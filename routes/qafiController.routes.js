import { Router } from "express";
import { verification } from "../Middleware/Verification.js";
import { upload } from "../utils/ImageHandler.js";
import { UnlikePicTour } from "../Controllers/picTourController.js";
import {
  createQafi, deleteAllQAFIs, deleteQafi, getAllCommentsByQAFI, getAllLikesByQafi, getAllQAFIs,
  getAllQafisByCategory, getAllQafisByUser, getSpecificQafi, likeUnlikeQafi, searchQafi, getTopQafiWithMostComments,
  sendComment, updateQafi
} from "../Controllers/qafiControler.js";
const qafiRoute = Router();

qafiRoute.post(
  "/createQafi",

  upload("qafiImages").single("image"),
  createQafi
);
qafiRoute.delete("/deleteQafi/:id", deleteQafi);
qafiRoute.put(
  "/updateQafi",

  upload("qafiImages").single("image"),
  updateQafi
);
qafiRoute.get("/getAllQAFIs", getAllQAFIs);
qafiRoute.get("/getAllQafisByUser/:id", getAllQafisByUser);
qafiRoute.get("/getAllQafisByCategory/:id", getAllQafisByCategory);
qafiRoute.get("/getSpecificQafi/:id", getSpecificQafi);
qafiRoute.delete("/deleteAllQAFIs", deleteAllQAFIs);
//comment......................................
qafiRoute.post("/sendComment", sendComment);
qafiRoute.get("/getAllCommentsByQAFI/:id", getAllCommentsByQAFI);
///like...................................................
qafiRoute.post("/likeUnlikeQafi", likeUnlikeQafi);
qafiRoute.post("/UnlikePicTour", UnlikePicTour);
qafiRoute.get("/getAllLikesByQafi/:id", getAllLikesByQafi);
qafiRoute.get("/getTopQafi", getTopQafiWithMostComments);

qafiRoute.get("/searchQafi", searchQafi);
export default qafiRoute;
