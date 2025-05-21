import { getGameState } from '../state/game.js';

/**
 * Génère le HTML représentant une propriété à partir de son identifiant.
 * @param {number} propertyId
 * @returns {string} HTML
 */
export function renderProperty(propertyId) {
  const state = getGameState();
  if (!state || !state.board) return '';
  const square = state.board.find(s => s.id === propertyId);
  if (!square) return '';

  const ownerName = square.ownerId
    ? (state.players || []).find(p => p.id === square.ownerId)?.name || 'Inconnu'
    : 'Libre';

  return `
    <div class="property-card">
      <div class="property-name">${square.name}</div>
      <div class="property-owner">Propriétaire: ${ownerName}</div>
      ${square.price ? `<div class="property-price">Prix: ${square.price}€</div>` : ''}
    </div>
  `;
}
