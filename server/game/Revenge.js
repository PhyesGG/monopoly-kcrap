// Module simplifié gérant un prêt de "revanche" accordé à un joueur

class Revenge {
  constructor(player) {
    this.player = player;
    this.turnsLeft = 5;
    this.amount = 750;
  }

  nextTurn() {
    if (this.turnsLeft > 0) {
      this.turnsLeft--;
    }
  }

  isActive() {
    return this.turnsLeft > 0;
  }
}

module.exports = Revenge;
