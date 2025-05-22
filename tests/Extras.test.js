const Game = require('../server/game/Game');

describe('Additional game mechanics', () => {
  let game;

  beforeEach(() => {
    game = new Game();
  });

  test('applyCardEffect activates digital disruption', () => {
    const alice = game.addPlayer('Alice', 's1');
    game.addPlayer('Bob', 's2');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    game.startGame();
    Math.random.mockRestore();

    game.state = 'card';
    const card = game.cardDeck.cards.find(c => c.type === 'digital');
    const result = game.applyCardEffect(game.currentPlayer.id, card.id);
    expect(result.success).toBe(true);
    // nextPlayer is called automatically, decreasing the counter to 1
    expect(game.digitalDisruptionTurnsLeft).toBe(1);
    expect(game.state).toBe('rolling');
  });

  test('applyCardEffect jail card sends player to jail', () => {
    const alice = game.addPlayer('Alice', 's1');
    game.addPlayer('Bob', 's2');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    game.startGame();
    Math.random.mockRestore();

    game.state = 'card';
    const jailCard = game.cardDeck.cards.find(c => c.type === 'jail');
    const current = game.currentPlayer;
    const res = game.applyCardEffect(current.id, jailCard.id);
    expect(res.success).toBe(true);
    expect(current.inJail).toBe(true);
    expect(game.state).toBe('rolling');
  });

  test('create and break alliance with penalty', () => {
    const alice = game.addPlayer('Alice', 's1');
    const bob = game.addPlayer('Bob', 's2');

    const result = game.createAlliance(alice.id, bob.id);
    expect(result.success).toBe(true);
    expect(game.currentAlliances).toHaveLength(1);

    const moneyAlice = alice.money;
    const moneyBob = bob.money;

    const breakRes = game.breakAlliance(alice.id);
    expect(breakRes.success).toBe(true);
    expect(alice.money).toBe(moneyAlice - 200);
    expect(bob.money).toBe(moneyBob + 200);
    expect(game.currentAlliances).toHaveLength(0);
    expect(alice.currentAlliance).toBeNull();
    expect(bob.currentAlliance).toBeNull();
  });

  test('mortgage and unmortgage property', () => {
    const alice = game.addPlayer('Alice', 's1');
    const property = game.board.getSquareAt(1); // price 60
    property.owner = alice;
    alice.properties.push(property);

    const mort = game.mortgageProperty(alice.id, property.id);
    expect(mort.success).toBe(true);
    expect(property.mortgaged).toBe(true);
    const afterMortgage = 1500 + Math.floor(property.price * 0.5);
    expect(alice.money).toBe(afterMortgage);

    const unmort = game.unmortgageProperty(alice.id, property.id);
    expect(unmort.success).toBe(true);
    expect(property.mortgaged).toBe(false);
    const afterUnmortgage = afterMortgage - Math.floor(property.price * 0.55);
    expect(alice.money).toBe(afterUnmortgage);
  });

  test('bankruptcy when unable to pay rent', () => {
    const alice = game.addPlayer('Alice', 's1');
    const bob = game.addPlayer('Bob', 's2');
    const property = game.board.getSquareAt(23); // price 240 => rent 24
    property.owner = bob;
    bob.properties.push(property);

    game.currentPlayer = alice;
    alice.position = 23;
    alice.money = 10; // not enough for rent
    alice.revengeToken = false; // trigger immediate bankruptcy

    const result = game.processSquare();
    expect(result.actionResult.type).toBe('bankruptcy');
    expect(alice.bankrupt).toBe(true);
  });

  test('digital disruption duration decreases each turn', () => {
    game.addPlayer('Alice', 's1');
    const bob = game.addPlayer('Bob', 's2');
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    game.startGame();
    Math.random.mockRestore();

    game.applyDigitalDisruption(2);
    expect(game.digitalDisruptionTurnsLeft).toBe(2);

    game.nextPlayer();
    expect(game.digitalDisruptionTurnsLeft).toBe(1);

    game.nextPlayer();
    expect(game.digitalDisruptionTurnsLeft).toBe(0);
  });
});
