export interface RatingCriteria {
  expertise: number;
  communication: number;
  professionalism: number;
  punctuality: number;
  valueForMoney: number;
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface Rating {
  _id: string;
  coachId: string;
  traineeId: string;
  subscriptionId: string;
  criteria: RatingCriteria;
  overallRating: number;
  comment?: string;
  isVisible: boolean;
  moderationStatus: ModerationStatus;
  moderationNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingPage {
  reviews: Rating[];
  total: number;
  limit: number;
  offset: number;
}