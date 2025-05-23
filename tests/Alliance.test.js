const Alliance = require('../server/game/Alliance');
const Player = require('../server/game/Player');

describe('Alliance mechanics', () => {
  test('alliance ends after three turns each', () => {
    const p1 = new Player('Alice');
    const p2 = new Player('Bob');
    const alliance = new Alliance(p1, p2);

    for (let i = 0; i < 3; i++) {
      alliance.playerTurnCompleted(p1);
      alliance.playerTurnCompleted(p2);
    }

    expect(alliance.active).toBe(false);
    expect(p1.currentAlliance).toBeNull();
    expect(p2.currentAlliance).toBeNull();
  });

  test('breakAlliance transfers money when possible', () => {
    const p1 = new Player('Alice');
    const p2 = new Player('Bob');
    const alliance = new Alliance(p1, p2);

    const res = alliance.breakAlliance(p1);
    expect(res.success).toBe(true);
    expect(p1.money).toBe(1300);
    expect(p2.money).toBe(1700);
    expect(alliance.active).toBe(false);
  });

  test('breakAlliance fails with insufficient funds', () => {
    const p1 = new Player('Alice');
    const p2 = new Player('Bob');
    p1.money = 100;
    const alliance = new Alliance(p1, p2);

    const res = alliance.breakAlliance(p1);
    expect(res.success).toBe(false);
    expect(alliance.active).toBe(false);
  });

  test('calculateSplitRent divides rent', () => {
    const p1 = new Player('A');
    const p2 = new Player('B');
    const alliance = new Alliance(p1, p2);
    const split = alliance.calculateSplitRent(75);
    expect(split.player1Amount + split.player2Amount).toBe(75);
    expect(split.player1Amount).toBe(37);
    expect(split.player2Amount).toBe(38);
  });
});
