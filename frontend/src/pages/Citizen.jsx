import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Citizen() {
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [method, setMethod] = useState('mpesa');
  const [receipt, setReceipt] = useState(null);
  const [msg, setMsg] = useState('');

  async function load() {
    const [f, p] = await Promise.all([api('/fees'), api('/payments')]);
    setFees(f); setPayments(p);
  }
  useEffect(() => { load(); }, []);

  async function initiate() {
    setMsg('');
    try {
      const { payment } = await api('/payments/initiate', { method: 'POST', body: { fee_id: selected.id, method } });
      setSelected(null); setReceipt(payment); load();
    } catch (e) { setMsg(e.message); }
  }

  async function confirmPayment(p) {
    if (p.method === 'pos' || p.method === 'cash') {
      return setMsg('Dirija-se ao balcão do município com a referência para efetuar o pagamento.');
    }
    try {
      const result = await api('/payments/' + p.reference + '/confirm', { method: 'POST' });
      setReceipt({ ...p, status: 'paid', receipt_number: result.receipt });
      setMsg('Pagamento confirmado - recibo ' + result.receipt); load();
    } catch (e) { setMsg(e.message); }
  }

  // Função para imprimir
  const imprimirRelatorio = () => {
    window.print();
  };

  return (
    <div className="dashboard">
      {/* Adicionada a classe no-print para esconder esta secção na impressão */}
      <section className="card no-print">
        <h2>Taxas disponíveis</h2>
        {msg && <div className="info">{msg}</div>}
        <div className="grid">
          {fees.map(f => (
            <div key={f.id} className="fee">
              <h3>{f.name}</h3><p>{f.description}</p>
              <p className="price">{f.amount.toFixed(2)} {f.currency} <small>({f.periodicity})</small></p>
              <button onClick={() => setSelected(f)} className="primary">Pagar</button>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>Histórico de Pagamentos</h2>
          {/* Botão de Imprimir */}
          <button onClick={imprimirRelatorio} className="primary no-print" style={{ backgroundColor: '#374151' }}>
            🖨️ Imprimir Relatório
          </button>
        </div>
        
        <div className="table-container">
          <table>
            <thead><tr><th>Data</th><th>Taxa</th><th>Valor</th><th>Método</th><th>Estado</th><th>Recibo</th><th className="no-print"></th></tr></thead>
            <tbody>{payments.map(p => (
              <tr key={p.id}>
                <td>{new Date(p.created_at).toLocaleString('pt-MZ')}</td>
                <td>{p.fee_name}</td><td>{p.amount.toFixed(2)} MZN</td>
                <td>{p.method === 'mpesa' ? 'M-Pesa' : p.method === 'emola' ? 'e-Mola' : p.method === 'pos' ? 'POS' : 'Numerário'}</td>
                <td><span className={'badge ' + p.status}>{p.status === 'paid' ? 'Pago' : p.status === 'pending' ? 'Pendente' : 'Falhado'}</span></td>
                <td>{p.receipt_number || '-'}</td>
                <td className="no-print">{p.status === 'pending' && <button onClick={() => confirmPayment(p)}>Confirmar</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="modal no-print"><div className="card">
          <h3>Pagar: {selected.name}</h3>
          <p>Valor: <b>{selected.amount.toFixed(2)} MZN</b></p>
          <label>Método:
            <select value={method} onChange={e => setMethod(e.target.value)}>
              <option value="mpesa">M-Pesa</option><option value="emola">e-Mola</option>
              <option value="pos">POS</option><option value="cash">Numerário</option>
            </select>
          </label>
          <div className="actions">
            <button onClick={() => setSelected(null)}>Cancelar</button>
            <button className="primary" onClick={initiate}>Gerar referência</button>
          </div>
        </div></div>
      )}
      {receipt && (
        <div className="modal no-print"><div className="card">
          {receipt.status === 'pending' ? <>
            <h3>Pagamento pendente</h3>
            <p>Referência: <b>{receipt.reference}</b></p>
            <p>Valor: <b>{receipt.amount.toFixed(2)} MZN</b></p>
            <div className="actions">
              <button onClick={() => setReceipt(null)}>Fechar</button>
              <button className="primary" onClick={() => confirmPayment(receipt)}>Confirmar pagamento</button>
            </div>
          </> : <>
            <h3>Pagamento confirmado</h3>
            <p>Recibo: <b>{receipt.receipt_number}</b></p>
            <p>Valor: <b>{receipt.amount.toFixed(2)} MZN</b></p>
            <button onClick={() => setReceipt(null)}>Fechar</button>
          </>}
        </div></div>
      )}
    </div>
  );
}