/**
 * Seed Tesseract.js IndexedDB cache so premium packs are not fetched from langPath
 * (which would 404 on /ocr) or from a CDN.
 * Database, store, and key format must match tesseract.js `idb-keyval` defaults.
 */
const DB_NAME = "keyval-store";
const STORE = "keyval";

export function seedOcrLanguageCache(lang: string, data: Uint8Array): Promise<void> {
  const key = `./${lang}.traineddata`;
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME);
    open.onerror = () => reject(open.error ?? new Error("IndexedDB unavailable"));
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(STORE)) {
        open.result.createObjectStore(STORE);
      }
    };
    open.onsuccess = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const nextVersion = db.version + 1;
        db.close();
        const upgrade = indexedDB.open(DB_NAME, nextVersion);
        upgrade.onerror = () => reject(upgrade.error ?? new Error("IndexedDB upgrade failed"));
        upgrade.onupgradeneeded = () => {
          if (!upgrade.result.objectStoreNames.contains(STORE)) {
            upgrade.result.createObjectStore(STORE);
          }
        };
        upgrade.onsuccess = () => put(upgrade.result);
        return;
      }
      put(db);
    };

    function put(db: IDBDatabase) {
      try {
        const tx = db.transaction(STORE, "readwrite");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error ?? new Error("Language cache write failed"));
        tx.objectStore(STORE).put(data, key);
      } catch (error) {
        db.close();
        reject(error);
      }
    }
  });
}
