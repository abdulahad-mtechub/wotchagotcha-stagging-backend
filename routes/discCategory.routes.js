import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { create, deleteAllCategory, deleteCategory, getAllCategories, getSpecificCategory, searchCategories, updateCatgory } from '../Controllers/discCategoryController.js';
const discCategoryRoute = Router();

discCategoryRoute.post('/createDiscCategory', create);
discCategoryRoute.delete('/deleteDiscCategory/:id', deleteCategory);
discCategoryRoute.put('/updateDiscCategory', updateCatgory);
discCategoryRoute.get("/getAllDiscCategories", getAllCategories)
discCategoryRoute.get("/getSpecificDiscCategory/:id", getSpecificCategory)
discCategoryRoute.delete("/deleteAllDiscCategories", deleteAllCategory)
discCategoryRoute.get("/searchDiscCategories", searchCategories)
export default discCategoryRoute;
