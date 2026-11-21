import Database from 'better-sqlite3';

const db = new Database('sifm.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE NOT NULL,
    address TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen' CHECK(role IN ('citizen','merchant','admin','manager')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'MZN',
    periodicity TEXT NOT NULL CHECK(periodicity IN ('unica','mensal','trimestral','anual')),
    category TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    fee_id INTEGER NOT NULL REFERENCES fees(id),
    reference TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    method TEXT CHECK(method IN ('mpesa','emola','pos','cash')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','cancelled')),
    receipt_number TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now')),
    paid_at TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    details TEXT,
    ip TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS carteira_movel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilizador_id INTEGER REFERENCES users(id),
  operadora TEXT,
  numero TEXT
);
`);



export default db;