const { createLobby, joinLobby, lobbies, handleDisconnect } = require('../server/socket/lobby');

describe('lobby edge cases', () => {
  test('createLobby fails with empty parameters', () => {
    const socket = { id: 'x', join: jest.fn() };
    const res = createLobby(socket, { playerName: '', lobbyName: '' });
    expect(res.success).toBe(false);
  });

  test('joinLobby fails if lobby does not exist', () => {
    const socket = { id: 'y', join: jest.fn(), to: () => ({ emit: jest.fn() }) };
    const res = joinLobby(socket, { playerName: 'Bob', lobbyId: 'UNKNOWN' });
    expect(res.success).toBe(false);
  });

  test('handleDisconnect marks player disconnected', () => {
    const socket = { id: 'z', join: jest.fn(), leave: jest.fn(), to: () => ({ emit: jest.fn() }) };
    const create = createLobby(socket, { playerName: 'Alice', lobbyName: 'L1' });
    const lobbyId = create.lobby.id;
    handleDisconnect(socket);
    expect(lobbies[lobbyId].players[0].connected).toBe(false);
  });
});
