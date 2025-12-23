import { Router } from "express";
import {
  create,
  deleteAllCategory,
  deleteCategory,
  getAllSubCategories,
  getAllSubCategoriesByCategory,
  getSpecificCategory,
  searchCategories,
  updateCatgory,
} from "../../Controllers/kid_vids/subCategoryController.js";
import { verification } from "../../Middleware/Verification.js";
const tvProgmaxSubCategory = Router();

tvProgmaxSubCategory.post("/create", create);
tvProgmaxSubCategory.delete("/delete/:id", deleteCategory);
tvProgmaxSubCategory.put("/update", updateCatgory);
tvProgmaxSubCategory.get("/getAll", getAllSubCategories);
tvProgmaxSubCategory.get(
  "/getAllByCategory",

  getAllSubCategoriesByCategory
);
tvProgmaxSubCategory.get("/get/:id", getSpecificCategory);
tvProgmaxSubCategory.delete("/deleteAll", deleteAllCategory);
tvProgmaxSubCategory.get("/searchAppCategories", searchCategories);
export default tvProgmaxSubCategory;
