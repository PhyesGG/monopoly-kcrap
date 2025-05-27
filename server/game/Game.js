const uuid = require('uuid');
const Player = require('./Player');
const Property = require('./Property');
const Auction = require('./Auction');
const Alliance = require('./Alliance');
const Board = require('./Board');
const CardDeck = require('./cards/CardDeck');

const JAIL_FINE = 50;

class Game {
  constructor(boardPreset = 'classic') {
    this.id = uuid.v4();
    this.players = {};
    this.boardPreset = boardPreset;
    this.board = new Board(boardPreset);
    this.cardDeck = new CardDeck();
    this.currentPlayerIndex = 0;
    this.currentPlayer = null;
    this.state = 'waiting'; // waiting, rolling, auction, card, action, ended
    this.currentAuction = null;
    this.pendingAuction = null;
    this.currentAlliances = [];
    this.digitalDisruptionTurnsLeft = 0;
    this.lastDiceTotal = 0;
    this.turnCount = 0;
    this.log = [];
    this.onEndCallback = null;
  }

  onEnd(callback) {
    this.onEndCallback = callback;
  }

  static fromState(state) {
    const game = new Game(state.boardPreset);
    game.id = state.id;

    // Reconstruire les joueurs
    game.players = {};
    state.players.forEach(pData => {
      const player = new Player(pData.name, null, pData.color || '#FF00A8');
      player.id = pData.id;
      player.money = pData.money;
      player.position = pData.position;
      player.inJail = pData.inJail;
      player.jailTurns = pData.jailTurns;
      player.turnsInJail = pData.turnsInJail;
      player.jailCards = pData.jailCards;
      player.totalJailPayments = pData.jailPaid;
      player.bankrupt = pData.bankrupt;
      player.revengeToken = pData.revengeToken;
      player.revengeActive = pData.revengeActive;
      game.players[player.id] = player;
    });

    // Reconstruire le plateau
    game.board = new Board();
    state.board.forEach(sq => {
      const boardSq = game.board.getSquareAt(sq.position);
      if (boardSq && boardSq.type === 'property') {
        boardSq.houses = sq.houses || 0;
        boardSq.hotel = sq.hotel || false;
        boardSq.mortgaged = sq.mortgaged || false;
        if (sq.ownerId && game.players[sq.ownerId]) {
          boardSq.owner = game.players[sq.ownerId];
          game.players[sq.ownerId].properties.push(boardSq);
        }
      }
    });

    game.playerOrder = state.players.map(p => p.id);
    game.currentPlayerIndex = game.playerOrder.indexOf(state.currentPlayer);
    game.currentPlayer = game.players[state.currentPlayer] || null;
    game.state = state.state;
    game.turnCount = state.turnCount;
    game.digitalDisruptionTurnsLeft = state.digitalDisruptionTurnsLeft ||
      (state.digitalDisruption ? 1 : 0);
    game.lastDiceTotal = state.lastDiceTotal || 0;
    game.log = state.log || [];

    return game;
  }

  addPlayer(name, socketId, color = '#FF00A8') {
    const player = new Player(name, socketId, color);
    this.players[player.id] = player;
    
    this.log.push(`${name} a rejoint la partie`);
    
    return player;
  }

  removePlayer(playerId) {
    if (this.players[playerId]) {
      const playerName = this.players[playerId].name;
      delete this.players[playerId];
      
      this.log.push(`${playerName} a quitté la partie`);
      
      // Vérifier si la partie doit se terminer
      if (Object.keys(this.players).length <= 1 && this.state !== 'waiting') {
        this.endGame();
      }
      
      return true;
    }
    
    return false;
  }

  startGame() {
    if (Object.keys(this.players).length < 2) {
      return { success: false, message: "Il faut au moins 2 joueurs pour commencer la partie." };
    }
    
    // Mélanger l'ordre des joueurs
    const playerIds = Object.keys(this.players);
    for (let i = playerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }
    
    this.playerOrder = playerIds;
    this.currentPlayerIndex = 0;
    this.currentPlayer = this.players[this.playerOrder[0]];
    this.state = 'rolling';
    this.turnCount = 1;
    
    this.log.push("La partie a commencé");
    
    return { 
      success: true, 
      firstPlayer: this.currentPlayer.name 
    };
  }

