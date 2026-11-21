import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, createContext, useContext } from 'react';
import Auth from './pages/Auth';
import Citizen from './pages/Citizen';
import Admin from './pages/Admin';
import Manager from './pages/Manager';
import { getToken, setToken, clearToken } from './api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// Identificar em que porta o utilizador está
const isAdminPort = window.location.port === '5174';
const isManagerPort = window.location.port === '5175';

function Layout({ children }) {
    const { user, logout } = useAuth();
    return (
        <div className="app">
            <header className="topbar">
                <div className="brand"><b>SIFM</b> · Inclusão Financeira Municipal</div>
                {user && (
                    <div className="userbox">
                        <span>{user.name} · <b>{user.role === 'admin' ? 'Admin' : (user.role === 'manager' ? 'Gestor' : 'Cidadão')}</b></span>
                        <button onClick={logout}>Sair</button>
                    </div>
                )}
            </header>
            <main>{children}</main>
        </div>
    );
}

function Protected({ children, requireRole }) {
    const { user } = useAuth();

    // Se não estiver logado, manda para o login específico da porta
    if (!user) {
        if (isAdminPort) return <Navigate to="/admin/login" replace />;
        if (isManagerPort) return <Navigate to="/gestor/login" replace />;
        return <Navigate to="/login" replace />;
    }

    // Proteção extra: se o Admin tentar entrar na porta do Gestor ou vice-versa
    if (requireRole && user.role !== requireRole && user.role !== 'admin') return <Navigate to="/" replace />;

    return children;
}

export default function App() {
    const [user, setUser] = useState(() => {
        // O localStorage é separado por porta para não haver conflitos de sessão
        const storageKey = isAdminPort ? 'admin_user' : (isManagerPort ? 'manager_user' : 'user');
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : null;
    });

    const login = (u, t) => {
        setToken(t);
        const storageKey = isAdminPort ? 'admin_user' : (isManagerPort ? 'manager_user' : 'user');
        localStorage.setItem(storageKey, JSON.stringify(u));
        setUser(u);
    };

    const logout = () => {
        clearToken();
        const storageKey = isAdminPort ? 'admin_user' : (isManagerPort ? 'manager_user' : 'user');
        localStorage.removeItem(storageKey);
        setUser(null);
    };

    return (
        <AuthCtx.Provider value={{ user, login, logout }}>
            <BrowserRouter>
                <Layout>
                    <Routes>
                        {/* Rotas de Login específicas */}
                        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth isAdmin={false} isManager={false} />} />
                        <Route path="/admin/login" element={user ? <Navigate to="/" replace /> : <Auth isAdmin={true} isManager={false} />} />
                        <Route path="/gestor/login" element={user ? <Navigate to="/" replace /> : <Auth isAdmin={false} isManager={true} />} />

                        {/* Rota Principal (Dashboard) */}
                        <Route path="/" element={
                            <Protected>
                                {user?.role === 'admin' ? <Admin /> : user?.role === 'manager' ? <Manager /> : <Citizen />}
                            </Protected>
                        } />

                        {/* Qualquer rota inválida volta para a raiz */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </AuthCtx.Provider>
    );
}