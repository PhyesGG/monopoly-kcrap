import { subscribeToUIState } from '../state/ui.js';

/**
 * Affiche les options liées au jeton de revanche.
 * @param {string|HTMLElement} target
 */
export function initRevenge(target = 'game-controls') {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  const render = (uiState) => {
    if (!uiState || !uiState.revenge) return;
    container.innerHTML = `
      <div class="revenge-notification">
        <h3>Revanche</h3>
        <p>${uiState.revenge.message || ''}</p>
      </div>
    `;
  };

  subscribeToUIState(render);
}

