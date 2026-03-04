import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  FolderOpen,
  Image,
  Loader2,
  Phone,
  Plus,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Site } from "../backend.d";
import {
  Variant_upi_cash_bankTransfer_cheque as PayMode,
  Variant_miscExpense_labourPayment_paymentReceived_materialPurchase as TxType,
} from "../backend.d";
import type { Labour } from "../backend.d";
import LabourPaymentSheet from "../components/app/LabourPaymentSheet";
import {
  useAddLabour,
  useAddTransaction,
  useLabourBySite,
  useTransactionsBySite,
} from "../hooks/useQueries";
import { useSyncContext } from "../hooks/useSyncStatus";
import {
  formatDate,
  formatINR,
  getInitials,
  paymentModeLabels,
  todayISO,
  transactionTypeLabels,
  txTypeClass,
} from "../utils/helpers";

interface SiteFile {
  name: string;
  uploadedAt: string;
  category: "photo" | "document";
}

interface Props {
  site: Site;
  onBack: () => void;
}

const getSiteFilesKey = (siteId: string) => `sd-site-files-${siteId}`;

function loadSiteFiles(siteId: string): SiteFile[] {
  try {
    const raw = localStorage.getItem(getSiteFilesKey(siteId));
    if (!raw) return [];
    return JSON.parse(raw) as SiteFile[];
  } catch {
    return [];
  }
}

function saveSiteFiles(siteId: string, files: SiteFile[]): void {
  localStorage.setItem(getSiteFilesKey(siteId), JSON.stringify(files));
}

