/**
 * CloudStorageScreen - Google Drive cloud storage management screen.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Cloud,
  CloudOff,
  FileText,
  FolderOpen,
  HardDrive,
  Image,
  Loader2,
  MapPin,
  RefreshCw,
  Upload,
  Wallet,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { FileCategory } from "../hooks/useSyncStatus";
import { getLastBackupDate, useSyncContext } from "../hooks/useSyncStatus";
import { GOOGLE_CLIENT_ID } from "../utils/GoogleDriveService";

// ─── Folder Card ───────────────────────────────────────────────────────────────

interface FolderCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  category: FileCategory;
  accept: string;
  ocidBase: string;
  onUpload: (file: File, category: FileCategory) => Promise<void>;
}

function FolderCard({
  icon,
  iconBg,
  title,
  description,
  category,
  accept,
  ocidBase,
  onUpload,
}: FolderCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file, category);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. File will be queued for retry.");
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {description}
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
        data-ocid={`${ocidBase}.upload_button`}
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full h-9 text-xs"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        data-ocid={`${ocidBase}.button`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload File
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function CloudStorageScreen() {
  const {
    isConnected,
    isOnline,
    pendingCount,
    connectDrive,
    disconnectDrive,
    enqueueFileUpload,
    triggerBackup,
  } = useSyncContext();

  const [connecting, setConnecting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const lastBackup = getLastBackupDate();
  const isPlaceholder = GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID";

  const handleConnect = async () => {
    if (isPlaceholder) {
      toast.error("Please configure your Google API Client ID first.");
      return;
    }
    setConnecting(true);
    try {
      await connectDrive();
      toast.success("Google Drive connected successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect Google Drive. Check your Client ID.");
    } finally {
      setConnecting(false);
    }
  };

  const handleBackupNow = async () => {
    setBackingUp(true);
    try {
      await triggerBackup({
        date: new Date().toISOString().split("T")[0],
        app: "SD Corp",
        note: "Manual backup triggered by user",
        timestamp: new Date().toISOString(),
      });
      toast.success("Backup initiated!");
    } catch {
      toast.error("Backup failed.");
    } finally {
      setBackingUp(false);
    }
  };

  const handleUpload = async (file: File, category: FileCategory) => {
    await enqueueFileUpload(file, category);
    if (!isOnline) {
      toast.info("File queued. Will upload when back online.");
    } else if (!isConnected) {
      toast.info("File saved locally. Connect Google Drive to sync.");
    } else {
      toast.success("Uploading to Drive...");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scroll-hide">
      {/* Header */}
      <header className="bg-primary px-5 pt-12 pb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-primary-foreground/5 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-primary-foreground/3 rounded-full -translate-x-1/2 translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider mb-0.5">
            SD Corp
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-display font-black text-primary-foreground">
              Cloud Storage
            </h1>
            {/* Network status badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isOnline
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "bg-destructive/30 text-primary-foreground"
              }`}
            >
              {isOnline ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Client ID info banner */}
        {isPlaceholder && (
          <div
            data-ocid="cloud.error_state"
            className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Setup Required
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                To enable Google Drive, add your Google API Client ID in{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-[10px]">
                  src/utils/GoogleDriveService.ts
                </code>
                . Get one at{" "}
                <span className="text-primary">console.cloud.google.com</span>.
              </p>
            </div>
          </div>
        )}

        {/* Connection Card */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Google Drive
            </h2>
          </div>

          {isConnected ? (
            <div>
              <div
                data-ocid="cloud.success_state"
                className="flex items-center gap-3 mb-4"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Connected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Files sync to SD_CORP_DATA folder
                  </p>
                </div>
              </div>

              {/* Pending count */}
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 mb-3 bg-amber-500/10 rounded-xl px-3 py-2">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    {pendingCount} file{pendingCount !== 1 ? "s" : ""} pending
                    sync
                  </p>
                  <Badge className="ml-auto bg-amber-500/20 text-amber-700 dark:text-amber-300 border-0 text-[10px] px-1.5">
                    {pendingCount}
                  </Badge>
                </div>
              )}

              <div className="flex gap-2">
                <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2 text-center">
                  <FolderOpen className="w-4 h-4 text-primary mx-auto mb-0.5" />
                  <p className="text-[10px] text-muted-foreground">
                    SD_CORP_DATA
                  </p>
                </div>
                <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2 text-center">
                  <Archive className="w-4 h-4 text-primary mx-auto mb-0.5" />
                  <p className="text-[10px] text-muted-foreground">
                    SD_CORP_BACKUPS
                  </p>
                </div>
              </div>

              <Button
                data-ocid="cloud.secondary_button"
                variant="outline"
                size="sm"
                className="w-full mt-3 h-9 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={disconnectDrive}
              >
                <CloudOff className="w-3.5 h-3.5 mr-1.5" />
                Disconnect Drive
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <HardDrive className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Not connected
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Files upload to <strong>SD_CORP_DATA</strong> on your Google
                    Drive
                  </p>
                </div>
              </div>

              <Button
                data-ocid="cloud.primary_button"
                className="w-full h-11"
                onClick={handleConnect}
                disabled={connecting || !isOnline}
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 mr-2" />
                    Connect Google Drive
                  </>
                )}
              </Button>
              {!isOnline && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Internet connection required to connect
                </p>
              )}
            </div>
          )}
        </div>

        {/* Folder Structure (only when connected) */}
        {isConnected && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 px-1">
                Upload to Drive
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <FolderCard
                  icon={<MapPin className="w-5 h-5 text-blue-500" />}
                  iconBg="bg-blue-500/10"
                  title="Sites"
                  description="Site-related files"
                  category="sites"
                  accept="image/*,application/pdf,.doc,.docx,.xlsx,.xls,.txt"
                  ocidBase="cloud.sites"
                  onUpload={handleUpload}
                />
                <FolderCard
                  icon={<FileText className="w-5 h-5 text-purple-500" />}
                  iconBg="bg-purple-500/10"
                  title="Documents"
                  description="Bills & contracts"
                  category="documents"
                  accept="image/*,application/pdf,.doc,.docx,.xlsx,.xls,.txt"
                  ocidBase="cloud.documents"
                  onUpload={handleUpload}
                />
                <FolderCard
                  icon={<Image className="w-5 h-5 text-emerald-500" />}
                  iconBg="bg-emerald-500/10"
                  title="Photos"
                  description="Site photographs"
                  category="photos"
                  accept="image/*"
                  ocidBase="cloud.photos"
                  onUpload={handleUpload}
                />
                <FolderCard
                  icon={<Wallet className="w-5 h-5 text-orange-500" />}
                  iconBg="bg-orange-500/10"
                  title="Transactions"
                  description="Payment receipts"
                  category="transactions"
                  accept="image/*,application/pdf,.doc,.docx,.xlsx,.xls,.txt"
                  ocidBase="cloud.transactions"
                  onUpload={handleUpload}
                />
              </div>
            </div>

            {/* Daily Backup Section */}
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Archive className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Daily Backup
                </h2>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Last backup</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {lastBackup
                      ? new Date(lastBackup).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Never"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-xl px-3 py-1.5">
                  <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    SD_CORP_BACKUPS
                  </span>
                </div>
              </div>
              <Button
                data-ocid="cloud.save_button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                onClick={handleBackupNow}
                disabled={backingUp}
              >
                {backingUp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5 mr-1.5" />
                    Backup Now
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Offline storage info when not connected */}
        {!isConnected && (
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <HardDrive className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Local Storage Active
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Files are queued locally when offline. Connect Google Drive to
                  sync them automatically.
                </p>
                {pendingCount > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0 text-xs">
                      {pendingCount} pending
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      will sync on connection
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Drive Folder Structure Info */}
        <div className="bg-muted/40 rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Drive Structure
          </p>
          <div className="space-y-1.5">
            {[
              { label: "SD_CORP_DATA/Sites", icon: "📁" },
              { label: "SD_CORP_DATA/Documents", icon: "📄" },
              { label: "SD_CORP_DATA/Photos", icon: "🖼️" },
              { label: "SD_CORP_DATA/Transactions", icon: "💳" },
              { label: "SD_CORP_BACKUPS", icon: "🗄️" },
            ].map(({ label, icon }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-sm">{icon}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}
