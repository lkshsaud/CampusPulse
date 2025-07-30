import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  newPost,
  deletePost,
  getAllPosts,
  likeUnlikePost,
  commentonPost,
  deleteComment,
  editCaption,

 } from "../controllers/postControllers.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

router.post("/new", isAuth, uploadFile, newPost);
router.delete("/:id", isAuth, deletePost);
router.get("/all", isAuth, getAllPosts);
router.post("/like/:id", isAuth, likeUnlikePost);
router.post("/comment/:id", isAuth, commentonPost);
router.delete("/comment/:id", isAuth, deleteComment);
router.put("/:id", isAuth, editCaption);


export default router;