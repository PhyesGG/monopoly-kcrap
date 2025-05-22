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

  test('digital disruption applies 10% tax on rent', () => {
    const alice = game.addPlayer('Alice', 's1');
    const bob = game.addPlayer('Bob', 's2');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    game.startGame();
    Math.random.mockRestore();

    const property = game.board.getSquareAt(5); // price 100 => rent 10
    property.owner = bob;
    game.applyDigitalDisruption(2);

    game.currentPlayer = alice;
    alice.position = 5;

    const rent = property.calculateRent({ board: game.board });
    const expectedBob = bob.money + rent - Math.floor(rent * 0.1);

    const result = game.processSquare();
    expect(result.actionResult.type).toBe('rent');
    expect(alice.money).toBe(1500 - rent);
    expect(bob.money).toBe(expectedBob);
  });

  test('digital disruption taxes split rent in alliance', () => {
    const alice = game.addPlayer('Alice', 's1');
    const bob = game.addPlayer('Bob', 's2');
    const charlie = game.addPlayer('Charlie', 's3');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    game.startGame();
    Math.random.mockRestore();

    game.createAlliance(bob.id, charlie.id);

    const property = game.board.getSquareAt(36); // price 350 => rent 35
    property.owner = bob;
    game.applyDigitalDisruption(2);

    game.currentPlayer = alice;
    alice.position = 36;

    const rent = property.calculateRent({ board: game.board });
    const ownerShare = Math.floor(rent * 0.5);
    const allyShare = rent - ownerShare;
    const expectedBob = bob.money + ownerShare - Math.floor(ownerShare * 0.1);
    const expectedCharlie = charlie.money + allyShare - Math.floor(allyShare * 0.1);

    const result = game.processSquare();
    expect(result.actionResult.type).toBe('rent');
    expect(bob.money).toBe(expectedBob);
    expect(charlie.money).toBe(expectedCharlie);
  });

  test('railroad rent scales with number owned', () => {
    const alice = game.addPlayer('Alice', 's1');
    const bob = game.addPlayer('Bob', 's2');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    game.startGame();
    Math.random.mockRestore();

    const r1 = game.board.getSquareAt(14);
    const r2 = game.board.getSquareAt(24);
    r1.owner = bob; bob.properties.push(r1);
    r2.owner = bob; bob.properties.push(r2);

    game.currentPlayer = alice;
    alice.position = 14;

    const rent = r1.calculateRent({ board: game.board });
    expect(rent).toBe(50); // 25 * 2 railroads

    const result = game.processSquare();
    expect(result.actionResult.type).toBe('rent');
    expect(alice.money).toBe(1500 - rent);
    expect(bob.money).toBe(1500 + rent);
  });

  test('utility rent depends on dice roll', () => {
    const alice = game.addPlayer('Alice', 's1');
    const bob = game.addPlayer('Bob', 's2');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    game.startGame();
    Math.random.mockRestore();

    const util = game.board.getSquareAt(27);
    util.owner = bob; bob.properties.push(util);

    game.currentPlayer = alice;
    alice.position = 27;
    game.lastDiceTotal = 8;

    const rent = util.calculateRent({ diceTotal: 8, board: game.board });
    expect(rent).toBe(32);

    const result = game.processSquare();
    expect(result.actionResult.type).toBe('rent');
    expect(alice.money).toBe(1500 - rent);
    expect(bob.money).toBe(1500 + rent);
  });

  test('landing on goto-jail sends player to jail', () => {
    const alice = game.addPlayer('Alice', 's1');
    game.addPlayer('Bob', 's2');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    game.startGame();
    Math.random.mockRestore();

    game.currentPlayer = alice;
    alice.position = 29; // "Allez en Prison"

    const result = game.processSquare();
    expect(result.actionResult.type).toBe('jail');
    expect(alice.inJail).toBe(true);
    expect(alice.position).toBe(9);
  });

  test('cannot build house without full set', () => {
    const alice = game.addPlayer('Alice', 's1');
    game.addPlayer('Bob', 's2');
    const prop = game.board.getSquareAt(5);
    prop.owner = alice; alice.properties.push(prop);

    const res = game.buyHouse(alice.id, prop.id);
    expect(res.success).toBe(false);
  });

  test('houses must be built evenly', () => {
    const alice = game.addPlayer('Alice', 's1');
    game.addPlayer('Bob', 's2');
    const p1 = game.board.getSquareAt(5);
    const p2 = game.board.getSquareAt(6);
    const p3 = game.board.getSquareAt(8);
    [p1, p2, p3].forEach(p => { p.owner = alice; alice.properties.push(p); });

    expect(game.buyHouse(alice.id, p1.id).success).toBe(true);
    const second = game.buyHouse(alice.id, p1.id);
    expect(second.success).toBe(false); // doit construire sur autres cases avant
  });

  test('save and load game state', () => {
    const p1 = game.addPlayer('Alice', 's1');
    const p2 = game.addPlayer('Bob', 's2');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    game.startGame();
    Math.random.mockRestore();

    const { saveGame, loadGame } = require('../server/utils/gamePersistence');
    const { SAVE_PATH } = require('../server/config');
    const fs = require('fs');
    const path = require('path');

    game.applyDigitalDisruption(2);

    saveGame(game);
    const loaded = loadGame(game.id);
    expect(loaded).not.toBeNull();
    expect(Object.keys(loaded.game.players)).toHaveLength(2);
    expect(loaded.game.digitalDisruptionTurnsLeft).toBe(2);

    fs.unlinkSync(path.join(SAVE_PATH, `${game.id}.json`));
  });
});
