import { Router } from "express";
import {
  create,
  update,
  deleteVideo,
  deleteAllVideos,
  addComment,
  getComments,
  getTopVideoWithMostComments,
  getSubcategoriesWithVideosByCategory,
  getVideosByUserId,
  toggleLikeVideo,
  searchVideosByTitle,
  getLikes,
} from "../../Controllers/cinematics/cinematicController.js";
import { verification } from "../../Middleware/Verification.js";

const cinematicsRoute = Router();

cinematicsRoute.post("/create", create);
cinematicsRoute.put("/update", update);
cinematicsRoute.delete("/delete/:id", deleteVideo);
cinematicsRoute.delete("/deleteAll", deleteAllVideos);
cinematicsRoute.get("/getTopVideo", getTopVideoWithMostComments);
cinematicsRoute.get(
  "/getByCategory/:category_id",

  getSubcategoriesWithVideosByCategory
);
cinematicsRoute.get("/getByUserId/:user_id", getVideosByUserId);
cinematicsRoute.get("/searchByTitle", searchVideosByTitle);

cinematicsRoute.post("/toggleLikeVideo", toggleLikeVideo);
cinematicsRoute.get("/all-likes/:video_id", getLikes);
// comments
cinematicsRoute.post("/addComment", addComment);
cinematicsRoute.get("/getComments/:video_id", getComments);

export default cinematicsRoute;
