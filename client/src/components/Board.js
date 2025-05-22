import { getGameState, subscribeToGameState } from '../state/game.js';

/**
 * Initialise et met à jour l'affichage du plateau de jeu.
 * @param {string|HTMLElement} target - identifiant de l'élément ou élément DOM.
 */
export function initBoard(target = 'board') {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(10, 1fr)';
  container.style.gap = '4px';

  const render = () => {
    const state = getGameState();
    container.innerHTML = '';
    if (!state || !state.board) return;

    state.board.forEach(square => {
      const el = document.createElement('div');
      el.className = `board-square ${square.type}`;
      el.dataset.id = square.id;
      el.innerHTML = `<div class="square-name">${square.name}</div><div class="tokens"></div>`;
      el.style.minHeight = '60px';
      el.style.border = '1px solid rgba(0,0,0,0.2)';
      el.style.padding = '2px';
      container.appendChild(el);
    });

    if (state.players) {
      state.players.forEach(player => {
        const tokenContainer = container.querySelector(`.board-square[data-id="${player.position}"] .tokens`);
        if (tokenContainer) {
          const token = document.createElement('span');
          token.className = 'player-token';
          token.textContent = player.name.charAt(0).toUpperCase();
          token.style.display = 'inline-block';
          token.style.width = '20px';
          token.style.height = '20px';
          token.style.borderRadius = '50%';
          token.style.background = '#FF00A8';
          token.style.color = '#000';
          token.style.fontSize = '0.75rem';
          token.style.lineHeight = '20px';
          token.style.textAlign = 'center';
          token.style.marginRight = '2px';
          tokenContainer.appendChild(token);
        }
      });
    }
  };

  render();
  subscribeToGameState(render);
}
