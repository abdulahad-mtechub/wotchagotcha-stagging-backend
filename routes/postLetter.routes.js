import { Router } from "express";
import { verification } from "../Middleware/Verification.js";
import { postLetterMedia, upload } from "../utils/ImageHandler.js";
import {
  createSignature,
  deleteAllSignature,
  deleteSignature,
  getAllSignature,
  getAllSignatureByUserId,
  getSpecificSignature,
  updateSignature,
} from "../Controllers/signatureController.js";
import {
  createPostLetter,
  deleteLetter,
  getAllLetter,
  getAllLetterByDiscCategory,
  getAllLetterByPostType,
  getAllLetterByUser,
  getAllLetterPrivate,
  getAllLetterPrivateOther,
  getAllLetterPublicGeneral,
  getAllLetterPublicOther,
  getAllLettersByCategory,
  getAllRecievedLetter,
  getSpecificLetter,
  searchLetters,
  updatePostLetter,
  updatePostLetterImages,
} from "../Controllers/postLetterController.js";
const postLetterRoute = Router();

postLetterRoute.post(
  "/createLetter",

  postLetterMedia("letterMedia").array("media"),
  createPostLetter
);
postLetterRoute.delete("/deleteLetter/:id", deleteLetter);
postLetterRoute.put("/updatePostLetter", updatePostLetter);
postLetterRoute.put(
  "/updatePostLetterImages",

  postLetterMedia("letterMedia").array("media"),
  updatePostLetterImages
);
postLetterRoute.get("/getAllLetter", getAllLetter);
postLetterRoute.get(
  "/getAllLetterByUser/:id",

  getAllLetterByUser
);
postLetterRoute.get(
  "/getAllLetterByPostType/:id",

  getAllLetterByPostType
);
postLetterRoute.get(
  "/getAllLetterByDiscCategory/:id",

  getAllLetterByDiscCategory
);

postLetterRoute.get(
  "/public_general_by_category/:id",

  getAllLetterPublicGeneral
);
postLetterRoute.get(
  "/public_celebrity_by_category/:id",

  getAllLetterPublicOther
);
postLetterRoute.get(
  "/private_friends_by_category/:id",

  getAllLetterPrivate
);
postLetterRoute.get(
  "/private_celebrity_by_category/:id",

  getAllLetterPrivateOther
);
postLetterRoute.get("/getSpecificLetter/:id", getSpecificLetter);
postLetterRoute.get("/searchLetters", searchLetters);
postLetterRoute.delete("/deleteAllSignature", deleteAllSignature);
postLetterRoute.get(
  "/getAllRecievedLetterByUser/:id",

  getAllRecievedLetter
);
postLetterRoute.get(
  "/getAllLetterByCategory/:category_id",

  getAllLettersByCategory
);
export default postLetterRoute;