  sendPlayerToJail(player) {
    player.position = 9;
    player.goToJail();
  }

  processSquare() {
    const currentSquare = this.board.getSquareAt(this.currentPlayer.position);
    let actionResult = null;

    if (currentSquare.type === 'property') {
      if (!currentSquare.owner) {
        this.pendingAuction = currentSquare;
        this.state = 'pending_auction';
        actionResult = { type: 'pending_auction', property: currentSquare };
      } else if (currentSquare.owner.id !== this.currentPlayer.id) {
        const rent = currentSquare.calculateRent({
          diceTotal: this.lastDiceTotal,
          board: this.board
        });
        const payment = this.currentPlayer.payRent(rent, currentSquare.owner);

        if (payment.success && this.digitalDisruptionTurnsLeft > 0) {
          if (payment.split) {
            const ownerShare = Math.floor(rent * 0.5);
            const allyShare = rent - ownerShare;
            const ownerTax = Math.floor(ownerShare * 0.1);
            const allyTax = Math.floor(allyShare * 0.1);
            currentSquare.owner.money -= ownerTax;
            const allyPlayer = this.players[payment.ally];
            if (allyPlayer) {
              allyPlayer.money -= allyTax;
            }
          } else {
            const tax = Math.floor(rent * 0.1);
            currentSquare.owner.money -= tax;
          }
        }

        if (!payment.success) {
          if (this.currentPlayer.revengeToken && !this.currentPlayer.revengeActive) {
            this.state = 'revenge';
            actionResult = { type: 'revenge', amount: rent, toPlayer: currentSquare.owner.name };
          } else {
            this.playerBankruptcy(this.currentPlayer, currentSquare.owner);
            actionResult = { type: 'bankruptcy', cause: 'rent', amount: rent, toPlayer: currentSquare.owner.name };
          }
        } else {
          this.log.push(`${this.currentPlayer.name} a payé ${rent}€ de loyer à ${currentSquare.owner.name}`);
          actionResult = { type: 'rent', amount: rent, paid: true, split: payment.split, toPlayer: currentSquare.owner.name };
        }
      }
    } else if (currentSquare.type === 'card') {
      this.state = 'card';
      const card = this.cardDeck.drawCard(this);
      this.log.push(`${this.currentPlayer.name} a tiré une carte ${card.title}`);
      actionResult = { type: 'card', card };
    } else if (currentSquare.type === 'tax') {
      const taxAmount = currentSquare.amount;

      if (this.currentPlayer.money < taxAmount) {
        if (this.currentPlayer.revengeToken && !this.currentPlayer.revengeActive) {
          this.state = 'revenge';
          actionResult = { type: 'revenge', amount: taxAmount, toPlayer: null };
        } else {
          this.playerBankruptcy(this.currentPlayer);
          actionResult = { type: 'bankruptcy', cause: 'tax', amount: taxAmount };
        }
      } else {
        this.currentPlayer.money -= taxAmount;
        this.log.push(`${this.currentPlayer.name} a payé ${taxAmount}€ de taxe`);
        actionResult = { type: 'tax', amount: taxAmount, paid: true };
      }
    } else if (currentSquare.type === 'goto-jail') {
      this.sendPlayerToJail(this.currentPlayer);
      this.log.push(`${this.currentPlayer.name} va en prison`);
      actionResult = { type: 'jail', turns: 3 };
    } else if (currentSquare.type === 'jail') {
      actionResult = { type: 'visit_jail' };
    }

    return { currentSquare, actionResult };
  }

