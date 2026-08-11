export interface AdminUserRef {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar?: string | null;
}

export interface AdminPackageRef {
  _id: string;
  name: string;
  durationMonths?: number;
}

export interface AdminPendingCancellation {
  id: string;
  trainee: AdminUserRef;
  coach: AdminUserRef;
  package: AdminPackageRef;
  reason?: string;
  requestedAt: string | null;
  endDate: string;
  finalAmount: number;
}
