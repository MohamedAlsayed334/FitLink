export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending';

export interface SubscriptionHistoryEntry {
  action: string;
  date: string;
  note?: string;
}

export interface GymSubscription {
  _id: string;
  traineeId: string;
  packageId: string;
  handledBy?: string | null;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  history: SubscriptionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}