import {
  initSocket,
  getSocket,
  createLobby,
  joinLobby,
  listLobbies,
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
  reconnectPlayer,
  quitGame,
  startAuction,
  setPlayerColor
} from './socket';
import { getGameState, subscribeToGameState } from './state/game';
import { getUIState, subscribeToUIState } from './state/ui';
import { getPlayerState, setPlayerState, clearPlayerState } from './state/player';
import { getUsername, setUsername } from './state/username';
import { renderProperty } from './components/Property.js';

// Initialiser la connexion socket
async function handleSocketConnect() {
  const restored = await attemptAutoReconnect();
  if (!restored) {
    handlePathLobby();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Passer explicitement la fonction de rappel en second argument pour
  // éviter que la fonction soit utilisée comme URL de connexion.
  initSocket(undefined, handleSocketConnect);

  // Nettoyer l'état lorsqu'on quitte la page
  window.addEventListener('beforeunload', () => {
    const state = getPlayerState();
    const socket = getSocket();
    if (socket && state && state.lobbyId) {
      // Informer le serveur sans attendre de réponse
      socket.emit('quit_game', { token: state.token });
      socket.emit('leave_lobby', { lobbyId: state.lobbyId });
    }
    clearPlayerState();
  });
});

async function handlePathLobby() {
  const lobbyId = window.location.pathname.replace(/^\//, '');
  if (lobbyId) {
    const storedName = getUsername();
    if (storedName) {
      try {
        const lobby = await joinLobby(storedName, lobbyId);
        setPlayerState({
          name: storedName,
          lobbyId: lobby.id,
          token: lobby.token,
          socketId: getSocket().id
        });
        window.history.replaceState(null, '', `/${lobby.id}`);
        showLobbyScreen(lobby);
        return;
      } catch (error) {
        console.error('Auto join failed:', error);
      }
    }
    renderHomePage(lobbyId);
  } else {
    renderHomePage();
  }
}

function renderHomePage(prefillLobbyId = '') {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="home-container">
      <div class="grid-lines"></div>
      
      <div class="neon-particle particle-1"></div>
      <div class="neon-particle particle-2"></div>
      <div class="neon-particle particle-3"></div>
      <div class="neon-particle particle-4"></div>
      
      <div class="logo">
        <h1 data-text="MONOPOLY KCRAP" class="glitch">MONOPOLY KCRAP</h1>
      </div>
      <p class="subtitle">Le jeu classique réinventé avec un système d'enchères moderne, des alliances tactiques et des mécanismes de revanche dans un univers cyberpunk</p>
      
      <div class="cards-container">
        <div class="card create-card">
          <h2><i class="fas fa-plus-circle"></i>Créer un salon</h2>
          <div class="input-group">
            <label for="player-name">Votre nom</label>
            <input type="text" id="player-name" placeholder="Entrez votre pseudo">
          </div>
          <div class="input-group">
            <label for="lobby-name">Nom du salon</label>
            <input type="text" id="lobby-name" placeholder="Nommez votre salon">
          </div>
          <button id="create-lobby-btn" class="btn">
            <i class="fas fa-gamepad"></i> Créer et jouer
          </button>
        </div>
        
        <div class="card join-card">
          <h2><i class="fas fa-sign-in-alt"></i>Rejoindre un salon</h2>
          <div class="input-group">
            <label for="join-player-name">Votre nom</label>
            <input type="text" id="join-player-name" placeholder="Entrez votre pseudo">
          </div>
          <div class="input-group">
            <label for="lobby-id">Code du salon</label>
            <input type="text" id="lobby-id" placeholder="Exemple: ABC123" value="${prefillLobbyId}">
          </div>
          <button id="join-lobby-btn" class="btn btn-secondary">
            <i class="fas fa-play"></i> Rejoindre la partie
          </button>
        </div>
      </div>
      
      <div class="lobbies-list">
        <h2>
          Salons disponibles
          <button id="refresh-lobbies-btn" class="refresh-btn">
            <i class="fas fa-sync-alt"></i>
          </button>
        </h2>
        
        <div class="lobbies-container">
          <div class="lobbies-header">
            <div>Salon</div>
            <div>Joueurs</div>
            <div>Action</div>
          </div>
          <div class="lobbies" id="lobbies">
            <div class="empty-lobbies">Chargement des salons...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const storedName = getUsername();
  document.getElementById('player-name').value = storedName;
  document.getElementById('join-player-name').value = storedName;
  if (prefillLobbyId) {
    document.getElementById('lobby-id').value = prefillLobbyId;
  }
  
  // Ajouter les polices et icônes
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fontAwesome);
  }
  
  if (!document.querySelector('link[href*="Orbitron"]')) {
    const googleFonts = document.createElement('link');
    googleFonts.rel = 'stylesheet';
    googleFonts.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@400;500;700&display=swap';
    document.head.appendChild(googleFonts);
  }
  
  // Gestionnaires d'événements pour le lobby
  document.getElementById('create-lobby-btn').addEventListener('click', handleCreateLobby);
  document.getElementById('join-lobby-btn').addEventListener('click', handleJoinLobby);
  document.getElementById('refresh-lobbies-btn').addEventListener('click', handleRefreshLobbies);
  
  // Rafraîchir la liste des lobbies au chargement
  handleRefreshLobbies();
}

