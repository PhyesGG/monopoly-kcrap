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
    
    // Propriétés supplémentaires pour compléter le plateau classique
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

    // Reste du plateau classique
    const p8 = new Property(13, 'Rue de Paradis', 160, 'pink');
    p8.position = 13;
    squares.push(p8);

    const r2 = new Property(14, 'Gare de Lyon', 200, 'railroad');
    r2.position = 14;
    squares.push(r2);

    const o1 = new Property(15, 'Avenue Mozart', 180, 'orange');
    o1.position = 15;
    squares.push(o1);

    squares.push({
      id: 16,
      type: 'card',
      name: 'Caisse de Communauté',
      position: 16
    });

    const o2 = new Property(17, 'Boulevard Saint-Michel', 180, 'orange');
    o2.position = 17;
    squares.push(o2);

    const o3 = new Property(18, 'Place Pigalle', 200, 'orange');
    o3.position = 18;
    squares.push(o3);

    squares.push({
      id: 19,
      type: 'parking',
      name: 'Parc Gratuit',
      position: 19
    });

    const r3 = new Property(20, 'Avenue Matignon', 220, 'red');
    r3.position = 20;
    squares.push(r3);

    squares.push({
      id: 21,
      type: 'card',
      name: 'Chance',
      position: 21
    });

    const r4 = new Property(22, 'Boulevard Malesherbes', 220, 'red');
    r4.position = 22;
    squares.push(r4);

    const r5 = new Property(23, 'Avenue Henri-Martin', 240, 'red');
    r5.position = 23;
    squares.push(r5);

    const rr3 = new Property(24, 'Gare du Nord', 200, 'railroad');
    rr3.position = 24;
    squares.push(rr3);

    const y1 = new Property(25, 'Faubourg Saint-Honoré', 260, 'yellow');
    y1.position = 25;
    squares.push(y1);

    const y2 = new Property(26, 'Place de la Bourse', 260, 'yellow');
    y2.position = 26;
    squares.push(y2);

    const util2 = new Property(27, 'Compagnie des Eaux', 150, 'utility');
    util2.position = 27;
    squares.push(util2);

    const y3 = new Property(28, 'Rue La Fayette', 280, 'yellow');
    y3.position = 28;
    squares.push(y3);

    squares.push({
      id: 29,
      type: 'goto-jail',
      name: 'Allez en Prison',
      position: 29
    });

    const g1 = new Property(30, 'Avenue de Breteuil', 300, 'green');
    g1.position = 30;
    squares.push(g1);

    const g2 = new Property(31, 'Avenue Foch', 300, 'green');
    g2.position = 31;
    squares.push(g2);

    squares.push({
      id: 32,
      type: 'card',
      name: 'Caisse de Communauté',
      position: 32
    });

    const g3 = new Property(33, 'Boulevard des Capucines', 320, 'green');
    g3.position = 33;
    squares.push(g3);

    const rr4 = new Property(34, 'Gare Saint-Lazare', 200, 'railroad');
    rr4.position = 34;
    squares.push(rr4);

    squares.push({
      id: 35,
      type: 'card',
      name: 'Chance',
      position: 35
    });

    const b1 = new Property(36, 'Avenue des Champs-Élysées', 350, 'dark-blue');
    b1.position = 36;
    squares.push(b1);

    squares.push({
      id: 37,
      type: 'tax',
      name: 'Taxe de Luxe',
      position: 37,
      amount: 100
    });
    const b2 = new Property(38, 'Rue de la Paix', 400, 'dark-blue');
    b2.position = 38;
    squares.push(b2);

    squares.push({
      id: 39,
      type: 'go',
      name: 'Passage',
      position: 39
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
