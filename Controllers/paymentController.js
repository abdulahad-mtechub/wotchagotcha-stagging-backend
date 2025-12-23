import Stripe from "stripe";
import pool from "../db.config/index.js";
import dotenv from 'dotenv';
dotenv.config();
const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
  );
const convertToSmallestUnit = (amount, currency) => {
    const minorUnits = {
      USD: 100, // US Dollar (1 USD = 100 cents)
      EUR: 100,
    };
  
    const minorUnit = minorUnits[currency] || 1; // Default to 1 if the currency is not in the map
  
    // Convert the amount to the smallest unit (e.g., cents)
    const amountInSmallestUnit = Math.ceil(amount * minorUnit); // Rounding to handle potential floating point precision issues
  
    return amountInSmallestUnit;
  };
  const createPaymentIntent = async (amount, currency, metadata) => {
    try {
      const amountInSmallestUnit = convertToSmallestUnit(amount, currency);
      console.log(amountInSmallestUnit);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency,
        metadata: metadata,
      });
      return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  export const createPayment = async (req, res) => {
    const { amount, currency, userId } = req.body;
    const metadata = { userId };
  
    try {
    //   const customer = await stripe.customers.create({
    //     email: email, // Customer's email address
    //   });
    //   console.log(customer.id);
      const paymentIntent = await createPaymentIntent(
        amount,
        currency.toUpperCase(),
        // customer.id,
        metadata
        // metadata: {
        //   // This is the metadata key
        //   userId: userId,
        // },
      );
      console.log(paymentIntent);
      res.status(200).json({statusCode:200,paymentIntent});
    } catch (error) {
      
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  };

  export const savePaymentDetail = async (req, res) => {
    try {
      const { userId,payment_detail } = req.body;
      const createQuery =
        "INSERT INTO payment (user_id,payment_detail) VALUES ($1,$2) RETURNING *";
      const result = await pool.query(createQuery, [userId,payment_detail]);
  
      if (result.rowCount === 1) {
        let userQuery = `SELECT
        payment.payment_detail, users.* FROM users
        LEFT JOIN payment ON users.id=payment.user_id
         WHERE users.id=$1
       `;
       const { rows } = await pool.query(userQuery, [userId]);     
        return res.status(201).json({
          statusCode: 201,
          message: "Payment saved successfully",
          data: rows[0] || [],
        });
      }
      res.status(400).json({ statusCode: 400, message: "Not created" });
    } catch (error) {
      console.error(error);
     if(error.constraint==='payment_user_id_fkey'){
          return res.status(400).json({ statusCode: 400, message: "user does not exist" });
        }
      res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
  };
  export const getAllUsersPaymentDetails = async (req, res) => {
    try {
      console.log(req.query);
      
      let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
      const perPage = parseInt(req.query.limit || 5);
      const offset = (page - 1) * perPage;
      let userQuery = `SELECT
      payment.payment_detail, users.* FROM payment
      LEFT JOIN users ON payment.user_id=users.id
      WHERE users.is_deleted = FALSE
`;

  
      if (req.query.page === undefined && req.query.limit === undefined) {
      } else {
        userQuery += ` LIMIT $1 OFFSET $2;`;
      }
      let queryParameters = [];
  
      if (req.query.page !== undefined || req.query.limit !== undefined) {
        queryParameters = [perPage, offset];
      }
  
      const { rows } = await pool.query(userQuery, queryParameters);
  
      if (req.query.page === undefined && req.query.limit === undefined) {
        // If no pagination is applied, don't calculate totalCategories and totalPages
        res.status(200).json({
          statusCode: 200,
          totalPayments: rows.length,
          AllUsers: rows,
        });
      } else {
        // Calculate the total number of categories (without pagination)
        const totalUserQuery = `SELECT COUNT(*) AS total FROM public.payment
        LEFT JOIN users ON payment.user_id=users.id
        WHERE users.is_deleted=FALSE`;
        const totalUsersResult = await pool.query(totalUserQuery);
        const totalUsers = totalUsersResult.rows[0].total;
        const totalPages = Math.ceil(totalUsers / perPage);
  
        res.status(200).json({
          statusCode: 200,
          totalPayments:totalUsers,
          totalPages,
          AllUser: rows,
        });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ statusCode: 500, message: "Internal server error", error });
    }
  };
  export const getAllPaymentByUser = async (req, res) => {
    try {
       const {id}=req.params
       const check=await pool.query(`SELECT * FROM users WHERE id=$1 AND is_deleted=FALSE`,[id])
       if(check.rows.length===0){
        return res.status(400).json({statusCode:400,message:"user not exist"})
       }
      let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
      const perPage = parseInt(req.query.limit || 5);
      const offset = (page - 1) * perPage;
      let userQuery = `SELECT
      payment.payment_detail, users.* FROM payment
      LEFT JOIN users ON payment.user_id=users.id
      WHERE users.id=$1 AND users.is_deleted = FALSE
`;

  
      if (req.query.page === undefined && req.query.limit === undefined) {
      } else {
        userQuery += ` LIMIT $2 OFFSET $3;`;
      }
      let queryParameters = [id];
  
      if (req.query.page !== undefined || req.query.limit !== undefined) {
        queryParameters = [id,perPage, offset];
      }
  
      const { rows } = await pool.query(userQuery, queryParameters);
  
      if (req.query.page === undefined && req.query.limit === undefined) {
        // If no pagination is applied, don't calculate totalCategories and totalPages
        res.status(200).json({
          statusCode: 200,
          totalPayments: rows.length,
          AllUsers: rows,
        });
      } else {
        // Calculate the total number of categories (without pagination)
        const totalUserQuery = `SELECT COUNT(*) AS total FROM public.payment
        LEFT JOIN users ON payment.user_id=users.id
        WHERE users.id=$1 AND users.is_deleted = FALSE`;
        const totalUsersResult = await pool.query(totalUserQuery,[id]);
        const totalUsers = totalUsersResult.rows[0].total;
        const totalPages = Math.ceil(totalUsers / perPage);
  
        res.status(200).json({
          statusCode: 200,
          totalPayments:totalUsers,
          totalPages,
          AllUser: rows,
        });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ statusCode: 500, message: "Internal server error", error });
    }
  };