export default function SiteDetailScreen({ site, onBack }: Props) {
  const { data: transactions, isLoading: txLoading } = useTransactionsBySite(
    site.id,
  );
  const { data: labourList, isLoading: labourLoading } = useLabourBySite(
    site.id,
  );
  const addTransaction = useAddTransaction();
  const addLabour = useAddLabour();
  const { enqueueFileUpload, isConnected, isOnline } = useSyncContext();

  const [addTxOpen, setAddTxOpen] = useState(false);
  const [addLabourOpen, setAddLabourOpen] = useState(false);
  const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null);
  const [siteFiles, setSiteFiles] = useState<SiteFile[]>(() =>
    loadSiteFiles(site.id.toString()),
  );
  const [photoUploading, setPhotoUploading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [txForm, setTxForm] = useState({
    transactionType: TxType.paymentReceived as string,
    date: todayISO(),
    amount: "",
    notes: "",
    paymentMode: PayMode.cash as string,
  });

  const [labourForm, setLabourForm] = useState({
    name: "",
    phone: "",
    workType: "",
    dailyWage: "",
  });
  const [txErrors, setTxErrors] = useState<Record<string, string>>({});
  const [labourErrors, setLabourErrors] = useState<Record<string, string>>({});

  // File upload handlers
  const handleFileUpload = async (
    file: File,
    category: "photo" | "document",
  ) => {
    const setLoading =
      category === "photo" ? setPhotoUploading : setDocUploading;
    setLoading(true);
    try {
      await enqueueFileUpload(
        file,
        category === "photo" ? "photos" : "documents",
        site.siteName,
      );

      const newFile: SiteFile = {
        name: file.name,
        uploadedAt: new Date().toISOString(),
        category,
      };
      setSiteFiles((prev) => {
        const updated = [newFile, ...prev];
        saveSiteFiles(site.id.toString(), updated);
        return updated;
      });

      if (!isOnline) {
        toast.info("File queued. Will sync when online.");
      } else if (!isConnected) {
        toast.info("Saved locally. Connect Drive to sync.");
      } else {
        toast.success("File uploaded to Drive!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Compute site financials
  const totalReceived =
    transactions
      ?.filter((t) => t.transactionType === TxType.paymentReceived)
      .reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const totalSpent =
    transactions
      ?.filter((t) => t.transactionType !== TxType.paymentReceived)
      .reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const balance = totalReceived - totalSpent;

  const handleAddTransaction = async () => {
    const errs: Record<string, string> = {};
    if (!txForm.amount || Number.isNaN(Number(txForm.amount)))
      errs.amount = "Enter a valid amount";
    if (!txForm.date) errs.date = "Required";
    setTxErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await addTransaction.mutateAsync({
        siteId: site.id,
        transactionType: txForm.transactionType as TxType,
        date: txForm.date,
        amount: BigInt(Math.round(Number(txForm.amount))),
        notes: txForm.notes,
        paymentMode: txForm.paymentMode as PayMode,
      });
      toast.success("Transaction added!");
      setAddTxOpen(false);
      setTxForm({
        transactionType: TxType.paymentReceived,
        date: todayISO(),
        amount: "",
        notes: "",
        paymentMode: PayMode.cash,
      });
    } catch {
      toast.error("Failed to add transaction.");
    }
  };

  const handleAddLabour = async () => {
    const errs: Record<string, string> = {};
    if (!labourForm.name.trim()) errs.name = "Required";
    if (!labourForm.phone.trim()) errs.phone = "Required";
    if (!labourForm.workType.trim()) errs.workType = "Required";
    if (!labourForm.dailyWage || Number.isNaN(Number(labourForm.dailyWage)))
      errs.dailyWage = "Enter valid wage";
    setLabourErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await addLabour.mutateAsync({
        siteId: site.id,
        name: labourForm.name.trim(),
        phone: labourForm.phone.trim(),
        workType: labourForm.workType.trim(),
        dailyWage: BigInt(Math.round(Number(labourForm.dailyWage))),
      });
      toast.success("Labour added!");
      setAddLabourOpen(false);
      setLabourForm({ name: "", phone: "", workType: "", dailyWage: "" });
    } catch {
      toast.error("Failed to add labour.");
    }
  };

  if (selectedLabour) {
    return (
      <LabourPaymentSheet
        labour={selectedLabour}
        onBack={() => setSelectedLabour(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scroll-hide">
      {/* Header */}
      <header className="bg-primary px-5 pt-12 pb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-primary-foreground/5 rounded-bl-full" />
        <div className="relative z-10">
          <button
            type="button"
            data-ocid="site_detail.back_button"
            onClick={onBack}
            className="flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">All Sites</span>
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-display font-black text-primary-foreground leading-tight">
                {site.siteName}
              </h1>
              <p className="text-primary-foreground/70 text-xs mt-0.5">
                {site.clientName}
              </p>
            </div>
            <Badge
              className={
                site.isActive
                  ? "bg-primary-foreground/15 text-primary-foreground border-0 text-xs flex-shrink-0"
                  : "bg-primary-foreground/10 text-primary-foreground/60 border-0 text-xs flex-shrink-0"
              }
            >
              {site.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-card rounded-xl p-3 shadow-xs text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-chart-2" />
            </div>
            {txLoading ? (
              <Skeleton className="h-5 w-16 mx-auto" />
            ) : (
              <p className="text-sm font-display font-bold text-chart-2">
                {formatINR(totalReceived)}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">Received</p>
          </div>
          <div className="bg-card rounded-xl p-3 shadow-xs text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingDown className="w-4 h-4 text-chart-3" />
            </div>
            {txLoading ? (
              <Skeleton className="h-5 w-16 mx-auto" />
            ) : (
              <p className="text-sm font-display font-bold text-chart-3">
                {formatINR(totalSpent)}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">Spent</p>
          </div>
          <div className="bg-card rounded-xl p-3 shadow-xs text-center">
            <div className="flex items-center justify-center mb-1">
              <Wallet
                className={`w-4 h-4 ${balance >= 0 ? "text-chart-2" : "text-destructive"}`}
              />
            </div>
            {txLoading ? (
              <Skeleton className="h-5 w-16 mx-auto" />
            ) : (
              <p
                className={`text-sm font-display font-bold ${balance >= 0 ? "text-chart-2" : "text-destructive"}`}
              >
                {formatINR(balance)}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">Balance</p>
          </div>
        </div>

        {/* Tabs: Transactions | Labour | Files */}
        <Tabs defaultValue="transactions">
          <TabsList className="w-full mb-4">
            <TabsTrigger
              data-ocid="site_detail.transactions_tab"
              value="transactions"
              className="flex-1 text-xs"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger
              data-ocid="site_detail.labour_tab"
              value="labour"
              className="flex-1 text-xs"
            >
              Labour
            </TabsTrigger>
            <TabsTrigger
              data-ocid="site_detail.files_tab"
              value="files"
              className="flex-1 text-xs"
            >
              Files
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                All Transactions
              </h3>
              <Button
                data-ocid="site_detail.add_transaction_button"
                size="sm"
                onClick={() => setAddTxOpen(true)}
                className="h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>

            {txLoading ? (
              <div
                data-ocid="site_detail.transactions_list"
                className="space-y-2"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <div
                data-ocid="site_detail.transactions_empty_state"
                className="bg-card rounded-2xl p-8 text-center"
              >
                <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium text-foreground text-sm">
                  No transactions
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add your first transaction
                </p>
                <Button
                  data-ocid="site_detail.add_transaction_button"
                  size="sm"
                  className="mt-3 h-8"
                  onClick={() => setAddTxOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Transaction
                </Button>
              </div>
            ) : (
              <div
                data-ocid="site_detail.transactions_list"
                className="space-y-2"
              >
                {transactions.map((txn, idx) => (
                  <div
                    key={txn.id.toString()}
                    data-ocid={`site_detail.transactions_list.item.${idx + 1}`}
                    className="bg-card rounded-xl p-3 flex items-center gap-3 shadow-xs"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 font-semibold ${txTypeClass(txn.transactionType)}`}
                    >
                      {txn.transactionType === "paymentReceived"
                        ? "↓"
                        : txn.transactionType === "materialPurchase"
                          ? "🧱"
                          : txn.transactionType === "labourPayment"
                            ? "👷"
                            : "📋"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {transactionTypeLabels[txn.transactionType]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(txn.date)} ·{" "}
                        {paymentModeLabels[txn.paymentMode]}
                        {txn.notes && ` · ${txn.notes}`}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-bold flex-shrink-0 ${
                        txn.transactionType === "paymentReceived"
                          ? "text-chart-2"
                          : "text-foreground"
                      }`}
                    >
                      {txn.transactionType === "paymentReceived" ? "+" : "-"}
                      {formatINR(txn.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <div className="space-y-3">
              {/* Connection hint */}
              {!isConnected && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Connect Google Drive from the Cloud tab to sync files.
                  </p>
                </div>
              )}

              {/* Site Photos upload */}
              <div className="bg-card rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Image className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Site Photos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Upload to Photos folder
                    </p>
                  </div>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  data-ocid="site_detail.photo_upload_button"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFileUpload(f, "photo");
                    if (photoInputRef.current) photoInputRef.current.value = "";
                  }}
                />
                <Button
                  data-ocid="site_detail.photo_button"
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs"
                  disabled={photoUploading}
                  onClick={() => photoInputRef.current?.click()}
                >
                  {photoUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Add Photo
                    </>
                  )}
                </Button>
              </div>

              {/* Documents/Bills upload */}
              <div className="bg-card rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Documents / Bills
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Upload to Documents folder
                    </p>
                  </div>
                </div>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xlsx,.txt,image/*"
                  className="hidden"
                  data-ocid="site_detail.document_upload_button"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFileUpload(f, "document");
                    if (docInputRef.current) docInputRef.current.value = "";
                  }}
                />
                <Button
                  data-ocid="site_detail.document_button"
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs"
                  disabled={docUploading}
                  onClick={() => docInputRef.current?.click()}
                >
                  {docUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Add Document
                    </>
                  )}
                </Button>
              </div>

              {/* Uploaded files list */}
              {siteFiles.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
                    Uploaded Files
                  </h3>
                  <div className="space-y-2">
                    {siteFiles.map((f, idx) => (
                      <div
                        key={`${f.name}-${f.uploadedAt}`}
                        data-ocid={`site_detail.files_list.item.${idx + 1}`}
                        className="bg-card rounded-xl p-3 flex items-center gap-3 shadow-xs"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            f.category === "photo"
                              ? "bg-emerald-500/10"
                              : "bg-purple-500/10"
                          }`}
                        >
                          {f.category === "photo" ? (
                            <Image className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <FileText className="w-4 h-4 text-purple-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {f.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {f.category === "photo" ? "Photo" : "Document"} ·{" "}
                            {new Date(f.uploadedAt).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0.5 h-auto flex-shrink-0"
                        >
                          Queued
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {siteFiles.length === 0 && (
                <div
                  data-ocid="site_detail.files_empty_state"
                  className="bg-card rounded-2xl p-8 text-center"
                >
                  <FolderOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium text-foreground text-sm">
                    No files yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload photos and documents for this site
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Labour Tab */}
          <TabsContent value="labour">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Labour on Site
              </h3>
              <Button
                data-ocid="site_detail.add_labour_button"
                size="sm"
                onClick={() => setAddLabourOpen(true)}
                className="h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>

            {labourLoading ? (
              <div data-ocid="site_detail.labour_list" className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : !labourList || labourList.length === 0 ? (
              <div
                data-ocid="site_detail.labour_empty_state"
                className="bg-card rounded-2xl p-8 text-center"
              >
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium text-foreground text-sm">
                  No labour yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add workers for this site
                </p>
                <Button
                  data-ocid="site_detail.add_labour_button"
                  size="sm"
                  className="mt-3 h-8"
                  onClick={() => setAddLabourOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Labour
                </Button>
              </div>
            ) : (
              <div data-ocid="site_detail.labour_list" className="space-y-2">
                {labourList.map((labour, idx) => (
                  <button
                    type="button"
                    key={labour.id.toString()}
                    data-ocid={`site_detail.labour_list.item.${idx + 1}`}
                    onClick={() => setSelectedLabour(labour)}
                    className="w-full bg-card rounded-xl p-3 flex items-center gap-3 shadow-xs text-left hover:shadow-card-md transition-shadow active:scale-[0.99]"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {getInitials(labour.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {labour.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {labour.workType}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-foreground">
                        {formatINR(labour.dailyWage)}/day
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {labour.phone}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Transaction Sheet */}
      <Sheet open={addTxOpen} onOpenChange={setAddTxOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl px-5 pb-8 max-w-[430px] mx-auto"
        >
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="font-display text-xl">
              Add Transaction
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto max-h-[60vh] scroll-hide">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Transaction Type</Label>
              <Select
                value={txForm.transactionType}
                onValueChange={(v) =>
                  setTxForm((p) => ({ ...p, transactionType: v }))
                }
              >
                <SelectTrigger
                  data-ocid="add_transaction.type_select"
                  className="h-11"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TxType.paymentReceived}>
                    Payment Received
                  </SelectItem>
                  <SelectItem value={TxType.materialPurchase}>
                    Material Purchase
                  </SelectItem>
                  <SelectItem value={TxType.labourPayment}>
                    Labour Payment
                  </SelectItem>
                  <SelectItem value={TxType.miscExpense}>
                    Misc Expense
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Date</Label>
              <Input
                data-ocid="add_transaction.date_input"
                type="date"
                value={txForm.date}
                onChange={(e) =>
                  setTxForm((p) => ({ ...p, date: e.target.value }))
                }
                className="h-11"
              />
              {txErrors.date && (
                <p className="text-destructive text-xs">{txErrors.date}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Amount (₹)</Label>
              <Input
                data-ocid="add_transaction.amount_input"
                type="number"
                placeholder="e.g. 50000"
                value={txForm.amount}
                onChange={(e) =>
                  setTxForm((p) => ({ ...p, amount: e.target.value }))
                }
                className="h-11"
              />
              {txErrors.amount && (
                <p className="text-destructive text-xs">{txErrors.amount}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Notes (optional)</Label>
              <Textarea
                data-ocid="add_transaction.notes_textarea"
                placeholder="Add any notes..."
                value={txForm.notes}
                onChange={(e) =>
                  setTxForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Payment Mode</Label>
              <Select
                value={txForm.paymentMode}
                onValueChange={(v) =>
                  setTxForm((p) => ({ ...p, paymentMode: v }))
                }
              >
                <SelectTrigger
                  data-ocid="add_transaction.payment_mode_select"
                  className="h-11"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PayMode.cash}>Cash</SelectItem>
                  <SelectItem value={PayMode.upi}>UPI</SelectItem>
                  <SelectItem value={PayMode.bankTransfer}>
                    Bank Transfer
                  </SelectItem>
                  <SelectItem value={PayMode.cheque}>Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="mt-5 flex-row gap-3">
            <SheetClose asChild>
              <Button
                data-ocid="add_transaction.cancel_button"
                variant="outline"
                className="flex-1 h-11"
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              data-ocid="add_transaction.submit_button"
              onClick={handleAddTransaction}
              disabled={addTransaction.isPending}
              className="flex-1 h-11"
            >
              {addTransaction.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...
                </>
              ) : (
                "Add Transaction"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Add Labour Sheet */}
      <Sheet open={addLabourOpen} onOpenChange={setAddLabourOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl px-5 pb-8 max-w-[430px] mx-auto"
        >
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="font-display text-xl">Add Labour</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto max-h-[55vh] scroll-hide">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Full Name</Label>
              <Input
                data-ocid="add_labour.name_input"
                placeholder="e.g. Ramesh Singh"
                value={labourForm.name}
                onChange={(e) =>
                  setLabourForm((p) => ({ ...p, name: e.target.value }))
                }
                className="h-11"
              />
              {labourErrors.name && (
                <p className="text-destructive text-xs">{labourErrors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Phone Number</Label>
              <Input
                data-ocid="add_labour.phone_input"
                type="tel"
                placeholder="e.g. 9876543210"
                value={labourForm.phone}
                onChange={(e) =>
                  setLabourForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="h-11"
              />
              {labourErrors.phone && (
                <p className="text-destructive text-xs">{labourErrors.phone}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Work Type</Label>
              <Input
                data-ocid="add_labour.work_type_input"
                placeholder="e.g. Mason, Plumber, Electrician"
                value={labourForm.workType}
                onChange={(e) =>
                  setLabourForm((p) => ({ ...p, workType: e.target.value }))
                }
                className="h-11"
              />
              {labourErrors.workType && (
                <p className="text-destructive text-xs">
                  {labourErrors.workType}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Daily Wage (₹)</Label>
              <Input
                data-ocid="add_labour.wage_input"
                type="number"
                placeholder="e.g. 800"
                value={labourForm.dailyWage}
                onChange={(e) =>
                  setLabourForm((p) => ({ ...p, dailyWage: e.target.value }))
                }
                className="h-11"
              />
              {labourErrors.dailyWage && (
                <p className="text-destructive text-xs">
                  {labourErrors.dailyWage}
                </p>
              )}
            </div>
          </div>
          <SheetFooter className="mt-5 flex-row gap-3">
            <SheetClose asChild>
              <Button
                data-ocid="add_labour.cancel_button"
                variant="outline"
                className="flex-1 h-11"
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              data-ocid="add_labour.submit_button"
              onClick={handleAddLabour}
              disabled={addLabour.isPending}
              className="flex-1 h-11"
            >
              {addLabour.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...
                </>
              ) : (
                "Add Labour"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
