let uiState = {
  diceResult: null,
  auction: null,
  card: null,
  revenge: null,
  alliance: null,
  leaderboard: null
};

const listeners = [];

export function setDiceResult(result) {
  uiState = { ...uiState, diceResult: result };
  notifyListeners();
}

export function setAuctionState(auction) {
  uiState = { ...uiState, auction };
  notifyListeners();
}

export function setCardState(card) {
  uiState = { ...uiState, card };
  notifyListeners();
}

export function setRevengeState(revenge) {
  uiState = { ...uiState, revenge };
  notifyListeners();
}

export function setAllianceState(alliance) {
  uiState = { ...uiState, alliance };
  notifyListeners();
}

export function setLeaderboard(leaderboard) {
  uiState = { ...uiState, leaderboard };
  notifyListeners();
}

export function getUIState() {
  return uiState;
}

export function subscribeToUIState(listener) {
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
  listeners.forEach(listener => listener(uiState));
}