  handleJailRoll(dice1, dice2, total, doubles) {
    const player = this.currentPlayer;
    this.lastDiceTotal = total;
    let moveResult = { passedGo: false };
    let currentSquare = this.board.getSquareAt(player.position);
    let actionResult = null;

    if (player.jailCards > 0) {
      player.jailCards--;
      player.releaseFromJail();
      this.log.push(`${player.name} utilise une carte de sortie de prison`);
      moveResult = player.move(total);
      ({ currentSquare, actionResult } = this.processSquare());
    } else if (doubles) {
      player.releaseFromJail();
      this.log.push(`${player.name} fait un double et sort de prison`);
      moveResult = player.move(total);
      ({ currentSquare, actionResult } = this.processSquare());
    } else {
      player.jailTurns--;
      player.turnsInJail++;
      if (player.jailTurns <= 0) {
        if (player.payJailFine(JAIL_FINE)) {
          this.log.push(`${player.name} paie ${JAIL_FINE}€ pour sortir de prison`);
          moveResult = player.move(total);
          ({ currentSquare, actionResult } = this.processSquare());
        } else {
          if (player.revengeToken && !player.revengeActive) {
            this.state = 'revenge';
            actionResult = { type: 'revenge', amount: JAIL_FINE, toPlayer: null };
          } else {
            this.playerBankruptcy(player);
            actionResult = { type: 'bankruptcy', cause: 'jail-fine', amount: JAIL_FINE };
          }
        }
      } else {
        actionResult = { type: 'stay_jail', turnsLeft: player.jailTurns };
      }
    }

    if (this.state === 'rolling' && actionResult && actionResult.type !== 'stay_jail') {
      if (!doubles) {
        this.nextPlayer();
      } else {
        this.log.push(`${player.name} a fait un double et rejoue`);
      }
    } else if (actionResult && actionResult.type === 'stay_jail') {
      this.nextPlayer();
    }

    return {
      success: true,
      dice1,
      dice2,
      total,
      doubles,
      position: player.position,
      passedGo: moveResult.passedGo,
      square: currentSquare,
      action: actionResult
    };
  }

  rollDice() {
    if (this.state !== 'rolling') {
      return { success: false, message: "Ce n'est pas le moment de lancer les dés." };
    }

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    this.lastDiceTotal = total;
    const doubles = dice1 === dice2;

    this.log.push(`${this.currentPlayer.name} a lancé les dés: ${dice1} et ${dice2} = ${total}`);

    if (this.currentPlayer.inJail) {
      return this.handleJailRoll(dice1, dice2, total, doubles);
    }

    const moveResult = this.currentPlayer.move(total);
    const { currentSquare, actionResult } = this.processSquare();

    if (this.state === 'rolling') {
      if (!doubles) {
        this.nextPlayer();
      } else {
        this.log.push(`${this.currentPlayer.name} a fait un double et rejoue`);
      }
    }

    return {
      success: true,
      dice1,
      dice2,
      total,
      doubles,
      position: this.currentPlayer.position,
      passedGo: moveResult.passedGo,
      square: currentSquare,
      action: actionResult
    };
  }

  startAuction(property) {
    const startingBid = Math.floor(property.price * 0.5);
    this.currentAuction = new Auction(property, startingBid);
    
    // Ajouter automatiquement tous les joueurs comme participants
    Object.values(this.players).forEach(player => {
      if (!player.bankrupt) {
        this.currentAuction.addParticipant(player);
      }
    });
    
    this.log.push(`Une enchère commence pour ${property.name} à ${startingBid}€`);

    return this.currentAuction;
  }

  launchPendingAuction() {
    if (this.state !== 'pending_auction' || !this.pendingAuction) {
      return null;
    }
    const auction = this.startAuction(this.pendingAuction);
    this.state = 'auction';
    this.pendingAuction = null;
    return auction;
  }

  placeBid(playerId, amount) {
    if (!this.currentAuction || this.state !== 'auction') {
      return { success: false, message: "Aucune enchère en cours." };
    }
    
    const player = this.players[playerId];
    
    if (!player) {
      return { success: false, message: "Joueur non trouvé." };
    }
    
    if (player.money < amount) {
      return { success: false, message: "Vous n'avez pas assez d'argent pour cette enchère." };
    }
    
    const result = this.currentAuction.placeBid(player, amount);
    
    if (result.success) {
      this.log.push(`${player.name} a enchéri ${amount}€ pour ${this.currentAuction.property.name}`);
    }
    
    return result;
  }

