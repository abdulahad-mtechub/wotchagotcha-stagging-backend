import { Router } from "express";
import {
  create,
  deleteAllCategory,
  deleteCategory,
  getAllCategories,
  getSpecificCategory,
  searchCategories,
  updateCatgory,
} from "../../Controllers/learning_hobbies/categoryController.js";
import { verification } from "../../Middleware/Verification.js";
const tvProgmaxCategory = Router();

tvProgmaxCategory.post("/create", create);
tvProgmaxCategory.delete("/delete/:id", deleteCategory);
tvProgmaxCategory.put("/update", updateCatgory);
tvProgmaxCategory.get("/getAll", getAllCategories);
tvProgmaxCategory.get(
  "/get/:id",

  getSpecificCategory
);
tvProgmaxCategory.delete(
  "/deleteAll",

  deleteAllCategory
);
tvProgmaxCategory.get("/searchAppCategories", searchCategories);
export default tvProgmaxCategory;
