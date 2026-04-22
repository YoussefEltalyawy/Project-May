import { neon } from '@neondatabase/serverless';

// Increase timeout for IPv6 auto-selection to avoid ETIMEDOUT in some environments
if (typeof process !== 'undefined' && process.env) {
  (process.env as any).NODE_SET_DEFAULT_AUTO_SELECT_FAMILY_ATTEMPT_TIMEOUT = '1000';
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.warn('[DB] No connection string found (DATABASE_URL or POSTGRES_URL). Caching will be disabled.');
}

// Log connection attempt (masked password)
const maskedUrl = (connectionString || '').replace(/:([^:@]+)@/, ':****@');
if (maskedUrl) {
  const hostInfo = maskedUrl.split('@')[1] || 'unknown';
  console.log(`[DB] Using endpoint: ${hostInfo}`);
}

export const sql = connectionString ? neon(connectionString) : null;


/**
 * Helper to retry database operations
 */
export async function retrySql<T>(op: () => Promise<T>, retries = 2): Promise<T | null> {
  if (!sql) return null;
  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await op();
    } catch (e) {
      lastError = e;
      if (i < retries) {
        console.warn(`[DB] Operation failed, retrying (${i + 1}/${retries})...`, (e as Error).message);
        await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential-ish backoff
      }
    }
  }
  throw lastError;
}

let isInitialized = false;

/**
 * Ensures the chemicals table exists.
 */
export async function initDb() {
  if (isInitialized || !sql) return;

  await retrySql(async () => {
    if (!sql) return; 
    await sql`
      CREATE TABLE IF NOT EXISTS chemicals (
        cid TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_chemicals_name ON chemicals(name);
    `;
  });

  isInitialized = true;
}