// Créer un lobby
async function handleCreateLobby() {
  const playerName = document.getElementById('player-name').value;
  const lobbyName = document.getElementById('lobby-name').value;
  setUsername(playerName);
  
  if (!playerName || !lobbyName) {
    alert('Veuillez entrer un nom de joueur et un nom de salon.');
    return;
  }
  
  try {
    console.log('Tentative de création de salon avec:', { playerName, lobbyName });
    const lobby = await createLobby(playerName, lobbyName);
    console.log('Salon créé avec succès:', lobby);
    const me = lobby.players.find(p => p.id === getSocket().id);
    setPlayerState({
      name: playerName,
      lobbyId: lobby.id,
      token: lobby.token,
      socketId: getSocket().id,
      color: me && me.color ? me.color : '#FF00A8'
    });
    window.history.pushState(null, '', `/${lobby.id}`);
    showLobbyScreen(lobby);
  } catch (error) {
    console.error('Erreur lors de la création du salon:', error);
    alert(`Erreur: ${error.message}`);
  }
}

// Rejoindre un lobby
async function handleJoinLobby() {
  const playerName = document.getElementById('join-player-name').value;
  const lobbyId = document.getElementById('lobby-id').value;
  setUsername(playerName);
  
  if (!playerName || !lobbyId) {
    alert('Veuillez entrer un nom de joueur et un ID de salon.');
    return;
  }
  
  try {
    console.log('Tentative de rejoindre le salon avec:', { playerName, lobbyId });
    const lobby = await joinLobby(playerName, lobbyId);
    console.log('Salon rejoint avec succès:', lobby);
    const me = lobby.players.find(p => p.id === getSocket().id);
    setPlayerState({
      name: playerName,
      lobbyId: lobby.id,
      token: lobby.token,
      socketId: getSocket().id,
      color: me && me.color ? me.color : '#FF00A8'
    });
    window.history.pushState(null, '', `/${lobby.id}`);
    showLobbyScreen(lobby);
  } catch (error) {
    console.error('Erreur lors de l\'adhésion au salon:', error);
    alert(`Erreur: ${error.message}`);
  }
}

// Rafraîchir la liste des lobbies
async function handleRefreshLobbies() {
  try {
    console.log('Demande de la liste des lobbies');
    const lobbies = await listLobbies();
    console.log('Liste des lobbies reçue:', lobbies);
    renderLobbiesList(lobbies);
  } catch (error) {
    console.error('Erreur lors du chargement des lobbies:', error);
    document.getElementById('lobbies').innerHTML = `
      <div class="empty-lobbies">Erreur lors du chargement des salons: ${error.message}</div>
    `;
  }
}

// Afficher la liste des lobbies
function renderLobbiesList(lobbies) {
  const lobbiesList = document.getElementById('lobbies');
  
  if (!lobbies || lobbies.length === 0) {
    lobbiesList.innerHTML = '<div class="empty-lobbies">Aucun salon disponible</div>';
    return;
  }
  
  lobbiesList.innerHTML = '';
  
  lobbies.forEach(lobby => {
    const lobbyItem = document.createElement('div');
    lobbyItem.className = 'lobby-item';
    
    lobbyItem.innerHTML = `
      <div class="lobby-name">${lobby.name}</div>
      <div class="lobby-players">${lobby.players}/${lobby.maxPlayers || 8} joueurs</div>
      <button data-id="${lobby.id}" class="join-btn">Rejoindre</button>
    `;
    
    lobbiesList.appendChild(lobbyItem);
  });
  
  // Ajouter des gestionnaires d'événements aux boutons "Rejoindre"
  document.querySelectorAll('.join-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const lobbyId = e.target.dataset.id;
      const playerName = document.getElementById('join-player-name').value;
      setUsername(playerName);
      
      if (!playerName) {
        alert('Veuillez entrer un nom de joueur.');
        return;
      }
      
      try {
        const lobby = await joinLobby(playerName, lobbyId);
        window.history.pushState(null, '', `/${lobby.id}`);
        showLobbyScreen(lobby);
      } catch (error) {
        alert(`Erreur: ${error.message}`);
      }
    });
  });
}

