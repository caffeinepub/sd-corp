/**
 * GoogleDriveService - handles Google OAuth 2.0 (GIS token client) and Drive REST API v3.
 *
 * IMPORTANT: Replace "YOUR_GOOGLE_CLIENT_ID" with your actual Google API Client ID.
 * Get one at: https://console.cloud.google.com/apis/credentials
 * Required scope: https://www.googleapis.com/auth/drive.file
 */

// ─── Config ────────────────────────────────────────────────────────────────────

export const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const TOKEN_KEY = "sd-drive-token";
const FOLDERS_KEY = "sd-drive-folders";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StoredToken {
  access_token: string;
  expiry_time: number; // Date.now() + expires_in * 1000
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

export interface AppFolders {
  rootId: string;
  sitesId: string;
  documentsId: string;
  photosId: string;
  transactionsId: string;
  backupsId: string;
}

// ─── Script Loaders ────────────────────────────────────────────────────────────

let gapiLoaded = false;
let gisLoaded = false;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

export async function loadGapiAndGis(): Promise<void> {
  if (!gapiLoaded) {
    await loadScript("https://apis.google.com/js/api.js");
    gapiLoaded = true;
  }
  if (!gisLoaded) {
    await loadScript("https://accounts.google.com/gsi/client");
    gisLoaded = true;
  }
}

// ─── Token Management ──────────────────────────────────────────────────────────

export function getStoredToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
}

function storeToken(token: StoredToken): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

export function isSignedIn(): boolean {
  const token = getStoredToken();
  if (!token) return false;
  // 60 second buffer before expiry
  return Date.now() < token.expiry_time - 60_000;
}

export function getAccessToken(): string | null {
  if (!isSignedIn()) return null;
  return getStoredToken()?.access_token ?? null;
}

export function signOut(): void {
  const token = getStoredToken();
  if (token?.access_token) {
    try {
      // @ts-expect-error - GIS is loaded dynamically
      window.google?.accounts?.oauth2?.revoke(token.access_token, () => {});
    } catch {
      // ignore
    }
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(FOLDERS_KEY);
}

// ─── OAuth Token Request ───────────────────────────────────────────────────────

export function requestAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // @ts-expect-error - GIS is loaded dynamically
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (response: {
          access_token?: string;
          expires_in?: number;
          error?: string;
        }) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error ?? "Token request failed"));
            return;
          }
          const token: StoredToken = {
            access_token: response.access_token,
            expiry_time: Date.now() + (response.expires_in ?? 3600) * 1000,
          };
          storeToken(token);
          resolve(response.access_token);
        },
        error_callback: (err: { message?: string }) => {
          reject(new Error(err.message ?? "OAuth error"));
        },
      });
      tokenClient.requestAccessToken({ prompt: "" });
    } catch (e) {
      reject(e);
    }
  });
}

// ─── Ensure valid token ────────────────────────────────────────────────────────

async function ensureToken(): Promise<string> {
  const existing = getAccessToken();
  if (existing) return existing;
  return requestAccessToken();
}

// ─── Drive REST API helpers ────────────────────────────────────────────────────

async function driveRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await ensureToken();
  const url = path.startsWith("http")
    ? path
    : `https://www.googleapis.com/drive/v3${path}`;
  const resp = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Drive API error ${resp.status}: ${text}`);
  }
  const contentType = resp.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return resp.json() as Promise<T>;
  }
  return resp.text() as unknown as T;
}

// ─── Folder Management ─────────────────────────────────────────────────────────

export async function ensureFolder(
  name: string,
  parentId?: string,
): Promise<string> {
  const token = await ensureToken();

  // Search for existing folder
  let query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
  if (parentId) query += ` and '${parentId}' in parents`;

  const searchResp = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!searchResp.ok) {
    throw new Error(`Failed to search for folder: ${name}`);
  }

  const searchData = (await searchResp.json()) as {
    files: { id: string; name: string }[];
  };

  if (searchData.files.length > 0 && searchData.files[0]) {
    return searchData.files[0].id;
  }

  // Create folder
  const metadata: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) metadata.parents = [parentId];

  const createResp = await driveRequest<{ id: string }>("/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });

  return createResp.id;
}

export async function ensureAppFolders(): Promise<AppFolders> {
  // Try cache first
  try {
    const cached = localStorage.getItem(FOLDERS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as AppFolders;
      if (parsed.rootId && parsed.sitesId) return parsed;
    }
  } catch {
    // ignore
  }

  // Ensure root folder SD_CORP_DATA
  const rootId = await ensureFolder("SD_CORP_DATA");

  // Ensure subfolders in parallel
  const [sitesId, documentsId, photosId, transactionsId, backupsId] =
    await Promise.all([
      ensureFolder("Sites", rootId),
      ensureFolder("Documents", rootId),
      ensureFolder("Photos", rootId),
      ensureFolder("Transactions", rootId),
      ensureFolder("SD_CORP_BACKUPS"),
    ]);

  const folders: AppFolders = {
    rootId,
    sitesId,
    documentsId,
    photosId,
    transactionsId,
    backupsId,
  };
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  return folders;
}

export function getCachedFolders(): AppFolders | null {
  try {
    const cached = localStorage.getItem(FOLDERS_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as AppFolders;
  } catch {
    return null;
  }
}

// ─── File Upload ───────────────────────────────────────────────────────────────

export async function uploadFile(
  file: File | Blob,
  folderId: string,
  filename?: string,
): Promise<string> {
  const token = await ensureToken();
  const name = filename ?? (file instanceof File ? file.name : "upload");

  const metadata = JSON.stringify({ name, parents: [folderId] });
  const boundary = "boundary_sd_corp_drive";

  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`;
  const bodyPartHeader = `--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`;
  const closing = `\r\n--${boundary}--`;

  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadataPart);
  const bodyHeaderBytes = encoder.encode(bodyPartHeader);
  const closingBytes = encoder.encode(closing);
  const fileBytes = new Uint8Array(await file.arrayBuffer());

  const combined = new Uint8Array(
    metadataBytes.length +
      bodyHeaderBytes.length +
      fileBytes.length +
      closingBytes.length,
  );
  let offset = 0;
  combined.set(metadataBytes, offset);
  offset += metadataBytes.length;
  combined.set(bodyHeaderBytes, offset);
  offset += bodyHeaderBytes.length;
  combined.set(fileBytes, offset);
  offset += fileBytes.length;
  combined.set(closingBytes, offset);

  const resp = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary="${boundary}"`,
      },
      body: combined,
    },
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Drive upload error ${resp.status}: ${text}`);
  }

  const result = (await resp.json()) as { id: string };
  return result.id;
}

export async function createJsonFile(
  content: object,
  filename: string,
  folderId: string,
): Promise<string> {
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/json",
  });
  const file = new File([blob], filename, { type: "application/json" });
  return uploadFile(file, folderId, filename);
}

export async function listFiles(folderId: string): Promise<DriveFile[]> {
  const token = await ensureToken();
  const query = `'${folderId}' in parents and trashed=false`;
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime)&orderBy=modifiedTime desc`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!resp.ok) throw new Error("Failed to list files");
  const data = (await resp.json()) as { files: DriveFile[] };
  return data.files;
}
