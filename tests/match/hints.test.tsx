import { expect, jest, test } from '@jest/globals';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { game } from '@/logic/chessGame';
import * as storage from '@/util/storage';
import { STORAGE_KEYS } from '@/constants/storage';
import { renderDrawMatch } from '../helpers/renderDrawMatch';

jest.setTimeout(15000);
type Harness = Awaited<ReturnType<typeof renderDrawMatch>>;
type Request = Parameters<Harness['engine']['requestSearch']>[0];
const board = (match: Harness) => JSON.parse(match.screen.getByTestId('board-state').props.children);
const press = (match: Harness, label = 'HINT') => fireEvent.press(match.screen.getByText(label));
const latest = (match: Harness) => match.engine.requestSearch.mock.calls.at(-1)![0];
const writes = () => jest.mocked(AsyncStorage.setItem).mock.calls.length;

async function flushProgress() {
  await act(async () => { await storage.loadProgress(); });
}

async function output(request: Request, line: string) {
  await act(async () => { request.onOutput(line); });
  await flushProgress();
}

async function expectBalance(match: Harness, balance: number) {
  await flushProgress();
  expect(match.screen.getByText(String(balance))).toBeTruthy();
  expect(await storage.loadHints()).toBe(balance);
  expect(JSON.parse((await AsyncStorage.getItem('chess-sandbox-progress-v1'))!).hints).toBe(balance);
}

async function expectHintIgnored(match: Harness, request: Request, line = 'bestmove e2e4') {
  const fen = game.fen(), pgn = game.pgn(), state = board(match);
  const progress = await storage.loadProgress(), beforeWrites = writes();
  const alerts = match.alert.mock.calls.length, awards = match.award.mock.calls.length;
  const searches = match.engine.requestSearch.mock.calls.length;
  await act(async () => {
    request.onOutput(line);
    request.onError('obsolete hint failure');
  });
  await flushProgress();
  expect(game.fen()).toBe(fen);
  expect(game.pgn()).toBe(pgn);
  expect(board(match)).toEqual(state);
  expect(await storage.loadProgress()).toEqual(progress);
  expect(writes()).toBe(beforeWrites);
  expect(match.alert).toHaveBeenCalledTimes(alerts);
  expect(match.award).toHaveBeenCalledTimes(awards);
  expect(match.engine.requestSearch).toHaveBeenCalledTimes(searches);
}

async function expectSavedPosition() {
  await waitFor(async () => {
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY))!);
    expect(saved.fen).toBe(game.fen());
    expect(saved.pgn).toBe(game.pgn());
  });
}

test.each(['rookie', 'skilled'] as const)('%s match requests a Stockfish hint, displays a legal arrow and persists one charge without moving', async difficulty => {
  const match = await renderDrawMatch(undefined, { difficulty, hints: 3 });
  try {
    const fen = game.fen(), pgn = game.pgn();
    const snapshot = await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY);
    press(match);
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(1);
    expect(latest(match)).toMatchObject({ profile: 'hint', fen });
    expect(board(match).hintMove).toBeNull();
    await expectBalance(match, 3);
    await output(latest(match), 'bestmove e2e4');
    expect(board(match).hintMove).toEqual({ from: 'e2', to: 'e4' });
    await expectBalance(match, 2);
    expect(game.fen()).toBe(fen);
    expect(game.pgn()).toBe(pgn);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY)).toBe(snapshot);
    expect(match.award).not.toHaveBeenCalled();
    expect(match.alert).not.toHaveBeenCalled();
  } finally { match.cleanup(); }
});

test('saved zero blocks repeated hint requests without deductions, searches or writes', async () => {
  const match = await renderDrawMatch(undefined, { hints: 0 });
  try {
    const fen = game.fen(), beforeWrites = writes();
    for (let i = 0; i < 4; i++) press(match);
    await expectBalance(match, 0);
    expect(writes()).toBe(beforeWrites);
    expect(board(match).hintMove).toBeNull();
    expect(game.fen()).toBe(fen);
    expect(match.engine.requestSearch).not.toHaveBeenCalled();
    expect(match.alert).not.toHaveBeenCalled();
  } finally { match.cleanup(); }
});

test('pending presses, repeated callbacks and reuse at the same position charge only once', async () => {
  const match = await renderDrawMatch(undefined, { hints: 3 });
  try {
    const fen = game.fen();
    for (let i = 0; i < 4; i++) press(match);
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(1);
    const request = latest(match);
    await output(request, 'info depth 6 score cp 25 pv e2e4');
    expect(board(match).hintMove).toBeNull();
    await expectBalance(match, 3);
    await output(request, 'bestmove e2e4');
    const beforeWrites = writes();
    await expectHintIgnored(match, request, 'bestmove d2d4');
    for (let i = 0; i < 4; i++) press(match);
    await expectBalance(match, 2);
    expect(board(match).hintMove).toEqual({ from: 'e2', to: 'e4' });
    expect(writes()).toBe(beforeWrites);
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(1);
    expect(game.fen()).toBe(fen);
  } finally { match.cleanup(); }
});

