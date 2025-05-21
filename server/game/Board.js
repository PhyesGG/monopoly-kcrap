const Property = require('./Property');

class Board {
  constructor() {
    this.squares = this.initializeBoard();
  }

  initializeBoard() {
    const squares = [];
    
    // Case départ
    squares.push({
      id: 0,
      type: 'go',
      name: 'Départ',
      position: 0
    });
    
    // Propriétés marron
    squares.push(new Property(1, 'Boulevard de Belleville', 60, 'brown', 1));
    
    squares.push({
      id: 2,
      type: 'card',
      name: 'Caisse de Communauté',
      position: 2
    });
    
    squares.push(new Property(3, 'Rue Lecourbe', 60, 'brown', 3));
    
    squares.push({
      id: 4,
      type: 'tax',
      name: 'Impôt sur le Revenu',
      position: 4,
      amount: 200
    });
    
    // Propriétés bleu clair
    squares.push(new Property(5, 'Rue de Vaugirard', 100, 'light-blue', 5));
    
    squares.push(new Property(6, 'Rue de Courcelles', 100, 'light-blue', 6));
    
    squares.push({
      id: 7,
      type: 'card',
      name: 'Chance',
      position: 7
    });
    
    squares.push(new Property(8, 'Avenue de la République', 120, 'light-blue', 8));
    
    // Prison - Visite
    squares.push({
      id: 9,
      type: 'jail',
      name: 'Prison - Simple Visite',
      position: 9
    });
    
    // Note: pour un jeu complet, il faudrait ajouter les 40 cases
    // J'ajoute seulement quelques cases de plus pour l'exemple
    
    squares.push(new Property(10, 'Boulevard de la Villette', 140, 'pink', 10));
    
    squares.push(new Property(11, 'Avenue de Neuilly', 140, 'pink', 11));
    
    squares.push({
      id: 12,
      type: 'card',
      name: 'KCRAP',
      position: 12
    });
    
    return squares;
  }

  getSquareAt(position) {
    return this.squares.find(square => square.position === position);
  }

  getState() {
    return this.squares.map(square => {
      // Nettoyer la référence circulaire owner->property
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