// Afficher l'écran du lobby
function showLobbyScreen(lobby) {
  const app = document.getElementById('app');

  const myPlayer = lobby.players.find(p => p.id === getSocket().id);
  const myColor = myPlayer && myPlayer.color ? myPlayer.color : '#FF00A8';

  app.innerHTML = `
    <div class="lobby-screen">
      <div class="grid-lines"></div>
      
      <div class="neon-particle particle-1"></div>
      <div class="neon-particle particle-2"></div>
      
      <div class="logo">
        <h1 data-text="MONOPOLY KCRAP" class="glitch">MONOPOLY KCRAP</h1>
      </div>
      
      <div class="lobby-content">
        <div class="lobby-info">
          <h2>Salon: ${lobby.name}</h2>
          <p>Code d'invitation: <a href="/${lobby.id}" class="lobby-code">${lobby.id}</a></p>
          <div class="lobby-actions">
            ${lobby.isHost ? `
              <select id="board-preset" class="preset-select">
                <option value="classic">Classique</option>
                <option value="english">Anglais</option>
              </select>
              <button id="start-game-btn" class="btn">Commencer la partie</button>
            ` : '<p>En attente du début de la partie...</p>'}
            <button id="leave-lobby-btn" class="btn btn-outline">Quitter le salon</button>
            <div class="color-picker">
              <label for="player-color">Couleur de votre pion</label>
              <input type="color" id="player-color" value="${myColor}">
            </div>
          </div>
        </div>
        
        <div class="players-container">
          <h3>Joueurs</h3>
          <ul id="lobby-players" class="players-list"></ul>
        </div>
      </div>
    </div>
  `;
  
  // Afficher la liste des joueurs
  renderLobbyPlayers(lobby.players);
  
  // Gestionnaire pour démarrer la partie
  if (lobby.isHost) {
    document.getElementById('start-game-btn').addEventListener('click', handleStartGame);
  }

  // Gestionnaire pour quitter le salon
  document.getElementById('leave-lobby-btn').addEventListener('click', handleLeaveLobby);

  const colorInput = document.getElementById('player-color');
  if (colorInput) {
    colorInput.addEventListener('change', handleColorChange);
  }
  
  // S'abonner aux mises à jour du lobby via les événements socket
  const socket = getSocket();
  
  socket.on('player_joined', ({ player }) => {
    console.log('Joueur rejoint le salon:', player);
    const lobbyPlayers = document.getElementById('lobby-players');
    const li = document.createElement('li');
    li.setAttribute('data-id', player.id);
    li.innerHTML = `
      <div class="player-item">
        <span class="color-dot" style="background:${player.color || '#FF00A8'}"></span>
        <span>${player.name}</span>
      </div>
    `;
    lobbyPlayers.appendChild(li);
  });
  
  socket.on('player_left', ({ playerId, playerName }) => {
    console.log('Joueur quitte le salon:', playerId, playerName);
    const playerElement = document.querySelector(`#lobby-players li[data-id="${playerId}"]`);
    if (playerElement) {
      playerElement.remove();
    }
  });
  
  socket.on('host_changed', ({ newHostId }) => {
    console.log('Nouvel hôte du salon:', newHostId);
    // Si le client devient l'hôte, afficher le bouton "Commencer"
    if (socket.id === newHostId) {
      const lobbyActions = document.querySelector('.lobby-actions');
      lobbyActions.innerHTML = `
        <button id="start-game-btn" class="btn">Commencer la partie</button>
        <button id="leave-lobby-btn" class="btn btn-outline">Quitter le salon</button>
      `;
      
      document.getElementById('start-game-btn').addEventListener('click', handleStartGame);
      document.getElementById('leave-lobby-btn').addEventListener('click', handleLeaveLobby);
    }
  });

  socket.on('player_color_changed', ({ playerId, color }) => {
    const dot = document.querySelector(`#lobby-players li[data-id="${playerId}"] .color-dot`);
    if (dot) dot.style.background = color;
  });
  
  socket.on('game_started', ({ gameState }) => {
    console.log('Partie démarrée:', gameState);
    showGameScreen(gameState);
  });
}

// Afficher la liste des joueurs dans le lobby
function renderLobbyPlayers(players) {
  const lobbyPlayers = document.getElementById('lobby-players');
  lobbyPlayers.innerHTML = '';
  
  players.forEach(player => {
    const li = document.createElement('li');
    li.setAttribute('data-id', player.id);
    li.innerHTML = `
      <div class="player-item">
        <span class="color-dot" style="background:${player.color || '#FF00A8'}"></span>
        <span>${player.name}</span>
      </div>
    `;
    lobbyPlayers.appendChild(li);
  });
}

// Démarrer la partie
async function handleStartGame() {
  try {
    console.log('Tentative de démarrage de la partie');
    const presetSelect = document.getElementById('board-preset');
    const preset = presetSelect ? presetSelect.value : undefined;
    await startGame(preset);
    console.log('Partie démarrée avec succès');
  } catch (error) {
    console.error('Erreur lors du démarrage de la partie:', error);
    alert(`Erreur: ${error.message}`);
  }
}

