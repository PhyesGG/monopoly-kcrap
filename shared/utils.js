/**
 * Fonctions utilitaires partagées entre le client et le serveur
 */

// Formater le montant d'argent (ajouter le symbole €, séparer les milliers, etc.)
function formatMoney(amount) {
  return `${amount.toLocaleString()}€`;
}

// Vérifier si deux objets sont proches en valeur (±pourcentage)
function areValuesClose(value1, value2, percentTolerance = 20) {
  const diff = Math.abs(value1 - value2);
  const percentDiff = (diff / Math.max(value1, value2)) * 100;
  return percentDiff <= percentTolerance;
}

// Obtenir une couleur pour un groupe de propriétés
function getColorForGroup(group) {
  const colors = {
    'brown': '#8B4513',
    'light-blue': '#87CEEB',
    'pink': '#FFC0CB',
    'orange': '#FFA500',
    'red': '#FF0000',
    'yellow': '#FFFF00',
    'green': '#008000',
    'blue': '#0000FF'
  };
  
  return colors[group] || '#CCCCCC';
}

// Générer un identifiant aléatoire
function generateRandomId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  formatMoney,
  areValuesClose,
  getColorForGroup,
  generateRandomId
};