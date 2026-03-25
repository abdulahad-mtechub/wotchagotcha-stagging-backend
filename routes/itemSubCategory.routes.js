import { Router } from "express";
import { verification } from "../Middleware/Verification.js";
import {
  createItemSubCategory,
  deleteItemSubCategory,
  getItemSubCategories,
  getItemSubCategory,
  updateItemSubCategory,
} from "../Controllers/itemSubCategoryController.js";

const itemSubCategory = Router();

itemSubCategory.post("/create", createItemSubCategory);
itemSubCategory.delete("/delete/:id", deleteItemSubCategory);
itemSubCategory.patch("/update/:id", updateItemSubCategory);
itemSubCategory.get("/get/:id", getItemSubCategory);
itemSubCategory.get("/get-all", getItemSubCategories);

export default itemSubCategory;
