import { Router } from "express";
import { createPolicy, updatePolicy, getPolicy } from "../Controllers/policyController.js";

const policyRoute = Router();

policyRoute.post("/create", createPolicy);
policyRoute.put("/update", updatePolicy);
policyRoute.get("/get", getPolicy);

export default policyRoute;
