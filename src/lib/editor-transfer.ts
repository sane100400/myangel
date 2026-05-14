import type { ImageModelChoice, ImageQuality } from "./image-models";

export interface EditorTransferPayload {
  base?: string;
  baseUrl?: string;
  sourcePrompt?: string;
  quality?: ImageQuality;
  model?: ImageModelChoice;
}

interface EditorTransferRecord {
  id: string;
  createdAt: number;
  payload: EditorTransferPayload;
}

const DB_NAME = "myangel-editor-transfer";
const DB_VERSION = 1;
const STORE_NAME = "transfers";
const TRANSFER_KEY = "editor:transfer";
const LEGACY_BASE_KEY = "editor:base";
const LEGACY_BASE_URL_KEY = "editor:baseUrl";
const LEGACY_PROMPT_KEY = "editor:sourcePrompt";
const LEGACY_QUALITY_KEY = "editor:quality";
const LEGACY_MODEL_KEY = "editor:model";
const TRANSFER_TTL_MS = 24 * 60 * 60 * 1000;

function createTransferId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function openTransferDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed."));
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openTransferDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const request = run(tx.objectStore(STORE_NAME));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("IndexedDB transaction failed."));
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error ?? new Error("IndexedDB transaction aborted."));
        };
      })
  );
}

async function cleanupOldTransfers(): Promise<void> {
  try {
    const records = await withStore<EditorTransferRecord[]>("readonly", (store) =>
      store.getAll() as IDBRequest<EditorTransferRecord[]>
    );
    const staleIds = records
      .filter((record) => Date.now() - record.createdAt > TRANSFER_TTL_MS)
      .map((record) => record.id);
    await Promise.all(staleIds.map((id) => deleteEditorTransfer(id)));
  } catch {
    // Cleanup is opportunistic; transfer should not fail because cleanup failed.
  }
}

async function putEditorTransfer(record: EditorTransferRecord): Promise<void> {
  await withStore<IDBValidKey>("readwrite", (store) => store.put(record));
}

async function getEditorTransfer(id: string): Promise<EditorTransferRecord | undefined> {
  return await withStore<EditorTransferRecord | undefined>("readonly", (store) =>
    store.get(id) as IDBRequest<EditorTransferRecord | undefined>
  );
}

async function deleteEditorTransfer(id: string): Promise<void> {
  await withStore<undefined>("readwrite", (store) => store.delete(id) as IDBRequest<undefined>);
}

function storeLegacyTransfer(payload: EditorTransferPayload): void {
  if (payload.base) sessionStorage.setItem(LEGACY_BASE_KEY, payload.base);
  if (payload.baseUrl) sessionStorage.setItem(LEGACY_BASE_URL_KEY, payload.baseUrl);
  if (payload.sourcePrompt) sessionStorage.setItem(LEGACY_PROMPT_KEY, payload.sourcePrompt);
  if (payload.quality) sessionStorage.setItem(LEGACY_QUALITY_KEY, payload.quality);
  if (payload.model) sessionStorage.setItem(LEGACY_MODEL_KEY, payload.model);
}

function readLegacyTransfer(): EditorTransferPayload | null {
  const base = sessionStorage.getItem(LEGACY_BASE_KEY);
  const baseUrl = sessionStorage.getItem(LEGACY_BASE_URL_KEY);
  if (!base && !baseUrl) return null;
  const payload: EditorTransferPayload = {};
  if (base) payload.base = base;
  if (baseUrl) payload.baseUrl = baseUrl;
  const sourcePrompt = sessionStorage.getItem(LEGACY_PROMPT_KEY);
  const quality = sessionStorage.getItem(LEGACY_QUALITY_KEY);
  const model = sessionStorage.getItem(LEGACY_MODEL_KEY);
  if (sourcePrompt) payload.sourcePrompt = sourcePrompt;
  if (quality === "1K" || quality === "2K" || quality === "4K") payload.quality = quality;
  if (model === "nano-banana-pro" || model === "gpt-image-2") payload.model = model;
  return payload;
}

function clearLegacyTransfer(): void {
  sessionStorage.removeItem(LEGACY_BASE_KEY);
  sessionStorage.removeItem(LEGACY_BASE_URL_KEY);
  sessionStorage.removeItem(LEGACY_PROMPT_KEY);
  sessionStorage.removeItem(LEGACY_QUALITY_KEY);
  sessionStorage.removeItem(LEGACY_MODEL_KEY);
}

export async function saveEditorTransfer(
  payload: EditorTransferPayload
): Promise<string | null> {
  if (!payload.base && !payload.baseUrl) {
    throw new Error("편집할 이미지가 비어 있어요.");
  }
  const id = createTransferId();
  try {
    await putEditorTransfer({ id, createdAt: Date.now(), payload });
    sessionStorage.setItem(TRANSFER_KEY, id);
    void cleanupOldTransfers();
    return id;
  } catch {
    try {
      storeLegacyTransfer(payload);
      return null;
    } catch {
      throw new Error(
        "브라우저 임시 저장공간이 부족해서 편집기로 넘기지 못했어요. 이미지를 다운로드한 뒤 편집 화면에서 직접 업로드해주세요."
      );
    }
  }
}

export async function loadEditorTransfer(): Promise<EditorTransferPayload | null> {
  const transferId =
    new URLSearchParams(window.location.search).get("transfer") ??
    sessionStorage.getItem(TRANSFER_KEY);

  if (transferId) {
    try {
      const record = await getEditorTransfer(transferId);
      sessionStorage.removeItem(TRANSFER_KEY);
      await deleteEditorTransfer(transferId);
      if (record) return record.payload;
    } catch {
      // Fall through to legacy keys for older tabs or unavailable IndexedDB.
    }
  }

  const legacy = readLegacyTransfer();
  clearLegacyTransfer();
  return legacy;
}
