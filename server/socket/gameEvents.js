const Game = require('../game/Game');
const {
  getLobbyBySocketId,
  getLobbyById,
  leaveLobby,
  validateToken
} = require('./lobby');
const { saveGame } = require('../utils/gamePersistence');

// Gestion du timer d'enchère
function clearAuctionTimer(lobby) {
  if (lobby && lobby.auctionTimer) {
    clearTimeout(lobby.auctionTimer);
    lobby.auctionTimer = null;
  }
}

function startAuctionTimer(io, lobby) {
  clearAuctionTimer(lobby);
  lobby.auctionTimer = setTimeout(() => {
    if (!lobby.game || !lobby.game.currentAuction) return;

    const result = lobby.game.finalizeAuction();

    io.of('/game').to(lobby.id).emit('auction_ended', {
      result,
      gameState: lobby.game.getGameState()
    });

    saveGame(lobby.game, lobby);
    clearAuctionTimer(lobby);
  }, 10000);
}

function checkAuth(socket, token) {
  if (token !== undefined && !validateToken(socket, token)) {
    return { success: false, message: 'Authentification invalide' };
  }
  return null;
}

function startGame(io, socket, data = {}) {
  const auth = checkAuth(socket, data.token);
  if (auth) return auth;

  const lobby = getLobbyBySocketId(socket.id);
  
  if (!lobby) {
    return { 
      success: false, 
      message: "Lobby non trouvé" 
    };
  }
  
  if (socket.id !== lobby.host) {
    return { 
      success: false, 
      message: "Seul l'hôte peut démarrer la partie" 
    };
  }
  
  if (lobby.players.length < 2) {
    return { 
      success: false, 
      message: "Il faut au moins 2 joueurs pour commencer" 
    };
  }
  
  // Initialiser le jeu
  const game = new Game(data.boardPreset);
  
  // Ajouter les joueurs
  lobby.players.forEach(player => {
    game.addPlayer(player.name, player.id, player.color);
  });
  
  // Démarrer la partie
  const result = game.startGame();
  
  if (!result.success) {
    return result;
  }
  
  // Associer le jeu au lobby
  lobby.game = game;
  
  // Envoyer l'état initial à tous les joueurs
  io.of('/game').to(lobby.id).emit('game_started', {
    gameState: game.getGameState()
  });

  saveGame(game, lobby);

  return { success: true };
}

function rollDice(io, socket, data = {}) {
  const auth = checkAuth(socket, data.token);
  if (auth) return auth;

  const lobby = getLobbyBySocketId(socket.id);
  
  if (!lobby || !lobby.game) {
    return { 
      success: false, 
      message: "Partie non trouvée" 
    };
  }
  
  const game = lobby.game;
  
  // Vérifier si c'est le tour du joueur
  if (game.currentPlayer.socketId !== socket.id) {
    return { 
      success: false, 
      message: "Ce n'est pas votre tour" 
    };
  }
  
  // Lancer les dés
  const result = game.rollDice();
  
  // Informer tous les joueurs du résultat
  io.of('/game').to(lobby.id).emit('dice_rolled', {
    result,
    gameState: game.getGameState()
  });

  saveGame(game, lobby);

  return result;
}

function startAuctionEvent(io, socket, data = {}) {
  const auth = checkAuth(socket, data.token);
  if (auth) return auth;

  const lobby = getLobbyBySocketId(socket.id);

  if (!lobby || !lobby.game) {
    return { success: false, message: 'Partie non trouvée' };
  }

  const game = lobby.game;

  if (game.state !== 'pending_auction') {
    return { success: false, message: "Aucune enchère à démarrer" };
  }

  const playerId = Object.keys(game.players).find(id =>
    game.players[id].socketId === socket.id
  );

  if (!playerId || game.currentPlayer.id !== playerId) {
    return { success: false, message: "Ce n'est pas votre tour" };
  }

  const auction = game.launchPendingAuction();

  io.of('/game').to(lobby.id).emit('auction_started', {
    property: auction.property,
    startingBid: auction.startingBid,
    gameState: game.getGameState()
  });

  startAuctionTimer(io, lobby);

  saveGame(game, lobby);

  return { success: true };
}