  passBid(playerId) {
    if (!this.currentAuction || this.state !== 'auction') {
      return { success: false, message: "Aucune enchère en cours." };
    }
    
    const player = this.players[playerId];
    
    if (!player) {
      return { success: false, message: "Joueur non trouvé." };
    }
    
    // Mark that the player has passed
    this.currentAuction.participants.delete(player.id);
    
    this.log.push(`${player.name} passe son tour d'enchère`);
    
    // Check if all players have passed
    if (this.currentAuction.participants.size === 0) {
      return this.finalizeAuction();
    }
    
    // If the highest bidder is the only participant left
    if (this.currentAuction.participants.size === 1 && 
        this.currentAuction.highestBidder && 
        this.currentAuction.participants.has(this.currentAuction.highestBidder.id)) {
      return this.finalizeAuction();
    }
    
    return { success: true, message: `${player.name} a passé son tour.` };
  }

  finalizeAuction() {
    if (!this.currentAuction) {
      return { success: false, message: "Aucune enchère en cours." };
    }
    
    const result = this.currentAuction.end();
    
    if (result.winner) {
      // Propriété achetée par le plus offrant
      result.winner.buyProperty(result.property, result.finalPrice);
      
      this.log.push(`${result.winner.name} a remporté l'enchère pour ${result.property.name} à ${result.finalPrice}€`);
    } else {
      // La propriété reste à la banque
      this.log.push(`Aucun acheteur pour ${result.property.name}, la propriété reste à la banque`);
    }
    
    this.currentAuction = null;
    this.state = 'rolling';
    
    // Si c'était le joueur actuel qui a atterri sur la case, passer au joueur suivant
    if (
      this.currentPlayer &&
      this.board.getSquareAt(this.currentPlayer.position) === result.property
    ) {
      this.nextPlayer();
    }
    
    return {
      success: true,
      property: result.property,
      winner: result.winner ? result.winner.name : null,
      price: result.finalPrice
    };
  }

  activateRevenge(playerId) {
    if (this.state !== 'revenge' || this.currentPlayer.id !== playerId) {
      return { success: false, message: "Vous ne pouvez pas activer la revanche maintenant." };
    }
    
    const result = this.currentPlayer.activateRevenge();
    
    if (result.success) {
      this.log.push(`${this.currentPlayer.name} utilise son jeton de revanche et reçoit un prêt d'urgence de 500€`);
      this.state = 'rolling';
      this.nextPlayer();
    }
    
    return result;
  }

  declineRevenge(playerId) {
    if (this.state !== 'revenge' || this.currentPlayer.id !== playerId) {
      return { success: false, message: "Action non valide." };
    }
    
    // Le joueur fait faillite normalement
    const currentSquare = this.board.getSquareAt(this.currentPlayer.position);
    
    if (currentSquare.type === 'property' && currentSquare.owner) {
      this.playerBankruptcy(this.currentPlayer, currentSquare.owner);
    } else {
      this.playerBankruptcy(this.currentPlayer);
    }
    
    this.state = 'rolling';
    this.nextPlayer();
    
    return { success: true };
  }

  createAlliance(player1Id, player2Id) {
    const player1 = this.players[player1Id];
    const player2 = this.players[player2Id];
    
    if (!player1 || !player2) {
      return { success: false, message: "Joueur non trouvé." };
    }
    
    if (player1.currentAlliance || player2.currentAlliance) {
      return { success: false, message: "L'un des joueurs a déjà une alliance active." };
    }
    
    const alliance = new Alliance(player1, player2);
    this.currentAlliances.push(alliance);
    
    player1.currentAlliance = { player: player2, active: true, turnsLeft: 3 };
    player2.currentAlliance = { player: player1, active: true, turnsLeft: 3 };
    
    this.log.push(`${player1.name} et ${player2.name} ont formé une alliance pour 3 tours chacun`);
    
    return { success: true, alliance };
  }

