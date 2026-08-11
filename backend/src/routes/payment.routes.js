import { Router } from "express";
import {
  initiatePayment,
  paymobWebhook,
} from "../controllers/payment.controller.js";
import protect from "../middleware/auth.js";

const router = Router();

// trainee initiates payment for a pending subscription
router.post("/initiate", protect, initiatePayment);

// paymob calls this when payment is done — must be public (no protect)
router.post("/webhook", paymobWebhook);

export default router;
