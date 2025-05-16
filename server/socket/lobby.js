const Game = require('../game/Game');

// Stocker les lobbies actifs
const lobbies = {};

// Stocker les connexions des joueurs (socket.id -> lobby)
const playerConnections = {};

function createLobby(socket, { playerName, lobbyName }) {
  console.log('Demande de création de lobby:', { playerName, lobbyName, socketId: socket.id });
  
  if (!playerName || !lobbyName) {
    return { 
      success: false, 
      message: "Nom de joueur et nom de lobby requis" 
    };
  }
  
  const lobbyId = generateLobbyId();
  
  lobbies[lobbyId] = {
    id: lobbyId,
    name: lobbyName,
    host: socket.id,
    players: [{
      id: socket.id,
      name: playerName
    }],
    game: null,
    createdAt: Date.now()
  };
  
  // Associer le socket au lobby
  playerConnections[socket.id] = lobbyId;
  
  // Rejoindre la salle socket du lobby
  socket.join(lobbyId);
  
  console.log('Lobby créé avec succès:', lobbyId);
  
  return {
    success: true,
    lobby: {
      id: lobbyId,
      name: lobbyName,
      players: lobbies[lobbyId].players,
      isHost: true
    }
  };
}

function joinLobby(socket, { playerName, lobbyId }) {
  console.log('Demande de rejoindre le lobby:', { playerName, lobbyId, socketId: socket.id });
  
  if (!playerName || !lobbyId) {
    return { 
      success: false, 
      message: "Nom de joueur et ID de lobby requis" 
    };
  }
  
  const lobby = lobbies[lobbyId];
  
  if (!lobby) {
    console.log('Lobby non trouvé:', lobbyId);
    return { 
      success: false, 
      message: "Lobby non trouvé" 
    };
  }
  
  if (lobby.game) {
    return { 
      success: false, 
      message: "La partie a déjà commencé" 
    };
  }
  
  // Vérifier si le joueur est déjà dans le lobby
  const existingPlayer = lobby.players.find(p => p.id === socket.id);
  
  if (existingPlayer) {
    return { 
      success: false, 
      message: "Vous êtes déjà dans ce lobby" 
    };
  }
  
  // Ajouter le joueur au lobby
  lobby.players.push({
    id: socket.id,
    name: playerName
  });
  
  // Associer le socket au lobby
  playerConnections[socket.id] = lobbyId;
  
  // Rejoindre la salle socket du lobby
  socket.join(lobbyId);
  
  // Notifier les autres joueurs
  socket.to(lobbyId).emit('player_joined', {
    player: {
      id: socket.id,
      name: playerName
    }
  });
  
  console.log('Joueur ajouté au lobby avec succès:', playerName);
  
  return {
    success: true,
    lobby: {
      id: lobbyId,
      name: lobby.name,
      players: lobby.players,
      isHost: socket.id === lobby.host
    }
  };
}

function leaveLobby(socket, { lobbyId } = {}) {
  // Si l'ID du lobby n'est pas fourni, essayer de le récupérer à partir des connexions
  if (!lobbyId) {
    lobbyId = playerConnections[socket.id];
  }
  
  if (!lobbyId || !lobbies[lobbyId]) {
    return { 
      success: false, 
      message: "Lobby non trouvé" 
    };
  }
  
  const lobby = lobbies[lobbyId];
  
  // Retirer le joueur du lobby
  const playerIndex = lobby.players.findIndex(p => p.id === socket.id);
  
  if (playerIndex !== -1) {
    const playerName = lobby.players[playerIndex].name;
    lobby.players.splice(playerIndex, 1);
    
    // Notifier les autres joueurs
    socket.to(lobbyId).emit('player_left', {
      playerId: socket.id,
      playerName
    });
    
    // Si c'était l'hôte, désigner un nouvel hôte
    if (socket.id === lobby.host && lobby.players.length > 0) {
      lobby.host = lobby.players[0].id;
      
      // Notifier le changement d'hôte
      socket.to(lobbyId).emit('host_changed', {
        newHostId: lobby.host
      });
    }
    
    // Supprimer le lobby s'il est vide
    if (lobby.players.length === 0) {
      delete lobbies[lobbyId];
    }
    
    // Supprimer l'association du joueur
    delete playerConnections[socket.id];
    
    // Quitter la salle socket
    socket.leave(lobbyId);
    
    return { success: true };
  }
  
  return { 
    success: false, 
    message: "Joueur non trouvé dans le lobby" 
  };
}

function listLobbies() {
  console.log('Demande de liste des lobbies, lobbies actifs:', Object.keys(lobbies).length);
  
  return {
    success: true,
    lobbies: Object.values(lobbies)
      .filter(lobby => !lobby.game) // Ne montrer que les lobbies sans partie en cours
      .map(lobby => ({
        id: lobby.id,
        name: lobby.name,
        players: lobby.players.length,
        maxPlayers: 8,
        host: lobby.players.find(p => p.id === lobby.host)?.name || 'Inconnu'
      }))
  };
}

function getLobbyBySocketId(socketId) {
  const lobbyId = playerConnections[socketId];
  return lobbyId ? lobbies[lobbyId] : null;
}

function getLobbyById(lobbyId) {
  return lobbies[lobbyId] || null;
}

// Générer un ID de lobby de 6 caractères
function generateLobbyId() {
  let id;
  do {
    id = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (lobbies[id]);
  
  return id;
}

module.exports = {
  createLobby,
  joinLobby,
  leaveLobby,
  listLobbies,
  getLobbyBySocketId,
  getLobbyById,
  lobbies
};