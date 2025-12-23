import { Router } from "express";
import { verification } from "../Middleware/Verification.js";
import {
  createDiscSubCategory,
  deleteDiscSubCategory,
  getDiscSubCategories,
  getDiscSubCategory,
  updateDiscSubCategory,
} from "../Controllers/discSubCategoryController.js";

const discSubCategory = Router();

discSubCategory.post("/create", createDiscSubCategory);
discSubCategory.delete("/delete/:id", deleteDiscSubCategory);
discSubCategory.patch("/update/:id", updateDiscSubCategory);
discSubCategory.get("/get/:id", getDiscSubCategory);
discSubCategory.get("/get-all", getDiscSubCategories);

export default discSubCategory;
