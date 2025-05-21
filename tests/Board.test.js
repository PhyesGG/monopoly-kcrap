const Board = require('../server/game/Board');

describe('Board initialization', () => {
  test('board has expected squares and getSquareAt works', () => {
    const board = new Board();
    expect(board.squares.length).toBe(13);
    const go = board.getSquareAt(0);
    expect(go.type).toBe('go');
    expect(go.name).toBe('Départ');
    const belleville = board.getSquareAt(1);
    expect(belleville.name).toBe('Boulevard de Belleville');
    expect(belleville.group).toBe('brown');
    const chance = board.getSquareAt(7);
    expect(chance.type).toBe('card');
    const jail = board.getSquareAt(9);
    expect(jail.type).toBe('jail');
  });
});
