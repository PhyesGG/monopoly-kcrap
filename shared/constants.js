// États du jeu
const GAME_STATES = {
  WAITING: 'waiting',
  ROLLING: 'rolling',
  AUCTION: 'auction',
  CARD: 'card',
  REVENGE: 'revenge',
  ENDED: 'ended'
};

// Types de cases
const SQUARE_TYPES = {
  GO: 'go',
  PROPERTY: 'property',
  CARD: 'card',
  TAX: 'tax',
  JAIL: 'jail',
  GOTO_JAIL: 'goto-jail'
};

// Types de cartes KCRAP
const CARD_TYPES = {
  CRYPTO: 'crypto',
  EXCHANGE: 'exchange',
  RESTRUCTURE: 'restructure',
  HOSTILE: 'hostile',
  DIGITAL: 'digital',
  JAIL: 'jail'
};

module.exports = {
  GAME_STATES,
  SQUARE_TYPES,
  CARD_TYPES
};