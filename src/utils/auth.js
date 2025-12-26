export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pkat_token');
}

export function setToken(t) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pkat_token', t);
}

export function removeToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pkat_token');
}

import { apiFetch } from './api';

export async function fetchProfile() {
  const token = getToken();
  if (!token) return null;
  const res = await apiFetch('/api/auth/profile/', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.user || null;
}
