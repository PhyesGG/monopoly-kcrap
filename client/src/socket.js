import io from 'socket.io-client';
import { updateGameState } from './state/game';
import {
  setDiceResult,
  setAuctionState,
  setCardState,
  setRevengeState,
  setAllianceState,
  setLeaderboard
} from './state/ui';
import { getPlayerState } from './state/player';

// Gestionnaire de connexion au serveur
let socket = null;
const chatListeners = [];
const tradeListeners = [];

export function initSocket(url, onConnect) {
  // Lors du développement avec le client sur le port 8080, la connexion
  // WebSocket doit cibler le serveur Express sur le port 3000.
  if (!url) {
    const { protocol, hostname, port } = window.location;
    if (port === '8080') {
      url = `${protocol}//${hostname}:3000`;
    } else {
      url = window.location.origin;
    }
  }

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
    if (onConnect) onConnect();
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

  socket.on('chat_message', (msg) => {
    chatListeners.forEach(l => l(msg));
  });

  socket.on('trade_proposal', (trade) => {
    tradeListeners.forEach(l => l(trade));
  });
  
  // Événements du jeu
  socket.on('game_started', ({ gameState }) => {
    console.log('Partie démarrée:', gameState);
    updateGameState(gameState);
  });
  
  socket.on('dice_rolled', ({ result, gameState }) => {
    console.log('Dés lancés:', result);
    setDiceResult(result);
    if (result.action && result.action.type === 'card') {
      setCardState({ card: result.action.card, applied: false });
    } else {
      setCardState(null);
    }
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

  socket.on('auction_started', ({ property, startingBid, gameState }) => {
    console.log('Enchère démarrée');
    setAuctionState({ started: true, property, startingBid, amount: startingBid });
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

  socket.on('house_bought', ({ playerId, propertyId, success, message, gameState }) => {
    console.log('Maison achetée:', playerId, propertyId, success, message);
    updateGameState(gameState);
  });

  socket.on('hotel_bought', ({ playerId, propertyId, success, message, gameState }) => {
    console.log("Hôtel acheté:", playerId, propertyId, success, message);
    updateGameState(gameState);
  });

  socket.on('property_mortgaged', ({ playerId, propertyId, success, message, gameState }) => {
    console.log('Propriété hypothéquée:', playerId, propertyId, success, message);
    updateGameState(gameState);
  });

  socket.on('property_unmortgaged', ({ playerId, propertyId, success, message, gameState }) => {
    console.log("Hypothèque levée:", playerId, propertyId, success, message);
    updateGameState(gameState);
  });

  socket.on('player_quit', ({ playerId, gameState }) => {
    console.log('Joueur a quitté la partie:', playerId);
    updateGameState(gameState);
  });

  socket.on('game_ended', ({ result, gameState }) => {
    console.log('Partie terminée');
    setLeaderboard(result.ranking);
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

export function createLobby(playerName, lobbyName, color = '#FF00A8') {
  return new Promise((resolve, reject) => {
    if (!socket) {
      console.error('Socket non initialisé lors de createLobby');
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    console.log('Émission de l\'événement create_lobby avec:', { playerName, lobbyName, color });
    
    // Ajouter un timeout pour la réponse
    const timeout = setTimeout(() => {
      console.error('Timeout sur la réponse de create_lobby');
      reject(new Error('Délai de réponse dépassé'));
    }, 5000);
    
    socket.emit('create_lobby', { playerName, lobbyName, color }, (response) => {
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

export function joinLobby(playerName, lobbyId, color = '#FF00A8') {
  return new Promise((resolve, reject) => {
    if (!socket) {
      console.error('Socket non initialisé lors de joinLobby');
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    console.log('Émission de l\'événement join_lobby avec:', { playerName, lobbyId, color });
    
    // Ajouter un timeout pour la réponse
    const timeout = setTimeout(() => {
      console.error('Timeout sur la réponse de join_lobby');
      reject(new Error('Délai de réponse dépassé'));
    }, 5000);
    
    socket.emit('join_lobby', { playerName, lobbyId, color }, (response) => {
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

export function setPlayerColor(color) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }

    socket.emit('set_color', { color }, (response) => {
      if (response && response.success) {
        resolve(true);
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

export function startGame(boardPreset) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }
    
    socket.emit('start_game', { boardPreset }, (response) => {
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

export function buyHouse(propertyId) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }

    socket.emit('buy_house', { propertyId }, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function buyHotel(propertyId) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }

    socket.emit('buy_hotel', { propertyId }, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function mortgageProperty(propertyId) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }

    socket.emit('mortgage_property', { propertyId }, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function unmortgageProperty(propertyId) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }

    socket.emit('unmortgage_property', { propertyId }, (response) => {
      if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function startAuction() {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }

    const { token } = getPlayerState() || {};

    socket.emit('start_auction', { token }, (response) => {
      if (response && response.success) {
        if (response.property) {
          setAuctionState({ started: true, property: response.property, startingBid: response.startingBid, amount: response.startingBid });
          updateGameState(response.gameState);
        }
        resolve(response);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function quitGame() {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }

    socket.emit('quit_game', null, (response) => {
      if (response && response.success) {
        resolve(true);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function reconnectPlayer(lobbyId, token, previousSocketId) {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket non initialisé'));
      return;
    }

    socket.emit('reconnect_player', { lobbyId, token, previousSocketId }, (response) => {
      if (response && response.success) {
        resolve(response.lobby);
      } else {
        reject(new Error(response ? response.message : 'Erreur inconnue'));
      }
    });
  });
}

export function sendChatMessage(message) {
  return new Promise((resolve, reject) => {
    if (!socket) { reject(new Error('Socket non initialisé')); return; }
    const { token } = getPlayerState();
    socket.emit('chat_message', { token, message }, (res) => {
      if (res && res.success) resolve(true); else reject(new Error(res ? res.message : 'Erreur inconnue'));
    });
  });
}

export function subscribeToChat(listener) {
  chatListeners.push(listener);
}

export function subscribeToTrades(listener) {
  tradeListeners.push(listener);
}

export function proposeTrade(toPlayerId, offer) {
  return new Promise((resolve, reject) => {
    if (!socket) { reject(new Error('Socket non initialisé')); return; }
    const { token } = getPlayerState();
    socket.emit('propose_trade', { token, toPlayerId, offer }, (res) => {
      if (res && res.success) resolve(true); else reject(new Error(res ? res.message : 'Erreur inconnue'));
    });
  });
}

