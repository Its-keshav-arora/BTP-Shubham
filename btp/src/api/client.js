/** In dev, set VITE_API_BASE=http://localhost:5000/api in .env.development so requests hit the Express server on port 5000. */
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('btp_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  get: (path) => request(path, { method: 'GET' }),
};

export function uploadSubmission(formData) {
  const token = localStorage.getItem('btp_token');
  return fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  });
}

export function uploadReturnedResult(submissionId, formData) {
  const token = localStorage.getItem('btp_token');
  return fetch(`${API_BASE}/submissions/admin/${submissionId}/return`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  });
}
