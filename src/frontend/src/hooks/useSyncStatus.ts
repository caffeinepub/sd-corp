/**
 * useSyncStatus - manages Google Drive sync state, offline queue, and status indicators.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AppFolders } from "../utils/GoogleDriveService";
import {
  GOOGLE_CLIENT_ID,
  ensureAppFolders,
  getCachedFolders,
  isSignedIn,
  loadGapiAndGis,
  requestAccessToken,
  signOut,
} from "../utils/GoogleDriveService";
import { enqueue, fileToDataUrl, flush, getQueue } from "../utils/SyncStore";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SyncStatusState =
  | "idle"
  | "saving"
  | "saved"
  | "syncing"
  | "synced"
  | "offline"
  | "error";

export type FileCategory = "sites" | "documents" | "photos" | "transactions";

export interface SyncContextValue {
  status: SyncStatusState;
  isConnected: boolean;
  isOnline: boolean;
  pendingCount: number;
  connectDrive: () => Promise<void>;
  disconnectDrive: () => void;
  enqueueFileUpload: (
    file: File,
    category: FileCategory,
    subfolder?: string,
  ) => Promise<void>;
  triggerBackup: (dataSnapshot: object) => Promise<void>;
  folderIds: AppFolders | null;
  isUsingPlaceholderClientId: boolean;
}

// ─── Context ───────────────────────────────────────────────────────────────────

export const SyncContext = createContext<SyncContextValue | null>(null);

export function useSyncContext(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSyncContext must be used inside SyncProvider");
  return ctx;
}

// ─── Backup date helpers ────────────────────────────────────────────────────────

const LAST_BACKUP_KEY = "sd-last-backup-date";

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export function getLastBackupDate(): string {
  return localStorage.getItem(LAST_BACKUP_KEY) ?? "";
}

function markBackupDone(): void {
  localStorage.setItem(LAST_BACKUP_KEY, getTodayKey());
}

// ─── Provider logic ────────────────────────────────────────────────────────────

export function useSyncStatusProvider(): SyncContextValue {
  const [status, setStatus] = useState<SyncStatusState>("idle");
  const [isConnected, setIsConnected] = useState(isSignedIn());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [folderIds, setFolderIds] = useState<AppFolders | null>(
    getCachedFolders(),
  );
  const [pendingCount, setPendingCount] = useState(
    () => getQueue().filter((t) => t.status === "pending").length,
  );
  const isFlushing = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isUsingPlaceholderClientId =
    GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID";

  // ── Helper: refresh pending count ──────────────────────────────────────────
  const refreshPending = useCallback(() => {
    setPendingCount(getQueue().filter((t) => t.status === "pending").length);
  }, []);

  // ── Helper: auto-hide saved/synced after 3s ────────────────────────────────
  const setStatusWithAutohide = useCallback((s: SyncStatusState) => {
    setStatus(s);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (s === "saved" || s === "synced") {
      hideTimer.current = setTimeout(() => setStatus("idle"), 3000);
    }
  }, []);

  // ── Online/offline listeners ───────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (status === "offline") setStatusWithAutohide("idle");
    };
    const handleOffline = () => {
      setIsOnline(false);
      setStatus("offline");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [status, setStatusWithAutohide]);

  // ── Flush queue ────────────────────────────────────────────────────────────
  const flushQueue = useCallback(
    async (folders: AppFolders) => {
      if (isFlushing.current) return;
      const pending = getQueue().filter((t) => t.status === "pending");
      if (pending.length === 0) return;

      isFlushing.current = true;
      setStatus("syncing");

      try {
        const result = await flush(folders);
        refreshPending();
        if (result.failed > 0) {
          setStatus("error");
        } else {
          setStatusWithAutohide("synced");
        }
      } catch {
        setStatus("error");
      } finally {
        isFlushing.current = false;
      }
    },
    [refreshPending, setStatusWithAutohide],
  );

  // ── On mount: flush if connected + online ────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only on mount
  useEffect(() => {
    if (isConnected && isOnline && folderIds) {
      void flushQueue(folderIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── On come-back-online: flush ─────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      if (isConnected && folderIds) {
        void flushQueue(folderIds);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isConnected, folderIds, flushQueue]);

  // ── Connect Drive ──────────────────────────────────────────────────────────
  const connectDrive = useCallback(async () => {
    await loadGapiAndGis();
    await requestAccessToken();
    const folders = await ensureAppFolders();
    setFolderIds(folders);
    setIsConnected(true);
    // Flush any pending
    if (isOnline) await flushQueue(folders);
  }, [isOnline, flushQueue]);

  // ── Disconnect Drive ───────────────────────────────────────────────────────
  const disconnectDrive = useCallback(() => {
    signOut();
    setIsConnected(false);
    setFolderIds(null);
    setStatus("idle");
  }, []);

  // ── Enqueue file upload ────────────────────────────────────────────────────
  const enqueueFileUpload = useCallback(
    async (file: File, category: FileCategory, _subfolder?: string) => {
      setStatus("saving");

      let folderId: string | undefined;
      if (folderIds) {
        const categoryMap: Record<FileCategory, keyof AppFolders> = {
          sites: "sitesId",
          documents: "documentsId",
          photos: "photosId",
          transactions: "transactionsId",
        };
        folderId = folderIds[categoryMap[category]];
      }

      // Try to store in localStorage queue
      try {
        const dataUrl = await fileToDataUrl(file);
        enqueue({
          type: "upload",
          file: {
            name: file.name,
            dataUrl,
            mimeType: file.type || "application/octet-stream",
          },
          folderId,
        });
        refreshPending();
        setStatusWithAutohide("saved");
      } catch (err) {
        // localStorage quota exceeded or other error
        console.error("Failed to enqueue file:", err);
        setStatus("error");
        return;
      }

      // Flush immediately if online + connected
      if (isOnline && isConnected && folderIds) {
        await flushQueue(folderIds);
      }
    },
    [
      folderIds,
      isOnline,
      isConnected,
      flushQueue,
      refreshPending,
      setStatusWithAutohide,
    ],
  );

  // ── Trigger backup ─────────────────────────────────────────────────────────
  const triggerBackup = useCallback(
    async (dataSnapshot: object) => {
      const date = getTodayKey();
      const filename = `SD_Corp_Backup_${date}.json`;

      enqueue({
        type: "backup",
        backupContent: dataSnapshot,
        backupFilename: filename,
      });
      refreshPending();

      if (isOnline && isConnected && folderIds) {
        setStatus("syncing");
        try {
          await flushQueue(folderIds);
          markBackupDone();
          setStatusWithAutohide("synced");
        } catch {
          setStatus("error");
        }
      } else {
        setStatusWithAutohide("saved");
      }
    },
    [
      folderIds,
      isOnline,
      isConnected,
      flushQueue,
      refreshPending,
      setStatusWithAutohide,
    ],
  );

  // ── Daily backup check ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) return;
    const lastBackup = getLastBackupDate();
    const today = getTodayKey();
    if (lastBackup !== today) {
      // Auto-backup with minimal snapshot
      void triggerBackup({
        date: today,
        app: "SD Corp",
        note: "Daily automated backup",
        timestamp: new Date().toISOString(),
      });
    }
  }, [isConnected, triggerBackup]);

  return {
    status,
    isConnected,
    isOnline,
    pendingCount,
    connectDrive,
    disconnectDrive,
    enqueueFileUpload,
    triggerBackup,
    folderIds,
    isUsingPlaceholderClientId,
  };
}
