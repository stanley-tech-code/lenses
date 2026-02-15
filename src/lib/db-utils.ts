
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'src/lib/db.json');

// Ensure DB exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ templates: [], reminders: [], campaigns: [], customers: [] }, null, 2));
}

interface DbSchema {
  templates: unknown[];
  reminders: unknown[];
  campaigns: unknown[];
  customers: unknown[];
}

export const db = {
  read: (): DbSchema => {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  },
  write: (data: DbSchema) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }
};
