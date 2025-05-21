import { getGameState, subscribeToGameState } from '../state/game.js';

/**
 * Initialise et met à jour l'affichage du plateau de jeu.
 * @param {string|HTMLElement} target - identifiant de l'élément ou élément DOM.
 */
export function initBoard(target = 'board') {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  const render = () => {
    const state = getGameState();
    container.innerHTML = '';
    if (!state || !state.board) return;
    state.board.forEach(square => {
      const el = document.createElement('div');
      el.className = `board-square ${square.type}`;
      el.dataset.id = square.id;
      el.textContent = square.name;
      container.appendChild(el);
    });
  };

  render();
  subscribeToGameState(render);
}
