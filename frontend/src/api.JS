const BASE = '/api';

// Usamos apenas uma chave no localStorage para toda a aplicação
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 
      'Content-Type': 'application/json', 
      ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}) 
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ' + res.status);
  return data;
}