export interface AdminSummary {
  users: {
    admin: number;
    employee: number;
    coach: number;
    trainee: number;
  };
  totalUsers: number;
  activeGymSubscriptions: number;
  activeCoachSubscriptions: number;
  totalRevenue: number;
  pendingCancellations: number;
  pendingReviews: number;
  unverifiedCoaches: number;
}