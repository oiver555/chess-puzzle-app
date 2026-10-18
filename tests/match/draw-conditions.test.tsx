import { expect, test } from '@jest/globals';
import { game } from '@/logic/chessGame';
import { renderDrawMatch } from '../helpers/renderDrawMatch';

test('a human capture leaving insufficient material presents and saves a draw without rewards or another computer turn', async () => {
  const match = await renderDrawMatch();
  try {
    // Bishop captures Black's last knight, leaving king+bishop versus king.
    await match.arrangePosition('7k/8/5K2/8/8/8/1n6/B7 w - - 0 1');
    expect(game.isGameOver()).toBe(false);
    match.move('a1', 'b2');
    await match.expectDraw(
      'Draw by insufficient material.',
      '7k/8/5K2/8/8/8/1B6/8 b - - 0 1', 'a1', 'b2',
    );
    expect(game.history()).toEqual(['Bxb2']);
  } finally {
    match.cleanup();
  }
});

test('a human move completing the third occurrence presents and saves a repetition draw without rewards or another computer turn', async () => {
  // Build real history from the standard start, then recover it through Match.
  game.reset();
  const history = ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1'];
  history.forEach(move => game.move(move));
  const saved = {
    fen: game.fen(), pgn: game.pgn(), playerColor: 'b' as const, aiColor: 'w' as const,
    difficulty: 'skilled' as const, selectedSquare: null,
    lastMove: { from: 'f3' as const, to: 'g1' as const },
    savedAt: new Date().toISOString(), matchId: 'threefold-fixture',
  };
  const match = await renderDrawMatch(saved);
  try {
    expect(game.history()).toEqual(history);
    expect(game.isGameOver()).toBe(false);
    match.move('f6', 'g8');
    await match.expectDraw(
      'Draw by threefold repetition.',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 8 5', 'f6', 'g8',
    );
    expect(game.history()).toEqual([...history, 'Ng8']);
    // The start and both completed cycles have White to move, identical castling
    // rights, and no en-passant target. The half-move/full-move clocks differ.
  } finally {
    match.cleanup();
  }
});

test('a human quiet move reaching 100 half-moves presents and saves a fifty-move draw without rewards or another computer turn', async () => {
  const match = await renderDrawMatch();
  try {
    await match.arrangePosition('7k/8/8/8/8/8/6R1/K7 w - - 99 50');
    expect(game.isGameOver()).toBe(false);
    match.move('g2', 'g3');
    await match.expectDraw(
      'Draw by the fifty-move rule.',
      '7k/8/8/8/8/6R1/8/K7 b - - 100 50', 'g2', 'g3',
    );
    expect(game.history()).toEqual(['Rg3']);
  } finally {
    match.cleanup();
  }
});
