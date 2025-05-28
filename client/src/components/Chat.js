import { sendChatMessage, subscribeToChat } from '../socket.js';

let container;

export function initChat(target = 'chat', messages = []) {
  container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) return;
  container.innerHTML = `
    <div class="chat-messages"></div>
    <form class="chat-form">
      <input type="text" class="chat-input" placeholder="Message...">
      <button type="submit">Envoyer</button>
    </form>
  `;
  const messagesEl = container.querySelector('.chat-messages');
  messages.forEach(m => addMessage(m));

  container.querySelector('.chat-form').addEventListener('submit', async e => {
    e.preventDefault();
    const input = container.querySelector('.chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    try {
      await sendChatMessage(msg);
    } catch (err) {
      console.error('chat error', err);
    }
    input.value = '';
  });

  subscribeToChat(addMessage);
}

export function addMessage(msg) {
  if (!container) return;
  const messagesEl = container.querySelector('.chat-messages');
  const el = document.createElement('div');
  el.className = 'chat-line';
  const time = new Date(msg.timestamp).toLocaleTimeString();
  el.textContent = `[${time}] ${msg.name}: ${msg.message}`;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
