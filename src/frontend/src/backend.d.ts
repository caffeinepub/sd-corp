import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Labour {
    id: bigint;
    workType: string;
    dailyWage: bigint;
    name: string;
    createdAt: Time;
    siteId: bigint;
    phone: string;
}
export interface Transaction {
    id: bigint;
    transactionType: Variant_miscExpense_labourPayment_paymentReceived_materialPurchase;
    date: string;
    createdAt: Time;
    notes: string;
    paymentMode: Variant_upi_cash_bankTransfer_cheque;
    siteId: bigint;
    amount: bigint;
}
export type Time = bigint;
export interface Site {
    id: bigint;
    clientName: string;
    owner: Principal;
    createdAt: Time;
    isActive: boolean;
    siteName: string;
    totalProjectAmount: bigint;
    location: string;
    startDate: string;
}
export interface UserProfile {
    userId: string;
    name: string;
    email: string;
    pinHash: string;
}
export interface LabourPayment {
    id: bigint;
    date: string;
    labourId: bigint;
    createdAt: Time;
    notes: string;
    amount: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_miscExpense_labourPayment_paymentReceived_materialPurchase {
    miscExpense = "miscExpense",
    labourPayment = "labourPayment",
    paymentReceived = "paymentReceived",
    materialPurchase = "materialPurchase"
}
export enum Variant_upi_cash_bankTransfer_cheque {
    upi = "upi",
    cash = "cash",
    bankTransfer = "bankTransfer",
    cheque = "cheque"
}
export interface backendInterface {
    addLabour(siteId: bigint, name: string, phone: string, workType: string, dailyWage: bigint): Promise<bigint>;
    addLabourPayment(labourId: bigint, date: string, amount: bigint, notes: string): Promise<bigint>;
    addTransaction(siteId: bigint, transactionType: Variant_miscExpense_labourPayment_paymentReceived_materialPurchase, date: string, amount: bigint, notes: string, paymentMode: Variant_upi_cash_bankTransfer_cheque): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSite(siteName: string, clientName: string, location: string, startDate: string, totalProjectAmount: bigint): Promise<bigint>;
    deactivateSite(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<{
        totalReceived: bigint;
        totalGiven: bigint;
        activeSites: bigint;
    }>;
    getLabourBySite(siteId: bigint): Promise<Array<Labour>>;
    getLabourPayments(labourId: bigint): Promise<Array<LabourPayment>>;
    getMyProfile(): Promise<UserProfile | null>;
    getRecentTransactions(limit: bigint): Promise<Array<Transaction>>;
    getSiteById(id: bigint): Promise<Site | null>;
    getSites(): Promise<Array<Site>>;
    getTransactionsBySite(siteId: bigint): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setPin(pinHash: string): Promise<void>;
    updateLabour(id: bigint, name: string, phone: string, workType: string, dailyWage: bigint): Promise<void>;
    updateSite(id: bigint, siteName: string, clientName: string, location: string, startDate: string, totalProjectAmount: bigint): Promise<void>;
    verifyPin(pinHash: string): Promise<boolean>;
}
