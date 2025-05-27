const Game = require('../server/game/Game');

describe('Game end event', () => {
  test('endGame triggers callback with ranking', () => {
    const game = new Game();
    const p1 = game.addPlayer('Alice', 's1');
    const p2 = game.addPlayer('Bob', 's2');
    game.startGame();
    p1.money = 100;
    p2.money = 200;
    const cb = jest.fn();
    game.onEnd(cb);
    const result = game.endGame(p2);
    expect(cb).toHaveBeenCalled();
    expect(result.ranking[0].name).toBe('Bob');
  });
});
