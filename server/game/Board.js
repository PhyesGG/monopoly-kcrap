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
    const p1 = new Property(1, 'Boulevard de Belleville', 60, 'brown');
    p1.type = 'property';
    p1.position = 1;
    squares.push(p1);
    
    squares.push({
      id: 2,
      type: 'card',
      name: 'Caisse de Communauté',
      position: 2
    });
    
    const p2 = new Property(3, 'Rue Lecourbe', 60, 'brown');
    p2.type = 'property';
    p2.position = 3;
    squares.push(p2);
    
    squares.push({
      id: 4,
      type: 'tax',
      name: 'Impôt sur le Revenu',
      position: 4,
      amount: 200
    });
    
    // Propriétés bleu clair
    const p3 = new Property(5, 'Rue de Vaugirard', 100, 'light-blue');
    p3.type = 'property';
    p3.position = 5;
    squares.push(p3);
    
    const p4 = new Property(6, 'Rue de Courcelles', 100, 'light-blue');
    p4.type = 'property';
    p4.position = 6;
    squares.push(p4);
    
    squares.push({
      id: 7,
      type: 'card',
      name: 'Chance',
      position: 7
    });
    
    const p5 = new Property(8, 'Avenue de la République', 120, 'light-blue');
    p5.type = 'property';
    p5.position = 8;
    squares.push(p5);
    
    // Prison - Visite
    squares.push({
      id: 9,
      type: 'jail',
      name: 'Prison - Simple Visite',
      position: 9
    });
    
    // Note: pour un jeu complet, il faudrait ajouter les 40 cases
    // J'ajoute seulement quelques cases de plus pour l'exemple
    
    const p6 = new Property(10, 'Boulevard de la Villette', 140, 'pink');
    p6.type = 'property';
    p6.position = 10;
    squares.push(p6);
    
    const p7 = new Property(11, 'Avenue de Neuilly', 140, 'pink');
    p7.type = 'property';
    p7.position = 11;
    squares.push(p7);
    
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