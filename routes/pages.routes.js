import { Router } from "express";
import { createPage, updatePage, getPage } from "../Controllers/pagesController.js";

const pagesRoute = Router();

// Create a page (e.g., page_key: 'terms' or 'policy')
pagesRoute.post("/createPage", createPage);

// Update a page by id
pagesRoute.put("/updatePage", updatePage);

// Get a page by key
pagesRoute.get("/getPage/:key", getPage);

export default pagesRoute;
