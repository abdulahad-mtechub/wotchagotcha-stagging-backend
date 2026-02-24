import { Router } from "express";
import { createReport, getReports, updateReportStatus, getMyReports } from "../Controllers/reportedUserController.js";

const router = Router();

// User reports another user
router.post("/report", createReport);

// Admin or client can list reports, optionally filter by status
router.get("/", getReports);

// Get reports created by a specific user
router.get("/my/:user_id", getMyReports);

// Admin updates status of a report
router.patch("/:id/status", updateReportStatus);

export default router;
