import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openings } from '@/data/openings';
import * as storage from '@/util/storage';
import { expectedPieces, flushOpeningStorage, mockOpeningRouter, openingNamed, renderOpening } from '../helpers/renderOpening';

jest.setTimeout(15000);
beforeEach(async () => { jest.useFakeTimers(); jest.clearAllMocks(); await AsyncStorage.clear(); });
afterEach(async () => {
  cleanup();
  await flushOpeningStorage();
  jest.runAllTicks();
  expect(jest.getTimerCount()).toBe(0);
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('White practice accepts the expected move, blocks overlapping input and plays the scripted response', async () => {
  const opening = openingNamed('Italian Game');
  const practice = await renderOpening('practice', { openingId: opening.eco });
  expect(practice.state().pieces).toEqual(expectedPieces());
  practice.move('e2e4');
  expect(practice.index()).toBe(1);
  expect(practice.state().pieces).toEqual(expectedPieces(opening, 1));
  expect(practice.screen.getByText('Correct! Waiting for the opponent...')).toBeTruthy();
  practice.move('g1f3');
  expect(practice.index()).toBe(1);
  await practice.advanceResponse();
  expect(practice.index()).toBe(2);
  expect(practice.state().pieces).toEqual(expectedPieces(opening, 2));
  expect(practice.state().lastMove).toEqual({ from: 'e7', to: 'e5' });
  expect(await storage.getOpeningProgress(opening.name)).toBeNull();
});

test('a legal incorrect move leaves the board and index unchanged, permits retry and counts only student attempts', async () => {
  const opening = openingNamed('Italian Game');
  const practice = await renderOpening('practice', { openingId: opening.eco });
  practice.move('d2d4');
  expect(practice.screen.getByText("That move is legal, but it isn't in this lesson. Try again.")).toBeTruthy();
  expect(practice.index()).toBe(0);
  expect(practice.state().pieces).toEqual(expectedPieces());
  expect(await storage.getOpeningProgress(opening.name)).toBeNull();
  await practice.complete(opening);
  expect(await storage.getOpeningProgress(opening.name)).toMatchObject({
    mastery: 20, completedReps: 1, correctMoves: 3, totalAttempts: 4,
  });
  expect(practice.state().pieces).toEqual(expectedPieces(opening, opening.moves.length));
});

test('Black practice preplays White’s first move then validates Black and scripts White correctly', async () => {
  const opening = openingNamed('Grünfeld Defense');
  const practice = await renderOpening('practice', { openingId: opening.eco });
  expect(practice.index()).toBe(1);
  expect(practice.state().playerColor).toBe('b');
  expect(practice.state().pieces).toEqual(expectedPieces(opening, 1));
  practice.move(opening.uci[1]);
  await practice.advanceResponse();
  expect(practice.index()).toBe(3);
  expect(practice.state().pieces).toEqual(expectedPieces(opening, 3));
  await practice.complete(opening);
  expect(await storage.getOpeningProgress(opening.name)).toMatchObject({ mastery: 20, completedReps: 1, correctMoves: 3, totalAttempts: 3 });
});

test.each(['Four Knights Game', "King's Indian Defense: Classical Variation", "Queen's Gambit Accepted"])(
  '%s completes after the final scripted response and ignores duplicate response callbacks', async name => {
    const opening = openingNamed(name);
    const timers = jest.spyOn(global, 'setTimeout');
    const practice = await renderOpening('practice', { openingId: opening.eco });
    await practice.complete(opening);
    const saved = await storage.getOpeningProgress(name);
    expect(saved).toMatchObject({ mastery: 20, completedReps: 1 });
    const lastResponse = timers.mock.calls.filter(([, delay]) => delay === 500).at(-1)![0];
    const writes = jest.mocked(AsyncStorage.setItem).mock.calls.length;
    await act(async () => { lastResponse(); lastResponse(); });
    await flushOpeningStorage();
    expect(await storage.getOpeningProgress(name)).toEqual(saved);
    expect(jest.mocked(AsyncStorage.setItem).mock.calls).toHaveLength(writes);
  },
);

test('repeated runs award +20 up to 100, increment repetitions and cannot double-save from extra board taps', async () => {
  const opening = openingNamed('Polish Opening');
  const practice = await renderOpening('practice', { openingId: opening.eco });
  for (let run = 1; run <= 6; run++) {
    await practice.complete(opening);
    const saved = await storage.getOpeningProgress(opening.name);
    expect(saved).toMatchObject({ mastery: Math.min(run * 20, 100), completedReps: run, correctMoves: run, totalAttempts: run });
    practice.move(opening.uci[0]);
    await flushOpeningStorage();
    expect(await storage.getOpeningProgress(opening.name)).toEqual(saved);
    expect(practice.screen.queryByTestId('opening-reward') !== null).toBe(run === 5);
    if (run !== 6) fireEvent.press(practice.screen.getByText('Reset'));
  }
});

test('reset during a pending response invalidates the old callback and a fresh run still responds normally', async () => {
  const opening = openingNamed('Italian Game');
  const timers = jest.spyOn(global, 'setTimeout');
  const practice = await renderOpening('practice', { openingId: opening.eco });
  practice.move('e2e4');
  const old = timers.mock.calls.find(([, delay]) => delay === 500)![0];
  fireEvent.press(practice.screen.getByText('Reset'));
  expect(practice.index()).toBe(0);
  expect(practice.state()).toMatchObject({ selectedSquare: null, legalMoves: [], lastMove: null, pieces: expectedPieces() });
  practice.move('e2e4');
  await act(async () => { old(); });
  expect(practice.index()).toBe(1);
  await practice.advanceResponse();
  expect(practice.index()).toBe(2);
  expect(practice.state().pieces).toEqual(expectedPieces(opening, 2));
  expect(await storage.getOpeningProgress(opening.name)).toBeNull();
});

test('leaving incomplete practice cancels scripted work and returning starts clean without awarding progress', async () => {
  const opening = openingNamed('Italian Game');
  const timers = jest.spyOn(global, 'setTimeout');
  const practice = await renderOpening('practice', { openingId: opening.eco });
  practice.move('e2e4');
  const old = timers.mock.calls.find(([, delay]) => delay === 500)![0];
  fireEvent.press(practice.screen.getByTestId('icon-chevron-back'));
  expect(mockOpeningRouter.replace).toHaveBeenCalledWith('/LearnOpenings');
  await act(async () => { old(); jest.advanceTimersByTime(500); });
  expect(practice.index()).toBe(1);
  expect(await storage.getOpeningProgress(opening.name)).toBeNull();
  await practice.navigate('list');
  await practice.navigate('practice', { openingId: opening.eco });
  expect(practice.index()).toBe(0);
  expect(practice.state().pieces).toEqual(expectedPieces());
});

test('unmounting pending practice prevents a retained callback from writing progress', async () => {
  const opening = openingNamed('Italian Game');
  const timers = jest.spyOn(global, 'setTimeout');
  const practice = await renderOpening('practice', { openingId: opening.eco });
  practice.move('e2e4');
  const old = timers.mock.calls.find(([, delay]) => delay === 500)![0];
  practice.screen.unmount();
  await act(async () => { old(); jest.advanceTimersByTime(500); });
  jest.runAllTicks();
  expect(jest.getTimerCount()).toBe(0);
  expect(await storage.getAllOpeningProgress()).toEqual({});
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

test('changing openings while a response is pending initializes the new lesson and invalidates the old callback', async () => {
  const italian = openingNamed('Italian Game'), grunfeld = openingNamed('Grünfeld Defense');
  const timers = jest.spyOn(global, 'setTimeout');
  const practice = await renderOpening('practice', { openingId: italian.eco });
  practice.move('e2e4');
  const old = timers.mock.calls.find(([, delay]) => delay === 500)![0];
  await practice.navigate('practice', { openingId: grunfeld.eco });
  await act(async () => { old(); });
  expect(practice.index()).toBe(1);
  expect(practice.state()).toMatchObject({ playerColor: 'b', selectedSquare: null, lastMove: null, pieces: expectedPieces(grunfeld, 1) });
  practice.move(grunfeld.uci[1]);
  await practice.advanceResponse();
  expect(practice.state().pieces).toEqual(expectedPieces(grunfeld, 3));
  expect(await storage.getAllOpeningProgress()).toEqual({});
});

test('blur invalidates a response and refocus resumes exactly one scripted move', async () => {
  const opening = openingNamed('Italian Game');
  const timers = jest.spyOn(global, 'setTimeout');
  const practice = await renderOpening('practice', { openingId: opening.eco });
  practice.move('e2e4');
  const old = timers.mock.calls.find(([, delay]) => delay === 500)![0];
  await practice.setFocused(false);
  await act(async () => { old(); });
  expect(practice.index()).toBe(1);
  await practice.setFocused(true);
  await practice.advanceResponse();
  expect(practice.index()).toBe(2);
  expect(practice.state().pieces).toEqual(expectedPieces(opening, 2));
});

test('progress persists on return, stays separate per opening and is not erased by resetting the practice board', async () => {
  const polish = openingNamed('Polish Opening'), sicilian = openingNamed('Sicilian Defense');
  const practice = await renderOpening('practice', { openingId: polish.eco });
  await practice.complete(polish);
  const first = await storage.getOpeningProgress(polish.name);
  await practice.navigate('practice', { openingId: sicilian.eco });
  await practice.complete(sicilian);
  const second = await storage.getOpeningProgress(sicilian.name);
  fireEvent.press(practice.screen.getByText('Reset'));
  expect(practice.index()).toBe(1);
  expect(await storage.getOpeningProgress(polish.name)).toEqual(first);
  expect(await storage.getOpeningProgress(sicilian.name)).toEqual(second);
  await practice.navigate('practice', { openingId: polish.eco });
  expect(practice.screen.getByTestId('mastery')).toHaveTextContent('20%');
  expect(practice.index()).toBe(0);
});

test('all 50 bundled lessons complete through real practice callbacks with correct student-only statistics', async () => {
  expect(openings).toHaveLength(50);
  for (const opening of openings) {
    const practice = await renderOpening('practice', { openingId: opening.eco });
    await practice.complete(opening);
    const students = opening.uci.filter((_, index) => index % 2 === (opening.side === 'black' ? 1 : 0)).length;
    expect(await storage.getOpeningProgress(opening.name)).toMatchObject({ mastery: 20, completedReps: 1, correctMoves: students, totalAttempts: students });
    expect(practice.state().pieces).toEqual(expectedPieces(opening, opening.moves.length));
    practice.screen.unmount();
    jest.runAllTicks();
    expect(jest.getTimerCount()).toBe(0);
  }
  expect(Object.keys(await storage.getAllOpeningProgress())).toHaveLength(50);
}, 60000);
