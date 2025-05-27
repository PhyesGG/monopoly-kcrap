const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { SAVE_PATH } = require('../config');
const Game = require('../game/Game');

async function ensureSaveDir() {
  try {
    await fsp.access(SAVE_PATH);
  } catch {
    await fsp.mkdir(SAVE_PATH, { recursive: true });
  }
}

async function saveGame(game, lobby = null) {
  try {
    await ensureSaveDir();
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

    await fsp.writeFile(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du jeu:', err);
  }
}

async function loadGame(gameId) {
  try {
    await ensureSaveDir();
    const file = path.join(SAVE_PATH, `${gameId}.json`);
    try {
      await fsp.access(file);
    } catch {
      return null;
    }
    const data = JSON.parse(await fsp.readFile(file, 'utf8'));

    const gameState = data.game || data;
    const game = Game.fromState(gameState);
    const lobby = data.lobby || null;

    return { game, lobby };
  } catch (err) {
    console.error('Erreur lors du chargement du jeu:', err);
    return null;
  }
}

async function loadSavedGames() {
  await ensureSaveDir();
  const games = {};
  const files = (await fsp.readdir(SAVE_PATH)).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const gameId = path.basename(f, '.json');
    const g = await loadGame(gameId);
    if (g) games[gameId] = g;
  }
  return games;
}

module.exports = {
  saveGame,
  loadGame,
  loadSavedGames
};
