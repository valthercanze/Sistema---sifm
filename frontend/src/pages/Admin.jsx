import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Admin() {
  const [tab, setTab] = useState('taxas');
  return (
    <div className="dashboard">
      <nav className="tabs">
        <button className={tab==='taxas'?'active':''} onClick={()=>setTab('taxas')}>Taxas</button>
        <button className={tab==='pagamentos'?'active':''} onClick={()=>setTab('pagamentos')}>Pagamentos</button>
        <button className={tab==='relatorios'?'active':''} onClick={()=>setTab('relatorios')}>Relatórios</button>
        <button className={tab==='gestores'?'active':''} onClick={()=>setTab('gestores')}>Gestores</button>
        <button className={tab==='contribuintes'?'active':''} onClick={()=>setTab('contribuintes')}>Contribuintes</button>
        <button className={tab==='auditoria'?'active':''} onClick={()=>setTab('auditoria')}>Auditoria</button>
        <button className={tab==='config'?'active':''} onClick={()=>setTab('config')}>Configurações</button>
      </nav>
      {tab === 'taxas' && <Taxas />}
      {tab === 'pagamentos' && <Pagamentos />}
      {tab === 'relatorios' && <Relatorios />}
      {tab === 'gestores' && <Gestores />}
      {tab === 'contribuintes' && <Contribuintes />}
      {tab === 'auditoria' && <Auditoria />}
      {tab === 'config' && <Configuracoes />}
    </div>
  );
}

