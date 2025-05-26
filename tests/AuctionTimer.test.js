const { createLobby, joinLobby, lobbies } = require('../server/socket/lobby');
const { startGame, startAuctionEvent, placeBid } = require('../server/socket/gameEvents');

jest.useFakeTimers();

describe('Auction timer', () => {
  test('auction auto ends after 10 seconds without bids', () => {
    const io = { of: () => ({ to: () => ({ emit: jest.fn() }) }) };
    const hostSocket = { id: 's1', join: jest.fn(), to: () => ({ emit: jest.fn() }) };
    const playerSocket = { id: 's2', join: jest.fn(), to: () => ({ emit: jest.fn() }) };

    const createRes = createLobby(hostSocket, { playerName: 'Alice', lobbyName: 'L1' });
    const lobbyId = createRes.lobby.id;
    const token = createRes.lobby.token;
    joinLobby(playerSocket, { playerName: 'Bob', lobbyId });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.999);
    startGame(io, hostSocket, { token });
    Math.random.mockRestore();

    const lobby = lobbies[lobbyId];
    const game = lobby.game;
    const property = game.board.getSquareAt(1);
    game.pendingAuction = property;
    game.state = 'pending_auction';

    startAuctionEvent(io, hostSocket, { token });

    expect(game.state).toBe('auction');
    expect(lobby.auctionTimer).not.toBeNull();

    jest.advanceTimersByTime(10000);

    expect(game.state).toBe('rolling');
    expect(game.currentAuction).toBeNull();
    expect(lobby.auctionTimer).toBeNull();
  });

  test('timer resets when a bid is placed', () => {
    const io = { of: () => ({ to: () => ({ emit: jest.fn() }) }) };
    const hostSocket = { id: 's3', join: jest.fn(), to: () => ({ emit: jest.fn() }) };
    const playerSocket = { id: 's4', join: jest.fn(), to: () => ({ emit: jest.fn() }) };

    const createRes = createLobby(hostSocket, { playerName: 'Carol', lobbyName: 'L2' });
    const lobbyId = createRes.lobby.id;
    const token = createRes.lobby.token;
    joinLobby(playerSocket, { playerName: 'Dave', lobbyId });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.999);
    startGame(io, hostSocket, { token });
    Math.random.mockRestore();

    const lobby = lobbies[lobbyId];
    const game = lobby.game;
    const property = game.board.getSquareAt(1);
    game.pendingAuction = property;
    game.state = 'pending_auction';

    startAuctionEvent(io, hostSocket, { token });
    const bidAmount = game.currentAuction.currentBid + 10;

    jest.advanceTimersByTime(5000);
    placeBid(io, hostSocket, { token, amount: bidAmount });

    jest.advanceTimersByTime(6000);
    expect(game.state).toBe('auction');

    jest.advanceTimersByTime(4000);
    expect(game.state).toBe('rolling');
    expect(game.currentAuction).toBeNull();
  });
});
