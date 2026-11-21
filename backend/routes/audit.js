import { Router } from 'express';
import db from '../db.js';
import { authRequired, adminRequired } from '../auth.js';

const router = Router();

router.get('/', authRequired, adminRequired, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT a.*, u.name AS user_name, u.role AS user_role 
      FROM audit_logs a 
      LEFT JOIN users u ON u.id = a.user_id 
      ORDER BY a.created_at DESC LIMIT 100
    `).all();
    res.json(logs);
  } catch (error) {
    console.error("Erro na auditoria:", error);
    res.status(500).json({ error: "Erro ao carregar auditoria" });
  }
});

export default router;