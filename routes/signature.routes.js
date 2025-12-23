import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { upload } from '../utils/ImageHandler.js'
import { createSignature, deleteAllSignature, deleteSignature, getAllSignature, getAllSignatureByUserId, getSpecificSignature, updateSignature } from '../Controllers/signatureController.js';
const signatureRoute = Router();

signatureRoute.post('/createSignature', upload("signatureImages").single("image"), createSignature);
signatureRoute.delete('/deleteSignature/:id', deleteSignature);
signatureRoute.put('/updateSignature', upload("signatureImages").single("image"), updateSignature);
signatureRoute.get("/getAllSignatures", getAllSignature)
signatureRoute.get("/getAllSignaturesByUserId/:id", getAllSignatureByUserId)
signatureRoute.get("/getSpecificSignature/:id", getSpecificSignature)
signatureRoute.delete("/deleteAllSignature", deleteAllSignature)
export default signatureRoute;
