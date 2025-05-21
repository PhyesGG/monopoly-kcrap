import { getUIState, subscribeToUIState } from '../state/ui.js';
import { applyCardEffect } from '../socket.js';

/**
 * Affiche la carte en cours si disponible dans l'état UI.
 * @param {string|HTMLElement} target
 */
export function initCards(target = 'game-controls') {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  const render = () => {
    const uiState = getUIState();
    if (!uiState || !uiState.card) {
      container.innerHTML = '';
      return;
    }

    const { card, applied } = uiState.card;

    container.innerHTML = `
      <div class="card-display">
        <h3>${card.title || 'Carte'}</h3>
        <p>${card.description || ''}</p>
        ${applied ? '<p>Effet appliqué</p>' : '<button id="apply-card-btn" class="btn btn-secondary">Appliquer</button>'}
      </div>
    `;

    if (!applied) {
      const btn = container.querySelector('#apply-card-btn');
      btn.addEventListener('click', () => {
        applyCardEffect(card.id, {});
      });
    }
  };

  render();
  subscribeToUIState(render);
}
