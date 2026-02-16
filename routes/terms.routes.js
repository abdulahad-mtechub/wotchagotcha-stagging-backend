import { Router } from "express";
import { createTerms, updateTerms, getTerms } from "../Controllers/termsController.js";

const termsRoute = Router();

termsRoute.post("/create", createTerms);
termsRoute.put("/update", updateTerms);
termsRoute.get("/get", getTerms);

export default termsRoute;
