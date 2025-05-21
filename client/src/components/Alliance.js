import { subscribeToUIState } from '../state/ui.js';

/**
 * Affiche les informations d'alliance en cours.
 * @param {string|HTMLElement} target
 */
export function initAlliance(target = 'game-controls') {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  const render = (uiState) => {
    if (!uiState || !uiState.alliance) return;
    container.innerHTML = `
      <div class="alliance-notification">
        <h3>Alliance</h3>
        <p>${uiState.alliance.message || ''}</p>
      </div>
    `;
  };

  subscribeToUIState(render);
}

