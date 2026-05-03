import { SDSData } from "./pubchem";
import { SearchHistoryItem } from "./validation/schemas";

export type { SearchHistoryItem };

const DB_NAME = "project-may-db";
const DB_VERSION = 3; // Bumped to recover stores missing due to race condition

let db: IDBDatabase | null = null;

/**
 * The single authoritative DB opener — includes onupgradeneeded so stores
 * are always created. Export this and use it everywhere instead of creating
 * local openers that lack the upgrade handler.
 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Delete old stores if upgrading to clear corrupted data
      if (oldVersion < 2) {
        if (database.objectStoreNames.contains("sds_cache")) {
          database.deleteObjectStore("sds_cache");
        }
        if (database.objectStoreNames.contains("search_history")) {
          database.deleteObjectStore("search_history");
        }
      }

      // SDS cache store
      if (!database.objectStoreNames.contains("sds_cache")) {
        const sdsStore = database.createObjectStore("sds_cache", {
          keyPath: "cid",
        });
        sdsStore.createIndex("by-timestamp", "timestamp");
      }

      // Search history store
      if (!database.objectStoreNames.contains("search_history")) {
        const historyStore = database.createObjectStore("search_history", {
          keyPath: "id",
        });
        historyStore.createIndex("by-timestamp", "timestamp");
      }
    };
  });
}

// SDS Cache Functions
/** Strip preparedBy so it is never persisted or returned from cache. */
function withoutPreparedBy(data: SDSData): SDSData {
  const { preparedBy: _omit, ...rest } = data as SDSData & {
    preparedBy?: unknown;
  };
  return rest as SDSData;
}

export async function getCachedSDS(cid: string): Promise<SDSData | null> {
  try {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction("sds_cache", "readonly");
      const store = tx.objectStore("sds_cache");
      const request = store.get(cid);

      request.onsuccess = () => {
        const entry = request.result;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if cache is older than 30 days
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - entry.timestamp > thirtyDays) {
          // Delete old entry
          const deleteTx = database.transaction("sds_cache", "readwrite");
          deleteTx.objectStore("sds_cache").delete(cid);
          resolve(null);
          return;
        }

        // Always strip preparedBy — it must be entered fresh each time
        resolve(withoutPreparedBy(entry.data));
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to get cached SDS:", error);
    return null;
  }
}

export async function setCachedSDS(cid: string, data: SDSData): Promise<void> {
  try {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction("sds_cache", "readwrite");
      const store = tx.objectStore("sds_cache");
      // Strip preparedBy before persisting — it must be entered fresh each time
      const request = store.put({
        cid,
        data: withoutPreparedBy(data),
        timestamp: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to cache SDS:", error);
  }
}

// Search History Functions
export async function addSearchHistory(
  item: Omit<SearchHistoryItem, "id" | "timestamp">,
): Promise<void> {
  try {
    const database = await openDatabase();

    // Skip if this compound is the same as the most recent search (consecutive duplicates)
    const existing = await getSearchHistory(1);
    if (existing.length > 0 && existing[0].cid === item.cid) {
      return;
    }

    const id = `${item.cid}-${Date.now()}`;
    const historyItem: SearchHistoryItem = {
      ...item,
      id,
      timestamp: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("search_history", "readwrite");
      const store = tx.objectStore("search_history");
      const request = store.put(historyItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Keep only last 50 searches
    const history = await getSearchHistory(100);
    if (history.length > 50) {
      const toDelete = history.slice(50);
      for (const h of toDelete) {
        await deleteSearchHistoryItem(h.id);
      }
    }
  } catch (error) {
    console.warn("Failed to add search history:", error);
  }
}

export async function getSearchHistory(
  limit = 10,
): Promise<SearchHistoryItem[]> {
  try {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction("search_history", "readonly");
      const store = tx.objectStore("search_history");
      const index = store.index("by-timestamp");
      const request = index.openCursor(null, "prev");

      const results: SearchHistoryItem[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor || results.length >= limit) {
          // Filter out any invalid entries
          const validResults = results.filter(
            (r): r is SearchHistoryItem =>
              r != null &&
              typeof r === "object" &&
              typeof r.id === "string" &&
              typeof r.term === "string",
          );
          resolve(validResults);
          return;
        }
        if (cursor.value != null && typeof cursor.value === "object") {
          results.push(cursor.value);
        }
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to get search history:", error);
    return [];
  }
}

export async function clearSearchHistory(): Promise<void> {
  try {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction("search_history", "readwrite");
      const request = tx.objectStore("search_history").clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to clear search history:", error);
  }
}

export async function deleteSearchHistoryItem(id: string): Promise<void> {
  try {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = database.transaction("search_history", "readwrite");
      const request = tx.objectStore("search_history").delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to delete search history item:", error);
  }
}

// Legacy localStorage migration
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith("sds_cache_v3_"),
    );
    for (const key of keys) {
      const cid = key.replace("sds_cache_v3_", "");
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          await setCachedSDS(cid, parsed);
          localStorage.removeItem(key);
        } catch {
          // Skip invalid entries
        }
      }
    }
    console.log("Migrated SDS cache from localStorage to IndexedDB");
  } catch (error) {
    console.warn("Failed to migrate from localStorage:", error);
  }
}
