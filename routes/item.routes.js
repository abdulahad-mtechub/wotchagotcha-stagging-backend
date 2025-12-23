import { Router } from "express";
import { verification } from "../Middleware/Verification.js";
import { upload } from "../utils/ImageHandler.js";
import {
  UnlikePicTour,
  createPicTour,
  deleteAllPicTours,
  deletePicTour,
  getAllCommentsByPicTours,
  getAllLikesByPicTour,
  getAllPicTour,
  getAllPicTourByCategory,
  getAllPicToursByUser,
  getAllRecentToursByCategory,
  getAllTrendingToursByCategory,
  getComentedTours,
  getMostViewedToursByCategory,
  getSpecificPicTour,
  likePicTour,
  likeUnlikePicTour,
  searchTour,
  sendComment,
  updatePicTour,
  viewTour,
} from "../Controllers/picTourController.js";
import {
  changePaidStatus,
  checkAlert,
  createItem,
  deleteAllItems,
  deleteitem,
  getAllItemByCatgory,
  getAllItems,
  getAllItemsByPaid,
  getAllItemsByUser,
  getAllOfferByItem,
  getAllSavedItemsByUser,
  getOffer,
  getSpecificItem,
  saveItem,
  searchSaveItems,
  searchitems,
  sendOffer,
  toggleAlert,
  unSaveItem,
  updateItem,
  updateOfferStatus,
} from "../Controllers/itemController.js";
const itemRoute = Router();

itemRoute.post(
  "/sellItem",

  // upload("itemImages",'item').array("images"),
  createItem
);
itemRoute.delete("/deleteitem/:id", deleteitem);
itemRoute.delete("/deleteAllItems", deleteAllItems);
itemRoute.put(
  "/updateItem",


  upload("itemImages").array("images"),
  updateItem
);
itemRoute.get("/getSpecificItem/:id", getSpecificItem);
itemRoute.get("/getAllItemByCategory/:id", getAllItemByCatgory);
itemRoute.get("/getAllItemByUser/:id", getAllItemsByUser);
itemRoute.get("/getAllItems", getAllItems);
itemRoute.get("/getAllItemsByPaidStatus", getAllItemsByPaid);
itemRoute.get("/searchItems", searchitems);

itemRoute.post("/sendOffer", sendOffer);
itemRoute.post("/updateOfferStatus", updateOfferStatus);
itemRoute.get("/getOffer/:id", getOffer);
itemRoute.get("/getALlOfferByItem/:id", getAllOfferByItem);

itemRoute.post("/saveItem", saveItem);
itemRoute.post("/unSaveItem", unSaveItem);
itemRoute.get(
  "/getAllSavedItemsByUser/:id",

  getAllSavedItemsByUser
);
itemRoute.get("/searchSavedItems/:id", searchSaveItems);

itemRoute.post("/changePaidStatus", changePaidStatus);
itemRoute.post("/toggleAlert", toggleAlert);
itemRoute.post("/checkAlert", checkAlert);

export default itemRoute;
