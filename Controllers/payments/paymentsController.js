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
import pool from "../../db.config/index.js";
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

    // create payment intent
    const intent = await stripeInstance.paymentIntents.create({
      payment_method: paymentMethodId,
      customer: user.customer_id,
      amount: Math.round(Number(amount) * 100),
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // persist into stripe_payments table (single payments table) and update banner.transaction_id
    try {
      const rawResponse = JSON.stringify(intent);
      const providerTransactionId = intent.id || null;
      const amountCents = intent.amount || Math.round(Number(amount) * 100);
      const amountDecimal = amountCents ? (Number(amountCents) / 100).toFixed(2) : null;
      const currency = intent.currency || 'usd';
      const status = intent.status || null;
      const payment_method = intent.payment_method || null;
      const customer_id = intent.customer || user.customer_id || null;

      const insertQuery = `
        INSERT INTO stripe_payments
        (user_id, banner_id, stripe_session_id, provider_transaction_id, status, amount_cents, amount_decimal, currency, price_id, product_id, payment_method, customer_id, receipt_url, raw_response, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW()) RETURNING *
      `;
      const receipt_url = intent.charges?.data?.[0]?.receipt_url || null;
      const insertParams = [userId, banner_id || null, null, providerTransactionId, status, amountCents, amountDecimal, currency, null, null, payment_method, customer_id, receipt_url, rawResponse];
      await pool.query(insertQuery, insertParams);

      if (banner_id && providerTransactionId) {
        try {
            await pool.query(`UPDATE banner SET transaction_id = $1, paid_status = TRUE WHERE id = $2`, [providerTransactionId, banner_id]);
        } catch (e) {
          console.warn('Failed to update banner with transaction info for transferPayment:', e.message);
        }
      }
    } catch (e) {
      console.error('Failed to persist transfer payment:', e.message);
    }

    const message = `Your transaction of ${amount} has been successfully started`; 
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

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { priceId, lookupKey, successUrl: rawSuccessUrl, cancelUrl: rawCancelUrl } = req.body;

    if ((!priceId && !lookupKey) || !rawSuccessUrl || !rawCancelUrl) {
      return sendErrorResponse(res, 400, 'MISSING_PARAMS', 'priceId or lookupKey, successUrl and cancelUrl are required');
    }

    // Normalize URLs: Stripe requires absolute URLs with scheme
    const normalizeUrl = (u) => {
      if (!u || typeof u !== 'string') return null;
      const trimmed = u.trim();
      if (trimmed.startsWith('//')) return `https:${trimmed}`;
      if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
      return trimmed;
    };

    const successUrl = normalizeUrl(rawSuccessUrl);
    const cancelUrl = normalizeUrl(rawCancelUrl);
    if (!successUrl || !cancelUrl) return sendErrorResponse(res, 400, 'INVALID_URL', 'successUrl and cancelUrl must be valid URLs');

    // Try to get user email if authenticated
    let customerEmail = undefined;
    if (userId) {
      const user = await checkUserExist(userId);
      if (user && user.email) customerEmail = user.email;
    }

    // Resolve lookup key to price id if provided
    let finalPriceId = priceId || null;
    if (!finalPriceId && lookupKey) {
      try {
        const prices = await stripeInstance.prices.list({ lookup_keys: [lookupKey], limit: 1 });
        if (!prices || !prices.data || prices.data.length === 0) {
          return sendErrorResponse(res, 400, 'PRICE_NOT_FOUND', `Could not find price for lookupKey: ${lookupKey}`);
        }
        finalPriceId = prices.data[0].id;
      } catch (e) {
        console.warn('Failed resolving lookupKey to price:', e.message);
        return sendErrorResponse(res, 500, 'STRIPE_ERROR', 'Failed to resolve price lookup key');
      }
    }

    const session = await stripeInstance.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: finalPriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
    });

    return sendSuccessResponse(res, 'Checkout session created', { url: session.url, id: session.id });
  } catch (err) {
    console.error('createCheckoutSession error', err);
    return sendErrorResponse(res, 500, 'STRIPE_ERROR', err.message || 'Stripe error');
  }
};

