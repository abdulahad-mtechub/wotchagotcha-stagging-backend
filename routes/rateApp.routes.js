import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { create, deleteAllCategory, deleteCategory, getAllCategories, getSpecificCategory, searchCategories, updateCatgory } from '../Controllers/discCategoryController.js';
import { createRateApp, deleteRateApp, getAlllinks, getSpecificLink, updateLink } from '../Controllers/rateAppController.js';
const rateAppRoute = Router();

rateAppRoute.post('/addLink', createRateApp);
rateAppRoute.delete('/deleteLink/:id', deleteRateApp);
rateAppRoute.put('/updateLink', updateLink);
rateAppRoute.get("/getAlllinks", getAlllinks)
rateAppRoute.get("/getSpecificLink/:id", getSpecificLink)
export default rateAppRoute;
