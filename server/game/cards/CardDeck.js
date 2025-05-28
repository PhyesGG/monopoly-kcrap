const KcrapCard = require('./KcrapCard');

class CardDeck {
  constructor(customCards = []) {
    this.cards = [];
    this.currentIndex = 0;
    this.customCards = customCards;

    this.initialize();
  }

  initialize() {
    // Cartes Bourse Crypto
    for (let i = 0; i < 3; i++) {
      this.cards.push(new KcrapCard(
        `crypto_${i}`,
        'crypto',
        'Bourse Crypto',
        'Le prix de vente de vos propriétés fluctue de -30% à +50% jusqu\'à votre prochain tour'
      ));
    }
    
    // Cartes Échange forcé
    for (let i = 0; i < 3; i++) {
      this.cards.push(new KcrapCard(
        `exchange_${i}`,
        'exchange',
        'Échange forcé',
        'Choisissez et échangez une de vos propriétés contre une propriété d\'un adversaire (de valeur similaire ±20%)'
      ));
    }
    
    // Cartes Restructuration
    for (let i = 0; i < 3; i++) {
      this.cards.push(new KcrapCard(
        `restructure_${i}`,
        'restructure',
        'Restructuration',
        'Déplacez une maison de votre choix sur n\'importe quelle propriété que vous possédez'
      ));
    }
    
    // Cartes Fusion hostile
    for (let i = 0; i < 3; i++) {
      this.cards.push(new KcrapCard(
        `hostile_${i}`,
        'hostile',
        'Fusion hostile',
        'Prenez le contrôle d\'une propriété non améliorée d\'un adversaire pour 3 tours (collectez ses loyers)'
      ));
    }
    
    // Cartes Perturbation numérique
    for (let i = 0; i < 3; i++) {
      this.cards.push(new KcrapCard(
        `digital_${i}`,
        'digital',
        'Perturbation numérique',
        'Tous les joueurs doivent payer 10% de taxe sur tous les loyers perçus pendant 2 tours'
      ));
    }

    // Cartes Aller en prison
    for (let i = 0; i < 2; i++) {
      this.cards.push(new KcrapCard(
        `jail_${i}`,
        'jail',
        'Aller en prison',
        'Allez directement en prison et ne passez pas par la case départ'
      ));
    }

    if (Array.isArray(this.customCards)) {
      this.customCards.forEach(c => {
        this.cards.push(new KcrapCard(c.id, c.type, c.title, c.description));
      });
    }

    // Mélanger les cartes
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    this.currentIndex = 0;
  }

  isCardValid(card, game) {
    if (!game) return true;

    const anyPropertyOwned = Object.values(game.players).some(
      p => p.properties && p.properties.length > 0
    );

    if (!anyPropertyOwned && (card.type === 'exchange' || card.type === 'hostile')) {
      return false;
    }

    return true;
  }

  drawCard(game = null) {
    if (this.currentIndex >= this.cards.length) {
      this.shuffle();
    }

    if (game) {
      let attempts = 0;
      while (attempts < this.cards.length) {
        const card = this.cards[this.currentIndex];
        if (this.isCardValid(card, game)) {
          this.currentIndex++;
          return card;
        }
        this.currentIndex = (this.currentIndex + 1) % this.cards.length;
        attempts++;
      }
    }

    return this.cards[this.currentIndex++];
  }
}

module.exports = CardDeck;