export const verifyCheckoutSession = async (req, res) => {
  try {
    const userId = req.user?.userId;
      const { banner_id } = req.body || {};
    if (!userId) return sendErrorResponse(res, 401, 'AUTH_REQUIRED', 'Authentication required');

    const { sessionId, plan_id } = req.body || {};
    if (!sessionId) return sendErrorResponse(res, 400, 'MISSING_SESSION_ID', 'sessionId is required');

    // Handle free-trial synthetic sessions
    if (typeof sessionId === 'string' && sessionId.startsWith('free_trial_')) {
      const planIdValue = plan_id ? String(plan_id) : null;

      // Idempotent: check existing stripe_payments
      let transaction = null;
      try {
        const exist = await pool.query(`SELECT * FROM stripe_payments WHERE provider_transaction_id = $1 LIMIT 1`, [sessionId]);
        if (exist.rows && exist.rows[0]) transaction = exist.rows[0];
      } catch (e) {
        console.warn('Could not check existing stripe_payments for free trial:', e.message);
      }

      if (!transaction) {
        const rawResponse = JSON.stringify({ free_trial: true });
        const insertQuery = `
          INSERT INTO stripe_payments
          (user_id, banner_id, stripe_session_id, provider_transaction_id, status, amount_cents, amount_decimal, currency, price_id, product_id, payment_method, customer_id, receipt_url, raw_response, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW()) RETURNING *
        `;
        const amountDecimal = 0.00;
        try {
          const insertResult = await pool.query(insertQuery, [userId, banner_id || null, sessionId, sessionId, 'paid', 0, amountDecimal, 'usd', null, null, null, null, null, rawResponse]);
          if (insertResult.rows && insertResult.rows[0]) transaction = insertResult.rows[0];
        } catch (e) {
          console.warn('Failed to insert stripe_payments for free trial:', e.message);
        }
      }

      // Create subscription record (one month trial) idempotently
      let subscription = null;
      try {
        await pool.query(`UPDATE user_subscriptions SET status='cancelled', is_active=false WHERE user_id=$1 AND status='active'`, [userId]);

        const expiresAtDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const existSub = await pool.query(`SELECT * FROM user_subscriptions WHERE provider_transaction_id = $1 AND user_id = $2 LIMIT 1`, [sessionId, userId]);
        if (existSub.rows && existSub.rows[0]) {
          subscription = existSub.rows[0];
        } else {
          const insertSubQuery = `
            INSERT INTO user_subscriptions
            (user_id, plan_id, provider, provider_transaction_id, stripe_price_id, quantity, receipt_data, start_date, expires_at, status, is_active, created_at, updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8,'active',TRUE,NOW(),NOW())
            RETURNING *
          `;
          const receipt = JSON.stringify({ free_trial: true });
          const subParams = [userId, planIdValue, 'free', sessionId, null, 1, receipt, expiresAtDate];
          try {
            const subResult = await pool.query(insertSubQuery, subParams);
            if (subResult.rows && subResult.rows[0]) subscription = subResult.rows[0];
          } catch (e) {
            console.warn('Failed to insert free trial subscription:', e.message);
          }
        }

        // Optionally mark user premium
        try { await pool.query(`UPDATE users SET is_premium = TRUE WHERE id = $1`, [userId]); } catch (e) { /* ignore */ }
      } catch (e) {
        console.warn('Failed to create free trial subscription:', e.message);
      }

      // Build minimal response for frontend verification
      // return only status and our DB payment id
      const paymentId = transaction && transaction.id ? transaction.id : null;
      return sendSuccessResponse(res, 'Free trial verified', { status: paymentId ? 'paid' : 'not_saved', payment_id: paymentId });
    }

    // Retrieve the session and expand objects
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent', 'subscription', 'customer'] });
    if (!session) return sendErrorResponse(res, 404, 'SESSION_NOT_FOUND', 'Checkout session not found');

    // Fetch line items to get price/product info
    let lineItems = null;
    try {
      const li = await stripeInstance.checkout.sessions.listLineItems(sessionId, { limit: 10 });
      lineItems = li && li.data ? li.data : [];
    } catch (e) {
      console.warn('Could not list line items for session:', e.message);
      lineItems = [];
    }
    const firstItem = lineItems.length > 0 ? lineItems[0] : null;
    const priceId = firstItem?.price?.id || null;
    const productId = firstItem?.price?.product || null;

    const paymentMode = session.mode;
    let paid = false;
    let amountCents = null;
    let currency = null;
    let providerTransactionId = null;

    if (paymentMode === 'payment') {
      const pi = session.payment_intent;
      if (!pi) return sendErrorResponse(res, 400, 'NO_PAYMENT_INTENT', 'PaymentIntent not available on session');
      paid = pi.status === 'succeeded' || session.payment_status === 'paid';
      amountCents = pi.amount || session.amount_total || null;
      currency = pi.currency || session.currency || null;
      providerTransactionId = pi.id;
    } else {
      const subscriptionObj = session.subscription;
      if (!subscriptionObj) return sendErrorResponse(res, 400, 'NO_SUBSCRIPTION', 'Subscription object not available on session');
      // Retrieve subscription from Stripe for authoritative status
      const sub = await stripeInstance.subscriptions.retrieve(typeof subscriptionObj === 'string' ? subscriptionObj : subscriptionObj.id);
      paid = sub.status === 'active' || sub.status === 'trialing';
      const price = sub.items?.data?.[0]?.price;
      amountCents = price?.unit_amount || null;
      currency = price?.currency || null;
      providerTransactionId = sub.id;
    }

    if (!paid) return sendErrorResponse(res, 400, 'NOT_PAID', 'Payment not completed');

    // Save transaction to DB (idempotent)
    const rawResponse = JSON.stringify(session);
    let transaction = null;
    if (providerTransactionId) {
      try {
        const exist = await pool.query(`SELECT * FROM stripe_payments WHERE provider_transaction_id = $1 LIMIT 1`, [providerTransactionId]);
        if (exist.rows && exist.rows[0]) transaction = exist.rows[0];
      } catch (e) {
        console.warn('Could not check existing stripe_payments:', e.message);
      }
    }

    if (!transaction) {
      // extract additional main fields for easier querying
      let payment_method = null;
      let customer_id = null;
      let receipt_url = null;
      try {
        payment_method = session.payment_intent?.payment_method || session.payment_intent?.payment_method_types?.[0] || null;
        customer_id = (session.customer && typeof session.customer === 'object') ? session.customer.id : session.customer || null;
        receipt_url = session.payment_intent?.charges?.data?.[0]?.receipt_url || null;
      } catch (e) {
        // ignore extraction errors
      }

      const insertQuery = `
        INSERT INTO stripe_payments
        (user_id, stripe_session_id, provider_transaction_id, status, amount_cents, amount_decimal, currency, price_id, product_id, payment_method, customer_id, receipt_url, raw_response, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW()) RETURNING *
      `;
      const amountDecimal = amountCents ? (Number(amountCents) / 100).toFixed(2) : null;
      const insertParams = [userId, sessionId, providerTransactionId, 'paid', amountCents, amountDecimal, currency, priceId, productId, payment_method, customer_id, receipt_url, rawResponse];
      try {
        const insertResult = await pool.query(insertQuery, insertParams);
        if (insertResult.rows && insertResult.rows[0]) transaction = insertResult.rows[0];
      } catch (e) {
        console.error('Failed to insert stripe_payments:', e.message);
        return sendErrorResponse(res, 500, 'DB_ERROR', 'Failed to save payment');
      }
    }

    // Handle subscription persistence
    let subscriptionRecord = null;
    if (paymentMode === 'subscription') {
      try {
        await pool.query(`UPDATE user_subscriptions SET status='cancelled', is_active=false WHERE user_id=$1 AND status='active'`, [userId]);

        // Determine expires_at
        let expiresAt = null;
        try {
          const stripeSub = await stripeInstance.subscriptions.retrieve(providerTransactionId);
          expiresAt = stripeSub.current_period_end ? new Date(stripeSub.current_period_end * 1000) : null;
        } catch (e) {
          console.warn('Could not retrieve subscription details for expires_at:', e.message);
        }

        const existSub = await pool.query(`SELECT * FROM user_subscriptions WHERE provider_transaction_id = $1 AND user_id = $2 LIMIT 1`, [providerTransactionId, userId]);
        if (existSub.rows && existSub.rows[0]) {
          subscriptionRecord = existSub.rows[0];
        } else {
          const insertSubQuery = `
            INSERT INTO user_subscriptions
            (user_id, plan_id, provider, provider_transaction_id, stripe_price_id, quantity, receipt_data, start_date, expires_at, status, is_active, created_at, updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8,'active',TRUE,NOW(),NOW())
            RETURNING *
          `;
          const subParams = [userId, plan_id ? String(plan_id) : null, 'stripe', providerTransactionId, priceId, 1, rawResponse, expiresAt];
          const subResult = await pool.query(insertSubQuery, subParams);
          if (subResult.rows && subResult.rows[0]) subscriptionRecord = subResult.rows[0];
        }
      } catch (e) {
        console.warn('Failed to create/check user_subscriptions:', e.message);
      }
    }

    // return only status and our DB payment id
    const paymentId = transaction && transaction.id ? transaction.id : null;
    return sendSuccessResponse(res, 'Session verified and saved', { status: paymentId ? 'paid' : 'not_saved', payment_id: paymentId });
  } catch (err) {
    console.error('verifyCheckoutSession error', err);
    return sendErrorResponse(res, 500, 'STRIPE_ERROR', err.message || 'Stripe error');
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
