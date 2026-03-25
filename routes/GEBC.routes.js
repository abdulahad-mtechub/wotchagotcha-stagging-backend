import { Router } from "express";
import { verification } from "../Middleware/Verification.js";
import { upload } from "../utils/ImageHandler.js";
import { UnlikePicTour } from "../Controllers/picTourController.js";
import { createGEBC, deleteAllGEBCs, deleteGEBC, getAllCommentsByGEBC, getAllGEBCByUser, getAllGEBCs, getAllGEBCsByCategory, getTopGEBWithMostComments, getAllLikesByGBEC, getSpecificGEBC, likeUnlikeGEBC, searchGEBCs, sendComment, updateGEBC } from "../Controllers/gebcController.js";
const gebcRoute = Router();

gebcRoute.post(
  "/createGEBC",

  // upload("gebcImages").single("image"),
  createGEBC
);
gebcRoute.delete("/deleteGEBC/:id", deleteGEBC);
gebcRoute.put(
  "/updateGEBC",

  // upload("gebcImages").single("image"),
  updateGEBC
);
gebcRoute.get("/getAllGEBCs", getAllGEBCs);
gebcRoute.get("/getAllGEBCByUser/:id", getAllGEBCByUser);
gebcRoute.get("/getAllGEBCsByCategory/:id", getAllGEBCsByCategory);
gebcRoute.get("/getSpecificGEBC/:id", getSpecificGEBC);
gebcRoute.delete("/deleteAllGEBCs", deleteAllGEBCs);
//comment......................................
gebcRoute.post("/sendComment", sendComment);
gebcRoute.get("/getAllCommentsByGEBC/:id", getAllCommentsByGEBC);
///like...................................................
gebcRoute.post("/likeUnlikeGEBC", likeUnlikeGEBC);
gebcRoute.post("/UnlikePicTour", UnlikePicTour);
gebcRoute.get("/getAllLikesByGEBC/:id", getAllLikesByGBEC);
gebcRoute.get("/getTopGebc", getTopGEBWithMostComments);


gebcRoute.get("/searchGEBCs", searchGEBCs);
export default gebcRoute;
