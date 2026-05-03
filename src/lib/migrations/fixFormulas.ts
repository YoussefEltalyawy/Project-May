import { reorderFormula } from "@/lib/formulaUtils";
import { SDSData } from "@/lib/pubchem";
import { openDatabase } from "@/lib/cache";

interface MigrationResult {
  success: boolean;
  cacheUpdated: number;
  historyUpdated: number;
  errors: string[];
}

/**
 * Fix formulas in SDS cache
 */
async function fixCacheFormulas(
  db: IDBDatabase,
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    const tx = db.transaction("sds_cache", "readonly");
    const store = tx.objectStore("sds_cache");
    const request = store.getAll();

    const entries: { cid: string; data: SDSData; timestamp: number }[] =
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

    // Find entries that need updating
    const updates: { cid: string; data: SDSData; timestamp: number }[] = [];

    for (const entry of entries) {
      if (!entry.data?.identity?.formula) continue;

      const originalFormula = entry.data.identity.formula;
      const fixedFormula = reorderFormula(originalFormula);

      if (originalFormula !== fixedFormula) {
        entry.data.identity.formula = fixedFormula;
        updates.push(entry);
      }
    }

    // Apply updates
    if (updates.length > 0) {
      const writeTx = db.transaction("sds_cache", "readwrite");
      const writeStore = writeTx.objectStore("sds_cache");

      for (const entry of updates) {
        try {
          await new Promise<void>((resolve, reject) => {
            const req = writeStore.put(entry);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
          count++;
        } catch (e) {
          errors.push(`Failed to update cache entry ${entry.cid}: ${e}`);
        }
      }
    }

    return { count, errors };
  } catch (e) {
    errors.push(`Cache migration failed: ${e}`);
    return { count, errors };
  }
}

/**
 * Fix formulas in search history
 */
async function fixHistoryFormulas(
  db: IDBDatabase,
): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = [];
  let count = 0;

  try {
    const tx = db.transaction("search_history", "readonly");
    const store = tx.objectStore("search_history");
    const request = store.getAll();

    interface HistoryItem {
      id: string;
      term: string;
      cid: string;
      name?: string;
      cas?: string;
      formula?: string;
      timestamp: number;
    }

    const entries: HistoryItem[] = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Find entries that need updating
    const updates: HistoryItem[] = [];

    for (const entry of entries) {
      if (!entry.formula) continue;

      const originalFormula = entry.formula;
      const fixedFormula = reorderFormula(originalFormula);

      if (originalFormula !== fixedFormula) {
        entry.formula = fixedFormula;
        updates.push(entry);
      }
    }

    // Apply updates
    if (updates.length > 0) {
      const writeTx = db.transaction("search_history", "readwrite");
      const writeStore = writeTx.objectStore("search_history");

      for (const entry of updates) {
        try {
          await new Promise<void>((resolve, reject) => {
            const req = writeStore.put(entry);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
          count++;
        } catch (e) {
          errors.push(`Failed to update history entry ${entry.id}: ${e}`);
        }
      }
    }

    return { count, errors };
  } catch (e) {
    errors.push(`History migration failed: ${e}`);
    return { count, errors };
  }
}

/**
 * Run the formula migration
 */
export async function runFormulaMigration(): Promise<MigrationResult> {
  const errors: string[] = [];

  try {
    const db = await openDatabase();

    // Fix cache
    const cacheResult = await fixCacheFormulas(db);
    errors.push(...cacheResult.errors);

    // Fix history
    const historyResult = await fixHistoryFormulas(db);
    errors.push(...historyResult.errors);

    return {
      success: true,
      cacheUpdated: cacheResult.count,
      historyUpdated: historyResult.count,
      errors,
    };
  } catch (e) {
    return {
      success: false,
      cacheUpdated: 0,
      historyUpdated: 0,
      errors: [`Migration failed: ${e}`],
    };
  }
}

/**
 * Preview what formulas would be changed (dry run)
 */
export async function previewFormulaMigration(): Promise<{
  cacheChanges: { cid: string; from: string; to: string }[];
  historyChanges: { id: string; from: string; to: string }[];
}> {
  const cacheChanges: { cid: string; from: string; to: string }[] = [];
  const historyChanges: { id: string; from: string; to: string }[] = [];

  try {
    const db = await openDatabase();

    // Preview cache
    const cacheTx = db.transaction("sds_cache", "readonly");
    const cacheStore = cacheTx.objectStore("sds_cache");
    const cacheRequest = cacheStore.getAll();

    const cacheEntries: { cid: string; data: SDSData; timestamp: number }[] =
      await new Promise((resolve, reject) => {
        cacheRequest.onsuccess = () => resolve(cacheRequest.result);
        cacheRequest.onerror = () => reject(cacheRequest.error);
      });

    for (const entry of cacheEntries) {
      if (!entry.data?.identity?.formula) continue;
      const original = entry.data.identity.formula;
      const fixed = reorderFormula(original);
      if (original !== fixed) {
        cacheChanges.push({ cid: entry.cid, from: original, to: fixed });
      }
    }

    // Preview history
    const historyTx = db.transaction("search_history", "readonly");
    const historyStore = historyTx.objectStore("search_history");
    const historyRequest = historyStore.getAll();

    interface HistoryItem {
      id: string;
      term: string;
      cid: string;
      name?: string;
      cas?: string;
      formula?: string;
      timestamp: number;
    }

    const historyEntries: HistoryItem[] = await new Promise(
      (resolve, reject) => {
        historyRequest.onsuccess = () => resolve(historyRequest.result);
        historyRequest.onerror = () => reject(historyRequest.error);
      },
    );

    for (const entry of historyEntries) {
      if (!entry.formula) continue;
      const original = entry.formula;
      const fixed = reorderFormula(original);
      if (original !== fixed) {
        historyChanges.push({ id: entry.id, from: original, to: fixed });
      }
    }

    db.close();
  } catch (e) {
    console.error("Preview failed:", e);
  }

  return { cacheChanges, historyChanges };
}
