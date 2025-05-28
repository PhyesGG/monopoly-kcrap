import { getGameState, subscribeToGameState } from '../state/game.js';
import { getPlayerState } from '../state/player.js';
import { proposeTrade } from '../socket.js';
import { renderProperty } from './Property.js';

let container;

export function initPropertyManager(target = 'property-manager') {
  container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;
  const render = () => {
    const state = getGameState();
    const me = getPlayerState();
    if (!state || !me) return;
    const player = state.players.find(p => p.socketId === me.socketId);
    const others = state.players.filter(p => p.socketId !== me.socketId);
    let html = '<h3>Vos propriétés</h3>';
    html += '<div class="my-properties">';
    (player?.properties || []).forEach(id => {
      html += `<div class="prop" data-id="${id}">${renderProperty(id)}</div>`;
    });
    html += '</div>';
    if (others.length) {
      html += '<h4>Proposer un échange</h4>';
      html += '<form class="trade-form">';
      html += '<select name="their">' + others.map(p => `<option value="${p.id}">${p.name}</option>`).join('') + '</select>';
      html += '<select name="property">' + (player?.properties || []).map(id => `<option value="${id}">${id}</option>`).join('') + '</select>';
      html += '<button type="submit">Envoyer</button></form>';
    }
    container.innerHTML = html;
    const form = container.querySelector('.trade-form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const to = form.elements.their.value;
        const propId = parseInt(form.elements.property.value,10);
        proposeTrade(to, { propertyId: propId });
      });
    }
  };
  render();
  subscribeToGameState(render);
}
