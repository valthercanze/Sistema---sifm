import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, createContext, useContext } from 'react';
import Auth from './pages/Auth';
import Citizen from './pages/Citizen';
import Admin from './pages/Admin';
import Manager from './pages/Manager';
import { getToken, setToken, clearToken } from './api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"> <b>SIFM</b> · Inclusão Financeira Municipal</div>
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

function Protected({ children }) {
  const { user } = useAuth();
  // Se não estiver logado, manda para a página inicial de login
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (u, t) => { 
    setToken(t); 
    localStorage.setItem('user', JSON.stringify(u)); 
    setUser(u); 
  };
  
  const logout = () => { 
    clearToken(); 
    localStorage.removeItem('user');
    setUser(null); 
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* O utilizador pode aceder a qualquer um destes links na mesma porta 5173 */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth isAdmin={false} isManager={false} />} />
            <Route path="/admin/login" element={user ? <Navigate to="/" replace /> : <Auth isAdmin={true} isManager={false} />} />
            <Route path="/gestor/login" element={user ? <Navigate to="/" replace /> : <Auth isAdmin={false} isManager={true} />} />
            
            {/* Rota Principal (Dashboard) */}
            <Route path="/" element={
              <Protected>
                {user?.role === 'admin' ? <Admin /> : user?.role === 'manager' ? <Manager /> : <Citizen />}
              </Protected>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthCtx.Provider>
  );
}