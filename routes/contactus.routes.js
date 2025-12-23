import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { create, deleteAllCategory, deleteCategory, getAllCategories, getSpecificCategory, searchCategories, updateCatgory } from '../Controllers/discCategoryController.js';
import { createConfig, deleteConfig, getSpecificConfig, updateConfig } from '../Controllers/bannerConfigController.js';
import { createContactUs, deleteMessage, getAllMessages, getSpecificMessage, updateMessage, updateMessageStatus } from '../Controllers/contactUsController.js';
const contactUsRoute = Router();

contactUsRoute.post('/createMessage', createContactUs);
contactUsRoute.delete('/deleteMessage/:id', deleteMessage);
contactUsRoute.put('/updateMessage', updateMessage);
contactUsRoute.get("/getSpecificMessage/:id", getSpecificMessage)
contactUsRoute.get("/getAllMessages", getAllMessages)
contactUsRoute.put('/updateMessageStatus', updateMessageStatus);
export default contactUsRoute;
