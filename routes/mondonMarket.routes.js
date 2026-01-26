import express from "express";
import { sendMondonComment, getAllCommentsByMondonMarket } from "../Controllers/mondonMarketController.js";

const router = express.Router();

router.post("/comment", sendMondonComment);
router.get("/comments/:id", getAllCommentsByMondonMarket);

export default router;
