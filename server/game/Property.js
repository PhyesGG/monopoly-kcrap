// Classe Property représentant une propriété sur le plateau
class Property {
  constructor(id, name, price, group) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.group = group;
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

  calculateRent() {
    if (!this.owner) return 0;
    
    // Calcul du loyer de base (simplifié)
    let rent = this.price * 0.1;
    
    if (this.houses > 0) {
      rent = rent * (1 + this.houses * 0.5);
    }
    
    if (this.hotel) {
      rent = rent * 3;
    }
    
    return Math.floor(rent);
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
      this.temporaryOwnerTurns = turns;
      return true;
    }
    return false;
  }

  updateTemporaryOwnership() {
    if (this.temporaryOwner) {
      this.temporaryOwnerTurns--;
      
      if (this.temporaryOwnerTurns <= 0) {
        this.owner = this.originalOwner;
        this.temporaryOwner = null;
        this.originalOwner = null;
        return true; // Propriété rendue
      }
    }
    return false;
  }
}

module.exports = Property;