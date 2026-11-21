import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { authRequired, adminRequired } from '../auth.js';

const router = Router();

// 1. Limpar todos os dados de teste (TEM DE ESTAR ANTES DA ROTA /:id)
router.delete('/reset-data', authRequired, adminRequired, (req, res) => {
  try {
    db.prepare('DELETE FROM payments').run();
    db.prepare('DELETE FROM audit_logs').run();
    db.prepare("DELETE FROM users WHERE role IN ('citizen', 'merchant')").run();
    res.json({ ok: true, message: 'Todos os dados de teste apagados com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao limpar os dados.' });
  }
});

// 2. Listar Gestores
router.get('/managers', authRequired, adminRequired, (req, res) => {
  const managers = db.prepare(`
    SELECT id, name, phone, created_at 
    FROM users 
    WHERE role = 'manager' AND phone NOT LIKE 'del_%' 
    ORDER BY created_at DESC
  `).all();
  res.json(managers);
});

// 3. Listar Contribuintes
router.get('/', authRequired, adminRequired, (req, res) => {
  const users = db.prepare(`
    SELECT id, name, email, phone, role, created_at 
    FROM users 
    WHERE role IN ('citizen', 'merchant') 
    AND phone NOT LIKE 'del_%' 
    ORDER BY created_at DESC
  `).all();
  res.json(users);
});

// 4. Criar Gestor
router.post('/manager', authRequired, adminRequired, (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) return res.status(400).json({ error: 'Preencha todos os campos.' });
  
  const exists = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (exists) return res.status(409).json({ error: 'Telefone já registado.' });

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (name, phone, password_hash, role) VALUES (?,?,?,?)').run(name, phone, hash, 'manager');
  
  db.prepare('INSERT INTO audit_logs (user_id,action,details,ip) VALUES (?,?,?,?)')
    .run(req.user.id, 'CRIAR_GESTOR', `Criou o gestor: ${name}`, req.ip);
    
  res.status(201).json({ ok: true, message: 'Gestor criado com sucesso.' });
});

// 5. Remover Utilizador (Agora fica no fim)
router.delete('/:id', authRequired, adminRequired, (req, res) => {
  try {
    const id = req.params.id;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Não é possível remover o Administrador principal.' });

    const deletedPhone = `del_${id}_${Date.now()}`;
    const deletedEmail = `del_${id}_${Date.now()}@sifm.mz`;

    db.prepare('UPDATE users SET phone = ?, email = ?, name = ? WHERE id = ?').run(deletedPhone, deletedEmail, `${user.name} (Removido)`, id);

    db.prepare('INSERT INTO audit_logs (user_id,action,details,ip) VALUES (?,?,?,?)')
      .run(req.user.id, 'REMOVER_UTILIZADOR', `Removeu o utilizador: ${user.name}`, req.ip);

    res.json({ ok: true, message: 'Removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover utilizador.' });
  }
});

export default router;