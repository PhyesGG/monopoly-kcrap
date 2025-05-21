const STORAGE_KEY = 'playerState';

let playerState = null;
const listeners = [];

function loadState() {
  if (playerState) return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      playerState = JSON.parse(stored);
    }
  } catch (e) {
    playerState = null;
  }
}

function saveState() {
  try {
    if (playerState === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playerState));
    }
  } catch (e) {
    // ignore
  }
}

export function getPlayerState() {
  loadState();
  return playerState;
}

export function setPlayerState(newState) {
  loadState();
  playerState = { ...(playerState || {}), ...newState };
  saveState();
  notify();
}

export function clearPlayerState() {
  playerState = null;
  saveState();
  notify();
}

export function subscribeToPlayerState(listener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notify() {
  listeners.forEach(l => l(playerState));
}
