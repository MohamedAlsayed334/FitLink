import { Router } from "express";
import authRoutes from "./auth.routes.js";
import packageRoutes from "./package.routes.js";
import userRoutes from "./user.routes.js";
import coachRoutes from "./coach.routes.js";
import gymSubscriptionRoutes from "./gymSubscription.routes.js";
import coachSubscriptionRoutes from "./coachSubscription.routes.js";
import ratingRoutes from "./rating.routes.js";
import adminRoutes from "./admin.routes.js";
import employeeRoutes from "./employee.routes.js";
import notificationRoutes from "./notification.routes.js";
import chatRoutes from "./chat.routes.js";

const router = Router();
router.use("/auth", authRoutes);
router.use("/packages", packageRoutes);
router.use("/users", userRoutes);
router.use("/coaches", coachRoutes);
router.use("/gym-subscriptions", gymSubscriptionRoutes);
router.use("/coach-subscriptions", coachSubscriptionRoutes);
router.use("/ratings", ratingRoutes);
router.use("/admin", adminRoutes);
router.use("/employee", employeeRoutes);
router.use("/notifications", notificationRoutes);
router.use("/chat", chatRoutes);

// Placeholder interoperability route — scope not finalized yet.
router.get("/interactions", (req, res) => {
  res.status(200).json({ success: true, data: [] });
});

export default router;
