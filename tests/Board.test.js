const Board = require('../server/game/Board');

test('board has 40 squares', () => {
  const board = new Board();
  expect(board.squares).toHaveLength(40);
});
