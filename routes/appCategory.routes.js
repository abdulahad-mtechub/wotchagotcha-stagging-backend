import { Router } from 'express';
import { create, deleteAllCategory, deleteCategory, getAllCategories, getSpecificCategory, searchCategories, updateCatgory } from '../Controllers/appCategoryController.js';
import { verification } from '../Middleware/Verification.js';
const appCategoryRoute = Router();

appCategoryRoute.post('/createAppCategory', create);
appCategoryRoute.delete('/deleteAppCategory/:id', deleteCategory);
appCategoryRoute.put('/updateAppCategory', updateCatgory);
appCategoryRoute.get("/getAllAppCategories", getAllCategories)
appCategoryRoute.get("/getSpecificAppCategory/:id", getSpecificCategory)
appCategoryRoute.delete("/deleteAllAppCategories", deleteAllCategory)
appCategoryRoute.get("/searchAppCategories", searchCategories)
export default appCategoryRoute;
