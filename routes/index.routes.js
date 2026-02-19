import express from "express";
import {
  bulkUpdateCategoryIndex,
  bulkUpdateSubCategoryIndex,
} from "../Controllers/indexUpdater/indexController.js";

const router = express.Router();

// Bulk update main category indexes for a module
// Body: { module: string, items: [ { id, index } ] }
router.post("/category", bulkUpdateCategoryIndex);

// Bulk update subcategory indexes for a given module and main category
// Body: { module: string, category_id: number, items: [ { id, index } ] }
router.post("/sub_category", bulkUpdateSubCategoryIndex);

export default router;
