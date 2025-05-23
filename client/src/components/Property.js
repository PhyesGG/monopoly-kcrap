import { getGameState } from '../state/game.js';
import { getSocket } from '../socket.js';

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

  const owner = (state.players || []).find(p => p.id === square.ownerId);
  const ownerName = owner ? owner.name : 'Libre';

  const socket = getSocket && getSocket();
  const isOwner = owner && socket && owner.socketId === socket.id;

  const houses = square.houses ? `<div class="property-houses">Maisons: ${square.houses}</div>` : '';
  const hotel = square.hotel ? '<div class="property-hotel">Hôtel présent</div>' : '';
  const mortgaged = square.mortgaged ? '<div class="property-mortgaged">Hypothéquée</div>' : '';

  let actions = '';
  if (isOwner) {
    actions = `
      <div class="property-actions">
        <button class="buy-house-btn" data-id="${square.id}">+Maison</button>
        <button class="buy-hotel-btn" data-id="${square.id}">+Hôtel</button>
        ${square.mortgaged
          ? `<button class="unmortgage-btn" data-id="${square.id}">Lever</button>`
          : `<button class="mortgage-btn" data-id="${square.id}">Hyp.</button>`}
      </div>`;
  }

  return `
    <div class="property-card">
      <div class="property-name">${square.name}</div>
      <div class="property-owner">Propriétaire: ${ownerName}</div>
      ${square.price ? `<div class="property-price">Prix: ${square.price}€</div>` : ''}
      ${houses}
      ${hotel}
      ${mortgaged}
      ${actions}
    </div>
  `;
}
