import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  sendMessage,
  getAllMessages,
} from "../controllers/messageControllers.js";

const router = express.Router();

router.post("/", isAuth, sendMessage);
router.get("/:id", isAuth, getAllMessages);

export default router;