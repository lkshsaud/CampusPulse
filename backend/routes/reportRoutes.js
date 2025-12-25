// backend/routes/reportRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { isAuth } from "../middlewares/isAuth.js";
import * as reportController from "../controllers/reportControllers.js";

const router = express.Router();

/* ================= MULTER ================= */
const storage = multer.diskStorage({
  destination: path.resolve("uploads"),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// Routes
router.post("/", isAuth, upload.single("image"), reportController.createReport);
router.get("/", isAuth, reportController.getReports);
router.get("/nearby", isAuth, reportController.getNearbyReports);
router.get("/matches", isAuth, reportController.getMatches);
router.get("/stats", isAuth, reportController.getDashboardStats);
router.get("/:reportId/recommendations", isAuth, reportController.getImageRecommendations);
router.post("/:id/claim", isAuth, reportController.claimReport);

export default router;