// Quitter le salon
async function handleLeaveLobby() {
  try {
    console.log('Tentative de quitter le salon');
    await leaveLobby();
    console.log('Salon quitté avec succès');
    clearPlayerState();
    // Retourner à l'écran des lobbies
    window.history.pushState(null, '', '/');
    renderHomePage();
  } catch (error) {
    console.error('Erreur lors de la sortie du salon:', error);
    alert(`Erreur: ${error.message}`);
  }
}

async function handleColorChange(e) {
  const color = e.target.value;
  try {
    await setPlayerColor(color);
    const state = getPlayerState();
    setPlayerState({ ...state, color });
  } catch (err) {
    console.error('Erreur lors du changement de couleur:', err);
  }
}

// Quitter la partie sans abandonner
function handleQuitGame() {
  const socket = getSocket();
  if (socket) socket.disconnect();
  clearPlayerState();
  window.history.pushState(null, '', '/');
  renderHomePage();
}

// Déclarer la faillite et quitter
async function handleBankruptGame() {
  try {
    console.log('Tentative de faillite volontaire');
    await quitGame();
    console.log('Faillite déclarée');
    clearPlayerState();
    window.history.pushState(null, '', '/');
    renderHomePage();
  } catch (error) {
    console.error('Erreur lors de la faillite:', error);
    alert(`Erreur: ${error.message}`);
  }
}

async function attemptAutoReconnect() {
  const state = getPlayerState();
  if (!state || !state.lobbyId || !state.token) {
    return false;
  }

  try {
    const lobby = await reconnectPlayer(state.lobbyId, state.token, state.socketId);
    const me = lobby.players.find(p => p.id === getSocket().id || p.token === state.token);
    setPlayerState({ ...state, socketId: getSocket().id, color: me && me.color ? me.color : state.color });
    window.history.replaceState(null, '', `/${state.lobbyId}`);
    if (lobby.gameState) {
      showGameScreen(lobby.gameState);
    } else {
      showLobbyScreen(lobby);
    }
    return true;
  } catch (error) {
    console.error('Reconnexion échouée:', error);
    clearPlayerState();
    return false;
  }
}

