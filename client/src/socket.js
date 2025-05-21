import io from 'socket.io-client';
import { updateGameState } from './state/game';
import { 
  setDiceResult,
  setAuctionState,
  setCardState,
  setRevengeState,
  setAllianceState
} from './state/ui';

// Gestionnaire de connexion au serveur
let socket = null;

export function initSocket(url = window.location.origin) {
  if (socket) {
    socket.disconnect();
  }

  // Correction de la connexion socket.io
  // Se connecter explicitement au namespace "/game" utilisé par le serveur
  socket = io(`${url}/game`, { path: '/socket.io' });

  console.log('Tentative de connexion socket.io au namespace /game à:', `${url}`);
  
  // Écouter l'événement de connexion
  socket.on('connect', () => {
    console.log('Connexion socket.io établie avec succès, socket ID:', socket.id);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Erreur de connexion socket.io:', error);
  });
  
  // Événements du lobby
  socket.on('player_joined', (data) => {
    console.log('Joueur rejoint:', data);
    // Mettre à jour l'interface
  });
  
  socket.on('player_left', (data) => {
    console.log('Joueur parti:', data);
    // Mettre à jour l'interface
  });
  
  socket.on('host_changed', (data) => {
    console.log('Nouvel hôte:', data);
    // Mettre à jour l'interface
  });
  
  // Événements du jeu
  socket.on('game_started', ({ gameState }) => {
    console.log('Partie démarrée:', gameState);
    updateGameState(gameState);
  });
  
  socket.on('dice_rolled', ({ result, gameState }) => {
    console.log('Dés lancés:', result);
    setDiceResult(result);
    updateGameState(gameState);
  });
  
  socket.on('bid_placed', ({ playerId, amount, success, message, gameState }) => {
    console.log('Enchère placée:', playerId, amount, success, message);
    setAuctionState({ playerId, amount, success, message });
    updateGameState(gameState);
  });
  
  socket.on('bid_passed', ({ playerId, success, message, gameState }) => {
    console.log('Enchère passée:', playerId, success, message);
    setAuctionState({ playerId, passed: true, success, message });
    updateGameState(gameState);
  });
  
  socket.on('auction_ended', ({ result, gameState }) => {
    console.log('Enchère terminée:', result);
    setAuctionState({ ended: true, result });
    updateGameState(gameState);
  });
  
  socket.on('revenge_activated', ({ playerId, success, message, gameState }) => {
    console.log('Revanche activée:', playerId, success, message);
    setRevengeState({ activated: true, success, message });
    updateGameState(gameState);
  });
  
  socket.on('revenge_declined', ({ playerId, success, message, gameState }) => {
    console.log('Revanche refusée:', playerId, success, message);
    setRevengeState({ declined: true, success, message });
    updateGameState(gameState);
  });
  
  socket.on('alliance_created', ({ player1Id, player2Id, success, message, gameState }) => {
    console.log('Alliance créée:', player1Id, player2Id, success, message);
    setAllianceState({ created: true, player1Id, player2Id, success, message });
    updateGameState(gameState);
  });
  
  socket.on('alliance_broken', ({ playerId, unilateral, success, message, gameState }) => {
    console.log('Alliance rompue:', playerId, unilateral, success, message);
    setAllianceState({ broken: true, playerId, unilateral, success, message });
    updateGameState(gameState);
  });
  
  socket.on('card_effect_applied', ({ playerId, cardId, success, message, gameState }) => {
    console.log('Effet de carte appliqué:', playerId, cardId, success, message);
    setCardState({ applied: true, playerId, cardId, success, message });
    updateGameState(gameState);
  });
  
  socket.on('disconnect', () => {
    console.log('Déconnecté du serveur');
    // Gérer la déconnexion
  });
  
  return socket;
}

export function getSocket() {
  return socket;
}

export function createLobby(playerName, lobbyName) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      console.error('Socket non initialisé lors de createLobby');
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    console.log('Émission de l\'événement create_lobby avec:', { playerName, lobbyName });
    
    // Ajouter un timeout pour la réponse
    const timeout = setTimeout(() => {
      console.error('Timeout sur la réponse de create_lobby');
      reject(new Error('Délai de réponse dépassé'));
    }, 5000);
    
    socket.emit('create_lobby', { playerName, lobbyName }, (response) => {
      clearTimeout(timeout);
      console.log('Réponse reçue pour create_lobby:', response);
      
      if (response && response.success) {
        resolve(response.lobby);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function joinLobby(playerName, lobbyId) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      console.error('Socket non initialisé lors de joinLobby');
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    console.log('Émission de l\'événement join_lobby avec:', { playerName, lobbyId });
    
    // Ajouter un timeout pour la réponse
    const timeout = setTimeout(() => {
      console.error('Timeout sur la réponse de join_lobby');
      reject(new Error('Délai de réponse dépassé'));
    }, 5000);
    
    socket.emit('join_lobby', { playerName, lobbyId }, (response) => {
      clearTimeout(timeout);
      console.log('Réponse reçue pour join_lobby:', response);
      
      if (response && response.success) {
        resolve(response.lobby);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function leaveLobby(lobbyId) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    socket.emit('leave_lobby', { lobbyId }, (response) => {
      if (response && response.success) {
        resolve(true);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function listLobbies() {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    console.log('Émission de l\'événement list_lobbies');
    
    // Ajouter un timeout pour la réponse
    const timeout = setTimeout(() => {
      console.error('Timeout sur la réponse de list_lobbies');
      reject(new Error('Délai de réponse dépassé'));
    }, 5000);
    
    socket.emit('list_lobbies', (response) => {
      clearTimeout(timeout);
      console.log('Réponse reçue pour list_lobbies:', response);
      
      if (response && response.success) {
        resolve(response.lobbies);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function startGame() {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    socket.emit('start_game', {}, (response) => {
      if (response && response.success) {
        resolve(true);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function rollDice() {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    socket.emit('roll_dice', {}, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function placeBid(amount) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    socket.emit('place_bid', { amount }, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function passBid() {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    socket.emit('pass_bid', {}, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function activateRevenge() {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    socket.emit('activate_revenge', {}, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function declineRevenge() {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    socket.emit('decline_revenge', {}, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function createAlliance(targetPlayerId) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    socket.emit('create_alliance', { targetPlayerId }, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function breakAlliance(unilateral = true) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    socket.emit('break_alliance', { unilateral }, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function applyCardEffect(cardId, params) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    socket.emit('apply_card_effect', { cardId, params }, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}