let gameState = null;
const listeners = [];

export function updateGameState(newState) {
  gameState = newState;
  notifyListeners();
}

export function getGameState() {
  return gameState;
}

export function subscribeToGameState(listener) {
  listeners.push(listener);
  
  // Retourner une fonction pour se désabonner
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}

function notifyListeners() {
  listeners.forEach(listener => listener(gameState));
}

