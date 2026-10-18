import { expect, jest, test } from '@jest/globals';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chess } from 'chess.js';
import { game } from '@/logic/chessGame';
import * as storage from '@/util/storage';
import { STORAGE_KEYS } from '@/constants/storage';
import { renderDrawMatch, Snapshot } from '../helpers/renderDrawMatch';

jest.setTimeout(15000);
type Harness = Awaited<ReturnType<typeof renderDrawMatch>>;
type Request = Parameters<Harness['engine']['requestSearch']>[0];
const writeCount = () => jest.mocked(AsyncStorage.setItem).mock.calls.length;
const board = (match: Harness) => JSON.parse(match.screen.getByTestId('board-state').props.children);
const press = (match: Harness, label: string) => fireEvent.press(match.screen.getByText(label));

function snapshot(moves: string[], color: 'w' | 'b', difficulty: Snapshot['difficulty'] = 'skilled'): Snapshot {
  const fixture = new Chess();
  moves.forEach(move => fixture.move(move));
  return {
    fen: fixture.fen(), pgn: fixture.pgn(), playerColor: color, aiColor: color === 'w' ? 'b' : 'w',
    difficulty, selectedSquare: null, savedAt: new Date().toISOString(), matchId: 'lifecycle-fixture',
  };
}

async function expectHistory(moves: string[]) {
  const expected = new Chess();
  moves.forEach(move => expected.move(move));
  let saved!: Awaited<ReturnType<typeof storage.loadMatchState>>;
  await waitFor(async () => {
    saved = await storage.loadMatchState();
    expect(saved?.fen).toBe(expected.fen());
    expect(saved?.pgn).toBe(expected.pgn());
  });
  expect(game.fen()).toBe(expected.fen());
  expect(game.history()).toEqual(moves);
  return saved!;
}

async function reply(request: Request, uci: string) {
  await act(async () => { request.onOutput(`bestmove ${uci}`); });
}

async function expectObsolete(match: Harness, request: Request, uci: string) {
  const fen = game.fen(), writes = writeCount();
  const alerts = match.alert.mock.calls.length, awards = match.award.mock.calls.length;
  const searches = match.engine.requestSearch.mock.calls.length;
  await act(async () => {
    request.onOutput(`bestmove ${uci}`);
    request.onError('obsolete request');
  });
  expect(game.fen()).toBe(fen);
  expect(writeCount()).toBe(writes);
  expect(match.alert).toHaveBeenCalledTimes(alerts);
  expect(match.award).toHaveBeenCalledTimes(awards);
  expect(match.engine.requestSearch).toHaveBeenCalledTimes(searches);
}

test('Undo reverses a pending human move, saves the decision point and rejects its old computer response', async () => {
  const match = await renderDrawMatch();
  try {
    const initial = await expectHistory([]);
    match.move('e2', 'e4');
    await expectHistory(['e4']);
    const old = match.engine.requestSearch.mock.calls[0][0];
    press(match, 'UNDO');
    const saved = await expectHistory([]);
    expect(saved.matchId).toBe(initial.matchId);
    expect(saved.lastMove).toBeNull();
    expect(board(match)).toMatchObject({ selectedSquare: null, legalMoves: [], lastMove: null });
    await expectObsolete(match, old, 'e7e5');
    expect(await storage.loadProgress()).toEqual(match.progressBefore);
  } finally { match.cleanup(); }
});

test('Undo after a computer reply removes the latest human move and reply, keeping earlier history and highlights', async () => {
  const match = await renderDrawMatch();
  try {
    match.move('e2', 'e4');
    await reply(match.engine.requestSearch.mock.calls[0][0], 'e7e5');
    match.move('g1', 'f3');
    const old = match.engine.requestSearch.mock.calls[1][0];
    await reply(old, 'b8c6');
    await expectHistory(['e4', 'e5', 'Nf3', 'Nc6']);
    press(match, 'UNDO');
    const saved = await expectHistory(['e4', 'e5']);
    expect(saved.lastMove).toEqual({ from: 'e7', to: 'e5' });
    expect(board(match)).toMatchObject({ selectedSquare: null, legalMoves: [], lastMove: saved.lastMove });
    await expectObsolete(match, old, 'b8c6');
  } finally { match.cleanup(); }
});

