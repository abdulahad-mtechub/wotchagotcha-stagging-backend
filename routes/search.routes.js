import express from "express";
import { globalSearch } from "../Controllers/globalSearchController.js";

const router = express.Router();

// GET /search/global?q=term
router.get("/global", globalSearch);

export default router;
