import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../App';

// Ícones SVG nativos (sem precisar de instalar nada)
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default function Auth({ isAdmin, isManager }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', phone:'', address:'', password:'', confirmPassword:'', userType:'citizen' });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const { login } = useAuth();
  const set = k => e => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setErr(''); setMsg('');
    
    if (mode === 'register' && form.password !== form.confirmPassword) {
      return setErr('As palavras-passe não coincidem. Tente novamente.');
    }

    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const expectedRole = isAdmin ? 'admin' : (isManager ? 'manager' : null);
      
      const body = mode === 'login' 
        ? { phone: form.phone, password: form.password, expectedRole } 
        : form;
      
      const data = await api(path, { method: 'POST', body });
      
      if (mode === 'login') {
        login(data.user, data.token);
      } else {
        setMode('login');
        setMsg('Conta criada com sucesso! Por favor, faça login.');
        setForm({ ...form, password: '', confirmPassword: '' });
      }
    } catch (e) { setErr(e.message); }
  }

  const title = isAdmin ? 'Portal do Administrador' : (isManager ? 'Portal do Gestor' : (mode === 'login' ? 'Portal do Contribuinte' : 'Criar conta'));

  return (
    <div className="card auth">
      <h2>{title}</h2>
      
      <form onSubmit={submit}>
        {mode === 'register' && !isAdmin && !isManager && <>
          <select value={form.userType} onChange={set('userType')} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
            <option value="citizen">Cidadão Comum</option>
            <option value="merchant">Comerciante</option>
          </select>
          <input placeholder="Nome completo" value={form.name} onChange={set('name')} required />
          <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
          <input placeholder="Morada" value={form.address} onChange={set('address')} />
        </>}
        
        <input placeholder="Telefone" value={form.phone} onChange={set('phone')} required />
        
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <input 
            type={showPass ? 'text' : 'password'} 
            placeholder="Palavra-passe" 
            value={form.password} 
            onChange={set('password')} 
            required 
            style={{ width: '100%', marginBottom: 0, paddingRight: '40px' }}
          />
          <button 
            type="button" 
            onClick={() => setShowPass(!showPass)}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
            title={showPass ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
          >
            {showPass ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        
        {mode === 'register' && !isAdmin && !isManager && (
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <input 
              type={showConfirmPass ? 'text' : 'password'} 
              placeholder="Confirmar Palavra-passe" 
              value={form.confirmPassword} 
              onChange={set('confirmPassword')} 
              required 
              style={{ width: '100%', marginBottom: 0, paddingRight: '40px' }}
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              title={showConfirmPass ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
            >
              {showConfirmPass ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        )}
        
        {err && <div className="error">{err}</div>}
        {msg && <div className="info">{msg}</div>}
        
        <button type="submit" className="primary">{mode === 'login' ? 'Entrar' : 'Registar'}</button>
      </form>

      {!isAdmin && !isManager && (
        <p className="switch">
          {mode === 'login'
            ? <>Sem conta? <a onClick={() => { setMode('register'); setErr(''); setMsg(''); }}>Registar</a></>
            : <>Já tem conta? <a onClick={() => { setMode('login'); setErr(''); setMsg(''); }}>Entrar</a></>}
        </p>
      )}
    </div>
  );
}