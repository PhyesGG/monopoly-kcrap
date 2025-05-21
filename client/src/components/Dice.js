import { subscribeToUIState } from '../state/ui.js';

/**
 * Affiche le résultat des dés dans l'élément cible.
 * @param {string|HTMLElement} target
 */
export function initDice(target = 'dice-result') {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  const render = (uiState) => {
    if (!uiState || !uiState.diceResult) return;
    const { dice1, dice2, total } = uiState.diceResult;
    container.innerHTML = `
      <div class="dice-roll">
        <div class="dice">${dice1}</div>
        <div class="dice">${dice2}</div>
        <div class="dice-total">${total}</div>
      </div>
    `;
  };

  subscribeToUIState(render);
}

