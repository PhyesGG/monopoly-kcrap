const Player = require('../server/game/Player');

describe('Passing and landing on GO', () => {
  test('passing GO adds 200€', () => {
    const p = new Player('Alice');
    p.position = 38;
    p.money = 1500;
    const result = p.move(3); // 38 -> 41 -> 1
    expect(result.passedGo).toBe(true);
    expect(p.position).toBe(1);
    expect(p.money).toBe(1700);
  });

  test('landing exactly on GO adds 300€', () => {
    const p = new Player('Bob');
    p.position = 38;
    const result = p.move(2); // 38 -> 40 -> 0
    expect(result.passedGo).toBe(true);
    expect(p.position).toBe(0);
    expect(p.money).toBe(1800);
  });

  test('normal move gives no bonus', () => {
    const p = new Player('Charlie');
    const result = p.move(2); // 0 -> 2
    expect(result.passedGo).toBe(false);
    expect(p.position).toBe(2);
    expect(p.money).toBe(1500);
  });
});
