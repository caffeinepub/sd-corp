import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  CreditCard,
  Moon,
  Sun,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { Site } from "../backend.d";
import {
  useDashboardStats,
  useRecentTransactions,
  useSites,
} from "../hooks/useQueries";
import {
  formatDate,
  formatINR,
  transactionTypeLabels,
  txTypeClass,
} from "../utils/helpers";

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectSite: (site: Site) => void;
}

export default function DashboardScreen({ darkMode, onToggleDarkMode }: Props) {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentTxns, isLoading: txnLoading } = useRecentTransactions(10);
  const { data: sites } = useSites();

  const totalReceived = stats?.totalReceived ?? BigInt(0);
  const totalGiven = stats?.totalGiven ?? BigInt(0);
  const profitLoss = Number(totalReceived) - Number(totalGiven);
  const activeSites = stats?.activeSites ?? BigInt(0);
  const isProfitable = profitLoss >= 0;

  const getSiteName = (siteId: bigint) => {
    return sites?.find((s) => s.id === siteId)?.siteName ?? `Site #${siteId}`;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scroll-hide">
      {/* Header */}
      <header className="bg-primary px-5 pt-12 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-primary-foreground/5 rounded-bl-full" />
        <div className="absolute bottom-0 left-4 w-20 h-20 bg-primary-foreground/3 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider mb-0.5">
              SD Corp
            </p>
            <h1 className="text-2xl font-display font-black text-primary-foreground">
              Dashboard
            </h1>
          </div>
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="w-9 h-9 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="px-4 -mt-2 pb-2">
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Active Sites */}
          <div
            data-ocid="dashboard.active_sites_card"
            className="bg-card rounded-2xl p-4 shadow-card stat-amber"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-chart-1/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-chart-1" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Sites
              </span>
            </div>
            {statsLoading ? (
              <Skeleton
                className="h-7 w-16"
                data-ocid="dashboard.active_sites_card.loading_state"
              />
            ) : (
              <p className="text-2xl font-display font-black text-foreground">
                {activeSites.toString()}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">Active Sites</p>
          </div>

          {/* Total Received */}
          <div
            data-ocid="dashboard.total_received_card"
            className="bg-card rounded-2xl p-4 shadow-card stat-green"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-chart-2" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                In
              </span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-lg font-display font-black text-foreground leading-tight">
                {formatINR(totalReceived)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              Total Received
            </p>
          </div>

          {/* Total Given */}
          <div
            data-ocid="dashboard.total_given_card"
            className="bg-card rounded-2xl p-4 shadow-card stat-blue"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-chart-3" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Out
              </span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-lg font-display font-black text-foreground leading-tight">
                {formatINR(totalGiven)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">Total Given</p>
          </div>

          {/* Profit/Loss */}
          <div
            data-ocid="dashboard.profit_loss_card"
            className={`bg-card rounded-2xl p-4 shadow-card ${isProfitable ? "stat-green" : "stat-red"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isProfitable ? "bg-chart-2/10" : "bg-destructive/10"
                }`}
              >
                <CreditCard
                  className={`w-4 h-4 ${isProfitable ? "text-chart-2" : "text-destructive"}`}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                P&L
              </span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p
                className={`text-lg font-display font-black leading-tight ${
                  isProfitable ? "text-chart-2" : "text-destructive"
                }`}
              >
                {isProfitable ? "+" : ""}
                {formatINR(profitLoss)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {isProfitable ? "Profit" : "Loss"}
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-6">
          <h2 className="text-base font-display font-bold text-foreground mb-3 px-1">
            Recent Transactions
          </h2>

          {txnLoading ? (
            <div className="space-y-2" data-ocid="dashboard.transactions_list">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl p-3 flex items-center gap-3"
                >
                  <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : !recentTxns || recentTxns.length === 0 ? (
            <div
              data-ocid="dashboard.transactions_empty_state"
              className="bg-card rounded-2xl p-8 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-3">
                <CreditCard className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground text-sm">
                No transactions yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add transactions from a site to see them here
              </p>
            </div>
          ) : (
            <div data-ocid="dashboard.transactions_list" className="space-y-2">
              {recentTxns.map((txn, idx) => (
                <div
                  key={txn.id.toString()}
                  data-ocid={`dashboard.transactions_list.item.${idx + 1}`}
                  className="bg-card rounded-xl p-3 flex items-center gap-3 shadow-xs"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${txTypeClass(txn.transactionType)}`}
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
                      {getSiteName(txn.siteId)} · {formatDate(txn.date)}
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
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
