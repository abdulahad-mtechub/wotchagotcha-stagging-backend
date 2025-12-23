import stripe from "stripe";
import {
  sendErrorResponse,
  sendSuccessResponse,
  updateUserWithCustomerId,
  checkUserExist,
  insertCards,
  saveTransactions,
  retrieveTransactions,
  retrieveCards,
} from "./util.js";
import {
  ERROR_CUSTOMER_NOT_FOUND,
  ERROR_INTERNAL_SERVER,
  ERROR_USER_NOT_FOUND,
} from "./constants.js";

const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

export const createCustomer = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await checkUserExist(userId);
    if (!user) {
      sendErrorResponse(
        res,
        ERROR_USER_NOT_FOUND.statusCode,
        ERROR_USER_NOT_FOUND.code,
        ERROR_USER_NOT_FOUND.message
      );
    }
    if (!user.customer_id) {
      const customer = await stripeInstance.customers.create({
        name: user.username || "",
        email: user.email,
      });

      const updatedUser = await updateUserWithCustomerId(customer.id, userId);
      const message = "Customer on stripe created successfully!";
      sendSuccessResponse(res, message, updatedUser);
    } else {
      const message = "Customer already exists.";
      sendSuccessResponse(res, message, user);
    }
  } catch (error) {
    console.error("Error in customer creation or updating user:", error);
    sendErrorResponse(
      res,
      ERROR_INTERNAL_SERVER.statusCode,
      ERROR_INTERNAL_SERVER.code,
      ERROR_INTERNAL_SERVER.message
    );
  }
};

export const attachPaymentMethodToCustomer = async (req, res) => {
  const userId = req.user.userId;
  const { paymentMethodId } = req.body;

  try {
    const user = await checkUserExist(userId);
    if (!user) {
      sendErrorResponse(
        res,
        ERROR_USER_NOT_FOUND.statusCode,
        ERROR_USER_NOT_FOUND.code,
        ERROR_USER_NOT_FOUND.message
      );
    }
    if (!user.customer_id) {
      sendErrorResponse(
        res,
        ERROR_CUSTOMER_NOT_FOUND.statusCode,
        ERROR_CUSTOMER_NOT_FOUND.code,
        ERROR_CUSTOMER_NOT_FOUND.message
      );
    }

    const paymentMethod = await stripeInstance.paymentMethods.attach(
      paymentMethodId,
      {
        customer: user.customer_id,
      }
    );

    // insert the payment method into database 'cards' collection
    await insertCards(paymentMethod, user.customer_id, userId);

    const message = "Payment Method Attached to the customer";

    sendSuccessResponse(res, message, paymentMethod);
  } catch (error) {
    console.error("Error in attaching payment method to customer", error);
    sendErrorResponse(
      res,
      ERROR_INTERNAL_SERVER.statusCode,
      ERROR_INTERNAL_SERVER.code,
      ERROR_INTERNAL_SERVER.message
    );
  }
};

export const transferPayment = async (req, res) => {
  const userId = req.user.userId;

  const { paymentMethodId, amount, banner_id } = req.body;
  try {
    const user = await checkUserExist(userId);
    if (!user) {
      sendErrorResponse(
        res,
        ERROR_USER_NOT_FOUND.statusCode,
        ERROR_USER_NOT_FOUND.code,
        ERROR_USER_NOT_FOUND.message
      );
    }
    if (!user.customer_id) {
      sendErrorResponse(
        res,
        ERROR_CUSTOMER_NOT_FOUND.statusCode,
        ERROR_CUSTOMER_NOT_FOUND.code,
        ERROR_CUSTOMER_NOT_FOUND.message
      );
    }

    // transfer payments
    await stripeInstance.paymentIntents.create({
      payment_method: paymentMethodId,
      customer: user.customer_id,
      amount: amount * 100,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // save the user transaction
    await saveTransactions(userId, banner_id, amount);

    const message = `Your transaction of ${amount} has been successfully done!`;

    sendSuccessResponse(res, message);
  } catch (error) {
    console.error("Error in transferring payments", error, error.message);
    sendErrorResponse(
      res,
      ERROR_INTERNAL_SERVER.statusCode,
      ERROR_INTERNAL_SERVER.code,
      error.message
    );
  }
};

export const getUserTransactions = async (req, res) => {
  const userId = req.user.userId;
  const page = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 20);
  const offset = (page - 1) * limit;
  try {
    const transactionsResult = await retrieveTransactions(
      userId,
      limit,
      offset
    );

    if (!transactionsResult) {
      const message = `Transaction record are empty`;
      sendSuccessResponse(res, message, []);
    } else {
      const message = `Transaction record retrieved successfully!`;
      sendSuccessResponse(res, message, {
        count: transactionsResult.count,
        data: transactionsResult.data,
      });
    }
  } catch (error) {
    console.error("Error in getting users transactions", error);
    sendErrorResponse(
      res,
      ERROR_INTERNAL_SERVER.statusCode,
      ERROR_INTERNAL_SERVER.code,
      ERROR_INTERNAL_SERVER.message
    );
  }
};

export const getUserCards = async (req, res) => {
  const userId = req.user.userId;
  const page = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 20);
  const offset = (page - 1) * limit;
  try {
    const cardResult = await retrieveCards(userId, limit, offset);

    if (!cardResult) {
      const message = `Card record are empty`;
      sendSuccessResponse(res, message, []);
    } else {
      const message = `Card record retrieved successfully!`;
      sendSuccessResponse(res, message, {
        count: cardResult.count,
        data: cardResult.data,
      });
    }
  } catch (error) {
    console.error("Error in transferring payments", error);
    sendErrorResponse(
      res,
      ERROR_INTERNAL_SERVER.statusCode,
      ERROR_INTERNAL_SERVER.code,
      ERROR_INTERNAL_SERVER.message
    );
  }
};
