import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { sign, sendSMS, sendEmail } from '../auth.js';

const router = Router();
const audit = (uid, action, details, ip) =>
  db.prepare('INSERT INTO audit_logs (user_id,action,details,ip) VALUES (?,?,?,?)').run(uid, action, details, ip);

router.post('/register', async (req, res) => {
  const { name, email, phone, address, password, userType } = req.body;
  
  if (!name || !phone || !email || !password) 
    return res.status(400).json({ error: 'Nome, telefone, e-mail e palavra-passe são obrigatórios.' });
  // Substitui a validação atual por esta:
if (!password || password.length < 4 || password.length > 8) {
  return res.status(400).json({ error: 'O PIN deve ter entre 4 e 8 dígitos.' });
}
  
  const exists = db.prepare('SELECT id FROM users WHERE phone = ? OR (email IS NOT NULL AND email = ?)').get(phone, email || null);
  if (exists) return res.status(409).json({ error: 'Este telefone ou email já está registado.' });

  const role = userType === 'merchant' ? 'merchant' : 'citizen';
  const hash = bcrypt.hashSync(password, 10);
  
  const info = db.prepare('INSERT INTO users (name,email,phone,address,password_hash, role) VALUES (?,?,?,?,?,?)')
    .run(name, email || null, phone, address || null, hash, role);
    
  const user = db.prepare('SELECT id,name,email,phone,address,role FROM users WHERE id = ?').get(info.lastInsertRowid);
  
  sendSMS(phone, `Bem-vindo(a) ao SIFM, ${name.split(' ')[0]}! O seu registo foi concluído.`);
  await sendEmail(email, 'Bem-vindo ao SIFM', `Olá ${name}, a sua conta foi criada com sucesso.`);

  const rolePt = role === 'merchant' ? 'Comerciante' : 'Cidadão';
  audit(user.id, 'REGISTO', `Novo ${rolePt} registado: ${phone}`, req.ip);
  
  res.status(201).json({ user, token: sign(user) });
});

// LOGIN COM TRATAMENTO DE ERRO (Try/Catch)
router.post('/login', (req, res) => {
  try {
    const { phone, password, expectedRole } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Telefone ou palavra-passe inválidos.' });

    if (expectedRole) {
      if (expectedRole === 'admin' && user.role !== 'admin') return res.status(403).json({ error: 'Esta conta não tem acesso de Administrador.' });
      if (expectedRole === 'manager' && user.role !== 'manager') return res.status(403).json({ error: 'Esta conta não tem acesso de Gestor de Balcão.' });
      if (expectedRole === 'citizen' && (user.role === 'admin' || user.role === 'manager')) return res.status(403).json({ error: 'Funcionários devem entrar pelo portal específico.' });
    }

    audit(user.id, 'LOGIN', `Início de sessão: ${phone}`, req.ip);
    const { password_hash, ...pub } = user;
    res.json({ user: pub, token: sign(user) });

  } catch (error) {
    console.error("🚨 ERRO NO LOGIN:", error);
    res.status(500).json({ error: `Erro no servidor: ${error.message}` });
  }
});

export default router;