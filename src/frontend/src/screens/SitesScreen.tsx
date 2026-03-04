import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Calendar,
  ChevronRight,
  DollarSign,
  Loader2,
  MapPin,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Site } from "../backend.d";
import { useCreateSite, useSites } from "../hooks/useQueries";
import { formatDate, formatINR, todayISO } from "../utils/helpers";
import SiteDetailScreen from "./SiteDetailScreen";

interface Props {
  selectedSite: Site | null;
  onSelectSite: (site: Site | null) => void;
}

export default function SitesScreen({ selectedSite, onSelectSite }: Props) {
  const { data: sites, isLoading } = useSites();
  const createSite = useCreateSite();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({
    siteName: "",
    clientName: "",
    location: "",
    startDate: todayISO(),
    totalProjectAmount: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (selectedSite) {
    return (
      <SiteDetailScreen site={selectedSite} onBack={() => onSelectSite(null)} />
    );
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.siteName.trim()) errs.siteName = "Required";
    if (!form.clientName.trim()) errs.clientName = "Required";
    if (!form.location.trim()) errs.location = "Required";
    if (!form.startDate) errs.startDate = "Required";
    if (
      !form.totalProjectAmount ||
      Number.isNaN(Number(form.totalProjectAmount))
    )
      errs.totalProjectAmount = "Enter a valid amount";
    return errs;
  };

  const handleCreate = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      await createSite.mutateAsync({
        siteName: form.siteName.trim(),
        clientName: form.clientName.trim(),
        location: form.location.trim(),
        startDate: form.startDate,
        totalProjectAmount: BigInt(Math.round(Number(form.totalProjectAmount))),
      });
      toast.success("Site created successfully!");
      setSheetOpen(false);
      setForm({
        siteName: "",
        clientName: "",
        location: "",
        startDate: todayISO(),
        totalProjectAmount: "",
      });
      setErrors({});
    } catch {
      toast.error("Failed to create site.");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scroll-hide">
      {/* Header */}
      <header className="bg-primary px-5 pt-12 pb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-primary-foreground/5 rounded-bl-full" />
        <div className="relative z-10">
          <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider mb-0.5">
            SD Corp
          </p>
          <h1 className="text-2xl font-display font-black text-primary-foreground">
            Sites
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4 flex-1">
        {isLoading ? (
          <div className="space-y-3" data-ocid="sites.list">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : !sites || sites.length === 0 ? (
          <div
            data-ocid="sites.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-foreground text-lg mb-1">
              No Sites Yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-48">
              Create your first construction site to get started
            </p>
            <Button
              data-ocid="sites.create_button"
              onClick={() => setSheetOpen(true)}
              className="mt-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Site
            </Button>
          </div>
        ) : (
          <div data-ocid="sites.list" className="space-y-3">
            {sites.map((site, idx) => (
              <button
                type="button"
                key={site.id.toString()}
                data-ocid={`sites.item.${idx + 1}`}
                onClick={() => onSelectSite(site)}
                className="w-full bg-card rounded-2xl p-4 shadow-card text-left transition-all hover:shadow-card-md active:scale-[0.99]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-foreground text-base truncate">
                      {site.siteName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Client: {site.clientName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <Badge
                      variant={site.isActive ? "default" : "secondary"}
                      className={
                        site.isActive
                          ? "bg-chart-2/15 text-chart-2 border-0 text-xs"
                          : "text-xs"
                      }
                    >
                      {site.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{site.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{formatDate(site.startDate)}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <DollarSign className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>
                      Project Value: {formatINR(site.totalProjectAmount)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {sites && sites.length > 0 && (
        <button
          type="button"
          data-ocid="sites.create_button"
          onClick={() => setSheetOpen(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-card-md flex items-center justify-center z-40 hover:bg-primary/90 active:scale-95 transition-all max-w-[430px]"
          style={{ right: "calc(50% - 215px + 16px)" }}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Create Site Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl px-5 pb-8 max-w-[430px] mx-auto"
        >
          <SheetHeader className="mb-5 text-left">
            <SheetTitle className="font-display text-xl">
              Create New Site
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 overflow-y-auto max-h-[60vh] scroll-hide">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Site Name</Label>
              <Input
                data-ocid="create_site.name_input"
                placeholder="e.g. Rajesh Villa Phase 2"
                value={form.siteName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, siteName: e.target.value }))
                }
                className="h-11"
              />
              {errors.siteName && (
                <p className="text-destructive text-xs">{errors.siteName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Client Name</Label>
              <Input
                data-ocid="create_site.client_input"
                placeholder="e.g. Rajesh Kumar"
                value={form.clientName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clientName: e.target.value }))
                }
                className="h-11"
              />
              {errors.clientName && (
                <p className="text-destructive text-xs">{errors.clientName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Location</Label>
              <Input
                data-ocid="create_site.location_input"
                placeholder="e.g. Sector 14, Gurgaon"
                value={form.location}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: e.target.value }))
                }
                className="h-11"
              />
              {errors.location && (
                <p className="text-destructive text-xs">{errors.location}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Start Date</Label>
              <Input
                data-ocid="create_site.date_input"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startDate: e.target.value }))
                }
                className="h-11"
              />
              {errors.startDate && (
                <p className="text-destructive text-xs">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Total Project Amount (₹)
              </Label>
              <Input
                data-ocid="create_site.amount_input"
                type="number"
                placeholder="e.g. 2500000"
                value={form.totalProjectAmount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, totalProjectAmount: e.target.value }))
                }
                className="h-11"
              />
              {errors.totalProjectAmount && (
                <p className="text-destructive text-xs">
                  {errors.totalProjectAmount}
                </p>
              )}
            </div>
          </div>

          <SheetFooter className="mt-5 flex-row gap-3">
            <SheetClose asChild>
              <Button
                data-ocid="create_site.cancel_button"
                variant="outline"
                className="flex-1 h-11"
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              data-ocid="create_site.submit_button"
              onClick={handleCreate}
              disabled={createSite.isPending}
              className="flex-1 h-11"
            >
              {createSite.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Create Site"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
