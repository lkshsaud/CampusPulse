import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import uploadFile from "../middlewares/multer.js";

import {
  myProfile,
  userProfile,
  followandUnfollowUser,
  userFollowerandFollowingData,
  updateProfile,
  updatePassword,
  getWeeklyLeaderboard,     // ← import new controller
} from "../controllers/userControllers.js";

const router = express.Router();

router.get("/me", isAuth, myProfile);
router.get("/:id", isAuth, userProfile);
router.post("/follow/:id", isAuth, followandUnfollowUser);
router.get("/followdata/:id", isAuth, userFollowerandFollowingData);
router.put("/:id", isAuth, uploadFile, updateProfile);
router.post("/:id", isAuth, updatePassword);

// — NEW: weekly leaderboard endpoint —
router.get("/leaderboard/weekly", isAuth, getWeeklyLeaderboard);

export default router;
