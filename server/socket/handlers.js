const { createLobby, joinLobby, leaveLobby, listLobbies, reconnectPlayer, handleDisconnect, setPlayerColor, chatMessage, getChatHistory, proposeTrade } = require('./lobby');
const Logger = require('../utils/logger');
const logger = new Logger('socket');
const { 
  startGame, 
  rollDice, 
  placeBid,
  passBid,
  activateRevenge,
  declineRevenge,
  createAlliance,
  breakAlliance,
  applyCardEffect,
  buyHouse,
  buyHotel,
  mortgageProperty,
  unmortgageProperty,
  quitGame,
  startAuctionEvent
} = require('./gameEvents');

function initSocketHandlers(io) {
  // Espace de noms pour les jeux
  const gameNamespace = io.of('/game');
  
  logger.info('Initialisation des gestionnaires de socket pour le namespace /game');
  
  gameNamespace.on('connection', (socket) => {
    logger.info(`Nouvelle connexion socket: ${socket.id}`);
    
    // Événements de lobby
    socket.on('create_lobby', (data, callback) => {
      logger.info(`Événement create_lobby reçu: ${JSON.stringify(data)}`);
      const result = createLobby(socket, data);
      if (callback) {
        logger.info(`Envoi de la réponse create_lobby: ${JSON.stringify(result)}`);
        callback(result);
      }
    });
    
    socket.on('join_lobby', (data, callback) => {
      logger.info(`Événement join_lobby reçu: ${JSON.stringify(data)}`);
      const result = joinLobby(socket, data);
      if (callback) {
        logger.info(`Envoi de la réponse join_lobby: ${JSON.stringify(result)}`);
        callback(result);
      }
    });

    socket.on('reconnect_player', (data, callback) => {
      logger.info(`Événement reconnect_player reçu: ${JSON.stringify(data)}`);
      const result = reconnectPlayer(socket, data);
      if (callback) callback(result);
    });
    
    socket.on('leave_lobby', (data, callback) => {
      logger.info(`Événement leave_lobby reçu: ${JSON.stringify(data)}`);
      const result = leaveLobby(socket, data);
      if (callback) {
        logger.info(`Envoi de la réponse leave_lobby: ${JSON.stringify(result)}`);
        callback(result);
      }
    });
    
    socket.on('list_lobbies', (callback) => {
      logger.info('Événement list_lobbies reçu');
      const result = listLobbies();
      if (callback) {
        logger.info(`Envoi de la réponse list_lobbies: ${JSON.stringify(result)}`);
        callback(result);
      }
    });

    socket.on('set_color', (data, callback) => {
      const result = setPlayerColor(socket, data);
      if (callback) callback(result);
    });

    socket.on('chat_message', (data, callback) => {
      const result = chatMessage(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('get_chat_history', (data, callback) => {
      const result = getChatHistory(socket, data);
      if (callback) callback(result);
    });

    socket.on('propose_trade', (data, callback) => {
      const result = proposeTrade(io, socket, data);
      if (callback) callback(result);
    });
    
    // Événements de jeu
    socket.on('start_game', async (data, callback) => {
      logger.info(`Événement start_game reçu: ${JSON.stringify(data)}`);
      const result = await startGame(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('roll_dice', async (data, callback) => {
      const result = await rollDice(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('place_bid', async (data, callback) => {
      const result = await placeBid(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('pass_bid', async (data, callback) => {
      const result = await passBid(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('start_auction', async (data, callback) => {
      const result = await startAuctionEvent(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('activate_revenge', async (data, callback) => {
      const result = await activateRevenge(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('decline_revenge', async (data, callback) => {
      const result = await declineRevenge(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('create_alliance', async (data, callback) => {
      const result = await createAlliance(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('break_alliance', async (data, callback) => {
      const result = await breakAlliance(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('apply_card_effect', async (data, callback) => {
      const result = await applyCardEffect(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('buy_house', async (data, callback) => {
      const result = await buyHouse(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('buy_hotel', async (data, callback) => {
      const result = await buyHotel(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('mortgage_property', async (data, callback) => {
      const result = await mortgageProperty(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('unmortgage_property', async (data, callback) => {
      const result = await unmortgageProperty(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('quit_game', async (data, callback) => {
      const result = await quitGame(io, socket, data);
      if (callback) callback(result);
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
      logger.info(`Déconnexion socket: ${socket.id}`);
      handleDisconnect(socket);
    });
  });
  
  return gameNamespace;
}

module.exports = { initSocketHandlers };

