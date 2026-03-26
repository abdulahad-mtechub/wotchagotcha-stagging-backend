import express from "express";
import {
  sendMondonComment,
  getAllCommentsByMondonMarket,
  likeUnlikeMondonMarket,
  getAllLikesByMondonMarket,
} from "../Controllers/mondonMarketController.js";

const router = express.Router();

router.post("/comment", sendMondonComment);
router.get("/comments/:id", getAllCommentsByMondonMarket);
router.post("/likeUnlike", likeUnlikeMondonMarket);
router.get("/likes/:id", getAllLikesByMondonMarket);

export default router;
