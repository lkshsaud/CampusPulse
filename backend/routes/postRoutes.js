import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import uploadFile from "../middlewares/multer.js";

import {
  newPost,
  deletePost,
  getAllPosts,
  likeUnlikePost,
  commentonPost,
  deleteComment,
  editCaption,
} from "../controllers/postControllers.js";

// ─── Import your new popular controllers ─────────────────────────────
import {
  createPopular,
  getPopular,
  likePopular,
  commentPopular,
} from "../controllers/popularControllers.js";
// ─────────────────────────────────────────────────────────────────────

const router = express.Router();

// ─── Regular posts & reels ───────────────────────────────────────────
router.post("/new", isAuth, uploadFile, newPost);
router.delete("/:id", isAuth, deletePost);
router.get("/all", isAuth, getAllPosts);
router.post("/like/:id", isAuth, likeUnlikePost);
router.post("/comment/:id", isAuth, commentonPost);
router.delete("/comment/:id", isAuth, deleteComment);
router.put("/:id", isAuth, editCaption);

// ─── Popular Opinion (anonymous) ─────────────────────────────────────
// 1) Create an anonymous Popular Opinion post
router.post(
  "/popular",
  isAuth,
  // if you want to allow images in Popular, keep uploadFile here; otherwise remove it
  uploadFile,
  createPopular
);

// 2) Get all Popular Opinion posts, sorted by anonymousOrder
router.get("/popular", isAuth, getPopular);

// 3) Like a Popular Opinion post (increments both post.tokensAwarded and user.tokens)
router.post("/popular/:id/like", isAuth, likePopular);

// 4) Comment on a Popular Opinion post (anonymous comment)
router.post("/popular/:id/comment", isAuth, commentPopular);
// ─────────────────────────────────────────────────────────────────────

export default router;
