/**
 * SyncStore - localStorage-backed upload queue for offline → Drive sync.
 */

import type { AppFolders } from "./GoogleDriveService";
import { createJsonFile, uploadFile } from "./GoogleDriveService";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SyncTaskType = "upload" | "backup";
export type SyncTaskStatus = "pending" | "failed";

export interface SyncTask {
  id: string;
  type: SyncTaskType;
  // For upload tasks
  file?: {
    name: string;
    dataUrl: string; // base64 data URL
    mimeType: string;
  };
  folderId?: string;
  // For backup tasks
  backupContent?: object;
  backupFilename?: string;
  createdAt: number;
  status: SyncTaskStatus;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const QUEUE_KEY = "sd-sync-queue";

// ─── Queue helpers ─────────────────────────────────────────────────────────────

export function getQueue(): SyncTask[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncTask[];
  } catch {
    return [];
  }
}

function saveQueue(queue: SyncTask[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(
  task: Omit<SyncTask, "id" | "createdAt" | "status">,
): SyncTask {
  const newTask: SyncTask = {
    ...task,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    status: "pending",
  };

  const queue = getQueue();
  queue.push(newTask);
  saveQueue(queue);
  return newTask;
}

export function removeSyncTask(id: string): void {
  const queue = getQueue().filter((t) => t.id !== id);
  saveQueue(queue);
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

export function markFailed(id: string): void {
  const queue = getQueue().map((t) =>
    t.id === id ? { ...t, status: "failed" as SyncTaskStatus } : t,
  );
  saveQueue(queue);
}

// ─── File → dataUrl ────────────────────────────────────────────────────────────

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

export function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
  const base64 = dataUrl.split(",")[1] ?? dataUrl;
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

// ─── Flush queue ───────────────────────────────────────────────────────────────

export async function flush(
  folderIds: AppFolders,
): Promise<{ success: number; failed: number }> {
  const queue = getQueue().filter((t) => t.status === "pending");
  let success = 0;
  let failed = 0;

  for (const task of queue) {
    try {
      if (task.type === "upload" && task.file && task.folderId) {
        const blob = dataUrlToBlob(task.file.dataUrl, task.file.mimeType);
        const file = new File([blob], task.file.name, {
          type: task.file.mimeType,
        });
        await uploadFile(file, task.folderId, task.file.name);
        removeSyncTask(task.id);
        success++;
      } else if (
        task.type === "backup" &&
        task.backupContent &&
        task.backupFilename
      ) {
        await createJsonFile(
          task.backupContent,
          task.backupFilename,
          folderIds.backupsId,
        );
        removeSyncTask(task.id);
        success++;
      } else {
        // Malformed task — remove it
        removeSyncTask(task.id);
      }
    } catch (err) {
      console.error("SyncStore flush error:", err);
      markFailed(task.id);
      failed++;
    }
  }

  return { success, failed };
}
