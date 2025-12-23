import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { create, deleteAllCategory, deleteCategory, getAllCategories, getSpecificCategory, searchCategories, updateCatgory } from '../Controllers/discCategoryController.js';
import { createConfig, deleteConfig, getAllBannerConfig, getSpecificConfig, updateConfig } from '../Controllers/bannerConfigController.js';
const bannerConfigRoute = Router();

bannerConfigRoute.post('/createBannerConfiguartion', createConfig);
bannerConfigRoute.delete('/deleteBannerConfig/:id', deleteConfig);
bannerConfigRoute.put('/updateBannerConfig', updateConfig);
bannerConfigRoute.get("/getSpecificBannerConfig/:id", getSpecificConfig)
bannerConfigRoute.get('/getAllBannerConfig', getAllBannerConfig);
export default bannerConfigRoute;
