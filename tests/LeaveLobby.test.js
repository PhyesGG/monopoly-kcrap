const { createLobby, joinLobby, leaveLobby, lobbies } = require('../server/socket/lobby');

describe('leaveLobby behaviour', () => {
  test('host leaving reassigns host and removes lobby when empty', () => {
    const hostSocket = { id: 's1', join: jest.fn(), leave: jest.fn(), to: () => ({ emit: jest.fn() }) };
    const playerSocket = { id: 's2', join: jest.fn(), leave: jest.fn(), to: () => ({ emit: jest.fn() }) };

    const createRes = createLobby(hostSocket, { playerName: 'Alice', lobbyName: 'L1' });
    const lobbyId = createRes.lobby.id;
    joinLobby(playerSocket, { playerName: 'Bob', lobbyId });

    expect(lobbies[lobbyId].players.length).toBe(2);
    expect(lobbies[lobbyId].host).toBe('s1');

    const leaveRes = leaveLobby(hostSocket, { lobbyId });
    expect(leaveRes.success).toBe(true);
    expect(lobbies[lobbyId].players.length).toBe(1);
    expect(lobbies[lobbyId].host).toBe('s2');

    leaveLobby(playerSocket, { lobbyId });
    expect(lobbies[lobbyId]).toBeUndefined();
  });
});
