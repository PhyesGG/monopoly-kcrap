import { getUIState, subscribeToUIState } from '../state/ui.js';
import { placeBid } from '../socket.js';

/**
 * Affiche l'état de l'enchère courante et permet de placer une enchère.
 * @param {string|HTMLElement} target
 */
export function initAuction(target = 'game-controls') {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  const render = () => {
    const uiState = getUIState();
    if (!uiState || !uiState.auction) return;
    const auction = uiState.auction;

    if (auction.ended) {
      container.innerHTML = `
        <div class="auction-result">
          <h3>Enchère terminée</h3>
          ${auction.result && auction.result.winner ?
            `<p>${auction.result.winner} a remporté ${auction.result.property.name} pour ${auction.result.price}€</p>` :
            `<p>Aucun acquéreur pour ${auction.result.property.name}</p>`}
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="auction-controls">
        <h3>Enchère en cours</h3>
        <p class="property-name">${auction.property ? auction.property.name : ''}</p>
        <p class="current-bid">Enchère actuelle: ${auction.amount || auction.startingBid || 0}€</p>
        <div class="bid-actions">
          <input type="number" id="bid-amount" min="${(auction.amount || auction.startingBid || 0) + 10}" step="10" value="${(auction.amount || auction.startingBid || 0) + 10}">
          <button id="place-bid-btn" class="btn btn-secondary">Enchérir</button>
        </div>
      </div>`;

    const amountInput = container.querySelector('#bid-amount');
    container.querySelector('#place-bid-btn').addEventListener('click', () => {
      const amount = parseInt(amountInput.value, 10);
      if (!Number.isNaN(amount)) {
        placeBid(amount);
      }
    });
  };

  render();
  subscribeToUIState(render);
}
