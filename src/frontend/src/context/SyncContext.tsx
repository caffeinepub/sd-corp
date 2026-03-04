/**
 * SyncProvider - wraps the app with Google Drive sync context.
 */

import type { ReactNode } from "react";
import { SyncContext, useSyncStatusProvider } from "../hooks/useSyncStatus";

export function SyncProvider({ children }: { children: ReactNode }) {
  const value = useSyncStatusProvider();
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
