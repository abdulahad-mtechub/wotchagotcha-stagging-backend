import { Router } from "express";
import {
  createGEBCTop,
  createNewsTop,
  createQafiTop,
  createTopVideo,
  createTourTop,
  deleteAllGEBC,
  deleteAllNEWS,
  deleteAllQAFI,
  deleteAllTopItem,
  deleteAllTopLetter,
  deleteAllTopTours,
  deleteAllTopVideos,
  deleteTopGEBC,
  deleteTopNews,
  deleteTopQAFI,
  deleteTopTour,
  deleteTopVideo,
  getAllGEBC,
  getAllNews,
  getAllQAFI,
  getAllSpecificVideos,
  getAllTopGEBC,
  getAllTopItem,
  getAllTopLetter,
  getAllTopNews,
  getAllTopQAFI,
  getAllTopTour,
  getAllTopVideos,
  getAllTour,
  getAllVideos,
  getSpecificTopGEBC,
  getSpecificTopItem,
  getSpecificTopLetter,
  getSpecificTopNews,
  getSpecificTopQAFI,
  getSpecificTopTour,
  getTopGEBCApp,
  getTopItemApp,
  getTopLetterApp,
  getTopNewsApp,
  getTopQAFIApp,
  getTopTourApp,
  getTopVideoApp,
  setTopItem,
  setTopLetter,
  updateTopGEBC,
  updateTopNews,
  updateTopQAFI,
  updateTopTour,
  updateTopVideo,
} from "../Controllers/topController.js";
import { verification } from "../Middleware/Verification.js";
import { uploadVideoWithLengthCheck } from "../utils/VideoHandler.js";
import { upload } from "../utils/ImageHandler.js";
const topRoute = Router();
topRoute.post(
  "/createTopVideo",

  uploadVideoWithLengthCheck("topVideos"),
  createTopVideo
);
topRoute.delete("/deleteTopVideo/:id", deleteTopVideo);
topRoute.delete("/deleteAllTopVideo", deleteAllTopVideos);
topRoute.put(
  "/updateTopVideo",

  uploadVideoWithLengthCheck("topVideos"),
  updateTopVideo
);

topRoute.get("/getAllTopVideosByCategory/:id", getAllTopVideos);
topRoute.get("/getAllTopVideos", getAllVideos);
topRoute.get("/app/top_video/:id", getTopVideoApp);
topRoute.get("/getSpecificTopVideo/:id", getAllSpecificVideos);
//QAFI routes.........................................
topRoute.post(
  "/createTopQAFI",

  upload("topQAFI").single("image"),
  createQafiTop
);

topRoute.put(
  "/updateTopQAFI",

  upload("topQAFI").single("image"),
  updateTopQAFI
);
topRoute.delete("/deleteTopQAFI/:id", deleteTopQAFI);
topRoute.delete("/deleteAllTopQAFI", deleteAllQAFI);
topRoute.get("/getAllTopQAFIByCategory/:id", getAllTopQAFI);
topRoute.get("/getAllTopQAFI", getAllQAFI);
topRoute.get("/getSpecificTopQAFIsByCategory/:id", getSpecificTopQAFI);
topRoute.get("/app/top_QAFI/:id", getTopQAFIApp);

//GEBC routes.........................................
topRoute.post(
  "/createTopGEBC",

  upload("topGEBC").single("image"),
  createGEBCTop
);

topRoute.put(
  "/updateTopGEBC",

  upload("topGEBC").single("image"),
  updateTopGEBC
);
topRoute.delete("/deleteTopGEBC/:id", deleteTopGEBC);
topRoute.delete("/deleteAllTopGEBC", deleteAllGEBC);
topRoute.get("/getAllTopGEBCByCategory/:id", getAllTopGEBC);
topRoute.get("/getAllTopGEBC", getAllGEBC);
topRoute.get("/getSpecificTopGEBCsByCategory/:id", getSpecificTopGEBC);
topRoute.get("/app/top_GEBC/:id", getTopGEBCApp);


//NEWS routes.........................................
topRoute.post(
  "/createNewsTop",

  upload("topNEWS").single("image"),
  createNewsTop
);

topRoute.put(
  "/updateTopNews",

  upload("topNEWS").single("image"),
  updateTopNews
);
topRoute.delete("/deleteTopNEWS/:id", deleteTopNews);
topRoute.delete("/deleteAllTopNEWS", deleteAllNEWS);
topRoute.get("/getAllTopNEWSByCategory/:id", getAllTopNews);
topRoute.get("/getAllTopNEWS", getAllNews);
topRoute.get("/getSpecificTopNEWSByCategory/:id", getSpecificTopNews);
topRoute.get("/app/top_News/:id", getTopNewsApp);


//Top TOur routes.........................................
topRoute.post(
  "/createTourTop",

  upload("topTours").single("image"),
  createTourTop
);

topRoute.put(
  "/updateTopTour",

  upload("topTours").single("image"),
  updateTopTour
);
topRoute.delete("/deleteTopTour/:id", deleteTopTour);
topRoute.delete("/deleteAllTopTour", deleteAllTopTours);
topRoute.get("/getAllTopTourByCategory/:id", getAllTopTour);
topRoute.get("/getAllTopTour", getAllTour);
topRoute.get("/getSpecificTopTourByCategory/:id", getSpecificTopTour);
topRoute.get("/app/top_tour/:id", getTopTourApp);



//Top Market Zone routes.........................................
topRoute.post(
  "/setTopItem",

  setTopItem
);
topRoute.get("/getSpecificTopItem/:id", getSpecificTopItem);
topRoute.get("/getAllTopItem", getAllTopItem);
topRoute.delete("/deleteAllTopItems", deleteAllTopItem);
topRoute.get("/app/top_item", getTopItemApp);


//Top post letter routes.........................................
topRoute.post(
  "/setTopLetter",

  setTopLetter
);
topRoute.get("/getSpecificTopLetter/:id", getSpecificTopLetter);
topRoute.get("/getAllTopLetter", getAllTopLetter);
topRoute.delete("/deleteAllTopLetter", deleteAllTopLetter);
topRoute.get("/app/top_letter", getTopLetterApp);
export default topRoute;
