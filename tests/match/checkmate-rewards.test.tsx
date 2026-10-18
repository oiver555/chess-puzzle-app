import { expect, jest, test } from '@jest/globals';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { game } from '@/logic/chessGame';
import { STORAGE_KEYS } from '@/constants/storage';
import * as storage from '@/util/storage';
import { renderDrawMatch } from '../helpers/renderDrawMatch';

// Cold React Native renders under --detectOpenHandles can exceed Jest's 5s
// default. Let each case finish cleanup before the next case starts.
jest.setTimeout(15000);

type MatchHarness = Awaited<ReturnType<typeof renderDrawMatch>>;
const beforeWhiteMate = '7k/5Q2/5K2/8/8/8/8/8 w - - 0 1';
const afterWhiteMate = '7k/6Q1/5K2/8/8/8/8/8 b - - 1 1';

async function expectSavedMate(match: MatchHarness, fen: string, from: string, to: string, humanWon: boolean) {
  await waitFor(() => {
    expect(match.screen.getByTestId(humanWon ? 'victory-result' : 'defeat-result')).toBeTruthy();
    expect(match.screen.queryByTestId(humanWon ? 'defeat-result' : 'victory-result')).toBeNull();
  });
  let saved!: Awaited<ReturnType<typeof storage.loadMatchState>>;
  await waitFor(async () => {
    // Read the actual serialized output. Custom test FENs are not recovery fixtures.
    saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY))!);
    expect(saved).toMatchObject({
      fen, pgn: game.pgn(), lastMove: { from, to },
      difficulty: 'skilled', matchId: expect.any(String),
    });
  });
  expect(game.fen()).toBe(fen);
  expect(game.isCheckmate()).toBe(true);
  expect(game.isGameOver()).toBe(true);
  expect(match.alert).not.toHaveBeenCalled();
  return saved!;
}

test.each([
  { before: 0, after: 1, hints: 3 },
  { before: 3, after: 4, hints: 3 },
  { before: 4, after: 5, hints: 5 },
  { before: 5, after: 1, hints: 3 },
])('human checkmate advances win-cycle $before → $after with $hints hints', async ({ before, after, hints }) => {
  const match = await renderDrawMatch(undefined, { wins: before, hints: 3 });
  try {
    await match.arrangePosition(beforeWhiteMate);
    expect(game.isGameOver()).toBe(false);
    match.move('f7', 'g7');
    const saved = await expectSavedMate(match, afterWhiteMate, 'f7', 'g7', true);
    const progress = await storage.loadProgress();
    expect(progress).toEqual({ wins: after, hints, awardedMatchIds: [saved.matchId] });
    expect(match.award).toHaveBeenCalledTimes(1);
    expect(match.award).toHaveBeenCalledWith(saved.matchId);
    expect(match.screen.getByTestId('victory-result')).toHaveTextContent(`Victory ${after}`);
    expect(JSON.parse((await AsyncStorage.getItem('chess-sandbox-progress-v1'))!)).toEqual(progress);
    expect(await AsyncStorage.getItem('chess-sandbox-pending-award-v1')).toBeNull();
    expect(match.engine.requestSearch).not.toHaveBeenCalled();
  } finally {
    match.cleanup();
  }
});

// Standard-position history permits testing real recovery validation, too.
function foolsMateSnapshot(id: string) {
  game.reset();
  ['f3', 'e5', 'g4'].forEach(move => game.move(move));
  return {
    fen: game.fen(), pgn: game.pgn(), playerColor: 'b' as const, aiColor: 'w' as const,
    difficulty: 'skilled' as const, selectedSquare: null,
    savedAt: new Date().toISOString(), matchId: id,
  };
}

