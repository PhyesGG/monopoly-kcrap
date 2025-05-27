export function renderLeaderboard(ranking, onReplay) {
  const app = document.getElementById('app');
  if (!app) return;
  const items = ranking
    .map((p, i) => `<li>${i + 1}. ${p.name} - ${p.money}€</li>`) // money euro sign
    .join('');
  app.innerHTML = `
    <div class="leaderboard-screen">
      <h2>Classement final</h2>
      <ul class="leaderboard-list">${items}</ul>
      <button id="replay-btn" class="btn">Rejouer</button>
    </div>`;
  const btn = document.getElementById('replay-btn');
  if (btn) btn.addEventListener('click', () => onReplay && onReplay());
}
