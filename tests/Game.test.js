const Game = require('../server/game/Game');

describe('Game core methods', () => {
  let game;

  beforeEach(() => {
    game = new Game();
  });

  test('addPlayer and removePlayer', () => {
    const p1 = game.addPlayer('Alice', 's1');
    expect(game.players[p1.id]).toBeDefined();
    expect(Object.keys(game.players)).toHaveLength(1);

    const removed = game.removePlayer(p1.id);
    expect(removed).toBe(true);
    expect(Object.keys(game.players)).toHaveLength(0);
  });

  test('startGame sets state and first player', () => {
    const p1 = game.addPlayer('Alice', 's1');
    const p2 = game.addPlayer('Bob', 's2');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    const result = game.startGame();
    expect(result.success).toBe(true);
    expect(game.state).toBe('rolling');
    expect(game.currentPlayer.id).toBe(p2.id);
    Math.random.mockRestore();
  });

  test('rollDice on unowned property triggers auction', () => {
    game.addPlayer('Alice', 's1');
    game.addPlayer('Bob', 's2');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    game.startGame();
    Math.random.mockRestore();

    jest
      .spyOn(global.Math, 'random')
      .mockReturnValueOnce(0) // dice1 = 1
      .mockReturnValueOnce(0.2); // dice2 = 2

    const result = game.rollDice();
    expect(result.success).toBe(true);
    expect(result.action.type).toBe('auction');
    expect(game.state).toBe('auction');
    expect(game.currentAuction).toBeDefined();
    Math.random.mockRestore();
  });

  test('auction flow with finalizeAuction', () => {
    const p1 = game.addPlayer('Alice', 's1');
    game.addPlayer('Bob', 's2');
    const property = game.board.getSquareAt(1);
    game.startAuction(property);
    game.state = 'auction';

    const bid = game.placeBid(p1.id, 70);
    expect(bid.success).toBe(true);

    const final = game.finalizeAuction();
    expect(final.success).toBe(true);
    expect(final.winner).toBe(p1.name);
    expect(property.owner).toBe(game.players[p1.id]);
    expect(game.state).toBe('rolling');
  });

  test('nextPlayer changes the current player', () => {
    const p1 = game.addPlayer('Alice', 's1');
    const p2 = game.addPlayer('Bob', 's2');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    game.startGame();
    Math.random.mockRestore();

    const first = game.currentPlayer.id;
    const next = game.nextPlayer();
    expect(game.currentPlayer.id).not.toBe(first);
    expect(next.id).toBe(game.currentPlayer.id);
  });
});