function placeBid(io, socket, data = {}) {
  const { amount, token } = data;
  const auth = checkAuth(socket, token);
  if (auth) return auth;

  if (typeof amount !== 'number' || amount <= 0) {
    return { success: false, message: 'Montant invalide' };
  }
  const lobby = getLobbyBySocketId(socket.id);
  
  if (!lobby || !lobby.game) {
    return { 
      success: false, 
      message: "Partie non trouvée" 
    };
  }
  
  const game = lobby.game;
  
  // Vérifier que le jeu est en phase d'enchère
  if (game.state !== 'auction') {
    return { 
      success: false, 
      message: "Aucune enchère en cours" 
    };
  }
  
  // Récupérer l'ID du joueur à partir du socket
  const playerId = Object.keys(game.players).find(id => 
    game.players[id].socketId === socket.id
  );
  
  if (!playerId) {
    return { 
      success: false, 
      message: "Joueur non trouvé" 
    };
  }
  
  // Placer l'enchère
  const result = game.placeBid(playerId, amount);
  
  // Informer tous les joueurs du résultat
  io.of('/game').to(lobby.id).emit('bid_placed', {
    playerId,
    amount,
    success: result.success,
    message: result.message,
    gameState: game.getGameState()
  });

  if (result.success) {
    startAuctionTimer(io, lobby);
  }

  saveGame(game, lobby);

  return result;
}

function passBid(io, socket, data = {}) {
  const auth = checkAuth(socket, data.token);
  if (auth) return auth;

  const lobby = getLobbyBySocketId(socket.id);
  
  if (!lobby || !lobby.game) {
    return { 
      success: false, 
      message: "Partie non trouvée" 
    };
  }
  
  const game = lobby.game;
  
  // Vérifier que le jeu est en phase d'enchère
  if (game.state !== 'auction') {
    return { 
      success: false, 
      message: "Aucune enchère en cours" 
    };
  }
  
  // Récupérer l'ID du joueur à partir du socket
  const playerId = Object.keys(game.players).find(id => 
    game.players[id].socketId === socket.id
  );
  
  if (!playerId) {
    return { 
      success: false, 
      message: "Joueur non trouvé" 
    };
  }
  
  // Passer l'enchère et récupérer le résultat
  const passResult = game.passBid(playerId);

  // Si l'enchère a été finalisée pendant passBid
  if (!game.currentAuction) {
    io.of('/game').to(lobby.id).emit('auction_ended', {
      result: passResult,
      gameState: game.getGameState()
    });
    clearAuctionTimer(lobby);
    saveGame(game, lobby);
    return passResult;
  }

  // Avancer à la prochaine ronde d'enchères
  const roundResult = game.currentAuction.nextRound();
  
  if (roundResult.ended) {
    // Si l'enchère est terminée, finaliser
    const auctionResult = game.finalizeAuction();

    io.of('/game').to(lobby.id).emit('auction_ended', {
      result: auctionResult,
      gameState: game.getGameState()
    });
    clearAuctionTimer(lobby);
  } else {
    // Informer tous les joueurs du résultat
    io.of('/game').to(lobby.id).emit('bid_passed', {
      playerId,
      success: true,
      gameState: game.getGameState()
    });
  }

  saveGame(game, lobby);

  return { success: true };
}

function activateRevenge(io, socket, data = {}) {
  const auth = checkAuth(socket, data.token);
  if (auth) return auth;

  const lobby = getLobbyBySocketId(socket.id);
  
  if (!lobby || !lobby.game) {
    return { 
      success: false, 
      message: "Partie non trouvée" 
    };
  }
  
  const game = lobby.game;
  
  // Vérifier que le jeu est en phase de revanche
  if (game.state !== 'revenge') {
    return { 
      success: false, 
      message: "Vous ne pouvez pas activer la revanche maintenant" 
    };
  }
  
  // Récupérer l'ID du joueur à partir du socket
  const playerId = Object.keys(game.players).find(id => 
    game.players[id].socketId === socket.id
  );
  
  if (!playerId) {
    return { 
      success: false, 
      message: "Joueur non trouvé" 
    };
  }
  
  // Activer la revanche
  const result = game.activateRevenge(playerId);
  
  // Informer tous les joueurs du résultat
  io.of('/game').to(lobby.id).emit('revenge_activated', {
    playerId,
    success: result.success,
    message: result.message,
    gameState: game.getGameState()
  });

  saveGame(game, lobby);

  return result;
}

