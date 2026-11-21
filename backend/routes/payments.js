import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { authRequired } from '../auth.js';

const router = Router();
const audit = (uid, action, details, ip) =>
    db.prepare('INSERT INTO audit_logs (user_id,action,details,ip) VALUES (?,?,?,?)').run(uid, action, details, ip);
const genRef = () => 'REF-' + crypto.randomBytes(4).toString('hex').toUpperCase();
const genReceipt = () => 'REC-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();

router.post('/initiate', authRequired, (req, res) => {
    const { fee_id, method } = req.body;
    const fee = db.prepare('SELECT * FROM fees WHERE id = ? AND active = 1').get(fee_id);
    if (!fee) return res.status(404).json({ error: 'Taxa não encontrada ou desativada.' });

    const userPhone = req.user.phone;

    // Validação de rede em Português
    if (method === 'mpesa' && !userPhone.startsWith('84') && !userPhone.startsWith('85')) {
        return res.status(400).json({ error: 'O seu número não pertence à rede Vodacom. Para M-Pesa, use um número 84 ou 85.' });
    }
    if (method === 'emola' && !userPhone.startsWith('86') && !userPhone.startsWith('87')) {
        return res.status(400).json({ error: 'O seu número não pertence à rede Movitel. Para e-Mola, use um número 86 ou 87.' });
    }

    const reference = genRef();
    const info = db.prepare('INSERT INTO payments (user_id,fee_id,reference,amount,method) VALUES (?,?,?,?,?)')
        .run(req.user.id, fee.id, reference, fee.amount, method);

    audit(req.user.id, 'INICIAR_PAGAMENTO', `Ref: ${reference} - Taxa: ${fee.name} via ${method}`, req.ip);
    res.status(201).json({ payment: db.prepare('SELECT * FROM payments WHERE id = ?').get(info.lastInsertRowid), fee });
});

router.post('/:reference/confirm', authRequired, (req, res) => {
    const p = db.prepare('SELECT * FROM payments WHERE reference = ?').get(req.params.reference);
    if (!p) return res.status(404).json({ error: 'Referência de pagamento não encontrada.' });
    if (p.status === 'paid') return res.json({ payment: p, message: 'Este pagamento já foi confirmado.' });

    if ((p.method === 'pos' || p.method === 'cash') && req.user.role !== 'manager' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Pagamentos em numerário/POS só podem ser confirmados no balcão municipal.' });
    }

    const receipt = genReceipt();
    db.prepare("UPDATE payments SET status='paid', receipt_number=?, paid_at=datetime('now') WHERE id=?").run(receipt, p.id);

    audit(req.user.id, 'CONFIRMAR_PAGAMENTO', `Pagamento ${p.reference} confirmado. Recibo: ${receipt}`, req.ip);
    res.json({ payment: db.prepare('SELECT * FROM payments WHERE id = ?').get(p.id), receipt });
});

router.get('/', authRequired, (req, res) => {
    if (req.user.role === 'admin' || req.user.role === 'manager') {
        return res.json(db.prepare(`SELECT p.*, u.name AS user_name, f.name AS fee_name
      FROM payments p JOIN users u ON u.id=p.user_id JOIN fees f ON f.id=p.fee_id
      ORDER BY p.created_at DESC`).all());
    }
    res.json(db.prepare(`SELECT p.*, f.name AS fee_name
    FROM payments p JOIN fees f ON f.id=p.fee_id
    WHERE p.user_id=? ORDER BY p.created_at DESC`).all(req.user.id));
});

// Rota que a operadora móvel chamaria para confirmar o pagamento
router.post('/callback', (req, res) => {
  const { reference, status } = req.body;
  // Em produção, aqui validaríamos a assinatura HMAC
  if (status === 'success') {
    db.prepare("UPDATE payments SET status='paid', paid_at=datetime('now') WHERE reference=?").run(reference);
  }
  res.json({ received: true });
});
export default router;