  breakAlliance(playerId, unilateral = true) {
    const player = this.players[playerId];
    
    if (!player || !player.currentAlliance) {
      return { success: false, message: "Joueur sans alliance active." };
    }
    
    const allyId = player.currentAlliance.player.id;
    const ally = this.players[allyId];
    
    // Rupture unilatérale avec pénalité
    if (unilateral) {
      if (player.money < 200) {
        return { success: false, message: "Vous n'avez pas assez d'argent pour rompre l'alliance." };
      }
      
      player.money -= 200;
      ally.receiveMoney(200);
      
      this.log.push(`${player.name} a rompu unilatéralement l'alliance avec ${ally.name} et a payé 200€ de pénalité`);
    } else {
      this.log.push(`L'alliance entre ${player.name} et ${ally.name} a pris fin naturellement`);
    }
    
    // Supprimer l'alliance
    player.currentAlliance = null;
    ally.currentAlliance = null;
    
    // Mettre à jour la liste des alliances
    this.currentAlliances = this.currentAlliances.filter(alliance => {
      return !((alliance.player1.id === player.id && alliance.player2.id === ally.id) ||
               (alliance.player1.id === ally.id && alliance.player2.id === player.id));
    });

    return { success: true };
  }

  hasFullSet(player, group) {
    const groupProps = this.board.squares.filter(
      sq => sq.type === 'property' && sq.group === group
    );
    return (
      groupProps.length > 0 &&
      groupProps.every(p => p.owner && p.owner.id === player.id)
    );
  }

  canBuildHouse(player, property) {
    if (!this.hasFullSet(player, property.group)) return false;

    const groupProps = this.board.squares.filter(
      sq =>
        sq.type === 'property' &&
        sq.group === property.group &&
        sq.owner &&
        sq.owner.id === player.id
    );

    const minHouses = Math.min(...groupProps.map(p => p.houses));
    return property.houses === minHouses && property.houses < 4 && !property.hotel;
  }

  canBuildHotel(player, property) {
    if (!this.hasFullSet(player, property.group)) return false;

    const groupProps = this.board.squares.filter(
      sq =>
        sq.type === 'property' &&
        sq.group === property.group &&
        sq.owner &&
        sq.owner.id === player.id
    );

    if (property.hotel || property.houses !== 4) return false;
    return groupProps.every(p => p.houses === 4 || p.hotel);
  }

  buyHouse(playerId, propertyId) {
    const player = this.players[playerId];

    if (!player) {
      return { success: false, message: "Joueur non trouvé." };
    }

    const property = player.properties.find(p => p.id === propertyId);

    if (!property) {
      return { success: false, message: "Propriété non trouvée." };
    }

    const cost = Math.floor(property.price * 0.5);

    if (!player.canAfford(cost)) {
      return { success: false, message: "Fonds insuffisants." };
    }

    if (!this.canBuildHouse(player, property)) {
      return { success: false, message: "Conditions non remplies pour construire." };
    }

    if (!property.buyHouse()) {
      return { success: false, message: "Achat de maison impossible." };
    }

    player.money -= cost;
    this.log.push(`${player.name} a construit une maison sur ${property.name} pour ${cost}€`);

    return { success: true, houses: property.houses };
  }

  buyHotel(playerId, propertyId) {
    const player = this.players[playerId];

    if (!player) {
      return { success: false, message: "Joueur non trouvé." };
    }

    const property = player.properties.find(p => p.id === propertyId);

    if (!property) {
      return { success: false, message: "Propriété non trouvée." };
    }

    const cost = property.price;

    if (!player.canAfford(cost)) {
      return { success: false, message: "Fonds insuffisants." };
    }

    if (!this.canBuildHotel(player, property)) {
      return { success: false, message: "Conditions non remplies pour construire." };
    }

    if (!property.buyHotel()) {
      return { success: false, message: "Achat d'hôtel impossible." };
    }

    player.money -= cost;
    this.log.push(`${player.name} a construit un hôtel sur ${property.name} pour ${cost}€`);

    return { success: true };
  }

