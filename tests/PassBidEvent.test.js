const { createLobby, joinLobby, lobbies } = require('../server/socket/lobby');
const { startGame, passBid } = require('../server/socket/gameEvents');

describe('passBid socket event', () => {
  test('passing when auction ends should not throw', () => {
    const io = { of: () => ({ to: () => ({ emit: jest.fn() }) }) };
    const hostSocket = { id: 's1', join: jest.fn(), to: () => ({ emit: jest.fn() }) };
    const playerSocket = { id: 's2', join: jest.fn(), to: () => ({ emit: jest.fn() }) };

    const createRes = createLobby(hostSocket, { playerName: 'Alice', lobbyName: 'L1' });
    const lobbyId = createRes.lobby.id;
    const hostToken = createRes.lobby.token;

    const joinRes = joinLobby(playerSocket, { playerName: 'Bob', lobbyId });
    const playerToken = joinRes.lobby.token;

    startGame(io, hostSocket, { token: hostToken });

    const game = lobbies[lobbyId].game;
    const property = game.board.getSquareAt(1);
    game.startAuction(property);
    game.state = 'auction';

    expect(() => passBid(io, hostSocket, { token: hostToken })).not.toThrow();
    expect(game.state).toBe('auction');

    expect(() => passBid(io, playerSocket, { token: playerToken })).not.toThrow();
    expect(game.state).toBe('rolling');
    expect(game.currentAuction).toBeNull();
  });
});