// Afficher l'écran de jeu
function showGameScreen(gameState) {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div id="game-screen">
      <div class="grid-lines"></div>
      
      <div class="game-header">
        <h1 data-text="MONOPOLY KCRAP" class="glitch">MONOPOLY KCRAP</h1>
        <div class="game-info">
          <div class="turn-indicator">Tour: ${gameState.turnCount}</div>
          <div class="current-player">Joueur actuel: ${gameState.players.find(p => p.id === gameState.currentPlayer)?.name || ''}</div>
        </div>
        <button id="quit-game-btn" class="btn btn-outline">Quitter</button>
        <button id="bankrupt-btn" class="btn btn-danger">Abandonner</button>
      </div>

      <!-- Plateau de jeu -->
      <div id="board-container">
        <div id="board"></div>
        <div id="property-info" class="property-info"></div>
        <div id="auction-start" class="auction-start hidden">
          <button id="start-auction-btn" class="btn btn-secondary">Lancer l'enchère</button>
        </div>
      </div>

      <!-- Panneau latéral -->
      <div class="game-sidebar">
        <!-- Informations sur les joueurs -->
        <div id="players-info" class="players-panel"></div>
        
        <!-- Contrôles du jeu -->
        <div id="game-controls" class="game-controls">
          <button id="roll-dice-btn" class="btn action-btn">
            <i class="fas fa-dice"></i> Lancer les dés
          </button>
          <div id="dice-result"></div>
        </div>
        
        <!-- Journal de la partie -->
        <div id="game-log" class="game-log">
          <h3>Journal</h3>
          <div class="log-entries"></div>
        </div>
      </div>
    </div>
  `;
  
  // Initialiser le plateau et les contrôles
  renderBoard(gameState.board, gameState.players, gameState.currentPlayer, 'property-info');
  renderPlayersInfo(gameState.players);
  updateGameLog(gameState.log);

  // Ajouter les gestionnaires d'événements
  document.getElementById('roll-dice-btn').addEventListener('click', handleRollDice);
  document.getElementById('quit-game-btn').addEventListener('click', handleQuitGame);
  document.getElementById('bankrupt-btn').addEventListener('click', handleBankruptGame);
  const startBtn = document.getElementById('start-auction-btn');
  if (startBtn) startBtn.addEventListener('click', startAuction);
  
  // S'abonner aux mises à jour du jeu
  subscribeToGameState(updateGameScreen);
  subscribeToUIState(updateUIState);
}

// Fonction pour mettre à jour l'écran de jeu
function updateGameScreen(gameState) {
  if (!gameState) return;

  renderBoard(gameState.board, gameState.players, gameState.currentPlayer, 'property-info');

  renderPlayersInfo(gameState.players);
  updateGameLog(gameState.log);
  
  // Mettre à jour l'état des contrôles selon l'état du jeu
  updateGameControls(gameState);
  
  // Mettre à jour les indicateurs de tour et de joueur actuel
  document.querySelector('.turn-indicator').textContent = `Tour: ${gameState.turnCount}`;
  document.querySelector('.current-player').textContent = `Joueur actuel: ${gameState.players.find(p => p.id === gameState.currentPlayer)?.name || ''}`;
}

// Fonction pour mettre à jour l'interface utilisateur
function updateUIState(uiState) {
  if (!uiState) return;
  
  // Afficher le résultat des dés
  if (uiState.diceResult) {
    const diceResultElement = document.getElementById('dice-result');
    if (diceResultElement) {
      diceResultElement.innerHTML = `
        <div class="dice-roll">
          <div class="dice dice-${uiState.diceResult.dice1}">${uiState.diceResult.dice1}</div>
          <div class="dice dice-${uiState.diceResult.dice2}">${uiState.diceResult.dice2}</div>
          <div class="dice-total">${uiState.diceResult.total}</div>
        </div>
      `;
      diceResultElement.querySelectorAll('.dice').forEach(el => {
        el.classList.add('roll-anim');
        el.addEventListener('animationend', () => {
          el.classList.remove('roll-anim');
        }, { once: true });
      });
    }
  }
  
  // Gérer les enchères
  if (uiState.auction) {
    handleAuctionUI(uiState.auction);
  }
  
  // Gérer les cartes
  if (uiState.card) {
    handleCardUI(uiState.card);
  }
  
  // Gérer la revanche
  if (uiState.revenge) {
    handleRevengeUI(uiState.revenge);
  }
  
  // Gérer les alliances
  if (uiState.alliance) {
    handleAllianceUI(uiState.alliance);
  }
}

// Fonctions d'interface pour les différentes mécaniques de jeu
function handleAuctionUI(auction) {
  // Pour une implémentation simplifiée
  const gameControls = document.getElementById('game-controls');
  if (!gameControls) return;
  
  if (auction.ended) {
    gameControls.innerHTML = `
      <div class="auction-result">
        <h3>Enchère terminée</h3>
        ${auction.result && auction.result.winner ? 
          `<p>${auction.result.winner} a remporté ${auction.result.property.name} pour ${auction.result.price}€</p>` : 
          `<p>Aucun acquéreur pour ${auction.result.property.name}</p>`
        }
        <button id="roll-dice-btn" class="btn action-btn">
          <i class="fas fa-dice"></i> Lancer les dés
        </button>
      </div>
    `;
    
    document.getElementById('roll-dice-btn').addEventListener('click', handleRollDice);
    return;
  }
  
  gameControls.innerHTML = `
    <div class="auction-controls">
      <h3>Enchère en cours</h3>
      <p class="property-name">${auction.property ? auction.property.name : ''}</p>
      <p class="current-bid">Enchère actuelle: ${auction.amount || auction.startingBid || 0}€</p>
      <div class="bid-actions">
        <button class="bid-btn" data-inc="10">+10€</button>
        <button class="bid-btn" data-inc="50">+50€</button>
        <button class="bid-btn" data-inc="100">+100€</button>
        <button id="pass-bid-btn" class="btn btn-outline">Passer</button>
      </div>
    </div>
  `;

  document.querySelectorAll('.bid-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const inc = parseInt(btn.dataset.inc, 10);
      const amount = (auction.amount || auction.startingBid || 0) + inc;
      placeBid(amount);
    });
  });
  
  document.getElementById('pass-bid-btn').addEventListener('click', passBid);
}

function handleCardUI(card) {
  const gameControls = document.getElementById('game-controls');
  if (!gameControls) return;
  const state = getGameState();

  if (card.applied) {
    gameControls.innerHTML = `
      <div class="card-controls">
        <p>${card.message || 'Effet appliqué'}</p>
        <button id="roll-dice-btn" class="btn action-btn">
          <i class="fas fa-dice"></i> Lancer les dés
        </button>
      </div>
    `;
    document.getElementById('roll-dice-btn').addEventListener('click', handleRollDice);
    return;
  }

  const player = state.players.find(p => p.id === state.currentPlayer);
  const board = state.board || [];

  const getProp = id => board.find(s => s.id === id);

  let html = `
    <div class="card-controls">
      <h3>${card.card.title}</h3>
      <p>${card.card.description}</p>
  `;

  if (card.card.type === 'exchange') {
    const myOptions = (player.properties || [])
      .map(id => `<option value="${id}">${getProp(id)?.name || id}</option>`) 
      .join('');
    const otherPlayers = state.players.filter(p => p.id !== player.id && !p.bankrupt);
    const otherOptions = otherPlayers.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    const firstOther = otherPlayers[0];
    const targetProps = firstOther ? firstOther.properties.map(id => `<option value="${id}">${getProp(id)?.name || id}</option>`).join('') : '';

    html += `
      <form class="exchange-form">
        <label>Votre propriété
          <select name="selected-property">${myOptions}</select>
        </label>
        <label>Adversaire
          <select name="target-player">${otherOptions}</select>
        </label>
        <label>Propriété cible
          <select name="target-property">${targetProps}</select>
        </label>
        <button type="submit" class="btn btn-secondary">Échanger</button>
      </form>
    `;
  } else if (card.card.type === 'restructure') {
    const propOptions = (player.properties || [])
      .map(id => `<option value="${id}">${getProp(id)?.name || id}</option>`)
      .join('');
    html += `
      <form class="restructure-form">
        <label>De
          <select name="source-property">${propOptions}</select>
        </label>
        <label>Vers
          <select name="target-property">${propOptions}</select>
        </label>
        <button type="submit" class="btn btn-secondary">Déplacer</button>
      </form>
    `;
  } else if (card.card.type === 'hostile') {
    const others = state.players.filter(p => p.id !== player.id && !p.bankrupt);
    const targetOptions = others
      .flatMap(pl => pl.properties.map(pid => ({ pid, owner: pl.name })))
      .map(o => `<option value="${o.pid}">${getProp(o.pid)?.name || o.pid} (${o.owner})</option>`)
      .join('');
    html += `
      <form class="hostile-form">
        <label>Propriété cible
          <select name="target-property">${targetOptions}</select>
        </label>
        <button type="submit" class="btn btn-secondary">Prendre le contrôle</button>
      </form>
    `;
  } else {
    html += `<button id="apply-card-btn" class="btn btn-secondary">Appliquer l'effet</button>`;
  }

  html += '</div>';
  gameControls.innerHTML = html;

  // Event listeners
  if (card.card.type === 'exchange') {
    const form = gameControls.querySelector('.exchange-form');
    const targetPlayerSelect = form.querySelector('[name="target-player"]');
    const targetPropertySelect = form.querySelector('[name="target-property"]');

    targetPlayerSelect.addEventListener('change', () => {
      const p = state.players.find(pl => pl.id === targetPlayerSelect.value);
      const opts = (p?.properties || [])
        .map(id => `<option value="${id}">${getProp(id)?.name || id}</option>`)
        .join('');
      targetPropertySelect.innerHTML = opts;
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const params = {
        selectedPropertyId: parseInt(form.querySelector('[name="selected-property"]').value, 10),
        targetPlayerId: targetPlayerSelect.value,
        targetPropertyId: parseInt(targetPropertySelect.value, 10)
      };
      applyCardEffect(card.card.id, params);
    });
  } else if (card.card.type === 'restructure') {
    const form = gameControls.querySelector('.restructure-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const params = {
        sourcePropertyId: parseInt(form.querySelector('[name="source-property"]').value, 10),
        targetPropertyId: parseInt(form.querySelector('[name="target-property"]').value, 10)
      };
      applyCardEffect(card.card.id, params);
    });
  } else if (card.card.type === 'hostile') {
    const form = gameControls.querySelector('.hostile-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const params = {
        targetPropertyId: parseInt(form.querySelector('[name="target-property"]').value, 10)
      };
      applyCardEffect(card.card.id, params);
    });
  } else {
    const btn = gameControls.querySelector('#apply-card-btn');
    if (btn) {
      btn.addEventListener('click', () => applyCardEffect(card.card.id, {}));
    }
  }
}

