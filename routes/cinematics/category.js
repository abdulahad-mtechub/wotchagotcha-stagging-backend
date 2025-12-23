import { Router } from "express";
import {
  create,
  deleteAllCategory,
  deleteCategory,
  getAllCategories,
  getSpecificCategory,
  searchCategories,
  updateCatgory,
} from "../../Controllers/cinematics/categoryController.js";
import { verification } from "../../Middleware/Verification.js";
const appCategoryRoute = Router();

appCategoryRoute.post("/create", create);
appCategoryRoute.delete("/delete/:id", deleteCategory);
appCategoryRoute.put("/update", updateCatgory);
appCategoryRoute.get("/getAll", getAllCategories);
appCategoryRoute.get(
  "/get/:id",

  getSpecificCategory
);
appCategoryRoute.delete(
  "/deleteAll",

  deleteAllCategory
);
appCategoryRoute.get("/searchAppCategories", searchCategories);
export default appCategoryRoute;
