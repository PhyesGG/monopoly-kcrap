import { getUIState, subscribeToUIState } from '../state/ui.js';

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
      return;
    }
    const { card, applied } = uiState.card;
    container.innerHTML = `
      <div class="card-display">
        <h3>${card.title || 'Carte'}</h3>
        <p>${card.description || ''}</p>
        ${applied ? '<p>Effet appliqué</p>' : ''}
      </div>
    `;
  };

  render();
  subscribeToUIState(render);
}
