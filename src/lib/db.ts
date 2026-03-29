import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "carbook.db");

function getDb(): Database.Database {
  const g = globalThis as unknown as { __carbook_db?: Database.Database };
  if (g.__carbook_db) return g.__carbook_db;

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  db.exec(`
    CREATE TABLE IF NOT EXISTS cars (
      plate TEXT PRIMARY KEY,
      make TEXT,
      model TEXT,
      year INTEGER,
      color TEXT,
      vin TEXT,
      owner_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_records (
      id TEXT PRIMARY KEY,
      plate TEXT NOT NULL,
      service_date TEXT NOT NULL,
      odometer INTEGER,
      service_type TEXT NOT NULL,
      description TEXT,
      provider TEXT,
      cost REAL,
      currency TEXT DEFAULT 'NZD',
      invoice_filename TEXT,
      invoice_path TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (plate) REFERENCES cars(plate) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_records_plate ON service_records(plate);
    CREATE INDEX IF NOT EXISTS idx_records_date ON service_records(service_date DESC);
  `);

  g.__carbook_db = db;
  return db;
}

const db = getDb();
export default db;