function declineRevenge(io, socket, data = {}) {
  const auth = checkAuth(socket, data.token);
  if (auth) return auth;

  const lobby = getLobbyBySocketId(socket.id);
  
  if (!lobby || !lobby.game) {
    return { 
      success: false, 
      message: "Partie non trouvée" 
    };
  }
  
  const game = lobby.game;
  
  // Vérifier que le jeu est en phase de revanche
  if (game.state !== 'revenge') {
    return { 
      success: false, 
      message: "Vous ne pouvez pas refuser la revanche maintenant" 
    };
  }
  
  // Récupérer l'ID du joueur à partir du socket
  const playerId = Object.keys(game.players).find(id => 
    game.players[id].socketId === socket.id
  );
  
  if (!playerId) {
    return { 
      success: false, 
      message: "Joueur non trouvé" 
    };
  }
  
  // Refuser la revanche (fait faillite)
  const result = game.declineRevenge(playerId);
  
  // Informer tous les joueurs du résultat
  io.of('/game').to(lobby.id).emit('revenge_declined', {
    playerId,
    success: result.success,
    message: result.message,
    gameState: game.getGameState()
  });

  saveGame(game, lobby);

  return result;
}

function createAlliance(io, socket, data = {}) {
  const { targetPlayerId, token } = data;
  const auth = checkAuth(socket, token);
  if (auth) return auth;

  if (typeof targetPlayerId !== 'string' || targetPlayerId.trim() === '') {
    return { success: false, message: 'ID de joueur cible requis' };
  }
  const lobby = getLobbyBySocketId(socket.id);
  
  if (!lobby || !lobby.game) {
    return { 
      success: false, 
      message: "Partie non trouvée" 
    };
  }
  
  const game = lobby.game;
  
  // Récupérer l'ID du joueur à partir du socket
  const playerId = Object.keys(game.players).find(id => 
    game.players[id].socketId === socket.id
  );
  
  if (!playerId) {
    return { 
      success: false, 
      message: "Joueur non trouvé" 
    };
  }
  
  // Créer l'alliance
  const result = game.createAlliance(playerId, targetPlayerId);
  
  // Informer tous les joueurs du résultat
  io.of('/game').to(lobby.id).emit('alliance_created', {
    player1Id: playerId,
    player2Id: targetPlayerId,
    success: result.success,
    message: result.message,
    gameState: game.getGameState()
  });

  saveGame(game, lobby);

  return result;
}

function breakAlliance(io, socket, data = {}) {
  const { unilateral = true, token } = data;
  const auth = checkAuth(socket, token);
  if (auth) return auth;

  if (typeof unilateral !== 'boolean') {
    return { success: false, message: 'Paramètre invalide' };
  }
  const lobby = getLobbyBySocketId(socket.id);
  
  if (!lobby || !lobby.game) {
    return { 
      success: false, 
      message: "Partie non trouvée" 
    };
  }
  
  const game = lobby.game;
  
  // Récupérer l'ID du joueur à partir du socket
  const playerId = Object.keys(game.players).find(id => 
    game.players[id].socketId === socket.id
  );
  
  if (!playerId) {
    return { 
      success: false, 
      message: "Joueur non trouvé" 
    };
  }
  
  // Rompre l'alliance
  const result = game.breakAlliance(playerId, unilateral);
  
  // Informer tous les joueurs du résultat
  io.of('/game').to(lobby.id).emit('alliance_broken', {
    playerId,
    unilateral,
    success: result.success,
    message: result.message,
    gameState: game.getGameState()
  });

  saveGame(game, lobby);

  return result;
}

function applyCardEffect(io, socket, data = {}) {
  const { cardId, params, token } = data;
  const auth = checkAuth(socket, token);
  if (auth) return auth;

  if (typeof cardId !== 'string' || cardId.trim() === '') {
    return { success: false, message: 'Carte invalide' };
  }
  const lobby = getLobbyBySocketId(socket.id);
  
  if (!lobby || !lobby.game) {
    return { 
      success: false, 
      message: "Partie non trouvée" 
    };
  }
  
  const game = lobby.game;
  
  // Vérifier que le jeu est en phase de carte
  if (game.state !== 'card') {
    return { 
      success: false, 
      message: "Vous ne pouvez pas utiliser de carte maintenant" 
    };
  }
  
  // Récupérer l'ID du joueur à partir du socket
  const playerId = Object.keys(game.players).find(id => 
    game.players[id].socketId === socket.id
  );
  
  if (!playerId) {
    return { 
      success: false, 
      message: "Joueur non trouvé" 
    };
  }
  
  // Appliquer l'effet de la carte
  const result = game.applyCardEffect(playerId, cardId, params);
  
  // Informer tous les joueurs du résultat
  io.of('/game').to(lobby.id).emit('card_effect_applied', {
    playerId,
    cardId,
    success: result.success,
    message: result.message,
    gameState: game.getGameState()
  });

  saveGame(game, lobby);

  return result;
}

