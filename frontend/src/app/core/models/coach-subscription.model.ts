import { GymSubscription } from './gym-subscription.model';
import { Package } from './package.model';
import { CoachProfile } from './user.model';

export interface CancellationRequest {
  requested: boolean;
  reason?: string;
  requestedAt?: string;
}

/**
 * A coach document as returned when the backend populates
 * `CoachSubscription.coachId` (see GET /api/coach-subscriptions/mine, which
 * populates `coachId` with `firstName lastName avatar coachProfile`). It is a
 * partial `User`, NOT a full user record.
 */
export interface PopulatedCoach {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  coachProfile?: CoachProfile;
}

/**
 * `coachId` and `packageId` may each be either a raw ObjectId string (when the
 * document is unpopulated) or a fully populated reference (GET
 * /api/coach-subscriptions/mine populates both). Guard with `typeof x ===
 * 'string'` before treating them as ids.
 */
export interface CoachSubscription
  extends Omit<GymSubscription, 'traineeId' | 'packageId'> {
  traineeId: string;
  coachId: string | PopulatedCoach;
  packageId: string | Package;
  cancellationRequest?: CancellationRequest;
}
