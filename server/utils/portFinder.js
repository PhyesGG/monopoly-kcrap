const net = require('net');

// Vérifie si un port est utilisé
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// Trouver le premier port disponible à partir du port de départ
async function findAvailablePort(startPort, maxPort = 65535) {
  let port = startPort;
  
  while (port <= maxPort) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
    port++;
  }
  
  throw new Error('Aucun port disponible trouvé');
}

module.exports = { findAvailablePort };

