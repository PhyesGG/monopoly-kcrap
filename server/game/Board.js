const Property = require('./Property');

class Board {
  constructor() {
    this.squares = this.initializeBoard();
  }

  initializeBoard() {
    const squares = [];

    // 0 - Départ
    squares.push({ id: 0, type: 'go', name: 'Départ', position: 0 });

    // 1 - Boulevard de Belleville
    squares.push(new Property(1, 'Boulevard de Belleville', 60, 'brown', 1));

    // 2 - Caisse de Communauté
    squares.push({ id: 2, type: 'card', name: 'Caisse de Communauté', position: 2 });

    // 3 - Rue Lecourbe
    squares.push(new Property(3, 'Rue Lecourbe', 60, 'brown', 3));

    // 4 - Impôt sur le Revenu
    squares.push({ id: 4, type: 'tax', name: 'Impôt sur le Revenu', amount: 200, position: 4 });

    // 5 - Gare Montparnasse
    squares.push({ id: 5, type: 'railroad', name: 'Gare Montparnasse', price: 200, position: 5 });

    // 6 - Rue de Vaugirard
    squares.push(new Property(6, 'Rue de Vaugirard', 100, 'light-blue', 6));

    // 7 - Chance
    squares.push({ id: 7, type: 'card', name: 'Chance', position: 7 });

    // 8 - Rue de Courcelles
    squares.push(new Property(8, 'Rue de Courcelles', 100, 'light-blue', 8));

    // 9 - Avenue de la République
    squares.push(new Property(9, 'Avenue de la République', 120, 'light-blue', 9));

    // 10 - Prison / Simple visite
    squares.push({ id: 10, type: 'jail', name: 'Prison - Simple Visite', position: 10 });

    // 11 - Boulevard de la Villette
    squares.push(new Property(11, 'Boulevard de la Villette', 140, 'pink', 11));

    // 12 - Compagnie d'Électricité
    squares.push({ id: 12, type: 'utility', name: "Compagnie d'Électricité", price: 150, position: 12 });

    // 13 - Avenue de Neuilly
    squares.push(new Property(13, 'Avenue de Neuilly', 140, 'pink', 13));

    // 14 - Rue Paradis
    squares.push(new Property(14, 'Rue Paradis', 160, 'pink', 14));

    // 15 - Gare de Lyon
    squares.push({ id: 15, type: 'railroad', name: 'Gare de Lyon', price: 200, position: 15 });

    // 16 - Avenue Mozart
    squares.push(new Property(16, 'Avenue Mozart', 180, 'orange', 16));

    // 17 - Caisse de Communauté
    squares.push({ id: 17, type: 'card', name: 'Caisse de Communauté', position: 17 });

    // 18 - Boulevard Saint-Michel
    squares.push(new Property(18, 'Boulevard Saint-Michel', 180, 'orange', 18));

    // 19 - Place Pigalle
    squares.push(new Property(19, 'Place Pigalle', 200, 'orange', 19));

    // 20 - Parc Gratuit
    squares.push({ id: 20, type: 'parking', name: 'Parc Gratuit', position: 20 });

    // 21 - Avenue Matignon
    squares.push(new Property(21, 'Avenue Matignon', 220, 'red', 21));

    // 22 - Chance
    squares.push({ id: 22, type: 'card', name: 'Chance', position: 22 });

    // 23 - Boulevard Malesherbes
    squares.push(new Property(23, 'Boulevard Malesherbes', 220, 'red', 23));

    // 24 - Avenue Henri-Martin
    squares.push(new Property(24, 'Avenue Henri-Martin', 240, 'red', 24));

    // 25 - Gare du Nord
    squares.push({ id: 25, type: 'railroad', name: 'Gare du Nord', price: 200, position: 25 });

    // 26 - Faubourg Saint-Honoré
    squares.push(new Property(26, 'Faubourg Saint-Honoré', 260, 'yellow', 26));

    // 27 - Place de la Bourse
    squares.push(new Property(27, 'Place de la Bourse', 260, 'yellow', 27));

    // 28 - Compagnie des Eaux
    squares.push({ id: 28, type: 'utility', name: 'Compagnie des Eaux', price: 150, position: 28 });

    // 29 - Rue La Fayette
    squares.push(new Property(29, 'Rue La Fayette', 280, 'yellow', 29));

    // 30 - Aller en Prison
    squares.push({ id: 30, type: 'go-to-jail', name: 'Aller en Prison', position: 30 });

    // 31 - Avenue de Breteuil
    squares.push(new Property(31, 'Avenue de Breteuil', 300, 'green', 31));

    // 32 - Avenue Foch
    squares.push(new Property(32, 'Avenue Foch', 300, 'green', 32));

    // 33 - Caisse de Communauté
    squares.push({ id: 33, type: 'card', name: 'Caisse de Communauté', position: 33 });

    // 34 - Boulevard des Capucines
    squares.push(new Property(34, 'Boulevard des Capucines', 320, 'green', 34));

    // 35 - Gare Saint-Lazare
    squares.push({ id: 35, type: 'railroad', name: 'Gare Saint-Lazare', price: 200, position: 35 });

    // 36 - Chance
    squares.push({ id: 36, type: 'card', name: 'Chance', position: 36 });

    // 37 - Avenue des Champs-Élysées
    squares.push(new Property(37, 'Avenue des Champs-Élysées', 350, 'dark-blue', 37));

    // 38 - Taxe de Luxe
    squares.push({ id: 38, type: 'tax', name: 'Taxe de Luxe', amount: 100, position: 38 });

    // 39 - Rue de la Paix
    squares.push(new Property(39, 'Rue de la Paix', 400, 'dark-blue', 39));

    return squares;
  }

  getSquareAt(position) {
    return this.squares.find(square => square.position === position);
  }

  getState() {
    return this.squares.map(square => {
      const cleanSquare = { ...square };
      if (cleanSquare.owner) {
        cleanSquare.ownerId = cleanSquare.owner.id;
        delete cleanSquare.owner;
      }
      return cleanSquare;
    });
  }
}

module.exports = Board;