function handleRevengeUI(revenge) {
  // Pour une implémentation simplifiée
  const gameControls = document.getElementById('game-controls');
  if (!gameControls) return;
  
  if (!revenge.activated && !revenge.declined) {
    gameControls.innerHTML = `
      <div class="revenge-controls">
        <h3>Faillite imminente!</h3>
        <p>Vous êtes proche de la faillite. Souhaitez-vous utiliser votre jeton de revanche?</p>
        <p>Cela vous donnera un prêt d'urgence de 500€ à rembourser avec 50% d'intérêts (750€ total) dans les 5 tours.</p>
        <div class="revenge-actions">
          <button id="activate-revenge-btn" class="btn btn-secondary">Utiliser la revanche</button>
          <button id="decline-revenge-btn" class="btn btn-danger">Faire faillite</button>
        </div>
      </div>
    `;
    
    document.getElementById('activate-revenge-btn').addEventListener('click', activateRevenge);
    document.getElementById('decline-revenge-btn').addEventListener('click', declineRevenge);
  }
}

function handleAllianceUI(alliance) {
  // Pour une implémentation simplifiée
  const gameControls = document.getElementById('game-controls');
  if (!gameControls) return;
  
  if (alliance.created) {
    gameControls.innerHTML = `
      <div class="alliance-notification">
        <h3>Alliance créée</h3>
        <p>Une alliance a été formée entre les joueurs.</p>
        <button id="roll-dice-btn" class="btn action-btn">
          <i class="fas fa-dice"></i> Lancer les dés
        </button>
      </div>
    `;
    
    document.getElementById('roll-dice-btn').addEventListener('click', handleRollDice);
  } else if (alliance.broken) {
    gameControls.innerHTML = `
      <div class="alliance-notification">
        <h3>Alliance rompue</h3>
        <p>L'alliance a été dissoute.</p>
        <button id="roll-dice-btn" class="btn action-btn">
          <i class="fas fa-dice"></i> Lancer les dés
        </button>
      </div>
    `;
    
    document.getElementById('roll-dice-btn').addEventListener('click', handleRollDice);
  }
}

