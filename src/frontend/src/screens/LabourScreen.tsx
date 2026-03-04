import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Phone, Users } from "lucide-react";
import { useState } from "react";
import type { Labour } from "../backend.d";
import LabourPaymentSheet from "../components/app/LabourPaymentSheet";
import { useAllLabour, useSites } from "../hooks/useQueries";
import { formatINR, getInitials } from "../utils/helpers";

export default function LabourScreen() {
  const { data: allLabour, isLoading } = useAllLabour();
  const { data: sites } = useSites();
  const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null);

  const getSiteName = (siteId: bigint) => {
    return sites?.find((s) => s.id === siteId)?.siteName ?? `Site #${siteId}`;
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
          <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider mb-0.5">
            SD Corp
          </p>
          <h1 className="text-2xl font-display font-black text-primary-foreground">
            Labour
          </h1>
        </div>
      </header>

      <div className="px-4 py-4 flex-1">
        {isLoading ? (
          <div data-ocid="labour.list" className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : !allLabour || allLabour.length === 0 ? (
          <div
            data-ocid="labour.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-foreground text-lg mb-1">
              No Labour Yet
            </h3>
            <p className="text-muted-foreground text-sm max-w-52">
              Labour workers added to sites will appear here
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3 px-1">
              {allLabour.length} worker{allLabour.length !== 1 ? "s" : ""}{" "}
              across all sites
            </p>
            <div data-ocid="labour.list" className="space-y-2">
              {allLabour.map((labour, idx) => (
                <button
                  type="button"
                  key={labour.id.toString()}
                  data-ocid={`labour.item.${idx + 1}`}
                  onClick={() => setSelectedLabour(labour)}
                  className="w-full bg-card rounded-2xl p-4 flex items-center gap-3 shadow-card text-left hover:shadow-card-md transition-shadow active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {getInitials(labour.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      {labour.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{labour.workType}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{labour.phone}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      📍 {getSiteName(labour.siteId)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-primary">
                      {formatINR(labour.dailyWage)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">/day</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
