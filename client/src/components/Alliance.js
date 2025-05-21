import { getGameState, subscribeToGameState } from '../state/game.js';
import { getUIState, subscribeToUIState } from '../state/ui.js';
import { createAlliance, breakAlliance } from '../socket.js';

/**
 * Initialise l'affichage et la gestion des alliances.
 * @param {string|HTMLElement} target
 */
export function initAlliance(target = 'game-controls') {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;

  const render = () => {
    const gameState = getGameState();
    const uiState = getUIState();

    if (!gameState) {
      container.innerHTML = '';
      return;
    }

    const players = gameState.players || [];
    const options = players.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    container.innerHTML = `
      <div class="alliance-controls">
        <h3>Alliance</h3>
        <div class="create-alliance">
          <select id="alliance-target">${options}</select>
          <button id="create-alliance-btn" class="btn btn-secondary">Former une alliance</button>
        </div>
        <button id="break-alliance-btn" class="btn btn-outline">Rompre l'alliance</button>
        <div id="alliance-status"></div>
      </div>
    `;

    const statusDiv = container.querySelector('#alliance-status');
    if (uiState && uiState.alliance) {
      if (uiState.alliance.created) {
        const p1 = players.find(p => p.id === uiState.alliance.player1Id);
        const p2 = players.find(p => p.id === uiState.alliance.player2Id);
        statusDiv.innerHTML = `<p>${uiState.alliance.message || ''} ${p1 ? p1.name : ''} & ${p2 ? p2.name : ''}</p>`;
      } else if (uiState.alliance.broken) {
        statusDiv.innerHTML = `<p>${uiState.alliance.message || "Alliance rompue"}</p>`;
      }
    }

    container.querySelector('#create-alliance-btn').addEventListener('click', () => {
      const targetId = container.querySelector('#alliance-target').value;
      if (targetId) createAlliance(targetId);
    });

    container.querySelector('#break-alliance-btn').addEventListener('click', () => {
      breakAlliance(true);
    });
  };

  render();
  subscribeToGameState(render);
  subscribeToUIState(render);
}