// Fonctions de rendu du jeu
function renderBoard(board, players = [], currentPlayerId = null, infoTarget = null) {
  const boardElement = document.getElementById('board');
  const infoElement = infoTarget
    ? (typeof infoTarget === 'string' ? document.getElementById(infoTarget) : infoTarget)
    : null;
  if (!boardElement) return;

  boardElement.innerHTML = '';
  boardElement.style.display = 'grid';
  boardElement.style.gridTemplateColumns = 'repeat(11, 1fr)';
  boardElement.style.gridTemplateRows = 'repeat(11, 1fr)';
  boardElement.style.gap = '4px';

  const getGridPos = id => {
    const rotated = (id + 19) % 40;
    if (rotated === 39) return { row: 11, col: 11 };
    if (rotated <= 9) return { row: 11, col: 10 - rotated };
    if (rotated <= 19) return { row: 20 - rotated, col: 1 };
    if (rotated <= 29) return { row: 1, col: rotated - 18 };
    return { row: rotated - 28, col: 11 };
  };

  const currentPlayer = players.find(p => p.id === currentPlayerId);

  board.forEach(square => {
    const el = document.createElement('div');
    const pos = getGridPos(square.id);
    el.style.gridRowStart = pos.row;
    el.style.gridColumnStart = pos.col;
    let classes = `board-square ${square.type}`;
    if (square.group) classes += ` group-${square.group}`;
    if (currentPlayer && square.id === currentPlayer.position) {
      classes += ' active-square';
    }
    if (square.mortgaged) classes += ' mortgaged';
    el.className = classes;
    el.dataset.id = square.id;
    let buildingsHTML = '';
    if (square.hotel) {
      buildingsHTML = '<div class="square-buildings hotel">🏨</div>';
    } else if (square.houses && square.houses > 0) {
      buildingsHTML = `<div class="square-buildings houses">${'🏠'.repeat(square.houses)}</div>`;
    }
    el.innerHTML = `<div class="square-name">${square.name}</div><div class="tokens"></div>${buildingsHTML}`;

    if (infoElement && square.type === 'property') {
      el.addEventListener('click', () => {
        infoElement.innerHTML = renderProperty(square.id);

        const bh = infoElement.querySelector('.buy-house-btn');
        if (bh) bh.addEventListener('click', () => buyHouse(square.id));
        const bht = infoElement.querySelector('.buy-hotel-btn');
        if (bht) bht.addEventListener('click', () => buyHotel(square.id));
        const mort = infoElement.querySelector('.mortgage-btn');
        if (mort) mort.addEventListener('click', () => mortgageProperty(square.id));
        const unmort = infoElement.querySelector('.unmortgage-btn');
        if (unmort) unmort.addEventListener('click', () => unmortgageProperty(square.id));
      });
    }

    boardElement.appendChild(el);
  });

  players.forEach(player => {
    const tokenContainer = boardElement.querySelector(`.board-square[data-id="${player.position}"] .tokens`);
    if (tokenContainer) {
      const token = document.createElement('span');
      token.className = 'player-token';
      token.textContent = player.name.charAt(0).toUpperCase();
      token.style.display = 'inline-block';
      token.style.width = '20px';
      token.style.height = '20px';
      token.style.borderRadius = '50%';
      token.style.background = '#FF00A8';
      token.style.color = '#000';
      token.style.fontSize = '0.75rem';
      token.style.lineHeight = '20px';
      token.style.textAlign = 'center';
      token.style.marginRight = '2px';
      token.classList.add('move-anim');
      token.addEventListener('animationend', () => {
        token.classList.remove('move-anim');
      }, { once: true });
      tokenContainer.appendChild(token);
    }
  });
}

