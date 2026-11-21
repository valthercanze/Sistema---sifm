import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Manager() {
  const [payments, setPayments] = useState([]);
  const [msg, setMsg] = useState('');

  const load = () => api('/payments').then(setPayments);
  useEffect(() => { load(); }, []);

  async function confirm(p) {
    try {
      const res = await api('/payments/' + p.reference + '/confirm', { method: 'POST' });
      setMsg(`Pagamento de ${p.user_name} confirmado. Recibo: ${res.receipt}`);
      load();
    } catch (e) { setMsg(e.message); }
  }

  return (
    <section className="card">
      <h2>Balcão de Atendimento</h2>
      <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '15px'}}>
        Apenas pagamentos em POS ou Numerário necessitam de confirmação aqui.
      </p>
      {msg && <div className="info">{msg}</div>}
      <div className="table-container">
        <table>
          <thead><tr><th>Data</th><th>Contribuinte</th><th>Taxa</th><th>Valor</th><th>Método</th><th>Estado</th><th>Ação</th></tr></thead>
          <tbody>{payments.map(p => (
            <tr key={p.id}>
              <td>{new Date(p.created_at).toLocaleString('pt-MZ')}</td>
              <td>{p.user_name}</td><td>{p.fee_name}</td>
              <td>{p.amount.toFixed(2)} MZN</td>
              {/* Traduzindo diretamente no código */}
              <td><b>{p.method === 'mpesa' ? 'M-Pesa' : p.method === 'emola' ? 'e-Mola' : p.method === 'pos' ? 'POS' : 'Numerário'}</b></td>
              <td><span className={`badge ${p.status}`}>{p.status === 'paid' ? 'Pago' : p.status === 'pending' ? 'Pendente' : 'Falhado'}</span></td>
              <td>{p.status === 'pending' && <button className="primary" onClick={() => confirm(p)}>Confirmar no Balcão</button>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}