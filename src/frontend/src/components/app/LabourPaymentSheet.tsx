import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Briefcase,
  IndianRupee,
  Loader2,
  Phone,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Labour } from "../../backend.d";
import { useAddLabourPayment, useLabourPayments } from "../../hooks/useQueries";
import {
  formatDate,
  formatINR,
  getInitials,
  todayISO,
} from "../../utils/helpers";

interface Props {
  labour: Labour;
  onBack: () => void;
}

export default function LabourPaymentSheet({ labour, onBack }: Props) {
  const { data: payments, isLoading } = useLabourPayments(labour.id);
  const addPayment = useAddLabourPayment();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: todayISO(), amount: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalPaid = payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!form.amount || Number.isNaN(Number(form.amount)))
      errs.amount = "Enter a valid amount";
    if (!form.date) errs.date = "Required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await addPayment.mutateAsync({
        labourId: labour.id,
        date: form.date,
        amount: BigInt(Math.round(Number(form.amount))),
        notes: form.notes,
      });
      toast.success("Payment recorded!");
      setShowForm(false);
      setForm({ date: todayISO(), amount: "", notes: "" });
    } catch {
      toast.error("Failed to record payment.");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scroll-hide">
      {/* Header */}
      <header className="bg-primary px-5 pt-12 pb-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-foreground/15 flex items-center justify-center">
            <span className="text-base font-bold text-primary-foreground">
              {getInitials(labour.name)}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-display font-black text-primary-foreground">
              {labour.name}
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1 text-primary-foreground/70 text-xs">
                <Briefcase className="w-3 h-3" />
                <span>{labour.workType}</span>
              </div>
              <div className="flex items-center gap-1 text-primary-foreground/70 text-xs">
                <Phone className="w-3 h-3" />
                <span>{labour.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-card rounded-xl p-3 shadow-xs">
            <div className="flex items-center gap-1.5 mb-1">
              <IndianRupee className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Daily Wage</p>
            </div>
            <p className="text-base font-display font-bold text-foreground">
              {formatINR(labour.dailyWage)}
            </p>
          </div>
          <div className="bg-card rounded-xl p-3 shadow-xs">
            <div className="flex items-center gap-1.5 mb-1">
              <IndianRupee className="w-4 h-4 text-chart-2" />
              <p className="text-xs text-muted-foreground">Total Paid</p>
            </div>
            <p className="text-base font-display font-bold text-chart-2">
              {formatINR(totalPaid)}
            </p>
          </div>
        </div>

        {/* Payment form */}
        {showForm ? (
          <div className="bg-card rounded-2xl p-4 mb-4 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Record Payment
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date</Label>
                <Input
                  data-ocid="labour_payments.date_input"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="h-10 text-sm"
                />
                {errors.date && (
                  <p className="text-destructive text-xs">{errors.date}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Amount (₹)</Label>
                <Input
                  data-ocid="labour_payments.amount_input"
                  type="number"
                  placeholder="e.g. 5000"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  className="h-10 text-sm"
                />
                {errors.amount && (
                  <p className="text-destructive text-xs">{errors.amount}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Notes (optional)</Label>
                <Textarea
                  data-ocid="labour_payments.notes_textarea"
                  placeholder="e.g. Week 1 payment"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="labour_payments.submit_button"
                size="sm"
                className="flex-1 h-9"
                onClick={handleSubmit}
                disabled={addPayment.isPending}
              >
                {addPayment.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Save Payment"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            data-ocid="labour_payments.add_button"
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full h-11 border-dashed border-primary/30 text-primary hover:bg-primary/5 mb-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        )}

        {/* Payment history */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Payment History
          </h3>

          {isLoading ? (
            <div data-ocid="labour_payments.list" className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : !payments || payments.length === 0 ? (
            <div
              data-ocid="labour_payments.empty_state"
              className="bg-card rounded-2xl p-8 text-center"
            >
              <IndianRupee className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">
                No payments recorded
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Record the first payment above
              </p>
            </div>
          ) : (
            <div data-ocid="labour_payments.list" className="space-y-2">
              {payments.map((payment, idx) => (
                <div
                  key={payment.id.toString()}
                  data-ocid={`labour_payments.list.item.${idx + 1}`}
                  className="bg-card rounded-xl p-3 flex items-center justify-between shadow-xs"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(payment.date)}
                    </p>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                  <p className="text-base font-bold text-chart-2">
                    {formatINR(payment.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