test('malformed, no-move and illegal final hint responses show feedback without charging and permit retry', async () => {
  const match = await renderDrawMatch(undefined, { hints: 3 });
  try {
    const fen = game.fen();
    for (const line of ['bestmove', 'bestmove (none)', 'bestmove e2e5']) {
      press(match);
      const request = latest(match);
      await output(request, line);
      expect(match.alert).toHaveBeenLastCalledWith('Hint unavailable', 'No valid hint was received. No hint was used. You can try again.');
      expect(board(match).hintMove).toBeNull();
      expect(game.fen()).toBe(fen);
      await expectBalance(match, 3);
      await expectHintIgnored(match, request);
    }
    expect(match.alert).toHaveBeenCalledTimes(3);
    press(match);
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(4);
    await output(latest(match), 'bestmove e2e4');
    await expectBalance(match, 2);
  } finally { match.cleanup(); }
});

test('empty output does not charge and a provider error clears the pending request so a retry can succeed', async () => {
  const match = await renderDrawMatch(undefined, { hints: 3 });
  try {
    const fen = game.fen();
    press(match);
    const failed = latest(match);
    await output(failed, '');
    press(match);
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(1);
    await expectBalance(match, 3);
    await act(async () => { failed.onError('controlled provider failure'); });
    await expectBalance(match, 3);
    expect(board(match).hintMove).toBeNull();
    expect(game.fen()).toBe(fen);
    press(match);
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(2);
    await expectHintIgnored(match, failed);
    await output(latest(match), 'bestmove g1f3');
    await expectBalance(match, 2);
    expect(board(match).hintMove).toEqual({ from: 'g1', to: 'f3' });
  } finally { match.cleanup(); }
});

test('making a move cancels its pending hint and old hint output cannot replace a newer request', async () => {
  const match = await renderDrawMatch(undefined, { hints: 3 });
  try {
    press(match);
    const old = latest(match);
    match.move('e2', 'e4');
    const computer = latest(match);
    expect(computer.profile).toBe('skilled');
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(2);
    press(match); // Computer's turn: no hint search.
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(2);
    await expectHintIgnored(match, old);
    await output(computer, 'bestmove e7e5');
    await expectSavedPosition();
    press(match);
    const current = latest(match);
    expect(current.profile).toBe('hint');
    expect(current.fen).toBe(game.fen());
    await expectHintIgnored(match, old, 'bestmove g1f3');
    await output(current, 'bestmove g1f3');
    await expectBalance(match, 2);
    expect(game.history()).toEqual(['e4', 'e5']);
  } finally { match.cleanup(); }
});

test('Undo invalidates a pending hint and a new hint uses the restored position', async () => {
  const match = await renderDrawMatch(undefined, { hints: 3 });
  try {
    match.move('e2', 'e4');
    await output(latest(match), 'bestmove e7e5');
    press(match);
    const old = latest(match);
    press(match, 'UNDO');
    await expectSavedPosition();
    expect(game.history()).toEqual([]);
    expect(board(match).hintMove).toBeNull();
    await expectHintIgnored(match, old, 'bestmove g1f3');
    press(match);
    expect(latest(match).fen).toBe(game.fen());
    await output(latest(match), 'bestmove e2e4');
    await expectBalance(match, 2);
  } finally { match.cleanup(); }
});

test('spending the final hint survives Undo, Restart, interruption recovery and a new match without refunds', async () => {
  const first = await renderDrawMatch(undefined, { hints: 1 });
  try {
    first.move('e2', 'e4');
    await output(latest(first), 'bestmove e7e5');
    press(first);
    await output(latest(first), 'bestmove g1f3');
    await expectBalance(first, 0);
    press(first, 'UNDO');
    await expectSavedPosition();
    expect(board(first).hintMove).toBeNull();
    await expectBalance(first, 0);
    await act(async () => { press(first, 'RESTART'); });
    await expectSavedPosition();
    await expectBalance(first, 0);
    expect(game.history()).toEqual([]);
  } finally { first.cleanup(); }
  const recovered = await renderDrawMatch(undefined, { preserveStorage: true, recover: true });
  try {
    await expectBalance(recovered, 0);
    press(recovered);
    expect(recovered.engine.requestSearch).not.toHaveBeenCalled();
  } finally { recovered.cleanup(); }
  const fresh = await renderDrawMatch(undefined, { preserveStorage: true });
  try {
    await expectBalance(fresh, 0);
    press(fresh);
    expect(fresh.engine.requestSearch).not.toHaveBeenCalled();
  } finally { fresh.cleanup(); }
});

