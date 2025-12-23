import { Router } from "express";
import {
  create,
  update,
  deleteSport,
  deleteAllSports,
  addComment,
  getComments,
  getTopSportWithMostComments,
  getSubcategoriesWithSportsByCategory,
  getSportByUserId,
  toggleLikeSport,
  searchSportsByTitle,
  getSportsLikes,
} from "../../Controllers/sports/sportController.js";
import { verification } from "../../Middleware/Verification.js";

const cinematicsRoute = Router();

cinematicsRoute.post("/create", create);
cinematicsRoute.put("/update", update);
cinematicsRoute.delete("/delete/:id", deleteSport);
cinematicsRoute.delete("/deleteAll", deleteAllSports);
cinematicsRoute.get("/getTopSport", getTopSportWithMostComments);
cinematicsRoute.get(
  "/getByCategory/:category_id",

  getSubcategoriesWithSportsByCategory
);
cinematicsRoute.get("/getByUserId/:user_id", getSportByUserId);
cinematicsRoute.get("/searchByTitle", searchSportsByTitle);

cinematicsRoute.post("/toggleLikeSport", toggleLikeSport);
cinematicsRoute.get("/all-likes/:sport_id", getSportsLikes);
// comments
cinematicsRoute.post("/addComment", addComment);
cinematicsRoute.get("/getComments/:sport_id", getComments);

export default cinematicsRoute;
