const CardDeck = require('../server/game/cards/CardDeck');
const KcrapCard = require('../server/game/cards/KcrapCard');
const Game = require('../server/game/Game');

test('skip property cards when none owned', () => {
  const game = new Game();
  const deck = new CardDeck();
  deck.cards = [
    new KcrapCard('ex','exchange','ex',''),
    new KcrapCard('ho','hostile','ho',''),
    new KcrapCard('di','digital','di',''),
  ];
  deck.currentIndex = 0;
  const card = deck.drawCard(game);
  expect(card.type).toBe('digital');
});
