/* eslint @typescript-eslint/no-require-imports: off -- Jest's hoisted factories need local runtime imports. */
import React from 'react';
import { expect, jest } from '@jest/globals';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Square } from 'chess.js';
import { game } from '@/logic/chessGame';
import * as storage from '@/util/storage';
import { STORAGE_KEYS } from '@/constants/storage';
import { Difficulty } from '@/types/match';

// Git tracks lowercase match.tsx; require avoids a second, differently-cased TS
// module identity in the existing Windows checkout (which uses Match.tsx).
const Match: React.ComponentType = require('@/app/match').default;

type EngineRequest = { fen: string; profile: string; onOutput: (output: string) => void; onError: (error: string) => void };
const mockEngine = {
  requestSearch: jest.fn<(request: EngineRequest) => void>(), cancelSearch: jest.fn(),
  isEngineReady: true, engineError: null,
};
let mockRoute = { side: 'w', difficulty: 'skilled', intent: 'new', launchId: 'draw-test' };
let nextLaunch = 0;
let mockFocused = true;
type RemovalEvent = { data: { action: { type: string; payload: { name: string } } } };
let mockRemovalHandler: ((event: RemovalEvent) => void) | undefined;
const mockNavigation = { dispatch: jest.fn() };
const mockPlayer = { seekTo: jest.fn(async () => {}), play: jest.fn(), pause: jest.fn() };

jest.mock('@/providers/StockfishProvider', () => ({ useStockfishContext: () => mockEngine }));
jest.mock('expo-audio', () => ({ useAudioPlayer: () => mockPlayer }));
jest.mock('expo-router', () => ({
  router: { replace: (name: string) => mockRemovalHandler?.({ data: { action: { type: 'REPLACE', payload: { name } } } }) },
  useLocalSearchParams: () => mockRoute,
  useIsFocused: () => mockFocused,
  useNavigation: () => mockNavigation,
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = require('react');
    const focused = mockFocused;
    React.useEffect(() => focused ? callback() : undefined, [callback, focused]);
  },
}));
jest.mock('expo-router/react-navigation', () => ({
  usePreventRemove: (_enabled: boolean, callback: (event: RemovalEvent) => void) => { mockRemovalHandler = callback; },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, MaterialCommunityIcons: () => null }));

// Replace presentation only. These presses call Match's real square handler.
jest.mock('@/components/Chessboard', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return function TestBoard({ onSquarePressIn, ...state }: import('@/types/match').ChessBoardProps) {
    return <View><Text testID="board-state">{JSON.stringify(state)}</Text>{Array.from({ length: 64 }, (_, index) => `${'abcdefgh'[index % 8]}${Math.floor(index / 8) + 1}`).map(square => (
      <Pressable key={square} onPress={() => onSquarePressIn(square as Square)}><Text>{square}</Text></Pressable>
    ))}</View>;
  };
});
jest.mock('@/components/AdBanner', () => () => null);
jest.mock('@/components/PromotionModal', () => () => null);
jest.mock('@/components/RewardModal', () => () => null);
jest.mock('@/components/WinModal', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function TestVictory({ visible, wins }: { visible: boolean; wins: number }) {
    return visible ? <Text testID="victory-result">Victory {wins}</Text> : null;
  };
});
jest.mock('@/components/LooseModal', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function TestDefeat({ visible }: { visible: boolean }) {
    return visible ? <Text testID="defeat-result">Defeat</Text> : null;
  };
});
jest.mock('@/components/Header', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return function TestHeader({ onBack }: { onBack: () => void }) {
    return <Pressable onPress={onBack}><Text>BACK</Text></Pressable>;
  };
});
jest.mock('@/components/SettingsModal', () => ({ SettingsModal: () => null }));
jest.mock('@/components/EvalBar', () => () => null);
jest.mock('@/components/ThinkingDots', () => () => null);

export type Snapshot = Parameters<typeof storage.saveMatchState>[0];

export async function renderDrawMatch(savedMatch?: Snapshot, options: {
  wins?: number; hints?: number; preserveStorage?: boolean;
  side?: 'w' | 'b'; difficulty?: Difficulty; recover?: boolean;
} = {}) {
  jest.clearAllMocks();
  mockFocused = true;
  mockRemovalHandler = undefined;
  if (!options.preserveStorage) await AsyncStorage.clear();
  // Use the application's existing migration path, not a replacement reward function.
  if (options.wins !== undefined) await AsyncStorage.setItem(STORAGE_KEYS.WINS, JSON.stringify(options.wins));
  if (options.hints !== undefined) await AsyncStorage.setItem(STORAGE_KEYS.HINTS, JSON.stringify(options.hints));
  game.reset();
  let recoverySnapshot = savedMatch;
  if (!recoverySnapshot && options.recover) {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY);
    if (raw) recoverySnapshot = JSON.parse(raw);
  }
  mockRoute = {
    side: options.side ?? savedMatch?.playerColor ?? 'w',
    difficulty: options.difficulty ?? savedMatch?.difficulty ?? 'skilled',
    intent: savedMatch || options.recover ? 'recover' : 'new', launchId: `draw-test-${++nextLaunch}`,
  };
  if (savedMatch) {
    await AsyncStorage.setItem(STORAGE_KEYS.MATCH_STORAGE_KEY, JSON.stringify(savedMatch));
  }
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const award = jest.spyOn(storage, 'awardVictory');
  const screen = render(<Match />);
  let mounted = true;
  const unmount = () => {
    if (mounted) screen.unmount();
    mounted = false;
  };
  const cleanup = () => {
    unmount();
    mockRemovalHandler = undefined;
    alert.mockRestore();
    award.mockRestore();
    game.reset();
  };
  try {
    if (recoverySnapshot) {
      await waitFor(() => expect(game.fen()).toBe(recoverySnapshot.fen));
    } else {
      await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.MATCH_STORAGE_KEY, expect.any(String),
      ));
    }
    // Flush initialization and its React updates before injecting any position.
    let progressBefore!: Awaited<ReturnType<typeof storage.loadProgress>>;
    await act(async () => { progressBefore = await storage.loadProgress(); });
    return {
      screen, cleanup, unmount, award, alert, engine: mockEngine, progressBefore, navigation: mockNavigation,
      async setFocused(focused: boolean) {
        await act(async () => {
          mockFocused = focused;
          screen.rerender(<Match />);
        });
      },
      async arrangePosition(fen: string) {
        await act(async () => { game.load(fen); });
      },
      move(from: Square, to: Square) {
        fireEvent.press(screen.getByText(from));
        fireEvent.press(screen.getByText(to));
      },
      async expectDraw(reason: string, finalFen: string, from: Square, to: Square) {
        await waitFor(() => expect(alert).toHaveBeenCalledWith('Draw', reason));
        await waitFor(async () => {
          const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY))!);
          expect(saved.fen).toBe(finalFen);
          expect(saved.pgn).toBe(game.pgn());
          expect(saved.lastMove).toEqual({ from, to });
          expect(saved.playerColor).toBe(mockRoute.side);
          expect(saved.difficulty).toBe('skilled');
          expect(saved.matchId).toEqual(expect.any(String));
        });
        expect(game.fen()).toBe(finalFen);
        expect(game.isGameOver()).toBe(true);
        expect(alert).toHaveBeenCalledTimes(1);
        expect(award).not.toHaveBeenCalled();
        expect(await storage.loadProgress()).toEqual(progressBefore);
        expect(mockEngine.requestSearch).not.toHaveBeenCalled();
      },
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}

