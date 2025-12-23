import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { createType, deleteAllType, deleteType, getAllTypes, getSpecificType, updateType } from '../Controllers/notificationTypeController.js';
const notificationType = Router();

notificationType.post('/createType', createType);
notificationType.delete('/deleteType/:id', deleteType);
notificationType.put('/updateType', updateType);
notificationType.get("/getAllTypes", getAllTypes)
notificationType.get("/getSpecificType/:id", getSpecificType)
notificationType.delete("/deleteAllType", deleteAllType)
export default notificationType;
