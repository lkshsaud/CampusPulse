import express from "express";
import multer from "multer";
import { isAuth } from "../middlewares/isAuth.js";
import * as reportController from "../controllers/reportControllers.js";
import * as matchController from "../controllers/matchController.js";
import { storage } from "../config/cloudinary.js";

const router = express.Router();

// Configure multer for Cloudinary
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Routes
router.post("/", isAuth, upload.single("image"), reportController.createReport);
router.get("/", isAuth, reportController.getReports);
router.get("/nearby", isAuth, reportController.getNearbyReports);
router.get("/matches", isAuth, matchController.getMatches);
router.get("/stats", isAuth, reportController.getDashboardStats);
router.get("/:reportId/recommendations", isAuth, matchController.getImageRecommendations);
router.post("/:id/claim", isAuth, matchController.claimReport);

export default router;