test('Undo for a Black human preserves the computer opening and removes the human move plus computer reply', async () => {
  const match = await renderDrawMatch(undefined, { side: 'b' });
  try {
    await waitFor(() => expect(match.engine.requestSearch).toHaveBeenCalledTimes(1));
    await reply(match.engine.requestSearch.mock.calls[0][0], 'e2e4');
    match.move('e7', 'e5');
    await reply(match.engine.requestSearch.mock.calls[1][0], 'g1f3');
    await expectHistory(['e4', 'e5', 'Nf3']);
    press(match, 'UNDO');
    const saved = await expectHistory(['e4']);
    expect(saved.playerColor).toBe('b');
    expect(game.turn()).toBe('b');
    expect(saved.lastMove).toEqual({ from: 'e2', to: 'e4' });
    expect(match.engine.requestSearch).toHaveBeenCalledTimes(2);
  } finally { match.cleanup(); }
});

test('Undo with no human move is a no-op before and after the computer opening', async () => {
  const match = await renderDrawMatch(undefined, { side: 'b' });
  try {
    await waitFor(() => expect(match.engine.requestSearch).toHaveBeenCalledTimes(1));
    for (const stage of ['pending', 'opening played']) {
      const fen = game.fen(), state = board(match), writes = writeCount();
      const cancellations = match.engine.cancelSearch.mock.calls.length;
      press(match, 'UNDO');
      await act(async () => { await storage.loadProgress(); });
      expect(game.fen()).toBe(fen);
      expect(board(match)).toEqual(state);
      expect(writeCount()).toBe(writes);
      expect(match.engine.cancelSearch).toHaveBeenCalledTimes(cancellations);
      expect(match.engine.requestSearch).toHaveBeenCalledTimes(1);
      if (stage === 'pending') {
        await reply(match.engine.requestSearch.mock.calls[0][0], 'e2e4');
        await expectHistory(['e4']);
      }
    }
  } finally { match.cleanup(); }
});

test('Undo cannot change a completed match or award its victory again', async () => {
  const match = await renderDrawMatch(snapshot(['f3', 'e5', 'g4'], 'b'), { wins: 4, hints: 3 });
  try {
    match.move('d8', 'h4');
    await waitFor(() => expect(match.screen.getByTestId('victory-result')).toBeTruthy());
    await expectHistory(['f3', 'e5', 'g4', 'Qh4#']);
    const progress = await storage.loadProgress(), fen = game.fen(), writes = writeCount();
    press(match, 'UNDO');
    press(match, 'UNDO');
    await act(async () => { await storage.loadProgress(); });
    expect(game.fen()).toBe(fen);
    expect(writeCount()).toBe(writes);
    expect(await storage.loadProgress()).toEqual(progress);
    expect(match.award).toHaveBeenCalledTimes(1);
    expect(match.engine.requestSearch).not.toHaveBeenCalled();
  } finally { match.cleanup(); }
});

test('Restart saves a fresh identity, preserves unrelated data and rejects old output even after a newer search at the same FEN', async () => {
  const match = await renderDrawMatch(undefined, { wins: 4, hints: 2 });
  try {
    const settings = JSON.stringify({ highlightMoves: false, showMoveHints: false, soundEnabled: false });
    const openingProgress = JSON.stringify({ existing: { mastery: 80 } });
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, settings);
    await AsyncStorage.setItem(STORAGE_KEYS.OPENING_PROGRESS, openingProgress);
    const initial = await expectHistory([]);
    match.move('e2', 'e4');
    await expectHistory(['e4']);
    const old = match.engine.requestSearch.mock.calls[0][0];
    await act(async () => { press(match, 'RESTART'); });
    const restarted = await expectHistory([]);
    expect(restarted.matchId).not.toBe(initial.matchId);
    expect(restarted).toMatchObject({ playerColor: 'w', difficulty: 'skilled', lastMove: null, selectedSquare: null });
    expect(board(match)).toMatchObject({ selectedSquare: null, legalMoves: [], lastMove: null, squareInCheck: '', isCheckmate: false });
    expect(await storage.loadProgress()).toEqual(match.progressBefore);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS)).toBe(settings);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.OPENING_PROGRESS)).toBe(openingProgress);
    await expectObsolete(match, old, 'e7e5');
    match.move('e2', 'e4');
    const current = match.engine.requestSearch.mock.calls[1][0];
    expect(current.fen).toBe(old.fen);
    await expectHistory(['e4']);
    await expectObsolete(match, old, 'e7e6');
    await reply(current, 'e7e5');
    const saved = await expectHistory(['e4', 'e5']);
    expect(saved.matchId).toBe(restarted.matchId);
  } finally { match.cleanup(); }
});

