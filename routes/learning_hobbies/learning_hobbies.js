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
  getLearningAndHobbiesLikes,
} from "../../Controllers/learning_hobbies/learningHobbiesController.js";
import { verification } from "../../Middleware/Verification.js";

const fanStarRoute = Router();

fanStarRoute.post("/create", create);
fanStarRoute.put("/update", update);
fanStarRoute.delete("/delete/:id", deleteVideo);
fanStarRoute.delete("/deleteAll", deleteAllVideos);
fanStarRoute.get("/getTopVideo", getTopVideoWithMostComments);
fanStarRoute.get(
  "/getByCategory/:category_id",

  getSubcategoriesWithVideosByCategory
);
fanStarRoute.get("/getByUserId/:user_id", getVideosByUserId);
fanStarRoute.get("/searchByTitle", searchVideosByTitle);

fanStarRoute.post("/toggleLikeVideo", toggleLikeVideo);
fanStarRoute.get(
  "/all-likes/:video_id",

  getLearningAndHobbiesLikes
);
// comments
fanStarRoute.post("/addComment", addComment);
fanStarRoute.get("/getComments/:video_id", getComments);

export default fanStarRoute;
