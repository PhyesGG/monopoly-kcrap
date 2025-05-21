const defaultConfig = {
  apiBaseUrl: '',
  socketNamespace: '/game'
};

let currentConfig = { ...defaultConfig };

export function setConfig(config) {
  currentConfig = { ...currentConfig, ...config };
}

export function getConfig(key) {
  if (key) {
    return currentConfig[key];
  }
  return currentConfig;
}
