import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { createPayment, getAllPaymentByUser, getAllUsersPaymentDetails, savePaymentDetail } from '../Controllers/paymentController.js';
const paymentRoute = Router();


paymentRoute.post("/createPaymentIntent", createPayment)
paymentRoute.post("/savePaymentDetail", savePaymentDetail)
paymentRoute.get("/getAllPaymentsDetails", getAllUsersPaymentDetails)
paymentRoute.get("/getAllPaymentByUser/:id", getAllPaymentByUser)
export default paymentRoute;