test('Restart invalidates a pending hint even when the new search has the same FEN', async () => {
  const match = await renderDrawMatch(undefined, { hints: 3 });
  try {
    const initial = await storage.loadMatchState();
    press(match);
    const old = latest(match);
    await act(async () => { press(match, 'RESTART'); });
    await expectSavedPosition();
    expect((await storage.loadMatchState())?.matchId).not.toBe(initial?.matchId);
    press(match);
    const current = latest(match);
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(2);
    expect(current.fen).toBe(old.fen);
    await expectHintIgnored(match, old, 'bestmove g1f3');
    await output(current, 'bestmove e2e4');
    await expectBalance(match, 2);
    expect(board(match).hintMove).toEqual({ from: 'e2', to: 'e4' });
  } finally { match.cleanup(); }
});

test('intentional exit cancels a hint without charging or recreating the discarded match', async () => {
  const match = await renderDrawMatch(undefined, { hints: 3 });
  try {
    press(match);
    const old = latest(match);
    press(match, 'BACK');
    await waitFor(() => expect(match.navigation.dispatch).toHaveBeenCalledTimes(1));
    expect(await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY)).toBeNull();
    await expectHintIgnored(match, old);
    expect(await storage.loadHints()).toBe(3);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY)).toBeNull();
  } finally { match.cleanup(); }
});

test('unmounted hint callbacks cannot affect a recovered match or its newer hint request', async () => {
  const first = await renderDrawMatch(undefined, { hints: 3 });
  let old!: Request;
  try {
    press(first);
    old = latest(first);
    first.unmount();
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY);
    const beforeWrites = writes();
    await act(async () => { old.onOutput('bestmove e2e4'); old.onError('unmounted hint'); });
    await flushProgress();
    expect(await storage.loadHints()).toBe(3);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY)).toBe(saved);
    expect(writes()).toBe(beforeWrites);
    expect(first.alert).not.toHaveBeenCalled();
  } finally { first.cleanup(); }
  const recovered = await renderDrawMatch(undefined, { preserveStorage: true, recover: true });
  try {
    press(recovered);
    const current = latest(recovered);
    expect(current.fen).toBe(old.fen);
    await expectHintIgnored(recovered, old);
    await output(current, 'bestmove g1f3');
    await expectBalance(recovered, 2);
  } finally { recovered.cleanup(); }
});

test('blur cancels a hint and refocus waits for an explicit fresh request without charging for the old one', async () => {
  const match = await renderDrawMatch(undefined, { hints: 3 });
  try {
    press(match);
    const old = latest(match);
    await match.setFocused(false);
    await expectHintIgnored(match, old);
    await match.setFocused(true);
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(1);
    await expectBalance(match, 3);
    press(match);
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(2);
    await expectHintIgnored(match, old);
    await output(latest(match), 'bestmove e2e4');
    await expectBalance(match, 2);
  } finally { match.cleanup(); }
});

test.each([
  { result: 'checkmate', to: 'g7' as const },
  { result: 'stalemate', to: 'g6' as const },
])('$result cancels pending hints and blocks further requests without charging', async ({ result, to }) => {
  const match = await renderDrawMatch(undefined, { hints: 3, wins: 0 });
  try {
    await match.arrangePosition('7k/5Q2/5K2/8/8/8/8/8 w - - 0 1');
    press(match);
    const old = latest(match);
    match.move('f7', to);
    await expectSavedPosition();
    expect(game.isGameOver()).toBe(true);
    if (result === 'checkmate') expect(match.screen.getByTestId('victory-result')).toBeTruthy();
    else expect(match.alert).toHaveBeenCalledWith('Draw', 'Stalemate: there are no legal moves, but the king is not in check.');
    await expectHintIgnored(match, old, 'bestmove f7g7');
    press(match);
    await expectBalance(match, 3);
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(1);
    expect(board(match).hintMove).toBeNull();
  } finally { match.cleanup(); }
});

test('the fifth-win two-hint reward remains spendable in a later new match', async () => {
  const first = await renderDrawMatch(undefined, { wins: 4, hints: 0 });
  let creditedId!: string;
  try {
    await first.arrangePosition('7k/5Q2/5K2/8/8/8/8/8 w - - 0 1');
    first.move('f7', 'g7');
    await expectSavedPosition();
    // The controlled custom FEN is a move fixture, not a standard-start recovery fixture.
    creditedId = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY))!).matchId;
    await expectBalance(first, 2);
    expect(await storage.loadProgress()).toMatchObject({ wins: 5, hints: 2, awardedMatchIds: [creditedId] });
  } finally { first.cleanup(); }
  const next = await renderDrawMatch(undefined, { preserveStorage: true });
  try {
    await expectBalance(next, 2);
    press(next);
    await output(latest(next), 'bestmove e2e4');
    await expectBalance(next, 1);
    expect(await storage.loadProgress()).toMatchObject({ wins: 5, hints: 1, awardedMatchIds: [creditedId] });
  } finally { next.cleanup(); }
});
