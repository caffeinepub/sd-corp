/**
 * SyncStatusBar - fixed pill indicator showing current sync status.
 */

import {
  AlertCircle,
  CheckCircle,
  Cloud,
  CloudUpload,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { useSyncContext } from "../../hooks/useSyncStatus";
import type { SyncStatusState } from "../../hooks/useSyncStatus";

interface StatusConfig {
  icon: React.ReactNode;
  label: string;
  className: string;
}

function getConfig(status: SyncStatusState): StatusConfig | null {
  switch (status) {
    case "saving":
      return {
        icon: <CloudUpload className="w-3.5 h-3.5" />,
        label: "Saving...",
        className:
          "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      };
    case "saved":
      return {
        icon: <CheckCircle className="w-3.5 h-3.5" />,
        label: "Saved",
        className:
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      };
    case "syncing":
      return {
        icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
        label: "Syncing...",
        className:
          "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      };
    case "synced":
      return {
        icon: <Cloud className="w-3.5 h-3.5" />,
        label: "Synced",
        className:
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      };
    case "offline":
      return {
        icon: <WifiOff className="w-3.5 h-3.5" />,
        label: "Offline",
        className: "bg-muted text-muted-foreground border-border",
      };
    case "error":
      return {
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        label: "Sync Error",
        className: "bg-destructive/15 text-destructive border-destructive/30",
      };
    default:
      return null;
  }
}

export function SyncStatusBar() {
  const { status } = useSyncContext();
  const config = getConfig(status);

  if (!config) return null;

  const isSaving = status === "saving";

  return (
    <div
      data-ocid="sync.status_toast"
      className={`fixed top-3 right-3 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium shadow-sm transition-all duration-300 ${config.className} ${isSaving ? "animate-pulse" : ""}`}
      style={{
        maxWidth: "calc(min(430px, 100vw) - 24px)",
        right: "calc(max((100vw - 430px) / 2, 0px) + 12px)",
      }}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
