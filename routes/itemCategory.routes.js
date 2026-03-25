import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { create, deleteAllCategory, deleteCategory, getAllCategories, getSpecificCategory, searchCategories, updateCatgory } from '../Controllers/itemCategoryController.js';
const itemCategoryRoute = Router();

itemCategoryRoute.post('/createItemCategory', create);
itemCategoryRoute.delete('/deleteItemCategory/:id', deleteCategory);
itemCategoryRoute.put('/updateItemCategory', updateCatgory);
itemCategoryRoute.get("/getAllItemCategories", getAllCategories)
itemCategoryRoute.get("/getSpecificItemCategory/:id", getSpecificCategory)
itemCategoryRoute.delete("/deleteAllItemCategories", deleteAllCategory)
itemCategoryRoute.get("/searchItemCategories", searchCategories)
export default itemCategoryRoute;
