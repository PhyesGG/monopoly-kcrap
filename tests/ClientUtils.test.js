import { formatMoney, clamp, randomInt } from '../client/src/utils/helpers.js';
import { setConfig, getConfig } from '../client/src/config.js';
import { setUsername, getUsername } from '../client/src/state/username.js';

describe('client utilities', () => {
  test('formatMoney formats euros', () => {
    const result = formatMoney(1500);
    expect(result).toMatch(/1\D*500\D*€/);
  });

  test('clamp keeps value within range', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(10, 0, 3)).toBe(3);
  });

  test('randomInt returns value in range', () => {
    for (let i = 0; i < 10; i++) {
      const v = randomInt(1, 3);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(3);
    }
  });

  test('config setters and getters work', () => {
    setConfig({ apiBaseUrl: '/api' });
    expect(getConfig('apiBaseUrl')).toBe('/api');
    const cfg = getConfig();
    expect(cfg.socketNamespace).toBe('/game');
  });
});

describe('username persistence', () => {
  beforeEach(() => {
    global.localStorage = {
      data: {},
      getItem(k){ return this.data[k]; },
      setItem(k,v){ this.data[k]=v; },
      removeItem(k){ delete this.data[k]; }
    };
  });

  test('setUsername and getUsername store value', () => {
    setUsername('Alice');
    expect(getUsername()).toBe('Alice');
    setUsername('');
    expect(getUsername()).toBe('');
  });
});
