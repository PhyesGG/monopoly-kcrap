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
    squares.push({
      id: 1,
      type: 'property',
      name: 'Boulevard de Belleville',
      position: 1,
      price: 60,
      group: 'brown',
      owner: null,
      houses: 0,
      hotel: false
    });
    
    squares.push({
      id: 2,
      type: 'card',
      name: 'Caisse de Communauté',
      position: 2
    });
    
    squares.push({
      id: 3,
      type: 'property',
      name: 'Rue Lecourbe',
      position: 3,
      price: 60,
      group: 'brown',
      owner: null,
      houses: 0,
      hotel: false
    });
    
    squares.push({
      id: 4,
      type: 'tax',
      name: 'Impôt sur le Revenu',
      position: 4,
      amount: 200
    });
    
    // Propriétés bleu clair
    squares.push({
      id: 5,
      type: 'property',
      name: 'Rue de Vaugirard',
      position: 5,
      price: 100,
      group: 'light-blue',
      owner: null,
      houses: 0,
      hotel: false
    });
    
    squares.push({
      id: 6,
      type: 'property',
      name: 'Rue de Courcelles',
      position: 6,
      price: 100,
      group: 'light-blue',
      owner: null,
      houses: 0,
      hotel: false
    });
    
    squares.push({
      id: 7,
      type: 'card',
      name: 'Chance',
      position: 7
    });
    
    squares.push({
      id: 8,
      type: 'property',
      name: 'Avenue de la République',
      position: 8,
      price: 120,
      group: 'light-blue',
      owner: null,
      houses: 0,
      hotel: false
    });
    
    // Prison - Visite
    squares.push({
      id: 9,
      type: 'jail',
      name: 'Prison - Simple Visite',
      position: 9
    });
    
    // Note: pour un jeu complet, il faudrait ajouter les 40 cases
    // J'ajoute seulement quelques cases de plus pour l'exemple
    
    squares.push({
      id: 10,
      type: 'property',
      name: 'Boulevard de la Villette',
      position: 10,
      price: 140,
      group: 'pink',
      owner: null,
      houses: 0,
      hotel: false
    });
    
    squares.push({
      id: 11,
      type: 'property',
      name: 'Avenue de Neuilly',
      position: 11,
      price: 140,
      group: 'pink',
      owner: null,
      houses: 0,
      hotel: false
    });
    
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