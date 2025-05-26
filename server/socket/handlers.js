const { createLobby, joinLobby, leaveLobby, listLobbies, reconnectPlayer, handleDisconnect } = require('./lobby');
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
  
  console.log('Initialisation des gestionnaires de socket pour le namespace /game');
  
  gameNamespace.on('connection', (socket) => {
    console.log(`Nouvelle connexion socket: ${socket.id}`);
    
    // Événements de lobby
    socket.on('create_lobby', (data, callback) => {
      console.log('Événement create_lobby reçu:', data);
      const result = createLobby(socket, data);
      if (callback) {
        console.log('Envoi de la réponse create_lobby:', result);
        callback(result);
      }
    });
    
    socket.on('join_lobby', (data, callback) => {
      console.log('Événement join_lobby reçu:', data);
      const result = joinLobby(socket, data);
      if (callback) {
        console.log('Envoi de la réponse join_lobby:', result);
        callback(result);
      }
    });

    socket.on('reconnect_player', (data, callback) => {
      console.log('Événement reconnect_player reçu:', data);
      const result = reconnectPlayer(socket, data);
      if (callback) callback(result);
    });
    
    socket.on('leave_lobby', (data, callback) => {
      console.log('Événement leave_lobby reçu:', data);
      const result = leaveLobby(socket, data);
      if (callback) {
        console.log('Envoi de la réponse leave_lobby:', result);
        callback(result);
      }
    });
    
    socket.on('list_lobbies', (callback) => {
      console.log('Événement list_lobbies reçu');
      const result = listLobbies();
      if (callback) {
        console.log('Envoi de la réponse list_lobbies:', result);
        callback(result);
      }
    });
    
    // Événements de jeu
    socket.on('start_game', (data, callback) => {
      console.log('Événement start_game reçu:', data);
      const result = startGame(io, socket, data);
      if (callback) callback(result);
    });
    
    socket.on('roll_dice', (data, callback) => {
      const result = rollDice(io, socket, data);
      if (callback) callback(result);
    });
    
    socket.on('place_bid', (data, callback) => {
      const result = placeBid(io, socket, data);
      if (callback) callback(result);
    });
    
    socket.on('pass_bid', (data, callback) => {
      const result = passBid(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('start_auction', (data, callback) => {
      const result = startAuctionEvent(io, socket, data);
      if (callback) callback(result);
    });
    
    socket.on('activate_revenge', (data, callback) => {
      const result = activateRevenge(io, socket, data);
      if (callback) callback(result);
    });
    
    socket.on('decline_revenge', (data, callback) => {
      const result = declineRevenge(io, socket, data);
      if (callback) callback(result);
    });
    
    socket.on('create_alliance', (data, callback) => {
      const result = createAlliance(io, socket, data);
      if (callback) callback(result);
    });
    
    socket.on('break_alliance', (data, callback) => {
      const result = breakAlliance(io, socket, data);
      if (callback) callback(result);
    });
    
    socket.on('apply_card_effect', (data, callback) => {
      const result = applyCardEffect(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('buy_house', (data, callback) => {
      const result = buyHouse(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('buy_hotel', (data, callback) => {
      const result = buyHotel(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('mortgage_property', (data, callback) => {
      const result = mortgageProperty(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('unmortgage_property', (data, callback) => {
      const result = unmortgageProperty(io, socket, data);
      if (callback) callback(result);
    });

    socket.on('quit_game', (data, callback) => {
      const result = quitGame(io, socket);
      if (callback) callback(result);
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
      console.log(`Déconnexion socket: ${socket.id}`);
      handleDisconnect(socket);
    });
  });
  
  return gameNamespace;
}

module.exports = { initSocketHandlers };