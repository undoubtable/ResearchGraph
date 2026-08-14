const DATABASE_NAME = "researchgraph-local-files";
const STORE_NAME = "papers";

interface StoredPaperFile {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  updatedAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePaperFile(id: string, file: File) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({
      id,
      name: file.name,
      type: file.type || "application/pdf",
      blob: file,
      updatedAt: new Date().toISOString(),
    } satisfies StoredPaperFile);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function getPaperFileUrl(id: string) {
  const record = await getPaperFile(id);
  return record ? URL.createObjectURL(record) : undefined;
}

export async function getPaperFile(id: string) {
  const database = await openDatabase();
  const record = await new Promise<StoredPaperFile | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as StoredPaperFile | undefined);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return record?.blob;
}

export async function deletePaperFile(id: string) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
