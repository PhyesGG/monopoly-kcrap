import { getGameState, subscribeToGameState } from '../state/game.js';

/**
 * Initialise l'affichage des joueurs.
 * @param {string|HTMLElement} target
 */
export function initPlayers(target = 'players-info') {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  const render = () => {
    const state = getGameState();
    container.innerHTML = '<h3>Joueurs</h3>';
    if (!state || !state.players) return;
    state.players.forEach(player => {
      const el = document.createElement('div');
      el.className = 'player-card';
      el.dataset.id = player.id;
      const allianceInfo = player.currentAlliance ? `<span class="player-alliance">🤝</span>` : '';
      el.innerHTML = `
        <div class="player-name">${player.name} ${allianceInfo}</div>
        <div class="player-money">${player.money}€</div>
      `;
      container.appendChild(el);
    });
  };

  render();
  subscribeToGameState(render);
}
