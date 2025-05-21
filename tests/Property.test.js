const Game = require('../server/game/Game');

describe('Property buying and building', () => {
  let game;
  let player;
  let property;

  beforeEach(() => {
    game = new Game();
    player = game.addPlayer('Alice', 's1');
    property = game.board.getSquareAt(1); // Boulevard de Belleville
    player.buyProperty(property, property.price);
  });

  test('buyHouse and buyHotel', () => {
    expect(property.owner).toBe(player);
    const house = game.buyHouse(player.id, property.id);
    expect(house.success).toBe(true);
    expect(property.houses).toBe(1);

    // give player enough houses to buy hotel
    property.houses = 4;
    const hotel = game.buyHotel(player.id, property.id);
    expect(hotel.success).toBe(true);
    expect(property.hotel).toBe(true);
    expect(property.houses).toBe(0);
  });
});
