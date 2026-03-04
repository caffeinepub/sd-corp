import { Delete } from "lucide-react";

const DIGIT_ROWS = [
  [
    { digit: "1", key: "d1" },
    { digit: "2", key: "d2" },
    { digit: "3", key: "d3" },
  ],
  [
    { digit: "4", key: "d4" },
    { digit: "5", key: "d5" },
    { digit: "6", key: "d6" },
  ],
  [
    { digit: "7", key: "d7" },
    { digit: "8", key: "d8" },
    { digit: "9", key: "d9" },
  ],
  [
    { digit: "", key: "empty" },
    { digit: "0", key: "d0" },
    { digit: "⌫", key: "backspace" },
  ],
] as const;

const PIN_DOTS = ["pos0", "pos1", "pos2", "pos3"] as const;

interface PinPadProps {
  value: string;
  pinLength?: number;
  onDigit: (digit: string) => void;
  shake?: boolean;
  dotOcid?: string;
  disabled?: boolean;
  /** ocid for the "0" key (used as submit indicator) */
  submitOcid?: string;
}

export function PinDots({
  value,
  shake = false,
  ocid,
}: { value: string; shake?: boolean; ocid?: string }) {
  return (
    <div
      data-ocid={ocid}
      className={`flex gap-4 ${shake ? "animate-pin-shake" : ""}`}
    >
      {PIN_DOTS.map((pos, i) => (
        <div
          key={pos}
          className={`pin-dot ${i < value.length ? "pin-dot-filled" : ""}`}
        />
      ))}
    </div>
  );
}

export function PinPad({ onDigit, disabled, submitOcid }: PinPadProps) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      {DIGIT_ROWS.map((row) => (
        <div
          key={row[0].key.slice(0, 1) + row[1].key}
          className="flex gap-3 justify-center"
        >
          {row.map(({ digit, key }) => (
            <button
              type="button"
              key={key}
              data-ocid={key === "d0" && submitOcid ? submitOcid : undefined}
              onClick={() => onDigit(digit)}
              disabled={disabled}
              className={`pin-digit ${digit === "" ? "invisible" : ""} ${
                digit === "⌫" ? "bg-secondary text-secondary-foreground" : ""
              } disabled:opacity-50`}
            >
              {digit === "⌫" ? <Delete className="w-5 h-5" /> : digit}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
