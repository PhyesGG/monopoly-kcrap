const Game = require('../game/Game');
const { v4: uuidv4 } = require('uuid');

// Stocker les lobbies actifs
const lobbies = {};

// Stocker les connexions des joueurs
// socket.id -> { lobbyId, token }
const playerConnections = {};

// Vérifier qu'un socket possède bien le jeton fourni
function validateToken(socket, token) {
  const conn = playerConnections[socket.id];
  return !!(conn && conn.token && token && conn.token === token);
}

function createLobby(socket, { playerName, lobbyName }) {
  console.log('Demande de création de lobby:', { playerName, lobbyName, socketId: socket.id });

  if (typeof playerName !== 'string' || playerName.trim() === '' ||
      typeof lobbyName !== 'string' || lobbyName.trim() === '') {
    return {
      success: false,
      message: "Nom de joueur et nom de lobby requis"
    };
  }
  
  const lobbyId = generateLobbyId();
  const token = uuidv4();

  lobbies[lobbyId] = {
    id: lobbyId,
    name: lobbyName,
    host: socket.id,
    players: [{
      id: socket.id,
      token,
      name: playerName,
      connected: true
    }],
    game: null,
    createdAt: Date.now()
  };

  // Associer le socket au lobby
  playerConnections[socket.id] = { lobbyId, token };
  
  // Rejoindre la salle socket du lobby
  socket.join(lobbyId);
  
  console.log('Lobby créé avec succès:', lobbyId);
  
  return {
    success: true,
    lobby: {
      id: lobbyId,
      name: lobbyName,
      players: lobbies[lobbyId].players,
      isHost: true,
      token
    }
  };
}

function joinLobby(socket, { playerName, lobbyId }) {
  console.log('Demande de rejoindre le lobby:', { playerName, lobbyId, socketId: socket.id });

  if (typeof playerName !== 'string' || playerName.trim() === '' ||
      typeof lobbyId !== 'string' || lobbyId.trim() === '') {
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
  const token = uuidv4();
  lobby.players.push({
    id: socket.id,
    token,
    name: playerName,
    connected: true
  });

  // Associer le socket au lobby
  playerConnections[socket.id] = { lobbyId, token };
  
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
      isHost: socket.id === lobby.host,
      token
    }
  };
}

function reconnectPlayer(socket, { lobbyId, token, previousSocketId }) {
  if (typeof lobbyId !== 'string' || lobbyId.trim() === '') {
    return { success: false, message: 'ID de lobby requis' };
  }

  const lobby = lobbies[lobbyId];
  if (!lobby) {
    return { success: false, message: 'Lobby non trouvé' };
  }

  const player = lobby.players.find(p => p.token === token || p.id === previousSocketId);
  if (!player) {
    return { success: false, message: 'Joueur non trouvé' };
  }

  const oldId = player.id;
  player.id = socket.id;
  player.connected = true;
  playerConnections[socket.id] = { lobbyId, token: player.token };
  delete playerConnections[oldId];

  if (lobby.host === oldId) {
    lobby.host = socket.id;
  }

  if (lobby.game) {
    const gamePlayer = Object.values(lobby.game.players).find(pl => pl.socketId === oldId);
    if (gamePlayer) {
      gamePlayer.socketId = socket.id;
    }
  }

  socket.join(lobbyId);
  socket.to(lobbyId).emit('player_reconnected', { playerName: player.name });

  return {
    success: true,
    lobby: {
      id: lobbyId,
      name: lobby.name,
      players: lobby.players,
      isHost: socket.id === lobby.host,
      token: player.token,
      gameState: lobby.game ? lobby.game.getGameState() : null
    }
  };
}

function leaveLobby(socket, { lobbyId } = {}) {
  // Si l'ID du lobby n'est pas fourni, essayer de le récupérer à partir des connexions
  if (!lobbyId) {
    lobbyId = playerConnections[socket.id]?.lobbyId;
  }
  
  if (!lobbyId || !lobbies[lobbyId]) {
    return { 
      success: false, 
      message: "Lobby non trouvé" 
    };
  }
  
  const lobby = lobbies[lobbyId];
  const token = playerConnections[socket.id]?.token;

  // Retirer le joueur du lobby
  const playerIndex = lobby.players.findIndex(p => p.id === socket.id || p.token === token);
  
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
  const connection = playerConnections[socketId];
  return connection ? lobbies[connection.lobbyId] : null;
}

function getLobbyById(lobbyId) {
  return lobbies[lobbyId] || null;
}

function handleDisconnect(socket) {
  const connection = playerConnections[socket.id];
  if (!connection) {
    return;
  }

  const lobby = lobbies[connection.lobbyId];
  if (!lobby) {
    delete playerConnections[socket.id];
    return;
  }

  const player = lobby.players.find(p => p.id === socket.id);
  if (player) {
    player.connected = false;
  }

  delete playerConnections[socket.id];
  socket.leave(lobby.id);

  socket.to(lobby.id).emit('player_disconnected', { playerName: player?.name });
}

// Générer un ID de lobby de 6 caractères
function generateLobbyId() {
  let id;
  do {
    id = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (lobbies[id]);

  return id;
}

function registerLoadedGames(savedGames) {
  for (const gameId of Object.keys(savedGames)) {
    const { game, lobby: lobbyData } = savedGames[gameId];
    if (!game || !lobbyData) continue;

    lobbies[lobbyData.id] = {
      id: lobbyData.id,
      name: lobbyData.name || `Restored ${lobbyData.id}`,
      host: lobbyData.host,
      players: lobbyData.players.map(p => ({
        ...p,
        connected: false
      })),
      game,
      createdAt: lobbyData.createdAt || Date.now()
    };
  }
}

module.exports = {
  createLobby,
  joinLobby,
  reconnectPlayer,
  leaveLobby,
  listLobbies,
  getLobbyBySocketId,
  getLobbyById,
  handleDisconnect,
  lobbies,
  registerLoadedGames,
  validateToken
};