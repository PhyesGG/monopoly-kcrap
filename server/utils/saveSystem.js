const fs = require('fs');
const path = require('path');
const { dataPath } = require('../config');

const LOBBY_FILE = path.join(dataPath, 'lobbies.json');

function ensureDir() {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
}

function saveLobbies(lobbies) {
  try {
    ensureDir();
    fs.writeFileSync(LOBBY_FILE, JSON.stringify(lobbies, null, 2));
    return true;
  } catch (err) {
    console.error('Erreur lors de la sauvegarde des lobbies:', err);
    return false;
  }
}

function loadLobbies() {
  try {
    if (fs.existsSync(LOBBY_FILE)) {
      const data = fs.readFileSync(LOBBY_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erreur lors du chargement des lobbies:', err);
  }
  return {};
}

module.exports = { saveLobbies, loadLobbies };
