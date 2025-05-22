// Configuration du serveur et des sauvegardes
// Chargement éventuel des variables d'environnement depuis un fichier .env
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([^#=]+)=\s*(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  }
}

loadEnvFile();

module.exports = {
  PORT: process.env.PORT || 3000,
  SAVE_PATH: process.env.SAVE_PATH || './saves'
};
