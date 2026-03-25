import { Router } from "express";
import { verification } from "../Middleware/Verification.js";
import { uploadVideoWithLengthCheck } from "../utils/VideoHandler.js";
import {
  UnlikeVideo,
  createTopVideo,
  createXpiVideo,
  deleteAllVideos,
  deleteVideo,
  getAllCommentsByVideo,
  getAllLikesByVideo,
  getAllRecentVideosByCategory,
  getAllTrendingVideosByCategory,
  getAllVideos,
  getAllVideosByCategory,
  getAllVideosByUser,
  getComentedVideos,
  getMostViewedVideosByCategory,
  getSpecificVideo,
  getTopVideo,
  likeUnlikeVideo,
  likeVideo,
  searchVideos,
  sendComment,
  updateXpiVideo,
  uploadFile,
  viewVideo,
} from "../Controllers/xpiVideoController.js";
import { genericUploadFile, postLetterMedia } from "../utils/ImageHandler.js";
const xpiRoute = Router();

xpiRoute.post(
  "/createXpiVideo",

  // uploadVideoWithLengthCheck("xpiVideos"),
  createXpiVideo
);
xpiRoute.post(
  "/fileUpload",

  genericUploadFile("fileUpload").array('file'),
  uploadFile
);
xpiRoute.delete("/deleteXpiVideo/:id", deleteVideo);
xpiRoute.put(
  "/updateXpiVideo",

  // uploadVideoWithLengthCheck("xpiVideos"),
  updateXpiVideo
);


xpiRoute.get("/getAllVideos", getAllVideos);
xpiRoute.get("/getAllRecentVideosByCategory/:id", getAllRecentVideosByCategory);
xpiRoute.get("/getAllVideosByUser/:id", getAllVideosByUser);
xpiRoute.get("/getAllVideosBycategory/:id", getAllVideosByCategory);
xpiRoute.get("/getSpecificVideo/:id", getSpecificVideo);
xpiRoute.delete("/deleteAllVideos", deleteAllVideos);
//comment......................................
xpiRoute.post("/sendComment", sendComment);
xpiRoute.get("/getAllCommentsByVideo/:id", getAllCommentsByVideo);
///like...................................................
xpiRoute.post("/likeUnlikeVideo", likeUnlikeVideo);
xpiRoute.post("/likeVideo", likeVideo);
xpiRoute.post("/UnlikeVideo", UnlikeVideo);
xpiRoute.get("/getAllLikesByVideo/:id", getAllLikesByVideo);

// viewed mechanism...................................................
xpiRoute.post("/viewVideo", viewVideo);
xpiRoute.get("/getMostViewedVideosByCategory/:id", getMostViewedVideosByCategory);
xpiRoute.get("/getMostCommentedVideosByCategory/:id", getComentedVideos);
xpiRoute.get("/getTrendingVideosByCategory/:id", getAllTrendingVideosByCategory);

xpiRoute.get("/searchVideo", searchVideos);

xpiRoute.post("/createTopVideo", createTopVideo);
xpiRoute.get("/getTopVideo", getTopVideo);
export default xpiRoute;
