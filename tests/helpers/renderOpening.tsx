/* eslint @typescript-eslint/no-require-imports: off -- Hoisted Jest factories load native presentation substitutes locally. */
import React from 'react';
import { expect, jest } from '@jest/globals';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';
import { Chess, Square } from 'chess.js';
import { Opening, openings } from '@/data/openings';
import * as storage from '@/util/storage';

let mockParams: Record<string, unknown> = {};
let mockFocused = true;
export const mockOpeningRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false };

jest.mock('expo-router', () => ({
  router: {
    push: (route: unknown) => mockOpeningRouter.push(route),
    replace: (route: unknown) => mockOpeningRouter.replace(route),
    back: () => mockOpeningRouter.back(), canGoBack: () => mockOpeningRouter.canGoBack(),
  },
  useRouter: () => ({ push: (route: unknown) => mockOpeningRouter.push(route), back: () => mockOpeningRouter.back() }),
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = require('react');
    const focused = mockFocused;
    React.useEffect(() => focused ? callback() : undefined, [callback, focused]);
  },
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: require('react-native').View }));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name }: { name: string }) => <Text testID={`icon-${name}`}>{name}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});
jest.mock('@/components/AdBanner', () => () => null);
jest.mock('@/components/MasteryCircle', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function TestMastery({ percent }: { percent: number }) {
    return <Text testID="mastery">{percent}%</Text>;
  };
});
jest.mock('@/components/RewardModal', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function TestReward({ visible }: { visible: boolean }) {
    return visible ? <Text testID="opening-reward">Opening mastered</Text> : null;
  };
});
jest.mock('@/components/Chessboard', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return function PracticeBoard({ onSquarePressIn, getPieceAtSquare, ...state }: import('@/types/match').ChessBoardProps) {
    const squares = Array.from({ length: 64 }, (_, i) => `${'abcdefgh'[i % 8]}${Math.floor(i / 8) + 1}` as Square);
    const pieces = Object.fromEntries(squares.flatMap(square => {
      const piece = getPieceAtSquare(square);
      return piece ? [[square, piece.color + piece.type]] : [];
    }));
    return <View>
      <Text testID="practice-board">{JSON.stringify({ ...state, pieces })}</Text>
      {squares.map(square => <Pressable key={square} onPress={() => onSquarePressIn(square)}><Text>{square}</Text></Pressable>)}
    </View>;
  };
});

// Keep the detail screen's own board, layout and position generation real.
// Only replace native SVG assets with identifiable piece glyphs.
function mockPiece(code: string) {
  const React = require('react');
  const { Text } = require('react-native');
  return function PieceGlyph() { return <Text testID="detail-piece" accessibilityLabel={code}>{code}</Text>; };
}
jest.mock('@/assets/pieces/svg/wK.svg', () => mockPiece('wk'));
jest.mock('@/assets/pieces/svg/wQ.svg', () => mockPiece('wq'));
jest.mock('@/assets/pieces/svg/wR.svg', () => mockPiece('wr'));
jest.mock('@/assets/pieces/svg/wB.svg', () => mockPiece('wb'));
jest.mock('@/assets/pieces/svg/wN.svg', () => mockPiece('wn'));
jest.mock('@/assets/pieces/svg/wP.svg', () => mockPiece('wp'));
jest.mock('@/assets/pieces/svg/bK.svg', () => mockPiece('bk'));
jest.mock('@/assets/pieces/svg/bQ.svg', () => mockPiece('bq'));
jest.mock('@/assets/pieces/svg/bR.svg', () => mockPiece('br'));
jest.mock('@/assets/pieces/svg/bB.svg', () => mockPiece('bb'));
jest.mock('@/assets/pieces/svg/bN.svg', () => mockPiece('bn'));
jest.mock('@/assets/pieces/svg/bP.svg', () => mockPiece('bp'));

// Git paths retain lowercase learnOpenings; require avoids Windows casing aliases.
const screens: Record<ScreenName, React.ComponentType> = {
  list: require('@/app/learnOpenings').default,
  detail: require('@/app/OpenItemScreen').default,
  practice: require('@/app/OpeningPractice').default,
};
type ScreenName = 'list' | 'detail' | 'practice';

export function openingNamed(name: string): Opening {
  const opening = openings.find(item => item.name === name);
  if (!opening) throw new Error(`Unknown fixture opening: ${name}`);
  return opening;
}

export function expectedPieces(opening?: Opening, plies = 0) {
  const expected = new Chess();
  opening?.moves.slice(0, plies).forEach(move => expected.move(move));
  return Object.fromEntries(expected.board().flat().flatMap(piece => piece ? [[piece.square, piece.color + piece.type]] : []));
}

export async function flushOpeningStorage() {
  // A real queue read acts as a barrier for preceding practice writes.
  await act(async () => { await storage.getAllOpeningProgress(); });
}

export async function renderOpening(name: ScreenName, params: Record<string, unknown> = {}) {
  mockParams = params;
  mockFocused = true;
  let current = name;
  const screen = render(<View>{React.createElement(screens[current])}</View>);
  await flushOpeningStorage();
  const index = () => Number(String(screen.getByText(/^\d+ \/ \d+ moves played$/).props.children.join('')).split(' / ')[0]);
  const move = (uci: string) => {
    fireEvent.press(screen.getByText(uci.slice(0, 2)));
    fireEvent.press(screen.getByText(uci.slice(2, 4)));
  };
  const advanceResponse = async () => {
    await act(async () => { jest.advanceTimersByTime(500); });
    await flushOpeningStorage();
  };
  return {
    screen, index, move, advanceResponse,
    state: () => JSON.parse(screen.getByTestId('practice-board').props.children),
    async navigate(next: ScreenName, nextParams: Record<string, unknown> = {}) {
      current = next;
      mockParams = nextParams;
      screen.rerender(<View>{React.createElement(screens[current])}</View>);
      await flushOpeningStorage();
    },
    async setFocused(focused: boolean) {
      mockFocused = focused;
      screen.rerender(<View>{React.createElement(screens[current])}</View>);
      await flushOpeningStorage();
    },
    detailPieces(opening: Opening) {
      const cells = screen.UNSAFE_getAllByType(View).filter(node => {
        const background = StyleSheet.flatten(node.props.style)?.backgroundColor;
        return background === '#6b9651' || background === '#f1edc9';
      });
      expect(cells).toHaveLength(64);
      return Object.fromEntries(cells.flatMap((cell, renderedIndex) => {
        const piece = within(cell).queryByTestId('detail-piece');
        const i = opening.side === 'black' ? 63 - renderedIndex : renderedIndex;
        return piece ? [[`${'abcdefgh'[i % 8]}${8 - Math.floor(i / 8)}`, piece.props.accessibilityLabel]] : [];
      }));
    },
    async complete(opening: Opening) {
      let steps = 0;
      while (index() < opening.uci.length) {
        if (++steps > opening.uci.length + 1) throw new Error(`Practice did not advance: ${opening.name}`);
        if (index() % 2 === (opening.side === 'black' ? 1 : 0)) move(opening.uci[index()]);
        else await advanceResponse();
      }
      await flushOpeningStorage();
      expect(screen.getByText('Practice complete! Progress saved.')).toBeTruthy();
    },
  };
}
