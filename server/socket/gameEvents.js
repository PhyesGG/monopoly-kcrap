const Game = require('../game/Game');
const { getLobbyBySocketId, getLobbyById, leaveLobby } = require('./lobby');
const { saveGame } = require('../utils/gamePersistence');

function startGame(io, socket, data) {
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
  const game = new Game();
  
  // Ajouter les joueurs
  lobby.players.forEach(player => {
    game.addPlayer(player.name, player.id);
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

function rollDice(io, socket, data) {
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

function placeBid(io, socket, { amount }) {
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

  saveGame(game, lobby);

  return result;
}

function passBid(io, socket) {
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
  
  // Passer l'enchère
  game.passBid(playerId);
  
  // Avancer à la prochaine ronde d'enchères
  const roundResult = game.currentAuction.nextRound();
  
  if (roundResult.ended) {
    // Si l'enchère est terminée, finaliser
    const auctionResult = game.finalizeAuction();

    io.of('/game').to(lobby.id).emit('auction_ended', {
      result: auctionResult,
      gameState: game.getGameState()
    });
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

function activateRevenge(io, socket) {
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

function declineRevenge(io, socket) {
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

function createAlliance(io, socket, { targetPlayerId }) {
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

function breakAlliance(io, socket, { unilateral = true }) {
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

function applyCardEffect(io, socket, { cardId, params }) {
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

function buyHouse(io, socket, { propertyId }) {
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

function buyHotel(io, socket, { propertyId }) {
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

function mortgageProperty(io, socket, { propertyId }) {
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

function unmortgageProperty(io, socket, { propertyId }) {
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

function quitGame(io, socket) {
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
  quitGame
};