import { Router } from "express";
import { verification } from "../Middleware/Verification.js";
import { upload } from "../utils/ImageHandler.js";
import { UnlikePicTour } from "../Controllers/picTourController.js";
import { getAllCommentsByGEBC, getAllGEBCByUser, getAllGEBCs, getAllGEBCsByCategory, getAllLikesByGBEC, getSpecificGEBC, likeUnlikeGEBC, searchGEBCs, updateGEBC } from "../Controllers/gebcController.js";
import { createNews, deleteAllNews, deleteNews, getAllCommentsByNews, getAllLikesByNews, getAllNews, getAllNewsByCategory, getAllNewsByUser, getSpecificNews, likeUnlikeNews, getTopNewsWithMostComments, searchNews, sendComment, updateNews } from "../Controllers/newsController.js";
const newsRoute = Router();

newsRoute.post(
  "/createNews",

  // upload("newsImages").single("image"),
  createNews
);
newsRoute.delete("/deleteNews/:id", deleteNews);
newsRoute.put(
  "/updateNews",

  // upload("newsImages").single("image"),
  updateNews
);
newsRoute.get("/getAllNews", getAllNews);
newsRoute.get("/getAllNewsByUser/:id", getAllNewsByUser);
newsRoute.get("/getAllNewsByCategory/:id", getAllNewsByCategory);
newsRoute.get("/getSpecificNews/:id", getSpecificNews);
newsRoute.delete("/deleteAllNews", deleteAllNews);
//comment......................................
newsRoute.post("/sendComment", sendComment);
newsRoute.get("/getAllCommentsByNews/:id", getAllCommentsByNews);
///like...................................................
newsRoute.post("/likeUnlikeNews", likeUnlikeNews);
newsRoute.post("/UnlikePicTour", UnlikePicTour);
newsRoute.get("/getAllLikesByNews/:id", getAllLikesByNews);
newsRoute.get("/getTopNews", getTopNewsWithMostComments);

newsRoute.get("/searchNews", searchNews);
export default newsRoute;
