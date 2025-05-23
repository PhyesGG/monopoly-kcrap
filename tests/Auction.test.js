const Auction = require('../server/game/Auction');
const Property = require('../server/game/Property');
const Game = require('../server/game/Game');

describe('Auction mechanics', () => {
  test('nextRound lowers price when no bids', () => {
    const prop = new Property(1, 'Test', 100, 'brown');
    const auction = new Auction(prop, 50);

    const result = auction.nextRound();
    expect(result.ended).toBe(false);
    expect(auction.currentBid).toBe(45);
  });

  test('auction ends with no winner when all pass', () => {
    const game = new Game();
    const p1 = game.addPlayer('Alice', 's1');
    const p2 = game.addPlayer('Bob', 's2');
    const property = game.board.getSquareAt(1);

    game.startAuction(property);
    game.state = 'auction';

    const pass1 = game.passBid(p1.id);
    expect(pass1.success).toBe(true);
    expect(game.state).toBe('auction');

    const pass2 = game.passBid(p2.id);
    expect(pass2.success).toBe(true);
    expect(pass2.winner).toBeNull();
    expect(game.state).toBe('rolling');
    expect(property.owner).toBeNull();
    expect(game.currentAuction).toBe(null);
  });
});
