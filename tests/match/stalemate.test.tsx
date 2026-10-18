import { test } from '@jest/globals';
import { renderDrawMatch } from '../helpers/renderDrawMatch';

test('a human move causing stalemate presents and saves a draw without rewards or another computer turn', async () => {
  const match = await renderDrawMatch();
  try {
    await match.arrangePosition('7k/5Q2/5K2/8/8/8/8/8 w - - 0 1');
    match.move('f7', 'g6');
    await match.expectDraw(
      'Stalemate: there are no legal moves, but the king is not in check.',
      '7k/8/5KQ1/8/8/8/8/8 b - - 1 1', 'f7', 'g6',
    );
  } finally {
    match.cleanup();
  }
});
