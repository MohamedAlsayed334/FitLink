import Rating from "../models/Rating.js";
import User from "../models/User.js";

export async function recalculateCoachAverage(coachId) {
  const approved = await Rating.find({
    coachId,
    moderationStatus: "approved",
  });

  const totalReviews = approved.length;
  let averageRating = 0;
  if (totalReviews > 0) {
    const sum = approved.reduce((acc, r) => acc + r.overallRating, 0);
    averageRating = Math.round((sum / totalReviews) * 10) / 10;
  }

  await User.updateOne(
    { _id: coachId },
    {
      "coachProfile.averageRating": averageRating,
      "coachProfile.totalReviews": totalReviews,
    },
  );

  return { averageRating, totalReviews };
}

export default { recalculateCoachAverage };