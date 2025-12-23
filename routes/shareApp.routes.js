import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { createShareApp, deleteShareApp, getAlllinks, getSpecificLink, updateLink } from '../Controllers/shareAppController.js';
const shareAppRoute = Router();

shareAppRoute.post('/addLink', createShareApp);
shareAppRoute.delete('/deleteLink/:id', deleteShareApp);
shareAppRoute.put('/updateLink', updateLink);
shareAppRoute.get("/getAlllinks", getAlllinks)
shareAppRoute.get("/getSpecificLink/:id", getSpecificLink)
export default shareAppRoute;