test('Restart as Black starts exactly one fresh computer opening and rejects the old game response', async () => {
  const match = await renderDrawMatch(undefined, { side: 'b' });
  try {
    await waitFor(() => expect(match.engine.requestSearch).toHaveBeenCalledTimes(1));
    await reply(match.engine.requestSearch.mock.calls[0][0], 'e2e4');
    match.move('e7', 'e5');
    const old = match.engine.requestSearch.mock.calls[1][0];
    await expectHistory(['e4', 'e5']);
    await act(async () => { press(match, 'RESTART'); });
    const restarted = await expectHistory([]);
    await waitFor(() => expect(match.engine.requestSearch).toHaveBeenCalledTimes(3));
    const opening = match.engine.requestSearch.mock.calls[2][0];
    expect(opening.fen).toBe(new Chess().fen());
    await expectObsolete(match, old, 'g1f3');
    await reply(opening, 'e2e4');
    const saved = await expectHistory(['e4']);
    expect(saved.matchId).toBe(restarted.matchId);
    expect(saved.playerColor).toBe('b');
    expect(game.turn()).toBe('b');
  } finally { match.cleanup(); }
});

test('intentional Back waits for an in-flight save then deletes recovery data and ignores callbacks after leaving', async () => {
  const match = await renderDrawMatch();
  const setItem = jest.mocked(AsyncStorage.setItem);
  const original = setItem.getMockImplementation()!;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let entered = false;
  try {
    setItem.mockImplementationOnce(async (key, value) => {
      expect(key).toBe(STORAGE_KEYS.MATCH_STORAGE_KEY);
      entered = true;
      await gate;
      return original(key, value);
    });
    match.move('e2', 'e4');
    const old = match.engine.requestSearch.mock.calls[0][0];
    await waitFor(() => expect(entered).toBe(true));
    press(match, 'BACK');
    expect(match.navigation.dispatch).not.toHaveBeenCalled();
    await act(async () => { release(); });
    await waitFor(() => expect(match.navigation.dispatch).toHaveBeenCalledWith({
      type: 'REPLACE', payload: { name: 'ComputerSettings' },
    }));
    expect(await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY)).toBeNull();
    match.unmount();
    await expectObsolete(match, old, 'e7e5');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY)).toBeNull();
    expect(await storage.loadProgress()).toEqual(match.progressBefore);
  } finally {
    release();
    setItem.mockImplementation(original);
    match.cleanup();
  }
  // Asking Match to recover after abandonment has no old snapshot to load.
  const fresh = await renderDrawMatch(undefined, { preserveStorage: true, recover: true });
  try { await expectHistory([]); } finally { fresh.cleanup(); }
});

