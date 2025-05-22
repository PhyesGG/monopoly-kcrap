const fs = require('fs');
const path = require('path');
const { SAVE_PATH } = require('../config');
const Game = require('../game/Game');

function ensureSaveDir() {
  if (!fs.existsSync(SAVE_PATH)) {
    fs.mkdirSync(SAVE_PATH, { recursive: true });
  }
}

function saveGame(game, lobby = null) {
  try {
    ensureSaveDir();
    const file = path.join(SAVE_PATH, `${game.id}.json`);

    const data = { game: game.getGameState() };

    if (lobby) {
      data.lobby = {
        id: lobby.id,
        name: lobby.name,
        host: lobby.host,
        createdAt: lobby.createdAt,
        players: lobby.players
      };
    }

    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du jeu:', err);
  }
}

function loadGame(gameId) {
  try {
    ensureSaveDir();
    const file = path.join(SAVE_PATH, `${gameId}.json`);
    if (!fs.existsSync(file)) return null;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    const gameState = data.game || data;
    const game = Game.fromState(gameState);
    const lobby = data.lobby || null;

    return { game, lobby };
  } catch (err) {
    console.error('Erreur lors du chargement du jeu:', err);
    return null;
  }
}

function loadSavedGames() {
  ensureSaveDir();
  const games = {};
  const files = fs.readdirSync(SAVE_PATH).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const gameId = path.basename(f, '.json');
    const g = loadGame(gameId);
    if (g) games[gameId] = g;
  }
  return games;
}

module.exports = {
  saveGame,
  loadGame,
  loadSavedGames
};
