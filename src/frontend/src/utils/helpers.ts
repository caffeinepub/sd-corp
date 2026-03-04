// Hash a PIN using Web Crypto API (SHA-256)
export async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(pin),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Format amount as Indian Rupee (₹1,23,456)
export function formatINR(amount: bigint | number): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  if (Number.isNaN(num)) return "₹0";
  // Indian number format
  const str = Math.abs(num).toString();
  let result = "";
  const len = str.length;
  if (len <= 3) {
    result = str;
  } else {
    result = str.slice(-3);
    let remaining = str.slice(0, -3);
    while (remaining.length > 2) {
      result = `${remaining.slice(-2)},${result}`;
      remaining = remaining.slice(0, -2);
    }
    result = `${remaining},${result}`;
  }
  return (num < 0 ? "-₹" : "₹") + result;
}

// Format a date string to DD/MM/YYYY
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  // Handle YYYY-MM-DD input
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Today's date in YYYY-MM-DD format
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// Get initials from a name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Transaction type display names
export const transactionTypeLabels: Record<string, string> = {
  paymentReceived: "Payment Received",
  materialPurchase: "Material Purchase",
  labourPayment: "Labour Payment",
  miscExpense: "Misc Expense",
};

// Payment mode display names
export const paymentModeLabels: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  bankTransfer: "Bank Transfer",
  cheque: "Cheque",
};

// Transaction type CSS class
export function txTypeClass(type: string): string {
  switch (type) {
    case "paymentReceived":
      return "tx-received";
    case "materialPurchase":
      return "tx-material";
    case "labourPayment":
      return "tx-labour";
    case "miscExpense":
      return "tx-misc";
    default:
      return "tx-misc";
  }
}

// Transaction type icon emoji
export function txTypeIcon(type: string): string {
  switch (type) {
    case "paymentReceived":
      return "↓";
    case "materialPurchase":
      return "🧱";
    case "labourPayment":
      return "👷";
    case "miscExpense":
      return "📋";
    default:
      return "💳";
  }
}
