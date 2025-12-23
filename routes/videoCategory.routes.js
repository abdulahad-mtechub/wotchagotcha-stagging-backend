import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { create, deleteAllCategory, deleteCategory, getAllCategories, getSpecificCategory, searchCategories, updateCatgory } from '../Controllers/videoCategoryController.js';
const videoCategoryRoute = Router();

videoCategoryRoute.post('/createVideoCategory', create);
videoCategoryRoute.delete('/deleteVideoCategory/:id', deleteCategory);
videoCategoryRoute.put('/updateVideoCategory', updateCatgory);
videoCategoryRoute.get("/getAllVideoCategories", getAllCategories)
videoCategoryRoute.get("/getSpecificVideoCategory/:id", getSpecificCategory)
videoCategoryRoute.delete("/deleteAllVideoCategories", deleteAllCategory)
videoCategoryRoute.get("/searchVideoCategories", searchCategories)
export default videoCategoryRoute;
