/**
 * One-time migration: remove the `preparedBy` field from every entry in the
 * local IndexedDB SDS cache so that document attribution must be entered
 * fresh each time a PDF is generated.
 */

import { SDSData } from "@/lib/pubchem";
import { openDatabase } from "@/lib/cache";

interface MigrationResult {
  success: boolean;
  updated: number;
  errors: string[];
}

export async function runStripPreparedByMigration(): Promise<MigrationResult> {
  const errors: string[] = [];
  let updated = 0;

  try {
    const db = await openDatabase();

    // Read all cache entries
    const entries: {
      cid: string;
      data: SDSData & { preparedBy?: unknown };
      timestamp: number;
    }[] = await new Promise((resolve, reject) => {
      const tx = db.transaction("sds_cache", "readonly");
      const request = tx.objectStore("sds_cache").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Find entries that still carry preparedBy
    const toUpdate = entries.filter((e) => "preparedBy" in (e.data ?? {}));

    if (toUpdate.length > 0) {
      const writeTx = db.transaction("sds_cache", "readwrite");
      const store = writeTx.objectStore("sds_cache");

      for (const entry of toUpdate) {
        try {
          const { preparedBy: _omit, ...cleanData } = entry.data;
          await new Promise<void>((resolve, reject) => {
            const req = store.put({ ...entry, data: cleanData as SDSData });
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
          updated++;
        } catch (e) {
          errors.push(`Failed to update cache entry ${entry.cid}: ${e}`);
        }
      }
    }

    db.close();

    return { success: true, updated, errors };
  } catch (e) {
    return { success: false, updated: 0, errors: [`Migration failed: ${e}`] };
  }
}
