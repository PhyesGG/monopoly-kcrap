// Classe Property représentant une propriété sur le plateau
class Property {
  constructor(id, name, price, group, position) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.group = group;
    this.position = position;
    this.type = 'property';
    this.owner = null;
    this.houses = 0;
    this.hotel = false;
    this.mortgaged = false;
    
    // Spécifique au mode KCRAP
    this.currentAuction = null;
    this.temporaryOwner = null; // Pour la carte "Fusion hostile"
    this.originalOwner = null;  // Pour la carte "Fusion hostile"
    this.temporaryOwnerTurns = 0; // Pour la carte "Fusion hostile"
  }

  calculateRent({ diceTotal = 0, board = null } = {}) {
    if (!this.owner || this.mortgaged) return 0;

    // Règles spéciales pour les gares
    if (this.group === 'railroad' && board) {
      const railroadsOwned = board.squares.filter(
        sq =>
          sq.type === 'property' &&
          sq.group === 'railroad' &&
          sq.owner &&
          sq.owner.id === this.owner.id
      ).length;
      return 25 * railroadsOwned;
    }

    // Règles spéciales pour les compagnies de services
    if (this.group === 'utility' && board) {
      const utilitiesOwned = board.squares.filter(
        sq =>
          sq.type === 'property' &&
          sq.group === 'utility' &&
          sq.owner &&
          sq.owner.id === this.owner.id
      ).length;
      const multiplier = utilitiesOwned >= 2 ? 10 : 4;
      return diceTotal * multiplier;
    }

    // Calcul du loyer de base
    let rent = this.price * 0.1;

    // Double loyer si monopole sans construction
    if (board && !this.houses && !this.hotel) {
      const sameGroup = board.squares.filter(
        sq => sq.type === 'property' && sq.group === this.group
      );
      if (sameGroup.every(p => p.owner && p.owner.id === this.owner.id)) {
        rent *= 2;
      }
    }

    if (this.houses > 0) {
      rent = rent * (1 + this.houses * 0.5);
    }

    if (this.hotel) {
      rent = rent * 3;
    }

    return Math.floor(rent);
  }

  buyHouse() {
    if (this.mortgaged || this.hotel || this.houses >= 4) {
      return false;
    }
    this.houses += 1;
    return true;
  }

  buyHotel() {
    if (this.mortgaged || this.hotel || this.houses < 4) {
      return false;
    }
    this.houses = 0;
    this.hotel = true;
    return true;
  }

  mortgage() {
    if (this.mortgaged || this.houses > 0 || this.hotel) {
      return false;
    }
    this.mortgaged = true;
    return true;
  }

  unmortgage() {
    if (!this.mortgaged) {
      return false;
    }
    this.mortgaged = false;
    return true;
  }

  startAuction(startingBid = this.price * 0.5) {
    this.currentAuction = {
      highestBidder: null,
      highestBid: startingBid,
      rounds: 0,
      participants: new Set()
    };
    return this.currentAuction;
  }

  endAuction() {
    const auction = this.currentAuction;
    this.currentAuction = null;
    return auction;
  }

  applyHostileTakeover(newOwner, turns = 3) {
    if (this.owner && !this.houses && !this.hotel) {
      this.originalOwner = this.owner;
      this.temporaryOwner = newOwner;
      // Changer temporairement le propriétaire
      this.owner = newOwner;
      const idx = this.originalOwner.properties.findIndex(p => p.id === this.id);
      if (idx > -1) {
        this.originalOwner.properties.splice(idx, 1);
      }
      newOwner.properties.push(this);
      this.temporaryOwnerTurns = turns;
      return true;
    }
    return false;
  }

  updateTemporaryOwnership() {
    if (this.temporaryOwner) {
      this.temporaryOwnerTurns--;

      if (this.temporaryOwnerTurns <= 0) {
        // Retirer la propriété du joueur temporaire
        const idxTemp = this.temporaryOwner.properties.findIndex(p => p.id === this.id);
        if (idxTemp > -1) {
          this.temporaryOwner.properties.splice(idxTemp, 1);
        }

        // Restituer la propriété à son propriétaire d'origine
        this.owner = this.originalOwner;
        if (!this.originalOwner.properties.includes(this)) {
          this.originalOwner.properties.push(this);
        }

        this.temporaryOwner = null;
        this.originalOwner = null;
        return true; // Propriété rendue
      }
    }
    return false;
  }
}

module.exports = Property;