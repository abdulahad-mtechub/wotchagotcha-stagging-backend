import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { upload } from '../utils/ImageHandler.js'
import { createBlog, deleteAllBlog, deleteBlog, getAllBlogs, getSpecificBlog, searchBlogs, updateBlog } from '../Controllers/blogController.js';
import {
  createBanner,
  deleteAllBanner,
  deletebanner,
  getAllBanners,
  getAllBannersByStatus,
  getBannersByModule,
  getAllBannersByUser,
  getSpecificBanner,
  searchBanner,
  updateBanner,
  updateBannerStatus,
  getAllActiveBanners,
} from "../Controllers/bannerController.js";
const bannerRoute = Router();

bannerRoute.post('/createBanner', createBanner);
bannerRoute.delete('/deletebanner/:id', deletebanner);
bannerRoute.put('/updateBanner', updateBanner);
bannerRoute.get("/getAllBanners", getAllBanners)
bannerRoute.get("/getAllActiveBanners", getAllActiveBanners);
bannerRoute.get("/getAllBannersByUser/:id", getAllBannersByUser)
bannerRoute.get("/getSpecificBanner/:id", getSpecificBanner)
bannerRoute.delete("/deleteAllBanner", deleteAllBanner)
bannerRoute.get("/searchBanner", searchBanner)

bannerRoute.get("/getAllBannersByStatus", getAllBannersByStatus)
bannerRoute.post("/updateBannerStatus", verification, updateBannerStatus)
bannerRoute.get('/getByModule', getBannersByModule)
export default bannerRoute;
