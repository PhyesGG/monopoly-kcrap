describe('Leaderboard component', () => {
  test('renders ranking', async () => {
    const container = { innerHTML: '' };
    const button = { addEventListener: jest.fn() };
    global.document = {
      getElementById: jest.fn((id) => {
        if (id === 'app') return container;
        if (id === 'replay-btn') return button;
        return null;
      })
    };
    const mod = await import('../client/src/components/Leaderboard.js');
    const { renderLeaderboard } = mod;
    renderLeaderboard([
      { name: 'Bob', money: 200 },
      { name: 'Alice', money: 100 }
    ]);
    expect(container.innerHTML).toContain('Bob');
    expect(container.innerHTML).toContain('Alice');
  });
});