function renderPlayersInfo(players) {
  const playersInfo = document.getElementById('players-info');
  if (!playersInfo) return; // Avoid errors if container is missing
  playersInfo.innerHTML = '<h3>Joueurs</h3>';
  
  players.forEach(player => {
    const playerElement = document.createElement('div');
    playerElement.className = `player-card ${player.bankrupt ? 'bankrupt' : ''}`;
    playerElement.dataset.id = player.id;

    const socket = getSocket();
    const isSelf = socket && socket.id === player.socketId;

    let propertiesHtml = '';
    if (isSelf && player.properties.length > 0) {
      propertiesHtml = '<ul class="property-actions">';
      player.properties.forEach(prop => {
        propertiesHtml += `
          <li>
            <span class="prop-name">${prop.name}</span>
            <button class="buy-house-btn" data-id="${prop.id}">+Maison</button>
            <button class="buy-hotel-btn" data-id="${prop.id}">+Hôtel</button>
            <button class="mortgage-btn" data-id="${prop.id}">Hyp.</button>
            <button class="unmortgage-btn" data-id="${prop.id}">Lever</button>
          </li>`;
      });
      propertiesHtml += '</ul>';
    }

    playerElement.innerHTML = `
      <div class="player-header">
        <div class="player-name">${player.name}</div>
        ${player.bankrupt ? '<div class="bankrupt-label">En faillite</div>' : ''}
      </div>
      <div class="player-stats">
        <div class="money"><i class="fas fa-coins"></i> ${player.money}€</div>
        <div class="properties"><i class="fas fa-home"></i> ${player.properties.length} propriétés</div>
      </div>
      <div class="money-bar-container">
        <div class="money-bar" style="width:${Math.min(100, (player.money / 3000) * 100)}%"></div>
      </div>
      <div class="player-special">
        ${player.revengeToken ? '<div class="revenge-token"><i class="fas fa-undo"></i> Jeton de revanche</div>' : ''}
        ${player.revengeActive ? '<div class="revenge-active"><i class="fas fa-exclamation-triangle"></i> Prêt actif</div>' : ''}
        ${player.currentAlliance ? '<div class="alliance"><i class="fas fa-handshake"></i> En alliance</div>' : ''}
      </div>
      ${propertiesHtml}
    `;

    playersInfo.appendChild(playerElement);
  });

  // Ajouter les gestionnaires sur les boutons des propriétés
  document.querySelectorAll('.buy-house-btn').forEach(btn => {
    btn.addEventListener('click', () => buyHouse(parseInt(btn.dataset.id)));
  });

  document.querySelectorAll('.buy-hotel-btn').forEach(btn => {
    btn.addEventListener('click', () => buyHotel(parseInt(btn.dataset.id)));
  });

  document.querySelectorAll('.mortgage-btn').forEach(btn => {
    btn.addEventListener('click', () => mortgageProperty(parseInt(btn.dataset.id)));
  });

  document.querySelectorAll('.unmortgage-btn').forEach(btn => {
    btn.addEventListener('click', () => unmortgageProperty(parseInt(btn.dataset.id)));
  });
}

function updateGameLog(log) {
  const gameLog = document.querySelector('.log-entries');
  gameLog.innerHTML = '';
  
  log.forEach(entry => {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = entry;
    gameLog.appendChild(logEntry);
  });
  
  // Faire défiler vers le bas pour voir les dernières entrées
  gameLog.scrollTop = gameLog.scrollHeight;
}

function updateGameControls(gameState) {
  // Gérer les contrôles selon l'état du jeu
  const gameControls = document.getElementById('game-controls');
  if (!gameControls) return;

  if (gameState.state === 'rolling') {
    // Vérifier si c'est au tour du joueur actuel
    const socket = getSocket();
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
    const isCurrentPlayer = socket.id === currentPlayer?.socketId;
    
    if (isCurrentPlayer) {
      gameControls.innerHTML = `
        <button id="roll-dice-btn" class="btn action-btn">
          <i class="fas fa-dice"></i> Lancer les dés
        </button>
        <div id="dice-result"></div>
      `;
      
      document.getElementById('roll-dice-btn').addEventListener('click', handleRollDice);
    } else {
      gameControls.innerHTML = `
        <div class="waiting-message">
          <p>C'est au tour de ${currentPlayer?.name || 'un autre joueur'}</p>
          <div class="loader"></div>
        </div>
      `;
    }
  }

  if (gameState.state === 'pending_auction') {
    const overlay = document.getElementById('auction-start');
    if (overlay) {
      overlay.classList.remove('hidden');
      const btn = overlay.querySelector('#start-auction-btn');
      if (btn) btn.onclick = startAuction;
    }
    gameControls.innerHTML = '<div class="waiting-message"><p>En attente du lancement de l\'enchère...</p></div>';
    return;
  } else {
    const overlay = document.getElementById('auction-start');
    if (overlay) overlay.classList.add('hidden');
  }
}

// Actions du jeu
async function handleRollDice() {
  try {
    console.log('Tentative de lancement des dés');
    await rollDice();
    console.log('Dés lancés avec succès');
  } catch (error) {
    console.error('Erreur lors du lancement des dés:', error);
    alert(`Erreur: ${error.message}`);
  }
}

// Exposer certaines fonctions pour le débogage
window.handleCreateLobby = handleCreateLobby;
window.handleJoinLobby = handleJoinLobby;
window.handleRefreshLobbies = handleRefreshLobbies;
window.handleQuitGame = handleQuitGame;
