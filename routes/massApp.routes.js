import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { upload } from '../utils/ImageHandler.js'
import { createBanner, deleteAllBanner, getAllBannersByStatus, getAllBannersByUser, getSpecificBanner, searchBanner, updateBanner, updateBannerStatus } from '../Controllers/bannerController.js';
import { addfavourite, createMassApp, getAllAppByCategory, getAllFavouritesApp, removeMassApp, removefavourite, searchApps } from '../Controllers/massAppController.js';
const massAppRoute = Router();

massAppRoute.post('/createMassApp',

    // upload("massAppImages").single("icon"), 
    createMassApp);
massAppRoute.delete('/removeMassApp/:id', removeMassApp);
massAppRoute.post('/dragApp', addfavourite);
massAppRoute.post('/removefavourite', removefavourite);
massAppRoute.get("/getAllAppByCategory/:id", getAllAppByCategory)
massAppRoute.get("/getAllAppsBycategory/:id", getAllFavouritesApp)
massAppRoute.get("/searchApps", searchApps)

export default massAppRoute;
