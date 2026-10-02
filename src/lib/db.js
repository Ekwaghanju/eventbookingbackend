import { Pool } from 'pg';
import 'dotenv/config'; // Automatically loads .env

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

db.on('connect', () => {
  console.log('Database connected');
});

db.on('error', (err) => {
  console.error('Database connection error', err.stack);
});

export default db;