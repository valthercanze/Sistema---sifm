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
      </nav>
      {tab === 'taxas' && <Taxas />}
      {tab === 'pagamentos' && <Pagamentos />}
      {tab === 'relatorios' && <Relatorios />}
      {tab === 'gestores' && <Gestores />}
      {tab === 'contribuintes' && <Contribuintes />}
      {tab === 'auditoria' && <Auditoria />}
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
  
  async function toggleStatus(fee) {
    const acao = fee.active ? 'desativar' : 'ativar';
    if (!window.confirm(`Tem a certeza que deseja ${acao} esta taxa?`)) return;
    try {
      await api('/fees/' + fee.id, { method: 'PUT', body: { active: !fee.active } }); 
      load();
    } catch (e) { alert("Erro: " + e.message); }
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
      <table>
        <thead><tr><th>Data</th><th>Contribuinte</th><th>Taxa</th><th>Valor</th><th>Método</th><th>Estado</th><th>Recibo</th></tr></thead>
        <tbody>{rows.map(p => (
          <tr key={p.id}>
            <td>{new Date(p.created_at).toLocaleString('pt-MZ')}</td>
            <td>{p.user_name}</td><td>{p.fee_name}</td>
            <td>{p.amount.toFixed(2)} MZN</td><td>{p.method.toUpperCase()}</td>
            <td><span className={`badge ${p.status}`}>{p.status === 'paid' ? 'Pago' : (p.status === 'pending' ? 'Pendente' : p.status)}</span></td>
            <td>{p.receipt_number || '—'}</td>
          </tr>
        ))}</tbody>
      </table>
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

  function exportPDF() {
    window.print();
  }

  return (
    <section className="card">
      <h2>Relatórios de Arrecadação</h2>
      <form className="inline" onSubmit={run}>
        <label>De: <input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label>
        <label>Até: <input type="date" value={to} onChange={e=>setTo(e.target.value)} /></label>
        <button type="submit">Filtrar</button>
        <button type="button" onClick={exportCSV} style={{ backgroundColor: '#217346', color: '#fff', border: 'none' }}>Exportar Excel (CSV)</button>
        <button type="button" onClick={exportPDF} style={{ backgroundColor: '#d32f2f', color: '#fff', border: 'none' }}>Exportar PDF</button>
      </form>
      {data && <>
        <div className="kpis">
          <div className="kpi"><small>Total Arrecadado</small><b>{data.totals.total.toFixed(2)} MZN</b></div>
          <div className="kpi"><small>Nº de Pagamentos</small><b>{data.totals.count}</b></div>
        </div>
        <h3>Por Método</h3>
        <table><thead><tr><th>Método</th><th>Quantidade</th><th>Total (MZN)</th></tr></thead>
          <tbody>{data.byMethod.map(m=>(<tr key={m.method}><td>{m.method.toUpperCase()}</td><td>{m.count}</td><td>{m.total.toFixed(2)}</td></tr>))}</tbody>
        </table>
        <h3>Por Taxa</h3>
        <table><thead><tr><th>Taxa</th><th>Quantidade</th><th>Total (MZN)</th></tr></thead>
          <tbody>{data.byFee.map(f=>(<tr key={f.name}><td>{f.name}</td><td>{f.count}</td><td>{f.total.toFixed(2)}</td></tr>))}</tbody>
        </table>
        <h3>Por Dia</h3>
        <table><thead><tr><th>Dia</th><th>Quantidade</th><th>Total (MZN)</th></tr></thead>
          <tbody>{data.byDay.map(d=>(<tr key={d.day}><td>{d.day}</td><td>{d.count}</td><td>{d.total.toFixed(2)}</td></tr>))}</tbody>
        </table>
      </>}
    </section>
  );
}

function Gestores() {
  const [form, setForm] = useState({ name:'', phone:'', password:'' });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  async function create(e) {
    e.preventDefault(); setErr(''); setMsg('');
    try {
      await api('/users/manager', { method:'POST', body: form });
      setForm({ name:'', phone:'', password:'' });
      setMsg('Gestor de balcão criado com sucesso!');
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
    </section>
  );
}

function Contribuintes() {
  return (
    <section className="card">
      <h2>Lista de Contribuintes</h2>
      <p>A carregar lista de cidadãos e comerciantes...</p>
      {/* Aqui podes adicionar a lógica para listar os utilizadores se já a tiveres */}
    </section>
  );
}

function Auditoria() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { api('/audit').then(setLogs); }, []);
  return (
    <section className="card">
      <h2>Registo de Auditoria</h2>
      <table>
        <thead><tr><th>Data/Hora</th><th>Utilizador</th><th>Ação</th><th>Detalhes</th><th>IP</th></tr></thead>
        <tbody>{logs.map(l => (
          <tr key={l.id}>
            <td>{new Date(l.created_at).toLocaleString('pt-MZ')}</td>
            <td>{l.user_name || 'Sistema'} <small>({l.user_role})</small></td>
            <td><b>{l.action}</b></td>
            <td>{l.details}</td>
            <td>{l.ip}</td>
          </tr>
        ))}</tbody>
      </table>
    </section>
  );
}