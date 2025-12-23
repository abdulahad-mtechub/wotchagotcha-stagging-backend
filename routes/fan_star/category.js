import { Router } from "express";
import {
  create,
  deleteAllCategory,
  deleteCategory,
  getAllCategories,
  getSpecificCategory,
  searchCategories,
  updateCatgory,
} from "../../Controllers/fan_star/categoryController.js";
import { verification } from "../../Middleware/Verification.js";
const fanStarCategory = Router();

fanStarCategory.post("/create", create);
fanStarCategory.delete("/delete/:id", deleteCategory);
fanStarCategory.put("/update", updateCatgory);
fanStarCategory.get("/getAll", getAllCategories);
fanStarCategory.get(
  "/get/:id",

  getSpecificCategory
);
fanStarCategory.delete(
  "/deleteAll",

  deleteAllCategory
);
fanStarCategory.get("/searchAppCategories", searchCategories);
export default fanStarCategory;
