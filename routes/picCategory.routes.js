import { Router } from "express";
import { verification } from "../Middleware/Verification.js";
import {
  create,
  deleteAllCategory,
  deleteCategory,
  getAllCategories,
  getSpecificCategory,
  searchCategories,
  updateCatgory,
} from "../Controllers/picCategoryController.js";
const picCategoryRoute = Router();

picCategoryRoute.post("/createPicCategory", create);
picCategoryRoute.delete("/deletePicCategory/:id", deleteCategory);
picCategoryRoute.put("/updatePicCategory", updateCatgory);
picCategoryRoute.get("/getAllPicCategories", getAllCategories);
picCategoryRoute.get(
  "/getSpecificPicCategory/:id",

  getSpecificCategory
);
picCategoryRoute.delete(
  "/deleteAllPicCategories",

  deleteAllCategory
);
picCategoryRoute.get("/searchPicCategories", searchCategories);
export default picCategoryRoute;
