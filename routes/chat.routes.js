import express from "express";
import { 
  getConversationWithUser,
  getUnreadCount, 
  markMessagesRead, 
  getChatList
} from "../Controllers/chat.controller.js";
import { verification } from "../Middleware/Verification.js";

const router = express.Router();

router.use(verification);

router.get("/conversation/:otherUserId", getConversationWithUser);
router.get("/unread-count", getUnreadCount);
router.post("/mark-read", markMessagesRead);
router.get("/list", getChatList);

export default router;
