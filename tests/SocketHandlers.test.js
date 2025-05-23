const { createLobby, joinLobby, lobbies, validateToken } = require('../server/socket/lobby');
const { startGame } = require('../server/socket/gameEvents');

describe('Socket handlers authentication', () => {
  test('startGame requires valid token', () => {
    const io = { of: () => ({ to: () => ({ emit: jest.fn() }) }) };
    const hostSocket = { id: 's1', join: jest.fn(), to: () => ({ emit: jest.fn() }), disconnect: jest.fn() };
    const playerSocket = { id: 's2', join: jest.fn(), to: () => ({ emit: jest.fn() }) };

    const createRes = createLobby(hostSocket, { playerName: 'Alice', lobbyName: 'L1' });
    const lobbyId = createRes.lobby.id;
    joinLobby(playerSocket, { playerName: 'Bob', lobbyId });

    expect(validateToken(hostSocket, createRes.lobby.token)).toBe(true);
    expect(validateToken(hostSocket, 'bad')).toBe(false);

    const bad = startGame(io, hostSocket, { token: 'bad' });
    expect(bad.success).toBe(false);

    const good = startGame(io, hostSocket, { token: createRes.lobby.token });
    expect(good.success).toBe(true);
    expect(lobbies[lobbyId].game).toBeDefined();
  });
});
