export type UserRole = 'admin' | 'employee' | 'coach' | 'trainee';

export interface CoachProfile {
  specialization: string[];
  experience: number;
  bio: string;
  certifications: { name: string; issuer: string; year: number }[];
  isVerified: boolean;
  isAcceptingClients: boolean;
  averageRating: number;
  totalReviews: number;
}

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  activeCoachSubscriptionId?: string | null;
  coachProfile?: CoachProfile;
  createdAt: string;
  updatedAt: string;
}