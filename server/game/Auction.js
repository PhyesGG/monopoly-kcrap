// Classe Auction pour le système d'enchères modernes
class Auction {
  constructor(property, startingBid) {
    this.property = property;
    this.startingBid = startingBid || Math.floor(property.price * 0.5);
    this.currentBid = this.startingBid;
    this.highestBidder = null;
    this.participants = new Set();
    this.rounds = 0;
    this.roundsWithoutBids = 0;
    this.isActive = true;
    this.messages = [];
  }

  addParticipant(player) {
    this.participants.add(player.id);
    this.messages.push(`${player.name} a rejoint l'enchère`);
  }

  placeBid(player, amount) {
    if (!this.isActive) {
      return { success: false, message: "L'enchère est terminée." };
    }
    
    if (amount <= this.currentBid) {
      return { success: false, message: "L'enchère doit être supérieure à l'enchère actuelle." };
    }
    
    this.currentBid = amount;
    this.highestBidder = player;
    this.roundsWithoutBids = 0;
    this.messages.push(`${player.name} a enchéri à ${amount}€`);
    
    return { success: true };
  }

  nextRound() {
    this.rounds++;
    
    if (this.highestBidder === null) {
      this.roundsWithoutBids++;
      
      if (this.roundsWithoutBids >= 1) {
        // Diminution du prix de 10% à chaque tour sans enchère
        this.currentBid = Math.floor(this.currentBid * 0.9);
        this.messages.push(`Aucune enchère, le prix baisse à ${this.currentBid}€`);
      }
      
      if (this.roundsWithoutBids >= 5) {
        this.end();
        this.messages.push("L'enchère est terminée sans acquéreur");
        return { ended: true, winner: null };
      }
    }
    
    return { ended: false };
  }
  
  end() {
    this.isActive = false;
    return {
      property: this.property,
      winner: this.highestBidder,
      finalPrice: this.currentBid
    };
  }
}

module.exports = Auction;