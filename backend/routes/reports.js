import { Router } from 'express';
import db from '../db.js';
import { authRequired, adminRequired } from '../auth.js';

const router = Router();

router.get('/summary', authRequired, adminRequired, (req, res) => {
  const from = req.query.from || '1970-01-01';
  const to   = req.query.to   || '9999-12-31';

  const totals = db.prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS total
    FROM payments WHERE status='paid' AND date(paid_at) BETWEEN date(?) AND date(?)`).get(from, to);

  const byMethod = db.prepare(`SELECT method, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total
    FROM payments WHERE status='paid' AND date(paid_at) BETWEEN date(?) AND date(?)
    GROUP BY method`).all(from, to);

  const byFee = db.prepare(`SELECT f.name, COUNT(*) AS count, COALESCE(SUM(p.amount),0) AS total
    FROM payments p JOIN fees f ON f.id=p.fee_id
    WHERE p.status='paid' AND date(p.paid_at) BETWEEN date(?) AND date(?)
    GROUP BY f.name ORDER BY total DESC`).all(from, to);

  const byDay = db.prepare(`SELECT date(paid_at) AS day, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total
    FROM payments WHERE status='paid' AND date(paid_at) BETWEEN date(?) AND date(?)
    GROUP BY date(paid_at) ORDER BY day`).all(from, to);

  res.json({ totals, byMethod, byFee, byDay });
});

export default router;