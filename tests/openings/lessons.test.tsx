import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

test('selecting a catalog opening shows its real overview and move details and navigates to practice by identity', async () => {
  const opening = openingNamed('Polish Opening');
  const lesson = await renderOpening('list');
  fireEvent.press(lesson.screen.getByText(opening.name));
  expect(mockOpeningRouter.push).toHaveBeenCalledWith({ pathname: '/OpenItemScreen', params: { openingId: opening.eco } });
  await lesson.navigate('detail', { openingId: opening.eco });
  expect(lesson.screen.getByText(opening.description)).toBeTruthy();
  expect(lesson.screen.getByText(opening.commentary)).toBeTruthy();
  expect(lesson.screen.getByText(opening.difficulty)).toBeTruthy();
  opening.moveDetails.forEach(detail => expect(lesson.screen.getByText(detail.text!)).toBeTruthy());
  expect(lesson.detailPieces(opening)).toEqual(expectedPieces());
  fireEvent.press(lesson.screen.getByText('PRACTICE'));
  expect(mockOpeningRouter.push).toHaveBeenLastCalledWith({ pathname: '/OpeningPractice', params: { openingId: opening.eco } });
  await lesson.navigate('practice', { openingId: opening.eco });
  expect(lesson.state().pieces).toEqual(expectedPieces());
  expect(lesson.index()).toBe(0);
});

test.each(['Italian Game', 'Grünfeld Defense'])('the %s move viewer advances and reverses the actual board and clamps rapid navigation', async name => {
  const opening = openingNamed(name);
  const lesson = await renderOpening('detail', { openingId: opening.eco });
  for (const detail of opening.moveDetails) {
    const escaped = detail.move.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expect(lesson.screen.getByText(new RegExp(` ${escaped}$`))).toBeTruthy();
  }
  for (let i = 1; i <= opening.moves.length; i++) {
    fireEvent.press(lesson.screen.getByText('>'));
    expect(lesson.screen.getByText(`${i} / ${opening.moves.length}`)).toBeTruthy();
    expect(lesson.detailPieces(opening)).toEqual(expectedPieces(opening, i));
  }
  for (let i = 0; i < 5; i++) fireEvent.press(lesson.screen.getByText('>'));
  expect(lesson.detailPieces(opening)).toEqual(expectedPieces(opening, opening.moves.length));
  for (let i = opening.moves.length - 1; i >= 0; i--) {
    fireEvent.press(lesson.screen.getByText('<'));
    expect(lesson.screen.getByText(`${i} / ${opening.moves.length}`)).toBeTruthy();
    expect(lesson.detailPieces(opening)).toEqual(expectedPieces(opening, i));
  }
  for (let i = 0; i < 5; i++) fireEvent.press(lesson.screen.getByText('<'));
  expect(lesson.screen.getByText(`0 / ${opening.moves.length}`)).toBeTruthy();
  expect(lesson.detailPieces(opening)).toEqual(expectedPieces());
});

test('switching detail routes resets the old move index and board rather than carrying state into a shorter lesson', async () => {
  const italian = openingNamed('Italian Game'), polish = openingNamed('Polish Opening');
  const lesson = await renderOpening('detail', { openingId: italian.eco });
  fireEvent.press(lesson.screen.getByText('>'));
  fireEvent.press(lesson.screen.getByText('>'));
  expect(lesson.detailPieces(italian)).toEqual(expectedPieces(italian, 2));
  await lesson.navigate('detail', { openingId: polish.eco });
  expect(lesson.screen.getByText(polish.description)).toBeTruthy();
  expect(lesson.screen.getByText('0 / 1')).toBeTruthy();
  expect(lesson.detailPieces(polish)).toEqual(expectedPieces());
});

test('missing, malformed, repeated and unknown routes show the real fallback and never write progress', async () => {
  const polish = openingNamed('Polish Opening');
  const invalid = [{}, { openingId: 'removed' }, { openingId: [polish.eco] }, { opening: '{' },
    { opening: 'null' }, { opening: '[]' }, { opening: '42' }, { opening: '{}' }];
  const lesson = await renderOpening('detail');
  for (const name of ['detail', 'practice'] as const) {
    for (const params of invalid) {
      await lesson.navigate(name, params);
      expect(lesson.screen.getByText('Opening unavailable')).toBeTruthy();
      expect(lesson.screen.queryByTestId('practice-board')).toBeNull();
    }
  }
  fireEvent.press(lesson.screen.getByText('Back to openings'));
  expect(mockOpeningRouter.replace).toHaveBeenCalledWith('/LearnOpenings');
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(await storage.getAllOpeningProgress()).toEqual({});
});

test('legacy forged lesson content is ignored in both detail and practice in favor of the bundled sequence', async () => {
  const opening = openingNamed('Italian Game');
  const params = { opening: JSON.stringify({ name: opening.name, eco: opening.eco, moves: ['illegal'], side: 'black', uci: [], moveDetails: null }), masteryPercent: 'Infinity' };
  const lesson = await renderOpening('detail', params);
  expect(lesson.screen.getByText(opening.description)).toBeTruthy();
  expect(lesson.detailPieces(opening)).toEqual(expectedPieces());
  await lesson.navigate('practice', params);
  expect(lesson.state().playerColor).toBe('w');
  expect(lesson.screen.getByTestId('mastery')).toHaveTextContent('0%');
  await lesson.complete(opening);
  expect((await storage.getOpeningProgress(opening.name))?.mastery).toBe(20);
  expect(Object.keys(await storage.getAllOpeningProgress())).toEqual([opening.name]);
});

test('saved mastery is shown on detail/list return and opening-only reset refreshes mounted lesson statistics', async () => {
  const opening = openingNamed('Polish Opening');
  await storage.updateOpeningProgress(opening.name, () => ({ openingId: opening.name, mastery: 40, completedReps: 2, correctMoves: 2, totalAttempts: 2 }));
  const lesson = await renderOpening('detail', { openingId: opening.eco });
  expect(lesson.screen.getByTestId('mastery')).toHaveTextContent('40%');
  await lesson.navigate('list');
  expect(lesson.screen.getAllByTestId('mastery').some(node => node.props.children.join('') === '40%')).toBe(true);
  await act(async () => { await storage.resetOpeningProgress(); });
  await flushOpeningStorage();
  expect(lesson.screen.getAllByTestId('mastery').every(node => node.props.children.join('') === '0%')).toBe(true);
  await lesson.navigate('detail', { openingId: opening.eco });
  expect(lesson.screen.getByTestId('mastery')).toHaveTextContent('0%');
});