  mortgageProperty(playerId, propertyId) {
    const player = this.players[playerId];

    if (!player) {
      return { success: false, message: "Joueur non trouvé." };
    }

    const property = player.properties.find(p => p.id === propertyId);

    if (!property) {
      return { success: false, message: "Propriété non trouvée." };
    }

    const value = Math.floor(property.price * 0.5);

    if (!property.mortgage()) {
      return { success: false, message: "Hypothèque impossible." };
    }

    player.money += value;
    this.log.push(`${player.name} hypothèque ${property.name} et reçoit ${value}€`);

    return { success: true, amount: value };
  }

  unmortgageProperty(playerId, propertyId) {
    const player = this.players[playerId];

    if (!player) {
      return { success: false, message: "Joueur non trouvé." };
    }

    const property = player.properties.find(p => p.id === propertyId);

    if (!property) {
      return { success: false, message: "Propriété non trouvée." };
    }

    const cost = Math.floor(property.price * 0.55);

    if (player.money < cost) {
      return { success: false, message: "Fonds insuffisants." };
    }

    if (!property.unmortgage()) {
      return { success: false, message: "Action impossible." };
    }

    player.money -= cost;
    this.log.push(`${player.name} lève l'hypothèque sur ${property.name} pour ${cost}€`);

    return { success: true };
  }

  applyDigitalDisruption(turns) {
    this.digitalDisruptionTurnsLeft = turns;
    return true;
  }

  updateTemporaryEffects() {
    this.board.squares.forEach(square => {
      if (square.type === 'property') {
        if (typeof square.cryptoTurnsLeft === 'number') {
          square.cryptoTurnsLeft--;
          if (square.cryptoTurnsLeft <= 0) {
            delete square.cryptoTurnsLeft;
            delete square.cryptoFluctuation;
          }
        }

        if (square.updateTemporaryOwnership()) {
          this.log.push(`${square.name} retourne à ${square.owner.name}`);
        }
      }
    });
  }

  applyCardEffect(playerId, cardId, params) {
    if (this.state !== 'card') {
      return { 
        success: false, 
        message: "Ce n'est pas le moment d'appliquer une carte." 
      };
    }
    
    if (!this.players[playerId]) {
      return { 
        success: false, 
        message: "Joueur non trouvé." 
      };
    }
    
    // Trouver la carte dans le deck qui a été tirée
    const card = this.cardDeck.cards.find(c => c.id === cardId);
    
    if (!card) {
      return { 
        success: false, 
        message: "Carte non trouvée." 
      };
    }
    
    if (card.type === 'jail') {
      const player = this.players[playerId];
      this.sendPlayerToJail(player);
      this.log.push(`${player.name} est envoyé en prison par une carte`);
      this.state = 'rolling';
      this.nextPlayer();
      return { success: true, message: 'Aller en prison' };
    }

    const result = card.applyEffect(this, this.players[playerId], params);
    
    if (result.success) {
      // Après avoir appliqué l'effet, passer au joueur suivant
      if (!result.requireInput) {
        this.state = 'rolling';
        this.nextPlayer();
      }
    }
    
    return result;
  }

  playerBankruptcy(player, creditor = null) {
    player.bankrupt = true;

    // Récupérer les propriétés du joueur
    const properties = [...player.properties];
    player.properties = [];
    
    if (creditor) {
      // Transférer les propriétés au créancier
      properties.forEach(property => {
        property.houses = 0;
        property.hotel = false;
        property.owner = creditor;
        creditor.properties.push(property);
      });

      this.log.push(`${player.name} a fait faillite. Toutes ses propriétés vont à ${creditor.name}`);
    } else {
      // Remettre les propriétés à la banque
      properties.forEach(property => {
        property.houses = 0;
        property.hotel = false;
        property.owner = null;
      });

      this.log.push(`${player.name} a fait faillite. Toutes ses propriétés retournent à la banque`);
    }
    
    // Vérifier si la partie est terminée
    const activePlayers = Object.values(this.players).filter(p => !p.bankrupt);
    
    if (activePlayers.length === 1) {
      this.endGame(activePlayers[0]);
    }
    
    return { 
      success: true, 
      bankrupt: player.name, 
      properties: properties.map(p => p.name),
      beneficiary: creditor ? creditor.name : 'Banque'
    };
  }

