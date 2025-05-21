export function formatMoney(amount) {
  return amount.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0
  });
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
