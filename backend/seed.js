import db from './db.js';
import bcrypt from 'bcryptjs';

if (!db.prepare('SELECT id FROM users WHERE phone=?').get('840000000')) {
  db.prepare('INSERT INTO users (name,email,phone,address,password_hash,role) VALUES (?,?,?,?,?,?)')
    .run('Administrador Municipal', 'admin@sifm.gov.mz', '840000000', 'Município',
         bcrypt.hashSync('admin123', 10), 'admin');
}

const fees = [
  ['Taxa de Mercado','Taxa mensal para comerciantes do mercado municipal',500,'mensal','Comércio'],
  ['Licença de Comércio','Licença anual para atividades comerciais',2500,'anual','Licenças'],
  ['Taxa de Resíduos','Recolha de resíduos sólidos',200,'mensal','Saneamento'],
  ['Taxa de Publicidade','Publicidade em espaço público',1500,'anual','Publicidade']
];

for (const [name, description, amount, periodicity, category] of fees) {
  if (!db.prepare('SELECT id FROM fees WHERE name=?').get(name))
    db.prepare('INSERT INTO fees (name,description,amount,periodicity,category) VALUES (?,?,?,?,?)')
      .run(name, description, amount, periodicity, category);
}
console.log('✅ Seed concluído — Admin: 840000000 / admin123');