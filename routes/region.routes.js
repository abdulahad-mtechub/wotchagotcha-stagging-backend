import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { getAllRegion } from '../Controllers/regionController.js';
const regionRoute = Router();
regionRoute.get("/getAllRegion", getAllRegion)
export default regionRoute;
