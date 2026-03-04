import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  UserProfile,
  Variant_miscExpense_labourPayment_paymentReceived_materialPurchase,
  Variant_upi_cash_bankTransfer_cheque,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Auth / Profile ────────────────────────────────────────────────────────────

export function useMyProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useSetPin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pinHash: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setPin(pinHash);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useVerifyPin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (pinHash: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.verifyPin(pinHash);
    },
  });
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecentTransactions(limit = 10) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["recentTransactions", limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentTransactions(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Sites ─────────────────────────────────────────────────────────────────────

export function useSites() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSites();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSiteById(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["site", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getSiteById(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateSite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      siteName: string;
      clientName: string;
      location: string;
      startDate: string;
      totalProjectAmount: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createSite(
        data.siteName,
        data.clientName,
        data.location,
        data.startDate,
        data.totalProjectAmount,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sites"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateSite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      siteName: string;
      clientName: string;
      location: string;
      startDate: string;
      totalProjectAmount: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateSite(
        data.id,
        data.siteName,
        data.clientName,
        data.location,
        data.startDate,
        data.totalProjectAmount,
      );
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["sites"] });
      void queryClient.invalidateQueries({
        queryKey: ["site", vars.id.toString()],
      });
    },
  });
}

export function useDeactivateSite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deactivateSite(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sites"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

// ─── Transactions ──────────────────────────────────────────────────────────────

export function useTransactionsBySite(siteId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["transactions", siteId?.toString()],
    queryFn: async () => {
      if (!actor || siteId === null) return [];
      return actor.getTransactionsBySite(siteId);
    },
    enabled: !!actor && !isFetching && siteId !== null,
  });
}

export function useAddTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      siteId: bigint;
      transactionType: Variant_miscExpense_labourPayment_paymentReceived_materialPurchase;
      date: string;
      amount: bigint;
      notes: string;
      paymentMode: Variant_upi_cash_bankTransfer_cheque;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addTransaction(
        data.siteId,
        data.transactionType,
        data.date,
        data.amount,
        data.notes,
        data.paymentMode,
      );
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["transactions", vars.siteId.toString()],
      });
      void queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

// ─── Labour ────────────────────────────────────────────────────────────────────

export function useLabourBySite(siteId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["labour", siteId?.toString()],
    queryFn: async () => {
      if (!actor || siteId === null) return [];
      return actor.getLabourBySite(siteId);
    },
    enabled: !!actor && !isFetching && siteId !== null,
  });
}

export function useAllLabour() {
  const { data: sites } = useSites();
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allLabour", sites?.map((s) => s.id.toString()).join(",")],
    queryFn: async () => {
      if (!actor || !sites || sites.length === 0) return [];
      const labourArrays = await Promise.all(
        sites.map((site) => actor.getLabourBySite(site.id)),
      );
      return labourArrays.flat();
    },
    enabled: !!actor && !isFetching && !!sites,
  });
}

export function useAddLabour() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      siteId: bigint;
      name: string;
      phone: string;
      workType: string;
      dailyWage: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addLabour(
        data.siteId,
        data.name,
        data.phone,
        data.workType,
        data.dailyWage,
      );
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["labour", vars.siteId.toString()],
      });
      void queryClient.invalidateQueries({ queryKey: ["allLabour"] });
    },
  });
}

export function useUpdateLabour() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      siteId: bigint;
      name: string;
      phone: string;
      workType: string;
      dailyWage: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateLabour(
        data.id,
        data.name,
        data.phone,
        data.workType,
        data.dailyWage,
      );
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["labour", vars.siteId.toString()],
      });
      void queryClient.invalidateQueries({ queryKey: ["allLabour"] });
    },
  });
}

export function useLabourPayments(labourId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["labourPayments", labourId?.toString()],
    queryFn: async () => {
      if (!actor || labourId === null) return [];
      return actor.getLabourPayments(labourId);
    },
    enabled: !!actor && !isFetching && labourId !== null,
  });
}

export function useAddLabourPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      labourId: bigint;
      date: string;
      amount: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addLabourPayment(
        data.labourId,
        data.date,
        data.amount,
        data.notes,
      );
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["labourPayments", vars.labourId.toString()],
      });
    },
  });
}
