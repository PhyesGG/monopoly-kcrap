import { getConfig } from '../config';

async function request(path, options = {}) {
  const base = getConfig('apiBaseUrl') || '';
  const url = base + path;

  const fetchOptions = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };

  const response = await fetch(url, fetchOptions);
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    const message = (data && data.message) || response.statusText;
    throw new Error(message);
  }
  return data;
}

export function get(path) {
  return request(path, { method: 'GET' });
}

export function post(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export function put(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function del(path) {
  return request(path, { method: 'DELETE' });
}