test('a human playing Black receives victory credit and the fifth-win bonus', async () => {
  const match = await renderDrawMatch(foolsMateSnapshot('black-victory'), { wins: 4, hints: 3 });
  try {
    expect(game.history()).toEqual(['f3', 'e5', 'g4']);
    match.move('d8', 'h4');
    await expectSavedMate(match, 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3', 'd8', 'h4', true);
    expect(await storage.loadProgress()).toEqual({ wins: 5, hints: 5, awardedMatchIds: ['black-victory'] });
    expect(match.award).toHaveBeenCalledTimes(1);
    expect(match.engine.requestSearch).not.toHaveBeenCalled();
  } finally {
    match.cleanup();
  }
});

test('computer checkmate delivers defeat once despite repeated engine output and further input', async () => {
  const match = await renderDrawMatch(undefined, { wins: 4, hints: 3 });
  try {
    await match.arrangePosition('8/8/8/8/8/2k5/2q4P/K7 w - - 0 1');
    match.move('h2', 'h3');
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(1);
    const request = match.engine.requestSearch.mock.calls[0][0];
    expect(request.profile).toBe('skilled');
    expect(request.fen).toBe(game.fen());
    await act(async () => { request.onOutput('bestmove c2b2'); });
    const fen = '8/8/8/8/8/2k4P/1q6/K7 w - - 1 2';
    await expectSavedMate(match, fen, 'c2', 'b2', false);
    const writes = jest.mocked(AsyncStorage.setItem).mock.calls.length;
    await act(async () => {
      request.onOutput('bestmove c2b2');
      request.onOutput('bestmove c2b2');
      request.onError('obsolete response');
    });
    match.move('a1', 'b1');
    fireEvent.press(match.screen.getByText('UNDO'));
    fireEvent.press(match.screen.getByText('HINT'));
    expect(game.fen()).toBe(fen);
    expect(jest.mocked(AsyncStorage.setItem).mock.calls).toHaveLength(writes);
    expect(match.award).not.toHaveBeenCalled();
    expect(await storage.loadProgress()).toEqual(match.progressBefore);
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(1);
    expect(match.screen.queryAllByTestId('defeat-result')).toHaveLength(1);
  } finally {
    match.cleanup();
  }
});

test('late hint callbacks and completed-game interactions cannot duplicate a fifth-win award', async () => {
  const match = await renderDrawMatch(undefined, { wins: 4, hints: 3 });
  try {
    await match.arrangePosition(beforeWhiteMate);
    fireEvent.press(match.screen.getByText('HINT'));
    const request = match.engine.requestSearch.mock.calls[0][0];
    expect(request.profile).toBe('hint');
    match.move('f7', 'g7');
    const saved = await expectSavedMate(match, afterWhiteMate, 'f7', 'g7', true);
    const progress = await storage.loadProgress();
    expect(progress).toEqual({ wins: 5, hints: 5, awardedMatchIds: [saved.matchId] });
    const writes = jest.mocked(AsyncStorage.setItem).mock.calls.length;
    await act(async () => {
      request.onOutput('bestmove f7g7');
      request.onError('cancelled hint');
    });
    match.move('f6', 'e6');
    fireEvent.press(match.screen.getByText('UNDO'));
    fireEvent.press(match.screen.getByText('HINT'));
    expect(game.fen()).toBe(afterWhiteMate);
    expect(match.award).toHaveBeenCalledTimes(1);
    expect(await storage.loadProgress()).toEqual(progress);
    expect(jest.mocked(AsyncStorage.setItem).mock.calls).toHaveLength(writes);
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(1);
    expect(match.screen.queryAllByTestId('victory-result')).toHaveLength(1);
  } finally {
    match.cleanup();
  }
});

test('recovering an older unfinished snapshot cannot award the same victory twice', async () => {
  const snapshot = foolsMateSnapshot('replayed-victory');
  const first = await renderDrawMatch(snapshot, { wins: 4, hints: 3 });
  let progress: Awaited<ReturnType<typeof storage.loadProgress>>;
  try {
    first.move('d8', 'h4');
    await expectSavedMate(first, 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3', 'd8', 'h4', true);
    progress = await storage.loadProgress();
    expect(progress).toEqual({ wins: 5, hints: 5, awardedMatchIds: ['replayed-victory'] });
  } finally {
    first.cleanup();
  }
  const replay = await renderDrawMatch(snapshot, { preserveStorage: true });
  try {
    replay.move('d8', 'h4');
    await expectSavedMate(replay, 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3', 'd8', 'h4', true);
    expect(replay.award).toHaveBeenCalledWith('replayed-victory');
    expect(await storage.loadProgress()).toEqual(progress!);
    expect(replay.engine.requestSearch).not.toHaveBeenCalled();
  } finally {
    replay.cleanup();
  }
});

test('direct recovery of a completed snapshot does not reprocess its credited victory', async () => {
  const first = await renderDrawMatch(foolsMateSnapshot('finished-recovery'), { wins: 4, hints: 3 });
  let completed!: Awaited<ReturnType<typeof storage.loadMatchState>>;
  let progress!: Awaited<ReturnType<typeof storage.loadProgress>>;
  try {
    first.move('d8', 'h4');
    await expectSavedMate(first, 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3', 'd8', 'h4', true);
    completed = await storage.loadMatchState();
    progress = await storage.loadProgress();
  } finally {
    first.cleanup();
  }
  const recovered = await renderDrawMatch(completed!, { preserveStorage: true });
  try {
    recovered.move('d8', 'h4');
    fireEvent.press(recovered.screen.getByText('UNDO'));
    expect(game.isCheckmate()).toBe(true);
    expect(game.fen()).toBe(completed!.fen);
    expect(recovered.award).not.toHaveBeenCalled();
    expect(await storage.loadProgress()).toEqual(progress);
    expect(recovered.screen.queryByTestId('victory-result')).toBeNull();
    expect(recovered.screen.queryByTestId('defeat-result')).toBeNull();
    expect(recovered.engine.requestSearch).not.toHaveBeenCalled();
  } finally {
    recovered.cleanup();
  }
});
