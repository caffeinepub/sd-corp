# SD Corp

## Current State

A full-stack construction management app with:
- Login (Internet Identity), Register, PIN setup/lock screens
- Dashboard with stats (active sites, received, given, P&L), recent transactions
- Sites management: create sites, view site detail with transactions tab and labour tab
- Labour management with per-worker payment history
- Profile screen: change password, change PIN, logout
- Dark mode toggle
- Backend in Motoko storing all data on-chain

No file storage, no cloud sync, no offline queue, no status indicators.

## Requested Changes (Diff)

### Add

- **GoogleDriveService** (`src/frontend/src/utils/GoogleDriveService.ts`): handles Google OAuth 2.0 (GAPI/GIS), creates/finds folders `SD_CORP_DATA` (with sub-folders Sites, Documents, Photos, Transactions) and `SD_CORP_BACKUPS`, uploads files, lists files.
- **SyncStore** (`src/frontend/src/utils/SyncStore.ts`): a localStorage-backed queue for offline operations. Enqueues upload tasks when offline. Flushes the queue automatically when online status is restored via `window.addEventListener('online', ...)`.
- **useSyncStatus hook** (`src/frontend/src/hooks/useSyncStatus.ts`): reactive hook that returns current status (`idle | saving | saved | syncing | synced | error`), exposes `enqueueUpload`, `triggerBackup`, `connectDrive`, `disconnectDrive`, `isConnected`.
- **SyncStatusBar component** (`src/frontend/src/components/app/SyncStatusBar.tsx`): a persistent pill/chip fixed at the top of the app showing Saving / Saved / Syncing / Synced with icons and color cues.
- **CloudStorageScreen** (`src/frontend/src/screens/CloudStorageScreen.tsx`): a new tab/screen accessible from the bottom nav. Shows: Google Drive connection status (Connect / Disconnect button), folder structure, list of uploaded files per category (Sites, Documents, Photos, Transactions), upload buttons for each category, last backup timestamp, and a "Backup Now" button.
- **File upload UI**: in SiteDetailScreen, add a "Files" tab alongside Transactions and Labour. Allows uploading site photos and documents. Files are queued via SyncStore and uploaded to `SD_CORP_DATA/Sites/<siteName>/` or the appropriate subfolder.
- **Daily backup scheduler**: runs once per day (checked on app load via localStorage timestamp), collects all sites + transactions data, serializes to JSON, uploads to `SD_CORP_BACKUPS/backup_YYYY-MM-DD.json`.
- **Offline detection**: `navigator.onLine` plus `online`/`offline` event listeners. While offline, enqueue all upload tasks. When back online, flush queue and show Syncing → Synced.

### Modify

- **MainApp.tsx**: add a 5th bottom nav tab "Cloud" (CloudIcon). Render CloudStorageScreen when active. Pass sync status context down.
- **DashboardScreen.tsx**: display SyncStatusBar below the header (or inside it).
- **SiteDetailScreen.tsx**: add a third "Files" tab for file uploads per site.
- **App.tsx**: wrap the app in a SyncProvider context that initializes GoogleDriveService and SyncStore.

### Remove

Nothing removed.

## Implementation Plan

1. Create `GoogleDriveService.ts` -- OAuth 2.0 via Google Identity Services (GIS token-based flow), GAPI for Drive REST calls. Methods: `signIn()`, `signOut()`, `isSignedIn()`, `getAccessToken()`, `ensureFolder(name, parentId?)`, `uploadFile(file, folderId, filename)`, `listFiles(folderId)`, `createJsonFile(content, filename, folderId)`.
2. Create `SyncStore.ts` -- localStorage queue of pending upload tasks (`{id, type, payload, status}`). Methods: `enqueue`, `dequeue`, `flush(driveService)`, `getPendingCount`.
3. Create `useSyncStatus.ts` hook -- state machine (idle → saving → saved → syncing → synced), online/offline detection, auto-flush on reconnect, daily backup trigger.
4. Create `SyncStatusBar.tsx` -- compact pill showing current status with animated icons.
5. Modify `App.tsx` -- wrap with SyncContext provider.
6. Modify `MainApp.tsx` -- add Cloud tab to bottom nav.
7. Create `CloudStorageScreen.tsx` -- connect/disconnect UI, file browser per category, upload buttons, backup section.
8. Modify `SiteDetailScreen.tsx` -- add Files tab with photo/document upload capability.
9. Load GAPI script dynamically on app init; handle token expiry gracefully.
10. Implement daily backup: on `useSyncStatus` init, check localStorage `lastBackupDate`, if differs from today, collect data snapshot and upload.
