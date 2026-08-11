import CoachSubscription from "../models/CoachSubscription.js";

export async function enforceOneActiveCoach(traineeId) {
  const existing = await CoachSubscription.findOne({
    traineeId,
    status: { $in: ["active", "pending"] },
  });
  if (existing) {
    const err = new Error(
      "Trainee already has an active or pending coach subscription. Cancel it first.",
    );
    err.statusCode = 409;
    throw err;
  }
}

export default { enforceOneActiveCoach };