function Taxas() {
  const [fees, setFees] = useState([]);
  const [form, setForm] = useState({ name:'', description:'', amount:'', periodicity:'mensal', category:'' });
  const [err, setErr] = useState('');
  const set = k => e => setForm({ ...form, [k]: e.target.value });
  const load = () => api('/fees/all').then(setFees);
  
  useEffect(() => { load(); }, []);
  
  async function create(e) {
    e.preventDefault(); setErr('');
    try {
      await api('/fees', { method:'POST', body: { ...form, amount: Number(form.amount) } });
      setForm({ name:'', description:'', amount:'', periodicity:'mensal', category:'' }); load();
    } catch (e) { setErr(e.message); }
  }
  
  // Nova função para Ativar / Desativar
  async function toggleStatus(fee) {
    const acao = fee.active ? 'desativar' : 'ativar';
    if (!window.confirm(`Tem a certeza que deseja ${acao} esta taxa?`)) return;
    
    try {
      await api('/fees/' + fee.id, { 
        method: 'PUT', 
        body: { active: !fee.active } // Inverte o estado atual (se é 1, passa a 0. Se é 0, passa a 1)
      }); 
      load();
    } catch (e) {
      alert("Erro ao alterar estado: " + e.message);
    }
  }

  return (
    <section className="card">
      <h2>Gestão de Taxas</h2>
      <form className="inline" onSubmit={create}>
        <input placeholder="Nome da Taxa" value={form.name} onChange={set('name')} required />
        <input placeholder="Descrição" value={form.description} onChange={set('description')} />
        <input type="number" step="0.01" placeholder="Valor (MZN)" value={form.amount} onChange={set('amount')} required />
        <select value={form.periodicity} onChange={set('periodicity')}>
          <option value="unica">Única</option><option value="mensal">Mensal</option>
          <option value="trimestral">Trimestral</option><option value="anual">Anual</option>
        </select>
        <input placeholder="Categoria" value={form.category} onChange={set('category')} />
        <button className="primary" type="submit">Criar Taxa</button>
      </form>
      {err && <div className="error">{err}</div>}
      
      <table>
        <thead><tr><th>Nome</th><th>Valor</th><th>Periodicidade</th><th>Categoria</th><th>Estado</th><th>Ações</th></tr></thead>
        <tbody>{fees.map(f => (
          <tr key={f.id}>
            <td>{f.name}</td>
            <td>{f.amount.toFixed(2)} MZN</td>
            <td>{f.periodicity}</td>
            <td>{f.category || '—'}</td>
            <td>
              <span className={`badge ${f.active ? 'paid' : 'failed'}`}>
                {f.active ? 'Ativa' : 'Inativa'}
              </span>
            </td>
            <td>
              <button onClick={() => toggleStatus(f)}>
                {f.active ? 'Desativar' : 'Reativar'}
              </button>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </section>
  );
}

function Pagamentos() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api('/payments').then(setRows); }, []);
  return (
    <section className="card">
      <h2>Todos os Pagamentos</h2>
      <div className="table-container">
        <table>
          <thead><tr><th>Data</th><th>Contribuinte</th><th>Taxa</th><th>Valor</th><th>Método</th><th>Estado</th><th>Recibo</th></tr></thead>
          <tbody>{rows.map(p => (
            <tr key={p.id}>
              <td>{new Date(p.created_at).toLocaleString('pt-MZ')}</td>
              <td>{p.user_name}</td><td>{p.fee_name}</td>
              <td>{p.amount.toFixed(2)} MZN</td>
              <td>{p.method === 'mpesa' ? 'M-Pesa' : p.method === 'emola' ? 'e-Mola' : p.method === 'pos' ? 'POS' : 'Numerário'}</td>
              <td><span className={`badge ${p.status}`}>{p.status === 'paid' ? 'Pago' : p.status === 'pending' ? 'Pendente' : 'Falhado'}</span></td>
              <td>{p.receipt_number || '—'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

function Relatorios() {
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  
  async function run(e) {
    if (e) e.preventDefault();
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    setData(await api('/reports/summary?' + qs));
  }
  useEffect(() => { run(); }, []);
  
  function exportCSV() {
    if (!data) return;
    const lines = ['Dia,Quantidade,Total (MZN)'];
    data.byDay.forEach(d => lines.push(`${d.day},${d.count},${d.total}`));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio_sifm_${Date.now()}.csv`;
    a.click();
  }

  function exportPDF() { window.print(); }

  return (
    <section className="card">
      <h2>Relatórios de Arrecadação</h2>
      <form className="inline" onSubmit={run}>
        <label>De: <input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label>
        <label>Até: <input type="date" value={to} onChange={e=>setTo(e.target.value)} /></label>
        <button type="submit">Filtrar</button>
        <button type="button" onClick={exportCSV} style={{ backgroundColor: '#217346', color: '#fff', border: 'none' }}>Exportar Excel</button>
        <button type="button" onClick={exportPDF} style={{ backgroundColor: '#d32f2f', color: '#fff', border: 'none' }}>Exportar PDF</button>
      </form>
      {data && <>
        <div className="kpis">
          <div className="kpi"><small>Total Arrecadado</small><b>{data.totals.total.toFixed(2)} MZN</b></div>
          <div className="kpi"><small>Nº de Pagamentos</small><b>{data.totals.count}</b></div>
        </div>
        <h3>Por Método</h3>
        <div className="table-container">
          <table><thead><tr><th>Método</th><th>Quantidade</th><th>Total (MZN)</th></tr></thead>
            <tbody>{data.byMethod.map(m=>(<tr key={m.method}>
              <td>{m.method === 'mpesa' ? 'M-Pesa' : m.method === 'emola' ? 'e-Mola' : m.method === 'pos' ? 'POS' : 'Numerário'}</td>
              <td>{m.count}</td><td>{m.total.toFixed(2)}</td></tr>))}</tbody>
          </table>
        </div>
        <h3>Por Taxa</h3>
        <div className="table-container">
          <table><thead><tr><th>Taxa</th><th>Quantidade</th><th>Total (MZN)</th></tr></thead>
            <tbody>{data.byFee.map(f=>(<tr key={f.name}><td>{f.name}</td><td>{f.count}</td><td>{f.total.toFixed(2)}</td></tr>))}</tbody>
          </table>
        </div>
        <h3>Por Dia</h3>
        <div className="table-container">
          <table><thead><tr><th>Dia</th><th>Quantidade</th><th>Total (MZN)</th></tr></thead>
            <tbody>{data.byDay.map(d=>(<tr key={d.day}><td>{d.day}</td><td>{d.count}</td><td>{d.total.toFixed(2)}</td></tr>))}</tbody>
          </table>
        </div>
      </>}
    </section>
  );
}

function Gestores() {
  const [form, setForm] = useState({ name:'', phone:'', password:'' });
  const [managers, setManagers] = useState([]);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const loadManagers = () => api('/users/managers').then(setManagers);
  useEffect(() => { loadManagers(); }, []);

  async function create(e) {
    e.preventDefault(); setErr(''); setMsg('');
    try {
      await api('/users/manager', { method:'POST', body: form });
      setForm({ name:'', phone:'', password:'' });
      setMsg('Gestor criado com sucesso!');
      loadManagers();
    } catch (e) { setErr(e.message); }
  }

  async function remove(id) {
    if (!window.confirm('Remover este gestor? O acesso dele será bloqueado.')) return;
    setMsg(''); setErr('');
    try {
      const res = await api('/users/' + id, { method: 'DELETE' });
      setMsg(res.message);
      loadManagers();
    } catch (e) { setErr(e.message); }
  }

  return (
    <section className="card">
      <h2>Criar Gestor de Balcão</h2>
      <form className="inline" onSubmit={create}>
        <input placeholder="Nome do Gestor" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        <input placeholder="Telefone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required />
        <input type="password" placeholder="Palavra-passe" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
        <button className="primary" type="submit">Criar Gestor</button>
      </form>
      {err && <div className="error">{err}</div>}
      {msg && <div className="info">{msg}</div>}

      <h3 style={{marginTop: '30px'}}>Gestores Registados</h3>
      <div className="table-container">
        <table>
          <thead><tr><th>Data Registo</th><th>Nome</th><th>Telefone</th><th>Ações</th></tr></thead>
          <tbody>{managers.map(m => (
            <tr key={m.id}>
              <td>{new Date(m.created_at).toLocaleDateString('pt-MZ')}</td>
              <td>{m.name}</td>
              <td>{m.phone}</td>
              <td><button onClick={() => remove(m.id)} style={{color: 'red', borderColor: 'red'}}>Remover</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

function Contribuintes() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () => api('/users').then(setUsers);
  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!window.confirm('Remover este contribuinte?')) return;
    setMsg(''); setErr('');
    try {
      const res = await api('/users/' + id, { method: 'DELETE' });
      setMsg(res.message);
      load();
    } catch (e) { setErr(e.message); }
  }

  return (
    <section className="card">
      <h2>Gestão de Contribuintes</h2>
      {msg && <div className="info">{msg}</div>}
      {err && <div className="error">{err}</div>}
      <div className="table-container">
        <table>
          <thead><tr><th>Data Registo</th><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Tipo</th><th>Ações</th></tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id}>
              <td>{new Date(u.created_at).toLocaleDateString('pt-MZ')}</td>
              <td>{u.name}</td>
              <td>{u.phone}</td>
              <td>{u.email || '—'}</td>
              <td><span className={`badge ${u.role === 'merchant' ? 'pending' : 'paid'}`}>{u.role === 'merchant' ? 'Comerciante' : 'Cidadão'}</span></td>
              <td><button onClick={() => remove(u.id)} style={{color: 'red', borderColor: 'red'}}>Remover</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    api('/audit')
      .then(data => { setLogs(data); setLoading(false); })
      .catch(e => { setErro(e.message); setLoading(false); }); 
  }, []);

  if (loading) return <div className="info">A carregar auditoria...</div>;
  if (erro) return <div className="error">Erro no servidor: {erro}</div>;

  return (
    <section className="card">
      <h2>Registo de Auditoria</h2>
      {logs.length === 0 ? (
        <p>Nenhum registo encontrado na base de dados.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Data/Hora</th><th>Utilizador</th><th>Ação</th><th>Detalhes</th><th>IP</th></tr></thead>
            <tbody>{logs.map(l => (
              <tr key={l.id}>
                <td>{new Date(l.created_at).toLocaleString('pt-MZ')}</td>
                <td>{l.user_name || 'Sistema'} <small>({l.user_role === 'admin' ? 'Administrador' : l.user_role === 'manager' ? 'Gestor' : l.user_role === 'merchant' ? 'Comerciante' : 'Cidadão'})</small></td>
                <td><b>{l.action === 'REGISTO' ? 'Registo' : l.action === 'LOGIN' ? 'Início de Sessão' : l.action === 'CRIAR_GESTOR' ? 'Criar Gestor' : l.action === 'REMOVER_UTILIZADOR' ? 'Remover Utilizador' : l.action}</b></td>
                <td>{l.details}</td>
                <td>{l.ip}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Configuracoes() {
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function limparTudo() {
    if (!window.confirm('ATENÇÃO: Isto vai apagar TODOS os contribuintes, pagamentos e auditoria. O sistema ficará limpo. Tem a certeza?')) return;
    setMsg(''); setErr(''); setLoading(true);
    try {
      const res = await api('/users/reset-data', { method: 'DELETE' });
      setMsg(res.message);
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) { setErr(e.message); setLoading(false); }
  }

  return (
    <section className="card">
      <h2>Configurações do Sistema</h2>
      {msg && <div className="info">{msg}</div>}
      {err && <div className="error">{err}</div>}
      <div style={{ border: '1px solid #fee2e2', padding: '20px', borderRadius: '8px', backgroundColor: '#fef2f2' }}>
        <h3 style={{ color: '#991b1b', marginTop: 0 }}>Zona de Perigo</h3>
        <p style={{ color: '#7f1d1d', fontSize: '0.9rem' }}>
          Apaga todos os cidadãos, comerciantes, pagamentos e registos de auditoria. 
          O utilizador Administrador e os Gestores de Balcão serão mantidos.
        </p>
        <button onClick={limparTudo} disabled={loading} style={{ backgroundColor: '#d32f2f', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold' }}>
          {loading ? 'A limpar...' : 'Apagar Todos os Dados de Teste'}
        </button>
      </div>
    </section>
  );
}