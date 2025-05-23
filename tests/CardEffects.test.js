const KcrapCard = require('../server/game/cards/KcrapCard');
const Game = require('../server/game/Game');

describe('Kcrap card effects', () => {
  let game, alice, bob;
  beforeEach(() => {
    game = new Game();
    alice = game.addPlayer('Alice', 's1');
    bob = game.addPlayer('Bob', 's2');
  });

  test('crypto effect sets fluctuation', () => {
    const property = game.board.getSquareAt(5);
    property.owner = alice;
    alice.properties.push(property);
    jest.spyOn(global.Math, 'random').mockReturnValue(0); // -30%

    const card = new KcrapCard('c', 'crypto', 'Crypto', '');
    const res = card.applyEffect(game, alice);
    expect(res.success).toBe(true);
    expect(property.cryptoFluctuation).toBe(-30);
    expect(property.cryptoTurnsLeft).toBe(1);
    Math.random.mockRestore();
  });

  test('exchange effect swaps properties', () => {
    const p1 = game.board.getSquareAt(5); p1.owner = alice; alice.properties.push(p1);
    const p2 = game.board.getSquareAt(6); p2.owner = bob; bob.properties.push(p2);

    const card = new KcrapCard('e', 'exchange', 'ex', '');
    const res = card.applyEffect(game, alice, {
      selectedPropertyId: p1.id,
      targetPlayerId: bob.id,
      targetPropertyId: p2.id
    });

    expect(res.success).toBe(true);
    expect(alice.properties[0].id).toBe(p2.id);
    expect(bob.properties[0].id).toBe(p1.id);
    expect(p2.owner).toBe(alice);
    expect(p1.owner).toBe(bob);
  });

  test('restructure effect moves house', () => {
    const p1 = game.board.getSquareAt(5); p1.owner = alice; p1.houses = 1; alice.properties.push(p1);
    const p2 = game.board.getSquareAt(6); p2.owner = alice; alice.properties.push(p2);

    const card = new KcrapCard('r', 'restructure', 're', '');
    const res = card.applyEffect(game, alice, { sourcePropertyId: p1.id, targetPropertyId: p2.id });

    expect(res.success).toBe(true);
    expect(p1.houses).toBe(0);
    expect(p2.houses).toBe(1);
  });

  test('hostile effect transfers property temporarily', () => {
    const prop = game.board.getSquareAt(5); prop.owner = bob; bob.properties.push(prop);
    const card = new KcrapCard('h', 'hostile', 'ho', '');
    const res = card.applyEffect(game, alice, { targetPropertyId: prop.id });

    expect(res.success).toBe(true);
    expect(prop.owner).toBe(alice);
    expect(alice.properties).toContain(prop);
    expect(bob.properties).not.toContain(prop);
    expect(prop.temporaryOwnerTurns).toBe(3);
  });
});