function buyHouse(io, socket, data = {}) {
  const { propertyId, token } = data;
  const auth = checkAuth(socket, token);
  if (auth) return auth;

  if (typeof propertyId !== 'number') {
    return { success: false, message: 'Propriété invalide' };
  }

  const lobby = getLobbyBySocketId(socket.id);

  if (!lobby || !lobby.game) {
    return { success: false, message: 'Partie non trouvée' };
  }

  const game = lobby.game;

  const playerId = Object.keys(game.players).find(
    id => game.players[id].socketId === socket.id
  );

  if (!playerId) {
    return { success: false, message: 'Joueur non trouvé' };
  }

  const result = game.buyHouse(playerId, propertyId);

  io.of('/game').to(lobby.id).emit('house_bought', {
    playerId,
    propertyId,
    success: result.success,
    message: result.message,
    gameState: game.getGameState()
  });

  saveGame(game, lobby);

  return result;
}

function buyHotel(io, socket, data = {}) {
  const { propertyId, token } = data;
  const auth = checkAuth(socket, token);
  if (auth) return auth;

  if (typeof propertyId !== 'number') {
    return { success: false, message: 'Propriété invalide' };
  }

  const lobby = getLobbyBySocketId(socket.id);

  if (!lobby || !lobby.game) {
    return { success: false, message: 'Partie non trouvée' };
  }

  const game = lobby.game;

  const playerId = Object.keys(game.players).find(
    id => game.players[id].socketId === socket.id
  );

  if (!playerId) {
    return { success: false, message: 'Joueur non trouvé' };
  }

  const result = game.buyHotel(playerId, propertyId);

  io.of('/game').to(lobby.id).emit('hotel_bought', {
    playerId,
    propertyId,
    success: result.success,
    message: result.message,
    gameState: game.getGameState()
  });

  saveGame(game, lobby);

  return result;
}

function mortgageProperty(io, socket, data = {}) {
  const { propertyId, token } = data;
  const auth = checkAuth(socket, token);
  if (auth) return auth;

  if (typeof propertyId !== 'number') {
    return { success: false, message: 'Propriété invalide' };
  }

  const lobby = getLobbyBySocketId(socket.id);

  if (!lobby || !lobby.game) {
    return { success: false, message: 'Partie non trouvée' };
  }

  const game = lobby.game;

  const playerId = Object.keys(game.players).find(
    id => game.players[id].socketId === socket.id
  );

  if (!playerId) {
    return { success: false, message: 'Joueur non trouvé' };
  }

  const result = game.mortgageProperty(playerId, propertyId);

  io.of('/game').to(lobby.id).emit('property_mortgaged', {
    playerId,
    propertyId,
    success: result.success,
    message: result.message,
    gameState: game.getGameState()
  });

  saveGame(game, lobby);

  return result;
}

function unmortgageProperty(io, socket, data = {}) {
  const { propertyId, token } = data;
  const auth = checkAuth(socket, token);
  if (auth) return auth;

  if (typeof propertyId !== 'number') {
    return { success: false, message: 'Propriété invalide' };
  }

  const lobby = getLobbyBySocketId(socket.id);

  if (!lobby || !lobby.game) {
    return { success: false, message: 'Partie non trouvée' };
  }

  const game = lobby.game;

  const playerId = Object.keys(game.players).find(
    id => game.players[id].socketId === socket.id
  );

  if (!playerId) {
    return { success: false, message: 'Joueur non trouvé' };
  }

  const result = game.unmortgageProperty(playerId, propertyId);

  io.of('/game').to(lobby.id).emit('property_unmortgaged', {
    playerId,
    propertyId,
    success: result.success,
    message: result.message,
    gameState: game.getGameState()
  });

  saveGame(game, lobby);

  return result;
}

function quitGame(io, socket, data = {}) {
  const auth = checkAuth(socket, data.token);
  if (auth) return auth;

  const lobby = getLobbyBySocketId(socket.id);

  if (!lobby || !lobby.game) {
    return { success: false, message: 'Partie non trouvée' };
  }

  const game = lobby.game;
  const playerId = Object.keys(game.players).find(
    id => game.players[id].socketId === socket.id
  );

  if (!playerId) {
    return { success: false, message: 'Joueur non trouvé' };
  }

  const player = game.players[playerId];
  game.playerBankruptcy(player);

  io.of('/game').to(lobby.id).emit('player_quit', {
    playerId,
    gameState: game.getGameState()
  });

  saveGame(game, lobby);

  leaveLobby(socket, { lobbyId: lobby.id });

  socket.disconnect(true);

  return { success: true };
}

module.exports = {
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
};