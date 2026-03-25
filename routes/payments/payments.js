import { Router } from "express";

import { verification } from "../../Middleware/Verification.js";
import {
  attachPaymentMethodToCustomer,
  createCustomer,
  getUserCards,
  getUserTransactions,
  transferPayment,
  createCheckoutSession,
  verifyCheckoutSession,
} from "../../Controllers/payments/paymentsController.js";
import { validateBody } from "../../Middleware/validation.js";
const router = Router();

router.post("/create-customer", createCustomer);
router.post(
  "/attach-payment-method",

  validateBody(["paymentMethodId"]),
  attachPaymentMethodToCustomer
);
router.post(
  "/transfer-payment",

  validateBody(["amount", "banner_id", "paymentMethodId"]),
  transferPayment
);
router.post('/create-checkout-session', verification, createCheckoutSession);
router.post('/verify-checkout-session', verification, verifyCheckoutSession);
router.get("/user-transactions", getUserTransactions);
router.get("/user-cards", getUserCards);

export default router;
