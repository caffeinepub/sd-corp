import { Button } from "@/components/ui/button";
import { HardHat } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PinDots, PinPad } from "../components/app/PinPad";
import { useSetPin } from "../hooks/useQueries";
import { hashPin } from "../utils/helpers";

interface Props {
  onPinSet: () => void;
}

const PIN_LENGTH = 4;

export default function PinSetupScreen({ onPinSet }: Props) {
  const setPin = useSetPin();
  const [pin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [shake, setShake] = useState(false);

  const currentPin = step === "enter" ? pin : confirmPin;

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleDigit = (digit: string) => {
    if (digit === "⌫") {
      if (step === "enter") setNewPin((p) => p.slice(0, -1));
      else setConfirmPin((p) => p.slice(0, -1));
      return;
    }
    if (digit === "") return;
    if (currentPin.length >= PIN_LENGTH) return;

    if (step === "enter") {
      const updated = pin + digit;
      setNewPin(updated);
      if (updated.length === PIN_LENGTH) {
        setTimeout(() => setStep("confirm"), 300);
      }
    } else {
      const updated = confirmPin + digit;
      setConfirmPin(updated);
      if (updated.length === PIN_LENGTH) {
        setTimeout(async () => {
          if (updated !== pin) {
            triggerShake();
            toast.error("PINs don't match. Please try again.");
            setNewPin("");
            setConfirmPin("");
            setStep("enter");
          } else {
            try {
              const hashed = await hashPin(updated);
              await setPin.mutateAsync(hashed);
              toast.success("PIN set successfully!");
              onPinSet();
            } catch {
              toast.error("Failed to set PIN. Please try again.");
              setNewPin("");
              setConfirmPin("");
              setStep("enter");
            }
          }
        }, 300);
      }
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-between px-6 py-12">
      {/* Top */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-card-md">
          <HardHat className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display font-black text-foreground">
          SD Corp
        </h1>
      </div>

      {/* Center */}
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="text-center">
          <h2 className="text-xl font-display font-bold text-foreground mb-1">
            {step === "enter" ? "Set Your PIN" : "Confirm Your PIN"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {step === "enter"
              ? "Create a 4-digit PIN to secure your app"
              : "Re-enter your PIN to confirm"}
          </p>
        </div>

        <PinDots value={currentPin} shake={shake} ocid="pin_setup.input" />

        {/* Step indicator */}
        <div className="flex gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${step === "enter" ? "bg-primary" : "bg-primary/30"}`}
          />
          <div
            className={`w-2 h-2 rounded-full transition-colors ${step === "confirm" ? "bg-primary" : "bg-primary/30"}`}
          />
        </div>
      </div>

      {/* Number pad */}
      <div className="flex flex-col items-center gap-3 w-full">
        <PinPad
          value={currentPin}
          onDigit={handleDigit}
          shake={shake}
          submitOcid="pin_setup.submit_button"
        />

        {setPin.isPending && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Setting PIN...
            </span>
          </div>
        )}

        {step === "confirm" && !setPin.isPending && (
          <Button
            variant="ghost"
            className="mt-1 text-muted-foreground"
            onClick={() => {
              setNewPin("");
              setConfirmPin("");
              setStep("enter");
            }}
          >
            Start Over
          </Button>
        )}
      </div>
    </div>
  );
}
