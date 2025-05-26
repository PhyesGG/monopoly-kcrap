const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { PORT } = require('./config');
const { initSocketHandlers } = require('./socket/handlers');
const { loadSavedGames } = require('./utils/gamePersistence');
const { registerLoadedGames } = require('./socket/lobby');

// Configuration du serveur


async function startServer() {
  try {
    // Initialisation de l'application Express
    const app = express();
    const server = http.createServer(app);
    
    // Utiliser le port défini dans la configuration
    const port = PORT;
    
    // Charger les parties sauvegardées
    const saved = loadSavedGames();
    console.log(`Jeux sauvegardés chargés: ${Object.keys(saved).length}`);
    registerLoadedGames(saved);

    // Configuration de Socket.io
    const io = socketIO(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      path: '/socket.io' // S'assurer que le chemin est explicite
    });
    
    // Ajouter des logs pour le débogage
    console.log('Socket.IO configuré avec cors origin: * et path: /socket.io');
    
    // Servir les fichiers statiques
    app.use(express.static(path.join(__dirname, '../client/public')));
    
    // Route principale
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/public/index.html'));
    });

    // Servir index.html pour tout identifiant de lobby
    // Assurer que le chemin special "/socket.io" reste gere par Socket.IO
    app.get('/:lobbyId', (req, res, next) => {
      if (req.path.startsWith('/socket.io')) {
        // Laisser socket.io gerer ces requetes
        return next();
      }
      res.sendFile(path.join(__dirname, '../client/public/index.html'));
    });
    
    // Initialiser les gestionnaires de socket
    initSocketHandlers(io);
    
    // Démarrer le serveur
    server.listen(port, () => {
      console.log(`Serveur démarré sur le port ${port}`);
      console.log(`URL d'accès: http://localhost:${port}`);
    });
    
    return { port };
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();
