const USERNAME_KEY = 'username';

export function getUsername() {
  try {
    return localStorage.getItem(USERNAME_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function setUsername(name) {
  try {
    if (name) {
      localStorage.setItem(USERNAME_KEY, name);
    } else {
      localStorage.removeItem(USERNAME_KEY);
    }
  } catch (e) {
    // ignore
  }
}
