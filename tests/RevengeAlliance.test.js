const Game = require('../server/game/Game');
const Player = require('../server/game/Player');

describe('Revenge loan and alliances', () => {
  test('activate and repay revenge loan', () => {
    const player = new Player('Alice', 's1');
    const result = player.activateRevenge();
    expect(result.success).toBe(true);
    expect(player.revengeActive).toBe(true);
    expect(player.money).toBe(2000); // 1500 + 500

    player.money = 1000; // ensure enough to repay
    let last;
    for (let i = 0; i < 5; i++) {
      last = player.updateRevengeLoan();
    }
    expect(last.success).toBe(true);
    expect(player.revengeActive).toBe(false);
    expect(player.money).toBe(250); // 1000 - 750
  });

  test('create and break alliance', () => {
    const game = new Game();
    const p1 = game.addPlayer('Alice', 's1');
    const p2 = game.addPlayer('Bob', 's2');

    const create = game.createAlliance(p1.id, p2.id);
    expect(create.success).toBe(true);
    expect(p1.currentAlliance.player).toBe(p2);
    expect(p2.currentAlliance.player).toBe(p1);

    const broken = game.breakAlliance(p1.id, true);
    expect(broken.success).toBe(true);
    expect(p1.currentAlliance).toBeNull();
    expect(p2.currentAlliance).toBeNull();
    expect(p1.money).toBe(1300); // 1500 - 200 penalty
    expect(p2.money).toBe(1700); // 1500 + 200 received
  });
});
