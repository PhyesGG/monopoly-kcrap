const { createLobby, joinLobby, leaveLobby, lobbies } = require('../server/socket/lobby');
const gameEvents = require('../server/socket/gameEvents');

describe('Socket handlers', () => {
  let io;
  let emitMock;

  const makeSocket = id => ({
    id,
    join: jest.fn(),
    to: jest.fn(() => ({ emit: jest.fn() })),
    leave: jest.fn()
  });

  beforeEach(() => {
    for (const id of Object.keys(lobbies)) delete lobbies[id];
    emitMock = jest.fn();
    io = { of: jest.fn(() => ({ to: jest.fn(() => ({ emit: emitMock })) })) };
  });

  test('startGame only allowed for host', () => {
    const hostSocket = makeSocket('s1');
    const resCreate = createLobby(hostSocket, { playerName: 'Host', lobbyName: 'L1' });
    const lobbyId = resCreate.lobby.id;
    const playerSocket = makeSocket('s2');
    joinLobby(playerSocket, { playerName: 'Bob', lobbyId });

    let result = gameEvents.startGame(io, playerSocket, {});
    expect(result.success).toBe(false);

    result = gameEvents.startGame(io, hostSocket, {});
    expect(result.success).toBe(true);
    expect(io.of).toHaveBeenCalledWith('/game');

    leaveLobby(hostSocket, { lobbyId });
    leaveLobby(playerSocket, { lobbyId });
  });

  test('createAlliance event', () => {
    const hostSocket = makeSocket('s3');
    const { lobby } = createLobby(hostSocket, { playerName: 'Alice', lobbyName: 'L2' });
    const socket2 = makeSocket('s4');
    joinLobby(socket2, { playerName: 'Bob', lobbyId: lobby.id });
    gameEvents.startGame(io, hostSocket, {});

    const lobbyObj = lobbies[lobby.id];
    const bobId = Object.values(lobbyObj.game.players).find(p => p.socketId === socket2.id).id;
    const allianceRes = gameEvents.createAlliance(io, hostSocket, { targetPlayerId: bobId });
    expect(allianceRes.success).toBe(true);

    leaveLobby(hostSocket, { lobbyId: lobby.id });
    leaveLobby(socket2, { lobbyId: lobby.id });
  });
});
