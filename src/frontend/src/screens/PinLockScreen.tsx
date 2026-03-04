import { HardHat, LogOut } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PinDots, PinPad } from "../components/app/PinPad";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useVerifyPin } from "../hooks/useQueries";
import { hashPin } from "../utils/helpers";

interface Props {
  onUnlocked: () => void;
  onLogout: () => void;
}

const PIN_LENGTH = 4;

export default function PinLockScreen({ onUnlocked, onLogout }: Props) {
  const verifyPin = useVerifyPin();
  const { clear } = useInternetIdentity();
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleDigit = (digit: string) => {
    if (verifyPin.isPending) return;
    if (digit === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (digit === "") return;
    if (pin.length >= PIN_LENGTH) return;

    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      setTimeout(async () => {
        try {
          const hashed = await hashPin(newPin);
          const valid = await verifyPin.mutateAsync(hashed);
          if (valid) {
            onUnlocked();
          } else {
            triggerShake();
            toast.error("Incorrect PIN. Please try again.");
            setPin("");
          }
        } catch {
          toast.error("Verification failed. Please try again.");
          setPin("");
        }
      }, 200);
    }
  };

  const handleLogout = () => {
    clear();
    onLogout();
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-between px-6 py-12">
      {/* Top */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-card-md">
          <HardHat className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-display font-black text-foreground tracking-tight">
          SD Corp
        </h1>
        <p className="text-sm text-muted-foreground">
          Construction Business Manager
        </p>
      </div>

      {/* Center */}
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="text-center">
          <h2 className="text-xl font-display font-bold text-foreground mb-1">
            Enter PIN
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your 4-digit PIN to unlock
          </p>
        </div>

        <PinDots value={pin} shake={shake} ocid="pin_lock.input" />
      </div>

      {/* Number pad */}
      <div className="flex flex-col items-center gap-3 w-full">
        {verifyPin.isPending ? (
          <div className="flex flex-col gap-3 w-full max-w-xs items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying...</p>
          </div>
        ) : (
          <PinPad
            value={pin}
            onDigit={handleDigit}
            shake={shake}
            disabled={verifyPin.isPending}
            submitOcid="pin_lock.submit_button"
          />
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 mt-2 text-muted-foreground hover:text-destructive transition-colors text-sm py-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
