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
} from "../../Controllers/fan_star/subCategoryController.js";
import { verification } from "../../Middleware/Verification.js";
const fanStarSubCategory = Router();

fanStarSubCategory.post("/create", create);
fanStarSubCategory.delete("/delete/:id", deleteCategory);
fanStarSubCategory.put("/update", updateCatgory);
fanStarSubCategory.get("/getAll", getAllSubCategories);
fanStarSubCategory.get(
  "/getAllByCategory",

  getAllSubCategoriesByCategory
);
fanStarSubCategory.get("/get/:id", getSpecificCategory);
fanStarSubCategory.delete("/deleteAll", deleteAllCategory);
fanStarSubCategory.get("/searchAppCategories", searchCategories);
export default fanStarSubCategory;
