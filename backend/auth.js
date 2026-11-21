import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function sign(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
}

export function authRequired(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token em falta' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Token inválido' }); }
}

export function adminRequired(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito' });
  next();
}

export function managerRequired(req, res, next) {
  if (req.user?.role !== 'manager' && req.user?.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito ao balcão' });
  next();
}

// ==========================================
// CONFIGURAÇÃO DO SMS (Textbee)
// ==========================================
export async function sendSMS(phone, message) {
  const formattedPhone = phone.startsWith('+258') ? phone : `+258${phone.replace(/^0+/, '')}`;

  try {
    const response = await fetch('https://api.textbee.dev/api/v1/gateway/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Usando a chave que confirmaste que está a funcionar
        'x-api-key': process.env.TEXTBEE_API_KEY || 'txb_fulANIZGYYaaekFmWWN3LNxdpmTurJDT' 
      },
      body: JSON.stringify({
        recipients: [formattedPhone],
        message: message
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`SMS REAL enviado via textbee para ${formattedPhone}`, data);
    } else {
      console.error(`Falha na textbee:`, data);
    }
  } catch (error) {
    console.error('Erro de rede ao enviar SMS:', error.message);
  }
}

// ==========================================
// CONFIGURAÇÃO DO E-MAIL (Nodemailer)
// ==========================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendEmail(to, subject, text) {
  if (!to) return;
  try {
    const info = await transporter.sendMail({
      from: `"SIFM - Município" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: `<div style="font-family: Arial; padding: 20px; border: 1px solid #0f5132; border-radius: 10px;">
               <h2 style="color: #0f5132;">SIFM - Inclusão Financeira Municipal</h2>
               <p>${text}</p>
               <br>
               <small>Este é um e-mail automático, por favor não responda.</small>
             </div>`
    });
    console.log(`E-mail enviado com sucesso para ${to}`);
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${to}:`, error.message);
  }
}