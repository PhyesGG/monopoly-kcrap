// Classe Alliance pour le système d'alliances temporaires
class Alliance {
  constructor(player1, player2) {
    this.player1 = player1;
    this.player2 = player2;
    this.createdAt = Date.now();
    this.active = true;
    this.player1TurnsLeft = 3;
    this.player2TurnsLeft = 3;
  }

  playerTurnCompleted(player) {
    if (!this.active) return false;
    
    if (player.id === this.player1.id) {
      this.player1TurnsLeft--;
      if (this.player1TurnsLeft <= 0) {
        this.checkAlliance();
      }
      return true;
    } else if (player.id === this.player2.id) {
      this.player2TurnsLeft--;
      if (this.player2TurnsLeft <= 0) {
        this.checkAlliance();
      }
      return true;
    }
    
    return false;
  }

  checkAlliance() {
    if (this.player1TurnsLeft <= 0 && this.player2TurnsLeft <= 0) {
      this.endAlliance();
      return { ended: true };
    }
    
    return { ended: false };
  }

  breakAlliance(initiatingPlayer) {
    if (!this.active) {
      return { success: false, message: "Cette alliance n'est plus active." };
    }
    
    this.active = false;
    
    // Déterminer l'autre joueur pour appliquer la pénalité
    const otherPlayer = initiatingPlayer.id === this.player1.id ? this.player2 : this.player1;
    
    // Appliquer la pénalité de 200€
    if (initiatingPlayer.money >= 200) {
      initiatingPlayer.money -= 200;
      otherPlayer.receiveMoney(200);
      
      return { 
        success: true,
        message: `${initiatingPlayer.name} a rompu l'alliance et a payé 200€ à ${otherPlayer.name}.`
      };
    } else {
      // Le joueur ne peut pas payer la pénalité
      return { 
        success: false, 
        message: `${initiatingPlayer.name} n'a pas assez d'argent pour rompre l'alliance.`
      };
    }
  }

  endAlliance() {
    this.active = false;
    
    // Réinitialiser les références dans les objets joueurs
    this.player1.currentAlliance = null;
    this.player2.currentAlliance = null;
    
    return {
      player1: this.player1,
      player2: this.player2,
      message: "L'alliance s'est terminée naturellement."
    };
  }

  calculateSplitRent(amount) {
    const sharedAmount = Math.floor(amount * 0.5);
    return {
      player1Amount: sharedAmount,
      player2Amount: amount - sharedAmount
    };
  }
}

module.exports = Alliance;