// export const webhook = async (request, response) => {
//     const event = request.body;
  
//     // Handle the event
//     switch (event.type) {
//       case "payment_intent.created":
//         const paymentIntent = event.data.object;
//         // Then define and call a method to handle the successful payment intent.
//         // handlePaymentIntentSucceeded(paymentIntent);
//         break;
//       case "payment_intent.succeeded":
//         console.log("--------------------------------------------------------------------------------");
//         const paymentMethod = event.data.object;
//         const { metadata } = paymentMethod;
//         const userId = metadata.userId;
//         const paymentExpireDate = getDateAfter30Days();
//         const userObj = await userModel.updateOne(
//           { _id: userId },
//           {
//             $set: {
//               membership:"premium",
//               paymentSuccessful: true,
//               paymentExpireDate: paymentExpireDate,
//             },
//           }
//         );
//         if (userObj) {
//           cron.schedule("* * * */30 * *", () => executeAfter30Days(userId));
//         }
  
//         // Then define and call a method to handle the successful attachment of a PaymentMethod.
//         // handlePaymentMethodAttached(paymentMethod);
//         break;
//       // ... handle other event types
//       case "charge.succeeded":
//         const pMethod = event.data.object;
//         const { customer, payment_method } = pMethod;
//         const uId = pMethod.metadata.userId;
//         const paymentObj = new PaymentsModel({
//           customerId: customer,
//           paymentMethodId: payment_method,
//           userId: uId,
//         });
//         await paymentObj.save();
//         break;
//       default:
//         console.log(`Unhandled event type ${event.type}`);
//     }
  
//     // Return a response to acknowledge receipt of the event
//     response.json({ received: true });
//   };