test('an interrupted player turn recovers FEN, PGN, settings and identity and waits for human input', async () => {
  const first = await renderDrawMatch(undefined, { difficulty: 'advanced' });
  let saved!: Snapshot;
  try {
    first.move('e2', 'e4');
    await reply(first.engine.requestSearch.mock.calls[0][0], 'e7e5');
    saved = await expectHistory(['e4', 'e5']);
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY);
    first.unmount();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY)).toBe(raw);
  } finally { first.cleanup(); }
  const recovered = await renderDrawMatch(undefined, { preserveStorage: true, recover: true, difficulty: 'skilled', side: 'b' });
  try {
    const restored = await expectHistory(['e4', 'e5']);
    expect(restored).toEqual(saved);
    expect(board(recovered)).toMatchObject({ playerColor: 'w', lastMove: { from: 'e7', to: 'e5' } });
    expect(recovered.engine.requestSearch).not.toHaveBeenCalled();
    recovered.move('g1', 'f3');
    expect(recovered.engine.requestSearch).toHaveBeenCalledTimes(1);
    expect(recovered.engine.requestSearch.mock.calls[0][0].profile).toBe('advanced');
    expect((await expectHistory(['e4', 'e5', 'Nf3'])).matchId).toBe(saved.matchId);
  } finally { recovered.cleanup(); }
});

test('an interrupted computer turn recovers once, rejects unmounted-instance output and accepts one current response', async () => {
  const first = await renderDrawMatch(undefined, { difficulty: 'master' });
  let saved!: Snapshot, old!: Request;
  try {
    first.move('e2', 'e4');
    saved = await expectHistory(['e4']);
    old = first.engine.requestSearch.mock.calls[0][0];
    first.unmount();
    await expectObsolete(first, old, 'e7e5');
    expect(await storage.loadMatchState()).toEqual(saved);
  } finally { first.cleanup(); }
  const recovered = await renderDrawMatch(undefined, { preserveStorage: true, recover: true, side: 'b', difficulty: 'rookie' });
  try {
    await waitFor(() => expect(recovered.engine.requestSearch).toHaveBeenCalledTimes(1));
    const current = recovered.engine.requestSearch.mock.calls[0][0];
    expect(current.fen).toBe(saved.fen);
    expect(current.profile).toBe('master');
    expect(board(recovered).playerColor).toBe('w');
    await expectObsolete(recovered, old, 'e7e6');
    await reply(current, 'e7e5');
    const restored = await expectHistory(['e4', 'e5']);
    expect(restored.matchId).toBe(saved.matchId);
    expect(restored.difficulty).toBe('master');
    await expectObsolete(recovered, current, 'e7e5');
    expect(await storage.loadProgress()).toEqual(recovered.progressBefore);
  } finally { recovered.cleanup(); }
});

test('blur cancels a pending search and refocus starts one replacement without accepting obsolete output', async () => {
  const match = await renderDrawMatch();
  try {
    match.move('e2', 'e4');
    await expectHistory(['e4']);
    const old = match.engine.requestSearch.mock.calls[0][0];
    await match.setFocused(false);
    await expectObsolete(match, old, 'e7e5');
    expect((await storage.loadMatchState())?.pgn).toBe(game.pgn());
    await match.setFocused(true);
    await waitFor(() => expect(match.engine.requestSearch).toHaveBeenCalledTimes(2));
    await expectObsolete(match, old, 'e7e6');
    await reply(match.engine.requestSearch.mock.calls[1][0], 'e7e5');
    await expectHistory(['e4', 'e5']);
  } finally { match.cleanup(); }
});

test('recovery for a Black human restores saved settings and automatically continues the White computer turn', async () => {
  const saved = snapshot(['e4', 'e5'], 'b', 'advanced');
  const match = await renderDrawMatch(saved, { side: 'w', difficulty: 'rookie' });
  try {
    expect(game.history()).toEqual(['e4', 'e5']);
    expect(board(match).playerColor).toBe('b');
    await waitFor(() => expect(match.engine.requestSearch).toHaveBeenCalledTimes(1));
    const request = match.engine.requestSearch.mock.calls[0][0];
    expect(request.fen).toBe(saved.fen);
    expect(request.profile).toBe('advanced');
    await reply(request, 'g1f3');
    const restored = await expectHistory(['e4', 'e5', 'Nf3']);
    expect(restored).toMatchObject({ playerColor: 'b', aiColor: 'w', difficulty: 'advanced', matchId: saved.matchId });
    expect(game.turn()).toBe('b');
    await expectObsolete(match, request, 'g1f3');
  } finally { match.cleanup(); }
});
