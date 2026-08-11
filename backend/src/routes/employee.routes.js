import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  getEmployeeStats,
  listWalkIns,
  listTrainees,
  getTraineeProfile,
} from "../controllers/employee.controller.js";

const router = Router();

router.use(protect, requireRole("admin", "employee"));

router.get("/stats", getEmployeeStats);
router.get("/walk-ins", listWalkIns);
router.get("/trainees", listTrainees);
router.get("/trainees/:id", getTraineeProfile);

export default router;
