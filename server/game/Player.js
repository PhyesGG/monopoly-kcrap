const uuid = require('uuid');

class Player {
  constructor(name, socketId, color = '#FF00A8') {
    this.id = uuid.v4();
    this.name = name;
    this.socketId = socketId;
    this.color = color;
    this.money = 1500; // Montant de départ
    this.position = 0; // Case de départ
    this.properties = [];
    this.inJail = false;
    this.jailTurns = 0;
    this.turnsInJail = 0; // Nombre de tours déjà passés en prison
    this.totalJailPayments = 0; // Somme payée pour sortir de prison
    this.jailCards = 0; // Cartes "Sortie de prison"
    this.bankrupt = false;
    
    // Spécifique au mode KCRAP
    this.revengeToken = true; // Un jeton de revanche par partie
    this.revengeActive = false;
    this.revengeLoanAmount = 0;
    this.revengeLoanTurnsLeft = 0;
    this.currentAlliance = null;
    this.allianceTurnsLeft = 0;
  }

  move(steps) {
    const oldPosition = this.position;
    this.position = (this.position + steps) % 40; // 40 cases sur le plateau standard

    // Si on passe par la case départ
    if (this.position < oldPosition) {
      let bonus = 200;
      if (this.position === 0) bonus = 300;
      this.receiveMoney(bonus);
      return { passedGo: true };
    }

    // Si on atterrit exactement sur la case départ sans l'avoir dépassée
    if (this.position === 0 && oldPosition !== 0) {
      this.receiveMoney(300);
      return { passedGo: true };
    }

    return { passedGo: false };
  }

  buyProperty(property, price) {
    if (this.money < price) {
      return { success: false, message: "Vous n'avez pas assez d'argent." };
    }
    
    this.money -= price;
    this.properties.push(property);
    property.owner = this;
    
    return { success: true };
  }

  payRent(amount, toPlayer) {
    if (this.money < amount) {
      return { success: false, message: "Vous n'avez pas assez d'argent pour payer le loyer." };
    }
    
    this.money -= amount;
    
    // Si alliance active, partage du loyer
    if (toPlayer.currentAlliance && toPlayer.currentAlliance.active) {
      const ally = toPlayer.currentAlliance.player;
      const splitAmount = Math.floor(amount * 0.5);
      
      toPlayer.receiveMoney(splitAmount);
      ally.receiveMoney(amount - splitAmount);
      
      return { success: true, split: true, ally: ally.id };
    } else {
      toPlayer.receiveMoney(amount);
      return { success: true, split: false };
    }
  }

  receiveMoney(amount) {
    this.money += amount;
    return this.money;
  }

  canAfford(amount) {
    return this.money >= amount;
  }

  goToJail() {
    this.inJail = true;
    this.jailTurns = 3;
    this.turnsInJail = 0;
  }

  releaseFromJail() {
    this.inJail = false;
    this.jailTurns = 0;
    this.turnsInJail = 0;
  }

  payJailFine(amount = 50) {
    if (this.money < amount) return false;
    this.money -= amount;
    this.totalJailPayments += amount;
    this.releaseFromJail();
    return true;
  }

  // Méthode pour activer le mécanisme de "Revanche"
  activateRevenge() {
    if (!this.revengeToken || this.revengeActive) {
      return { success: false, message: "Vous ne pouvez pas utiliser de jeton de revanche." };
    }
    
    this.revengeToken = false;
    this.revengeActive = true;
    this.revengeLoanAmount = 750; // 500€ + 50% d'intérêts
    this.revengeLoanTurnsLeft = 5;
    this.receiveMoney(500); // Prêt d'urgence
    
    return { success: true };
  }

  updateRevengeLoan() {
    if (this.revengeActive) {
      this.revengeLoanTurnsLeft--;
      
      // Vérification si le délai est écoulé
      if (this.revengeLoanTurnsLeft <= 0) {
        if (this.money >= this.revengeLoanAmount) {
          this.money -= this.revengeLoanAmount;
          this.revengeActive = false;
          this.revengeLoanAmount = 0;
          return { success: true, message: "Prêt remboursé avec succès." };
        } else {
          // Faillite suite au non-remboursement
          return { success: false, message: "Vous n'avez pas pu rembourser votre prêt.", bankruptcy: true };
        }
      }
    }
    
    return { success: true };
  }

  // Méthodes pour les alliances
  createAlliance(otherPlayer) {
    if (this.currentAlliance || otherPlayer.currentAlliance) {
      return { success: false, message: "L'un des joueurs a déjà une alliance active." };
    }
    
    const alliance = {
      player: otherPlayer,
      active: true,
      turnsLeft: 3
    };
    
    this.currentAlliance = alliance;
    otherPlayer.currentAlliance = {
      player: this,
      active: true,
      turnsLeft: 3
    };
    
    return { success: true };
  }

  updateAlliance() {
    if (this.currentAlliance && this.currentAlliance.active) {
      this.currentAlliance.turnsLeft--;
      
      if (this.currentAlliance.turnsLeft <= 0) {
        // L'alliance se termine naturellement, pas de pénalité
        const ally = this.currentAlliance.player;
        this.currentAlliance = null;
        ally.currentAlliance = null;
        
        return { endedNaturally: true };
      }
    }
    
    return { endedNaturally: false };
  }

  breakAlliance(unilateral = true) {
    if (!this.currentAlliance) {
      return { success: false, message: "Vous n'avez pas d'alliance active." };
    }
    
    const ally = this.currentAlliance.player;
    
    // Rupture unilatérale: paiement de la pénalité
    if (unilateral) {
      if (this.money < 200) {
        return { success: false, message: "Vous n'avez pas assez d'argent pour rompre l'alliance." };
      }
      
      this.money -= 200;
      ally.receiveMoney(200);
    }
    
    this.currentAlliance = null;
    ally.currentAlliance = null;
    
    return { success: true };
  }

  declareBankruptcy() {
    this.bankrupt = true;
    return this.properties;
  }
}

module.exports = Player;