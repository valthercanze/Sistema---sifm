import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import feeRoutes from './routes/fees.js';
import paymentRoutes from './routes/payments.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import auditRoutes from './routes/audit.js'; // Importa a auditoria

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);   // Rota dos gestores
app.use('/api/audit', auditRoutes);  // Rota da auditoria

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API SIFM em http://localhost:${PORT}`));