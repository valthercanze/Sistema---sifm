import { Router } from 'express';
import db from '../db.js';
import { authRequired, adminRequired } from '../auth.js';

const router = Router();
const audit = (uid, action, details, ip) =>
  db.prepare('INSERT INTO audit_logs (user_id,action,details,ip) VALUES (?,?,?,?)').run(uid, action, details, ip);

// Listar apenas as taxas ativas (para o cidadão)
router.get('/', authRequired, (req, res) => {
  res.json(db.prepare('SELECT * FROM fees WHERE active = 1 ORDER BY name').all());
});

// Listar todas as taxas (para o administrador)
router.get('/all', authRequired, adminRequired, (req, res) => {
  res.json(db.prepare('SELECT * FROM fees ORDER BY created_at DESC').all());
});

// Criar nova taxa
router.post('/', authRequired, adminRequired, (req, res) => {
  const { name, description, amount, periodicity, category } = req.body;
  if (!name || !amount || !periodicity) return res.status(400).json({ error: 'Campos obrigatórios em falta' });
  
  const info = db.prepare('INSERT INTO fees (name,description,amount,periodicity,category) VALUES (?,?,?,?,?)')
    .run(name, description || null, Number(amount), periodicity, category || null);
    
  audit(req.user.id, 'FEE_CREATE', 'Taxa ' + name, req.ip);
  res.status(201).json(db.prepare('SELECT * FROM fees WHERE id = ?').get(info.lastInsertRowid));
});

// Atualizar taxa (usado também para Ativar/Desativar)
router.put('/:id', authRequired, adminRequired, (req, res) => {
  const { id } = req.params;
  const cur = db.prepare('SELECT * FROM fees WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'Taxa não encontrada' });
  
  const { name, description, amount, periodicity, category, active } = req.body;
  
  db.prepare('UPDATE fees SET name=?, description=?, amount=?, periodicity=?, category=?, active=? WHERE id=?')
    .run(name ?? cur.name, description ?? cur.description, amount ?? cur.amount,
         periodicity ?? cur.periodicity, category ?? cur.category,
         active === undefined ? cur.active : (active ? 1 : 0), id);
         
  audit(req.user.id, 'FEE_UPDATE', 'Taxa ID ' + id, req.ip);
  res.json(db.prepare('SELECT * FROM fees WHERE id = ?').get(id));
});

// Desativar taxa (Soft Delete - Não apaga do banco de dados para proteger o histórico)
router.delete('/:id', authRequired, adminRequired, (req, res) => {
  const fee = db.prepare('SELECT * FROM fees WHERE id = ?').get(req.params.id);
  if (!fee) return res.status(404).json({ error: 'Taxa não encontrada.' });

  db.prepare('UPDATE fees SET active = 0 WHERE id = ?').run(req.params.id);
  audit(req.user.id, 'FEE_DEACTIVATE', 'Desativou a taxa ID ' + req.params.id, req.ip);
  
  res.json({ ok: true, message: 'Taxa desativada com sucesso.' });
});

export default router;