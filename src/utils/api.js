export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiFetch(path, options = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  const opts = { ...options };
  if (!opts.headers) opts.headers = {};
  // default headers for JSON
  if (!opts.headers['Content-Type'] && !(opts.body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
  }
  // include credentials when API_BASE is set and credentials needed
  if (API_BASE) {
    opts.credentials = opts.credentials || 'include';
  }
  return fetch(url, opts);
}
