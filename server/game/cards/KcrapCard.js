// Classe représentant les cartes KCRAP spéciales
class KcrapCard {
  constructor(id, type, title, description) {
    this.id = id;
    this.type = type; // 'crypto', 'exchange', 'restructure', 'hostile', 'digital', 'jail'
    this.title = title;
    this.description = description;
    this.effectApplied = false;
  }

  applyEffect(game, player, params) {
    switch (this.type) {
      case 'crypto':
        return this.applyCryptoEffect(game, player);
      case 'exchange':
        return this.applyExchangeEffect(game, player, params);
      case 'restructure':
        return this.applyRestructureEffect(game, player, params);
      case 'hostile':
        return this.applyHostileEffect(game, player, params);
      case 'digital':
        return this.applyDigitalEffect(game);
      case 'jail':
        return { success: true }; // Géré directement dans Game
      default:
        return {
          success: false,
          message: "Type de carte inconnu"
        };
    }
  }

  // Bourse Crypto : Fluctuation du prix de vente des propriétés
  applyCryptoEffect(game, player) {
    // Générer un pourcentage aléatoire entre -30% et +50%
    const fluctuationPercent = Math.floor(Math.random() * 81) - 30;
    
    // Marquer les propriétés du joueur pour la fluctuation
    player.properties.forEach(property => {
      property.cryptoFluctuation = fluctuationPercent;
      property.cryptoTurnsLeft = 1; // Jusqu'au prochain tour
    });
    
    this.effectApplied = true;
    
    return {
      success: true,
      message: `Les prix de vente de vos propriétés fluctuent de ${fluctuationPercent}% jusqu'à votre prochain tour.`
    };
  }

  // Échange forcé : Échange de propriétés
  applyExchangeEffect(game, player, params) {
    if (!params || !params.selectedPropertyId || !params.targetPlayerId || !params.targetPropertyId) {
      return {
        success: false,
        requireInput: true,
        message: "Veuillez sélectionner une propriété à échanger et une propriété cible."
      };
    }
    
    const selectedProperty = player.properties.find(p => p.id === params.selectedPropertyId);
    const targetPlayer = game.players[params.targetPlayerId];
    
    if (!targetPlayer) {
      return {
        success: false,
        message: "Joueur cible introuvable."
      };
    }
    
    const targetProperty = targetPlayer.properties.find(p => p.id === params.targetPropertyId);
    
    if (!selectedProperty || !targetProperty) {
      return {
        success: false,
        message: "Propriété introuvable."
      };
    }
    
    // Vérifier la différence de valeur (±20%)
    const valueDifference = Math.abs(selectedProperty.price - targetProperty.price);
    const percentDifference = (valueDifference / selectedProperty.price) * 100;
    
    if (percentDifference > 20) {
      return {
        success: false,
        message: "La différence de valeur entre les propriétés dépasse 20%."
      };
    }
    
    // Échanger les propriétés
    const playerPropertyIndex = player.properties.findIndex(p => p.id === selectedProperty.id);
    const targetPropertyIndex = targetPlayer.properties.findIndex(p => p.id === targetProperty.id);
    
    if (playerPropertyIndex === -1 || targetPropertyIndex === -1) {
      return {
        success: false,
        message: "Propriété introuvable."
      };
    }
    
    // Effectuer l'échange
    const temp = player.properties[playerPropertyIndex];
    player.properties[playerPropertyIndex] = targetPlayer.properties[targetPropertyIndex];
    targetPlayer.properties[targetPropertyIndex] = temp;
    
    // Mettre à jour les propriétaires
    player.properties[playerPropertyIndex].owner = player;
    targetPlayer.properties[targetPropertyIndex].owner = targetPlayer;
    
    this.effectApplied = true;
    
    return {
      success: true,
      message: `${player.name} a échangé ${selectedProperty.name} contre ${targetProperty.name} de ${targetPlayer.name}.`
    };
  }

  // Restructuration : Déplacer une maison
  applyRestructureEffect(game, player, params) {
    if (!params || !params.sourcePropertyId || !params.targetPropertyId) {
      return {
        success: false,
        requireInput: true,
        message: "Veuillez sélectionner une propriété source et une propriété cible."
      };
    }
    
    const sourceProperty = player.properties.find(p => p.id === params.sourcePropertyId);
    const targetProperty = player.properties.find(p => p.id === params.targetPropertyId);
    
    if (!sourceProperty || !targetProperty) {
      return {
        success: false,
        message: "Propriété introuvable ou ne vous appartenant pas."
      };
    }
    
    if (sourceProperty.houses <= 0) {
      return {
        success: false,
        message: "La propriété source n'a pas de maison à déplacer."
      };
    }
    
    if (targetProperty.hotel) {
      return {
        success: false,
        message: "La propriété cible possède déjà un hôtel."
      };
    }
    
    if (targetProperty.houses >= 4) {
      return {
        success: false,
        message: "La propriété cible possède déjà le maximum de maisons."
      };
    }
    
    // Déplacer la maison
    sourceProperty.houses--;
    targetProperty.houses++;
    
    this.effectApplied = true;
    
    return {
      success: true,
      message: `${player.name} a déplacé une maison de ${sourceProperty.name} vers ${targetProperty.name}.`
    };
  }

  // Fusion hostile : Prendre le contrôle d'une propriété
  applyHostileEffect(game, player, params) {
    if (!params || !params.targetPropertyId) {
      return {
        success: false,
        requireInput: true,
        message: "Veuillez sélectionner une propriété cible."
      };
    }
    
    // Trouver la propriété cible
    let targetProperty = null;
    let originalOwner = null;
    
    // Rechercher dans les propriétés de tous les joueurs
    for (const playerId in game.players) {
      const p = game.players[playerId];
      if (p.id !== player.id) {
        const prop = p.properties.find(prop => prop.id === params.targetPropertyId);
        if (prop) {
          targetProperty = prop;
          originalOwner = p;
          break;
        }
      }
    }
    
    if (!targetProperty) {
      return {
        success: false,
        message: "Propriété cible introuvable."
      };
    }
    
    if (targetProperty.houses > 0 || targetProperty.hotel) {
      return {
        success: false,
        message: "Vous ne pouvez pas prendre le contrôle d'une propriété améliorée."
      };
    }
    
    // Prendre le contrôle de la propriété
    targetProperty.applyHostileTakeover(player, 3); // 3 tours
    
    this.effectApplied = true;
    
    return {
      success: true,
      message: `${player.name} a pris le contrôle de ${targetProperty.name} de ${originalOwner.name} pour 3 tours.`
    };
  }

  // Perturbation numérique : Taxe sur les loyers
  applyDigitalEffect(game) {
    // Appliquer une taxe globale de 10% sur tous les loyers pendant 2 tours
    game.applyDigitalDisruption(2);
    
    this.effectApplied = true;
    
    return {
      success: true,
      message: "Tous les joueurs doivent payer 10% de taxe sur les loyers perçus pendant 2 tours."
    };
  }
}

module.exports = KcrapCard;