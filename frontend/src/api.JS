const BASE = '/api';

// A função deteta se estamos na porta do Admin ou do Cidadão
const isAdminPort = window.location.port === '5174';
const tokenKey = isAdminPort ? 'admin_token' : 'token';

export const getToken = () => localStorage.getItem(tokenKey);
export const setToken = (token) => localStorage.setItem(tokenKey, token);
export const clearToken = () => localStorage.removeItem(tokenKey);

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