  nextPlayer() {
    // Vérification et mise à jour des loans de revanche
    if (this.currentPlayer.revengeActive) {
      const result = this.currentPlayer.updateRevengeLoan();
      
      if (!result.success && result.bankruptcy) {
        this.playerBankruptcy(this.currentPlayer);
      }
    }
    
    // Vérification et mise à jour des alliances
    if (this.currentPlayer.currentAlliance) {
      const result = this.currentPlayer.updateAlliance();
      
      if (result.endedNaturally) {
        this.breakAlliance(this.currentPlayer.id, false);
      }
    }
    
    // Mise à jour de la perturbation numérique
    if (this.digitalDisruptionTurnsLeft > 0) {
      this.digitalDisruptionTurnsLeft--;

      if (this.digitalDisruptionTurnsLeft === 0) {
        this.log.push("La perturbation numérique s'est terminée");
      }
    }

    // Mise à jour des effets temporaires des propriétés
    this.updateTemporaryEffects();
    
    // Passer au joueur suivant
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerOrder.length;
      this.currentPlayer = this.players[this.playerOrder[this.currentPlayerIndex]];
    } while (this.currentPlayer.bankrupt);
    
    // Incrémenter le compteur de tours si on revient au premier joueur
    if (this.currentPlayerIndex === 0) {
      this.turnCount++;
    }
    
    this.state = 'rolling';
    
    this.log.push(`C'est au tour de ${this.currentPlayer.name}`);
    
    return this.currentPlayer;
  }

  endGame(winner = null) {
    this.state = 'ended';

    if (!winner) {
      const activePlayers = Object.values(this.players).filter(p => !p.bankrupt);
      
      if (activePlayers.length === 1) {
        winner = activePlayers[0];
      }
    }
    
    const ranking = Object.values(this.players)
      .sort((a, b) => b.money - a.money)
      .map(p => ({ name: p.name, money: p.money }));

    let result;

    if (winner) {
      this.log.push(`${winner.name} a gagné la partie!`);

      result = {
        winner: winner.name,
        stats: {
          turns: this.turnCount,
          money: winner.money,
          properties: winner.properties.length
        },
        ranking
      };
    } else {
      this.log.push("La partie s'est terminée sans vainqueur");

      result = {
        winner: null,
        ranking
      };
    }

    if (typeof this.onEndCallback === 'function') {
      try {
        this.onEndCallback(result);
      } catch (err) {
        console.error('Error in end callback:', err);
      }
    }

    return result;
  }

  getGameState() {
    return {
      id: this.id,
      players: Object.values(this.players).map(player => ({
        id: player.id,
        name: player.name,
        color: player.color,
        money: player.money,
        position: player.position,
        properties: player.properties.map(p => p.id),
        inJail: player.inJail,
        jailTurns: player.jailTurns,
        turnsInJail: player.turnsInJail,
        jailCards: player.jailCards,
        jailPaid: player.totalJailPayments,
        bankrupt: player.bankrupt,
        revengeToken: player.revengeToken,
        revengeActive: player.revengeActive,
        currentAlliance: player.currentAlliance ? player.currentAlliance.player.id : null
      })),
      currentPlayer: this.currentPlayer ? this.currentPlayer.id : null,
      state: this.state,
      turnCount: this.turnCount,
      board: this.board.getState(),
      boardPreset: this.boardPreset,
      digitalDisruption: this.digitalDisruptionTurnsLeft > 0,
      digitalDisruptionTurnsLeft: this.digitalDisruptionTurnsLeft,
      log: this.log.slice(-20) // Derniers 20 événements du log
    };
  }
}

module.exports = Game;