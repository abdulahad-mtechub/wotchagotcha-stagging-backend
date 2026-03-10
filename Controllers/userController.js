import { getSingleRow, insertRow } from "../queries/common.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.config/index.js";
const JWT_SECRET = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'dev-secret-please-change';
import {
  CancellationEmail,
  SubscriptionEmail,
  WellcomeEmail,
  forgetPasswordTemplate,
} from "../utils/EmailTemplates.js";
import { emailSent } from "../utils/EmailSent.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";
import { getMonthName } from "../utils/getMonth.js";
import cloudinary from "../utils/cloudinary.js";
export const login = async (req, res) => {
  const { email, password, role, deviceId } = req.body;

  try {
    const query = `SELECT * FROM users WHERE email=$1 AND role=$2 AND is_deleted=$3`;
    const { rows } = await pool.query(query, [email, role, "FALSE"]);

    if (
      rows.length === 0 ||
      !(await bcrypt.compare(password, rows[0].password)) ||
      rows[0].role !== role
    ) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Invalid email or password" });
    }

    // Update device_id only when provided and different
    if (deviceId && rows[0]?.device_id !== deviceId) {
      const updateDeviceQuery = `UPDATE users SET device_id=$1 WHERE id=$2`;
      await pool.query(updateDeviceQuery, [deviceId, rows[0].id]);
      // reflect change in the local row object
      rows[0].device_id = deviceId;
    }

    if (rows[0].is_deleted) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Your account has been deleted." });
    }
    if (rows[0].block) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Your account has been blocked" });
    }

    const token = jwt.sign({ userId: rows[0].id }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({
      statusCode: 200,
      user: {
        id: rows[0].id,
        token,
        username: rows[0].username,
        email: rows[0].email,
        block: rows[0].block,
        image: rows[0].image,
        device_id: deviceId || rows[0].device_id,
        city: rows[0].city,
        country: rows[0].country,
        province: rows[0].province,
        profession: rows[0].profession,
        state: rows[0].state,
        region: rows[0].region,
        banner_subscript_key: rows[0].banner_subscript_key,
        premium_subscription_key: rows[0].premium_subscription_key,
        is_premium: rows[0].is_premium,
        created_at: rows[0].created_at,
        updated_at: rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const register = async (req, res) => {
  try {
    const { email, username, password, confirmPassword, role, device_id, city, country, province, profession, state, region, image } =
      req.body;
      console.log("iamge",image)
    if (password !== confirmPassword) {
      return res.status(401).json({
        statusCode: 401,
        message: "Password and ConfirmPassword not matched",
      });
    }
    await pool.query("BEGIN"); // Start a transaction

    const existingUserResult = await getSingleRow("users", {
      column: "email",
      value: email,
    });
    console.log(existingUserResult);
    if (existingUserResult.length > 0) {
      await pool.query("ROLLBACK"); // Roll back the transaction
      if (!existingUserResult[0].is_deleted) {
        return res
          .status(401)
          .json({ statusCode: 401, message: "Email is already in use" });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save image value provided by frontend directly (no Cloudinary upload)
    const imageUrl = image || null;

    const insertUserQuery =
      "INSERT INTO users (email, password, role, username, device_id, image, city, country, province, profession, state, region) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *";
    const newUserResult = await pool.query(insertUserQuery, [
      email,
      hashedPassword,
      role,
      username,
      device_id,
      imageUrl,
      city || null,
      country || null,
      province || null,
      profession || null,
      state || null,
      region || null,
    ]);
    const userId = newUserResult.rows[0].id;
    await pool.query("COMMIT"); // Commit the transaction
    const token = jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.status(201).json({
      statusCode: 200,
      newUser: {
        id: userId,
        token,
        username: newUserResult.rows[0].username,
        role: newUserResult.rows[0].role,
        block: newUserResult.rows[0].block,
        is_deleted: newUserResult.rows[0].is_deleted,
        device_id: newUserResult.rows[0].device_id,
        email: newUserResult.rows[0].email,
        image: newUserResult.rows[0].image,
        city: newUserResult.rows[0].city,
        country: newUserResult.rows[0].country,
        province: newUserResult.rows[0].province,
        profession: newUserResult.rows[0].profession,
        state: newUserResult.rows[0].state,
        region: newUserResult.rows[0].region,
        banner_subscript_key: newUserResult.rows[0].banner_subscript_key,
        premium_subscription_key: newUserResult.rows[0].premium_subscription_key,
        is_premium: newUserResult.rows[0].is_premium,
        created_at: newUserResult.rows[0].created_at,
        updated_at: newUserResult.rows[0].updated_at,
      },
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      error: error.stack,
    });
  } finally {
    await pool.query("END"); // End the transaction
  }
};
export const uploadImage = async (req, res) => {
  try {
    // You can save additional information about the image in your database
    const { userId, image } = req.body;
    const existingUserResult = await getSingleRow("users", {
      column: "id",
      value: userId,
    });

    if (existingUserResult.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not found" });
    }
    const filePath = `${image}`; // Path to the uploaded image

    // Insert the image information into your database
    const insertImageQuery =
      "UPDATE users SET image=$1 WHERE id=$2 RETURNING *";
    const result = await pool.query(insertImageQuery, [filePath, userId]);

    res.status(201).json({
      statusCode: 201,
      message: "Image uploaded successfully",
      image: {
        id: userId,
        username: result.rows[0].username,
        image: result.rows[0].image,
        role: result.rows[0].role,
        block: result.rows[0].block,
        email: result.rows[0].email,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      error: error.stack,
    });
  }
};

export const forgetPassword = async (req, res, next) => {
  const { email, role } = req.body;
  try {
    const userEmailExistQuery =
      "SELECT * FROM users WHERE email=$1 AND role=$2";
    const userEmailExistResult = await pool.query(userEmailExistQuery, [
      email,
      role,
    ]);
    if (userEmailExistResult.rows.length === 0) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Invalid Email" });
    }
    if (userEmailExistResult.rows[0].is_deleted) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Your account has been deleted." });
    }
    if (userEmailExistResult.rows[0].block) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Your account has been blocked" });
    }
    const otpCode = Math.floor(1000 + Math.random() * 9000);
    const updateQuery = "UPDATE users SET code =$1 WHERE email=$2";
    const updateQueryResult = await pool.query(updateQuery, [otpCode, email]);
    if (updateQueryResult.rowCount === 1) {
      const output = forgetPasswordTemplate(otpCode);
      await emailSent(email, output, "Verification Code");
      res.status(200).json({
        statusCode: 200,
        message: "Reset password link sent successfully!",
        otp: otpCode,
        userEmailExistResult: userEmailExistResult.rows[0],
      });
    } else {
      res.status(400).json({
        statusCode: 400,
        message: "Reset passord link not sent",
      });
    }
  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      error: error.stack,
      message: "Server error",
    });
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { code, email, role } = req.body;

    const veritOtpQuery =
      "UPDATE users SET code=$1 WHERE email=$2 AND code=$3 AND role=$4 RETURNING *";
    const VerifyResult = await pool.query(veritOtpQuery, [
      null,
      email,
      code,
      role,
    ]);
    if (VerifyResult.rowCount === 1) {
      // const token = jwt.sign(
      //   { email, id: VerifyResult.rows[0].id },
      //   process.env.JWT_SECRET_KEY + VerifyResult.rows[0].password,
      //   { expiresIn: "60m" }
      // );
      return res.status(200).json({
        statusCode: 200,
        message: "Otp Code verify successfully",
        userId: VerifyResult.rows[0].id,
      });
    }
    return res
      .status(401)
      .json({ statusCode: 401, message: "Invalid Otp Code" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      statusCode: 500,
      error: error.stack,
      message: "Server error",
    });
  }
};
export const ResetPasswordLinkValidate = async (req, res, next) => {
  const { id, token } = req.body;
  const userQuery = `SELECT * FROM users WHERE id=$1`;
  const userResult = await pool.query(userQuery, [id]);
  if (userResult.rows.length === 0) {
    return res.status(401).json({ statusCode: 400, message: "Invalid Link" });
  }

  const secret = process.env.JWT_SECRET_KEY + userResult.rows[0].password;

  try {
    const payload = jwt.verify(token, secret);

    if (!payload) {
      return res.status(401).json({ statusCode: 401, message: "Link Expire" });
    }

    return res.status(200).json({ status: 200, message: "Valid Link" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 500, error, message: "Server error" });
  }
};
export const resetPassword = async (req, res, next) => {
  try {
    const {
      password,
      confirmPassword,
      id,
      // token
    } = req.body;
    if (password !== confirmPassword) {
      return res.status(401).json({
        statusCode: 401,
        message: "Password and confirm password not matched",
      });
    }
    const userEmailExistQuery = "SELECT * FROM users WHERE   id=$1";
    const userEmailExistResult = await pool.query(userEmailExistQuery, [id]);
    if (userEmailExistResult.rows.length === 0) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "User not exist" });
    }
    if (userEmailExistResult.rows[0].is_deleted) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Your account has been deleted." });
    }
    if (userEmailExistResult.rows[0].block) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Your account has been blocked" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateQuery = "UPDATE users SET password=$1 WHERE id=$2";
    const updateResult = await pool.query(updateQuery, [hashedPassword, id]);
    if (updateResult.rowCount === 1) {
      return res
        .status(200)
        .json({ statusCode: 200, message: "Password reset successfully" });
    }

    return res
      .status(401)
      .json({ statusCode: 401, message: "Password not updated" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      statusCode: 500,
      error: error.stack,
      message: "Server error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      id,
      username,
      hide_email,
      hide_location,
      hide_profession,
      bio,
      city,
      state,
      province,
      region,
      profession,
      image
    } = req.body;
    const existingUserResult = await getSingleRow("users", {
      column: "id",
      value: id,
    });

    if (existingUserResult.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not found" });
    }
    const insertUserQuery =
      "UPDATE users SET username=$1, hide_email=$2, hide_location=$3, hide_profession=$4, bio=$5, city=$6, state=$7, province=$8, region=$9, profession=$10, image=$11 WHERE id=$12 RETURNING *";
    const newUserResult = await pool.query(insertUserQuery, [
      username || existingUserResult[0].username,
      hide_email !== undefined ? hide_email : existingUserResult[0].hide_email,
      hide_location !== undefined ? hide_location : existingUserResult[0].hide_location,
      hide_profession !== undefined ? hide_profession : existingUserResult[0].hide_profession,
      bio !== undefined ? bio : existingUserResult[0].bio,
      city !== undefined ? city : existingUserResult[0].city,
      state !== undefined ? state : existingUserResult[0].state,
      province !== undefined ? province : existingUserResult[0].province,
      region !== undefined ? region : existingUserResult[0].region,
      profession !== undefined ? profession : existingUserResult[0].profession,
      image !== undefined ? image : existingUserResult[0].image,
      id
    ]);
    res.status(200).json({
      statusCode: 200,
      newUser: {
        id: id,
        username: newUserResult.rows[0].username,
        role: newUserResult.rows[0].role,
        block: newUserResult.rows[0].block,
        email: newUserResult.rows[0].email,
        image: newUserResult.rows[0].image,
        banner_subscript_key: newUserResult.rows[0].banner_subscript_key,
        premium_subscription_key: newUserResult.rows[0].premium_subscription_key,
        is_premium: newUserResult.rows[0].is_premium,
        hide_email: newUserResult.rows[0].hide_email,
        hide_location: newUserResult.rows[0].hide_location,
        hide_profession: newUserResult.rows[0].hide_profession,
        bio: newUserResult.rows[0].bio,
        city: newUserResult.rows[0].city,
        state: newUserResult.rows[0].state,
        province: newUserResult.rows[0].province,
        region: newUserResult.rows[0].region,
        profession: newUserResult.rows[0].profession,
        created_at: newUserResult.rows[0].created_at,
        updated_at: newUserResult.rows[0].updated_at,
      },
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      error: error.stack,
    });
  } finally {
    await pool.query("END"); // End the transaction
  }
};

export const getSpecificUser = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `SELECT * FROM users WHERE id=$1`;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "User not found" });
    }

    const likesQuery = `SELECT COUNT(*) FROM user_profile_likes WHERE liked_user_id=$1`;
    const likesResult = await pool.query(likesQuery, [id]);
    const total_likes = parseInt(likesResult.rows[0].count) || 0;

    // Mask fields based on privacy settings
    let email = rows[0].email;
    let city = rows[0].city;
    let country = rows[0].country;
    let province = rows[0].province;
    let profession = rows[0].profession;
    let state = rows[0].state;
    let region = rows[0].region;
    let bio = rows[0].bio;

    if (rows[0].hide_email) email = null;
    if (rows[0].hide_location) {
      city = null; country = null; province = null; state = null; region = null;
    }
    if (rows[0].hide_profession) profession = null;
    res.status(200).json({
      statusCode: 200,
      user: {
        id: rows[0].id,
        role: rows[0].role,
        username: rows[0].username,
        email: email,
        block: rows[0].block,
        image: rows[0].image,
        city: city,
        country: country,
        province: province,
        profession: profession,
        state: state,
        region: region,
        banner_subscript_key: rows[0].banner_subscript_key,
        premium_subscription_key: rows[0].premium_subscription_key,
        is_premium: rows[0].is_premium,
        hide_email: rows[0].hide_email,
        hide_location: rows[0].hide_location,
        hide_profession: rows[0].hide_profession,
        bio: bio,
        total_likes: total_likes,
        created_at: rows[0].created_at,
        updated_at: rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const likeUserProfile = async (req, res) => {
  try {
    const { liked_user_id, liked_by_user_id } = req.body;

    if (!liked_user_id || !liked_by_user_id) {
      return res.status(400).json({ statusCode: 400, message: "liked_user_id and liked_by_user_id are required" });
    }

    if (liked_user_id === liked_by_user_id) {
      return res.status(400).json({ statusCode: 400, message: "You cannot like your own profile" });
    }

    // Check if like already exists
    const checkQuery = "SELECT * FROM user_profile_likes WHERE liked_user_id = $1 AND liked_by_user_id = $2";
    const { rows } = await pool.query(checkQuery, [liked_user_id, liked_by_user_id]);

    if (rows.length > 0) {
      // Unlike
      const deleteQuery = "DELETE FROM user_profile_likes WHERE liked_user_id = $1 AND liked_by_user_id = $2";
      await pool.query(deleteQuery, [liked_user_id, liked_by_user_id]);
      return res.status(200).json({ statusCode: 200, message: "Profile unliked successfully", liked: false });
    } else {
      // Like
      const insertQuery = "INSERT INTO user_profile_likes (liked_user_id, liked_by_user_id) VALUES ($1, $2)";
      await pool.query(insertQuery, [liked_user_id, liked_by_user_id]);
      return res.status(200).json({ statusCode: 200, message: "Profile liked successfully", liked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error", error: error.message });
  }
};

export const getProfileLikesCount = async (req, res) => {
  try {
    const { user_id } = req.params;
    const query = "SELECT COUNT(*) FROM user_profile_likes WHERE liked_user_id = $1";
    const { rows } = await pool.query(query, [user_id]);
    const count = parseInt(rows[0].count) || 0;
    res.status(200).json({ statusCode: 200, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    console.log(req.query);
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let userQuery = `SELECT
   * FROM users
    WHERE is_deleted=FALSE
ORDER BY created_at DESC
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
        totalUsers: rows.length,
        AllUsers: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalUserQuery = `SELECT COUNT(*) AS total FROM public.users  WHERE is_deleted=FALSE`;
      const totalUsersResult = await pool.query(totalUserQuery);
      const totalUsers = totalUsersResult.rows[0].total;
      const totalPages = Math.ceil(totalUsers / perPage);

      res.status(200).json({
        statusCode: 200,
        totalUsers,
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

export const getAllUsersByYears = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    const { year } = req.query;
    let userQuery = `SELECT * FROM users WHERE EXTRACT(YEAR FROM created_at) = $1 ORDER BY created_at DESC
  `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      userQuery += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [year];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [year, perPage, offset];
    }

    const { rows } = await pool.query(userQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalUsers: rows.length,
        AllUsers: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalUserQuery = `SELECT COUNT(*) AS total FROM users WHERE EXTRACT(YEAR FROM created_at) = $1`;
      const totalUsersResult = await pool.query(totalUserQuery, [year]);
      const totalUsers = totalUsersResult.rows[0].total;
      const totalPages = Math.ceil(totalUsers / perPage);

      res.status(200).json({
        statusCode: 200,
        totalUsers,
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
export const countUsersByMonth = async (req, res) => {
  try {
    const { year } = req.query; // Get the year from the request query parameters

    // Check if the year is provided
    if (!year) {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Year is required" });
    }

    // Construct the SQL query to count users for each month in the provided year
    const userQuery = `
      SELECT
        EXTRACT(MONTH FROM created_at) AS month,
        COUNT(id) AS user_count
      FROM
        users
      WHERE
        EXTRACT(YEAR FROM created_at) = $1
      GROUP BY
        EXTRACT(MONTH FROM created_at)
      ORDER BY
        month
    `;

    // Execute the query with the provided year as a parameter
    const { rows } = await pool.query(userQuery, [year]);

    // Create an object to store user counts by month
    const userCountsByMonth = {};

    // Initialize user counts for all months to 0
    for (let month = 1; month <= 12; month++) {
      userCountsByMonth[getMonthName(month)] = 0;
    }

    // Process the result set to update user counts
    for (const row of rows) {
      const month = getMonthName(row.month);
      userCountsByMonth[month] = row.user_count;
    }

    return res.status(200).json({
      statusCode: 200,
      userCountsByMonth,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT * FROM users WHERE id=$1`;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }
    const result = await pool.query(
      `UPDATE users SET is_deleted=TRUE,deleted_date=NOW() WHERE id=$1 RETURNING id,username,email,role,image,is_deleted,deleted_date,block`,
      [id]
    );
    res.status(200).json({
      statusCode: 200,
      deletedUser: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deleteAllUsers = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM users RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No users found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All users deleted successfully",
      deletedUsers: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const searchUsers = async (req, res) => {
  try {
    const { name } = req.query;

    // Split the search query into individual words
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, Suppliers: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      // return `name ILIKE '%${word}%'`; // Use ILIKE for case-insensitive search
      return `(username ILIKE '%${word}%')`;
    });

    const userQuery = `SELECT
    *
    FROM
    users
   
    WHERE ${conditions.join(" OR ")}
    ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(userQuery);
    return res
      .status(200)
      .json({ statusCode: 200, totalResults: rows.length, Users: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const blockUnblockUser = async (req, res) => {
  try {
    const { block, id } = req.body; // You can use a JSON request body with a "block" field
    if (block !== true && block !== false) {
      return res.status(400).json({
        statusCode: 400,
        message:
          'Invalid value for the "block" parameter. It should be either true or false.',
      });
    }
    const query = "SELECT * FROM users WHERE id = $1";
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }
    const updateQuery = "UPDATE users SET block = $1 WHERE id = $2 RETURNING *";
    const updated = await pool.query(updateQuery, [block, id]);

    const message = block
      ? "User blocked suucessfully"
      : "User unblocked successfully";

    res.status(200).json({
      statusCode: 200,
      message,
      user: updated.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  const { id, currentPassword, newPassword, role } = req.body;
  try {
    const userEmailExistQuery = "SELECT * FROM users WHERE id=$1 AND role=$2";
    const { rows } = await pool.query(userEmailExistQuery, [id, role]);
    if (rows.length === 0) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "User not found" });
    }
    if (
      !(await bcrypt.compare(currentPassword, rows[0].password)) ||
      rows[0].role !== role
    ) {
      return res
        .status(401)
        .json({ statusCode: 401, message: "Current password invalid" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery = `UPDATE users SET password=$1 WHERE id=$2`;
    const updateResult = await pool.query(updateQuery, [hashedPassword, id]);
    if (updateResult.rowCount === 0) {
      return res
        .status(401)
        .json({ statusCode: 400, message: "Operation not successfull" });
    }

    res
      .status(200)
      .json({ statusCode: 200, message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllDeleteUsers = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    let userQuery = `
      SELECT id, username, email, role, image, is_deleted, deleted_date, block
      FROM users
      WHERE is_deleted = TRUE 
      AND deleted_date >= $1
      ORDER BY deleted_date DESC
    `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      userQuery += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [ninetyDaysAgo];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [ninetyDaysAgo, perPage, offset];
    }

    const { rows } = await pool.query(userQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalUsers: rows.length,
        AllDeletedUsers: rows.map((user) => ({
          ...user,
          daysLeftToRestore: Math.abs(
            Math.floor(
              (ninetyDaysAgo - user.deleted_date) / (1000 * 60 * 60 * 24)
            )
          ),
        })),
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalUserQuery = `SELECT COUNT(*) AS total FROM public.users  WHERE is_deleted = TRUE 
      AND deleted_date >= $1`;
      const totalUsersResult = await pool.query(totalUserQuery, [
        ninetyDaysAgo,
      ]);
      const totalUsers = totalUsersResult.rows[0].total;
      const totalPages = Math.ceil(totalUsers / perPage);

      res.status(200).json({
        statusCode: 200,
        totalUsers,
        totalPages,
        AllDeletedUsers: rows.map((user) => ({
          ...user,
          daysLeftToRestore: Math.abs(
            Math.floor(
              (ninetyDaysAgo - user.deleted_date) / (1000 * 60 * 60 * 24)
            )
          ),
        })),
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const restoreUser = async (req, res) => {
  try {
    const { id } = req.body;
    const query = `SELECT * FROM users WHERE id=$1`;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }
    await pool.query(
      `UPDATE users SET is_deleted=FALSE,deleted_date=$2 WHERE id=$1 RETURNING id,username,email,role,image,is_deleted,deleted_date,block`,
      [id, null]
    );
    res.status(200).json({
      statusCode: 200,
      restoreUser: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const { id, badge, amount } = req.body; // You can use a JSON request body with a "block" field
    console.log(badge);
    if (badge !== "gold" && badge !== "silver" && badge !== "brownze") {
      return res.status(400).json({
        statusCode: 400,
        message:
          'Invalid value for the "badge" parameter. It should be gold ,silver,brownze',
      });
    }
    const query = "SELECT * FROM users WHERE id = $1";
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }
    const updateQuery =
      "UPDATE users SET is_subscribed = $1,badge=$2,subscription_amount=$3 WHERE id = $4 RETURNING *";
    const updated = await pool.query(updateQuery, [true, badge, amount, id]);

    const message = "User subscribe suucessfully";

    res.status(200).json({
      statusCode: 200,
      message,
      user: updated.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getAllSubscribedUser = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let userQuery = `
      SELECT id, username, email, role, image, is_deleted, deleted_date, block,is_subscribed,badge,subscription_amount
      FROM users
      WHERE is_subscribed = TRUE 
      ORDER BY deleted_date DESC
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
        totalUsers: rows.length,
        AllDeletedUsers: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalUserQuery = `SELECT COUNT(*) AS total FROM public.users  WHERE is_subscribed = TRUE `;
      const totalUsersResult = await pool.query(totalUserQuery);
      const totalUsers = totalUsersResult.rows[0].total;
      const totalPages = Math.ceil(totalUsers / perPage);

      res.status(200).json({
        statusCode: 200,
        totalUsers,
        totalPages,
        AllDeletedUsers: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAdminDashboardStats = async (req, res) => {
  try {
    const statsQuery = `
WITH table_counts AS (
  SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
  UNION ALL
  SELECT 'xpi_videos' AS table_name, COUNT(*) AS row_count FROM xpi_videos
  UNION ALL
  SELECT 'pic_tours' AS table_name, COUNT(*) AS row_count FROM pic_tours
  UNION ALL
  SELECT 'item' AS table_name, COUNT(*) AS row_count FROM item
  UNION ALL
  SELECT 'blogs' AS table_name, COUNT(*) AS row_count FROM blogs
  UNION ALL
  SELECT 'banner' AS table_name, COUNT(*) AS row_count FROM banner WHERE status='inactive'
  UNION ALL
  SELECT 'NEWS' AS table_name, COUNT(*) AS row_count FROM NEWS
  UNION ALL
  SELECT 'post_letters' AS table_name, COUNT(*) AS row_count FROM post_letters
  UNION ALL
  SELECT 'QAFI' AS table_name, COUNT(*) AS row_count FROM QAFI
  UNION ALL
  SELECT 'GEBC' AS table_name, COUNT(*) AS row_count FROM GEBC
)
SELECT json_object_agg(table_name, row_count) AS result
FROM table_counts;
`;

    const { rows } = await pool.query(statsQuery);

    const data = {
      xpi_videos: rows[0].result.xpi_videos,
      pic_tours: rows[0].result.pic_tours,
      item: rows[0].result.item,
      DISC:
        rows[0].result.NEWS +
        rows[0].result.post_letters +
        rows[0].result.QAFI +
        rows[0].result.GEBC,
    };
    return res.status(200).json({ statusCode: 200, stats: data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const { user_id } = req.params;
    const statsQuery = `
WITH table_counts AS (
  SELECT 'xpi_videos' AS table_name, COUNT(*) AS row_count FROM xpi_videos WHERE user_id=$1
  UNION ALL
  SELECT 'pic_tours' AS table_name, COUNT(*) AS row_count FROM pic_tours WHERE user_id=$1
  UNION ALL
  SELECT 'item' AS table_name, COUNT(*) AS row_count FROM item WHERE user_id=$1
  UNION ALL
  SELECT 'NEWS' AS table_name, COUNT(*) AS row_count FROM NEWS WHERE user_id=$1
  UNION ALL
  SELECT 'post_letters' AS table_name, COUNT(*) AS row_count FROM post_letters WHERE user_id=$1
  UNION ALL
  SELECT 'QAFI' AS table_name, COUNT(*) AS row_count FROM QAFI WHERE user_id=$1
  UNION ALL
  SELECT 'GEBC' AS table_name, COUNT(*) AS row_count FROM GEBC WHERE user_id=$1
)
SELECT json_object_agg(table_name, row_count) AS result
FROM table_counts;
`;
    const { rows } = await pool.query(statsQuery, [user_id]);
    const data = {
      xpi_videos: rows[0].result.xpi_videos,
      pic_tours: rows[0].result.pic_tours,
      item: rows[0].result.item,
      DISC:
        rows[0].result.NEWS +
        rows[0].result.post_letters +
        rows[0].result.QAFI +
        rows[0].result.GEBC,
    };
    return res.status(200).json({ statusCode: 200, stats: data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendWellcomeEmail = async (req, res) => {
  try {
    const { user_id } = req.body;
    const getQuery = `
SELECT * FROM users WHERE id=$1
`;
    const { rows } = await pool.query(getQuery, [user_id]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not exist" });
    }
    const output = WellcomeEmail(rows[0].username, new Date(Date.now()));
    await emailSent(rows[0].email, output, "Wellcome Email");
    return res
      .status(200)
      .json({ statusCode: 200, message: "wellcome email sent successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const sendSubsciptionEmail = async (req, res) => {
  try {
    const { user_id } = req.body;
    console.log(user_id);
    const getQuery = `
    SELECT * FROM users WHERE id=$1
`;
    const { rows } = await pool.query(getQuery, [user_id]);
    console.log(rows);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not exist" });
    }
    if (rows[0].is_deleted) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "This user is deleted" });
    }
    const output = SubscriptionEmail(rows[0].username, new Date(Date.now()));
    await emailSent(
      rows[0].email,
      output,
      "Congratulations on Your Subscription Purchase!"
    );
    return res.status(200).json({
      statusCode: 200,
      message: "subscription email sent successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const cancelSubsciptionEmail = async (req, res) => {
  try {
    const { user_id } = req.body;
    console.log(user_id);
    const getQuery = `
SELECT * FROM users WHERE id=$1
`;
    const { rows } = await pool.query(getQuery, [user_id]);
    console.log(rows);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not exist" });
    }
    const output = CancellationEmail(rows[0].username, new Date(Date.now()));
    await emailSent(rows[0].email, output, "Cancel Subscription!");
    return res
      .status(200)
      .json({ statusCode: 200, message: "Cancel Subscription successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllDataOfDeletedUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    let userQuery = `
      SELECT *
      FROM users
      WHERE is_deleted = TRUE 
      AND deleted_date >= $1 AND id=$2
      ORDER BY deleted_date DESC
    `;
    const { rows } = await pool.query(userQuery, [ninetyDaysAgo, user_id]);
    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message:
          "The user does not exist, or the user has been permanently deleted.",
      });
    }
    let xpilQuery = `
     SELECT
     v.id AS video_id,
     v.name,
     v.description,
     v.video_category,
     v.video,
     v.created_at AS video_created_at,
     v.user_id,
     u.username AS username,
     u.image AS userImage,
     (
       SELECT COALESCE(json_agg(
         json_build_object(
           'comment_id', c.id,
           'comment', c.comment,
           'user_id', c.user_id,
           'username', cu.username,
           'userimage', cu.image,
           'comment_created_at', c.created_at
         )
       ), '[]'::json)
       FROM video_comment c
       JOIN users cu ON c.user_id = cu.id
       WHERE c.video_id = v.id
     ) AS comments,
     (
       SELECT COALESCE(json_agg(
         json_build_object(
           'id', lv.id,
           'user_id', lv.user_id,
           'video_id', v.id,
           'created_at', lu.created_at,
           'updated_at', lu.updated_at
         )
       ), '[]'::json)
       FROM like_video lv
       JOIN users lu ON lv.user_id = lu.id
       WHERE lv.video_id = v.id
     ) AS likes,
     (
       SELECT count(*) FROM video_comment c WHERE c.video_id = v.id
   ) AS comment_count,
   (
       SELECT count(*) FROM like_video lv WHERE lv.video_id = v.id
   ) AS like_count
     FROM xpi_videos v
     JOIN users u ON v.user_id = u.id
     WHERE v.user_id = $1
     GROUP BY v.id, u.username, u.image
       `;

    let picTourQuery = `
 SELECT
   v.id AS pic_tour_id,
   v.name,
   v.description,
   v.pic_category,
   v.image,
   v.created_at AS tour_created_at,
   v.user_id,
   u.username AS username,
   u.image AS userImage,
   (
     SELECT COALESCE(json_agg(
       json_build_object(
         'comment_id', c.id,
         'comment', c.comment,
         'user_id', c.user_id,
         'username', cu.username,
         'userimage', cu.image,
         'comment_created_at', c.created_at
       )
     ), '[]'::json)
     FROM pic_comment c
     JOIN users cu ON c.user_id = cu.id
     WHERE c.pic_tours_id = v.id
   ) AS comments,
   (
     SELECT COALESCE(json_agg(
       json_build_object(
         'id', lv.id,
         'user_id', lv.user_id,
         'pic_tours_id', v.id,
         'created_at', lu.created_at,
         'updated_at', lu.updated_at
       )
     ), '[]'::json)
     FROM like_pic lv
     JOIN users lu ON lv.user_id = lu.id 
     WHERE lv.pic_tours_id = v.id 
   ) AS likes,
   (
    SELECT count(*) FROM pic_comment c WHERE c.pic_tours_id = v.id
) AS comment_count,
(
    SELECT count(*) FROM like_pic lv WHERE lv.pic_tours_id = v.id
) AS like_count
   FROM pic_tours v
      JOIN users u ON v.user_id = u.id
      WHERE v.user_id = $1
      GROUP BY v.id, u.username, u.image
   `;
    const qafi_query = `SELECT
   v.id AS qafi_id,
   v.description,
   v.disc_category,
   v.image,
   v.created_at AS tour_created_at,
   v.user_id,
   u.username AS username,
   u.image AS userImage,
   (
       SELECT COALESCE(json_agg(
           json_build_object(
               'comment_id', c.id,
               'comment', c.comment,
               'user_id', c.user_id,
               'username', cu.username,
               'userimage', cu.image,
               'comment_created_at', c.created_at
           )
       ), '[]'::json)
       FROM qafi_comment c
       JOIN users cu ON c.user_id = cu.id
       WHERE c.QAFI_id = v.id
   ) AS comments,
   (
       SELECT COALESCE(json_agg(
           json_build_object(
               'id', lv.id,
               'user_id', lv.user_id,
               'QAFI_id', v.id,
               'created_at', lu.created_at,
               'updated_at', lu.updated_at
           )
       ), '[]'::json)
       FROM like_qafi lv
       JOIN users lu ON lv.user_id = lu.id
       WHERE lv.QAFI_id = v.id
   ) AS likes
FROM QAFI v
JOIN users u ON v.user_id = u.id
WHERE v.user_id = $1
GROUP BY v.id, u.username, u.image;


`;

    const gebcQuery = `SELECT
    v.id AS GEBC_id,
    v.description,
    v.disc_category,
    v.image,
    v.created_at AS tour_created_at,
    v.user_id,
    u.username AS username,
    u.image AS userImage,
    (
        SELECT COALESCE(json_agg(
            json_build_object(
                'comment_id', c.id,
                'comment', c.comment,
                'user_id', c.user_id,
                'username', cu.username,
                'userimage', cu.image,
                'comment_created_at', c.created_at
            )
        ), '[]'::json)
        FROM GEBC_comment c
        JOIN users cu ON c.user_id = cu.id
        WHERE c.GEBC_id = v.id
    ) AS comments,
    (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', lv.id,
                'user_id', lv.user_id,
                'GEBC_id', v.id,
                'created_at', lu.created_at,
                'updated_at', lu.updated_at
            )
        ), '[]'::json)
        FROM like_GEBC lv
        JOIN users lu ON lv.user_id = lu.id
        WHERE lv.GEBC_id = v.id
    ) AS likes
FROM GEBC v
JOIN users u ON v.user_id = u.id
WHERE v.user_id = $1
GROUP BY v.id, u.username, u.image;

 
 `;
    const newsQuery = `SELECT
 v.id AS News_id,
 v.description,
 v.disc_category,
 v.image,
 v.created_at AS tour_created_at,
 v.user_id,
 u.username AS username,
 u.image AS userImage,
 (
     SELECT COALESCE(json_agg(
         json_build_object(
             'comment_id', c.id,
             'comment', c.comment,
             'user_id', c.user_id,
             'username', cu.username,
             'userimage', cu.image,
             'comment_created_at', c.created_at
         )
     ), '[]'::json)
     FROM NEWS_comment c
     JOIN users cu ON c.user_id = cu.id
     WHERE c.NEWS_id = v.id
 ) AS comments,
 (
     SELECT COALESCE(json_agg(
         json_build_object(
             'id', lv.id,
             'user_id', lv.user_id,
             'news_id', v.id,
             'created_at', lu.created_at,
             'updated_at', lu.updated_at
         )
     ), '[]'::json)
     FROM like_NEWS lv
     JOIN users lu ON lv.user_id = lu.id
     WHERE lv.NEWS_id = v.id
 ) AS likes
FROM NEWS v
JOIN users u ON v.user_id = u.id
WHERE v.user_id = $1
GROUP BY v.id, u.username, u.image;


`;
    const signatureQuery = `SELECT
s.id AS signature_id,
s.image AS signature_image,
s.created_at AS signature_created_at,
s.user_id AS user_id,
u.username AS username,
u.image AS userImage
FROM signature s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.user_id=$1`;
    const letterQuery = `SELECT
pl.id AS post_id,
pl.user_id,
u.username,
u.image AS userImage,
pl.post_type,
pl.receiver_type,
pl.disc_category,
d.name AS disc_category_name,
pl.name,
pl.address,
pl.email,
pl.contact_no,
pl.subject_place,
pl.post_date,
pl.greetings,
pl.introduction,
pl.body,
pl.form_of_appeal,
pl.video,
pl.signature_id,
pl.paid_status,
COALESCE(
  json_agg(
    json_build_object('id', pli.id, 'image', pli.image)
  ) FILTER (WHERE pli.id IS NOT NULL),
  '[]'::json
) AS images,

lru.username AS receiver_name,
lru.image AS reciever_image,
lri.address AS receiver_address
FROM
post_letters AS pl
LEFT JOIN
users AS u ON pl.user_id = u.id
LEFT JOIN
post_letters_images AS pli ON pl.id = pli.letter_id
LEFT JOIN
letter_reciever_info AS lri ON pl.id = lri.letter_id
LEFT JOIN
users AS lru ON lri.reciever_id = lru.id

LEFT JOIN
disc_category AS d ON pl.disc_category = d.id
WHERE
pl.user_id = $1
GROUP BY
pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category, pl.name, pl.address,
pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, lru.username,lru.image,
u.image, lri.address, u.username,d.name;`;
    let itemQuery = `
SELECT
  item.id,
  item.user_id,
  u.username AS username,
  u.image AS userImage,
  item.item_category,
  ic.name AS item_category_name,
  item.title,
  item.region,
  item.description,
  item.price,
  item.condition,
  item.location,
  item.top_post,
  item.paid_status,
  COALESCE(ARRAY_AGG(
    JSONB_BUILD_OBJECT(
      'id', ii.id,
      'image', ii.image
    )
  ), ARRAY[]::JSONB[]) AS images
  FROM item
  LEFT JOIN item_images ii ON item.id = ii.item_id
  LEFT JOIN users u ON item.user_id = u.id
  LEFT JOIN item_category ic ON item.item_category = ic.id
  WHERE item.user_id = $1
  GROUP BY
  item.id,
  item.user_id,
  item.item_category,
  item.title,
  item.description,
  item.price,
  item.condition,
  item.location,
  item.top_post,
  item.paid_status,
  u.username,
  u.image,
  ic.name`;
    let saveItemQuery = `
  SELECT
    item.id,
    item.user_id,
    u.username AS username,
    u.image AS userImage,
    item.item_category,
    ic.name AS item_category_name,
    item.title,
    item.region,
    item.description,
    item.price,
    item.condition,
    item.location,
    item.top_post,
    item.paid_status,
    COALESCE(ARRAY_AGG(
      JSONB_BUILD_OBJECT(
        'id', ii.id,
        'image', ii.image
      )
    ), ARRAY[]::JSONB[]) AS images,
    CASE WHEN si.id IS NOT NULL THEN true ELSE false END AS is_saved
  FROM save_item
  LEFT JOIN item  ON save_item.item_id = item.id
  LEFT JOIN item_images ii ON item.id = ii.item_id
  LEFT JOIN users u ON item.user_id = u.id
  LEFT JOIN item_category ic ON item.item_category = ic.id
  LEFT JOIN save_item si ON item.id = si.item_id AND si.user_id = $1
  WHERE save_item.user_id = $1
  GROUP BY
    item.id,
    item.user_id,
    item.item_category,
    item.title,
    item.description,
    item.price,
    item.condition,
    item.location,
    item.top_post,
    item.paid_status,
    u.username,
    u.image,
    ic.name,
    si.id
`;
    const bannerQuery = `
SELECT banner.*, users.username AS user_username, users.image AS user_image
FROM banner
LEFT JOIN users ON banner.user_id = users.id
WHERE banner.user_id = $1

`;
    let paymentQuery = `SELECT
payment.payment_detail, users.* FROM payment
LEFT JOIN users ON payment.user_id=users.id
WHERE users.id=$1
`;
    const [
      xpiVideos,
      picTour,
      QAFI,
      GEBC,
      NEWS,
      signature,
      letter,
      item,
      saveItem,
      banner,
      payment,
    ] = await Promise.all([
      pool.query(xpilQuery, [user_id]),
      pool.query(picTourQuery, [user_id]),
      pool.query(qafi_query, [user_id]),
      pool.query(gebcQuery, [user_id]),
      pool.query(newsQuery, [user_id]),
      pool.query(signatureQuery, [user_id]),
      pool.query(letterQuery, [user_id]),
      pool.query(itemQuery, [user_id]),
      pool.query(saveItemQuery, [user_id]),
      pool.query(bannerQuery, [user_id]),
      pool.query(paymentQuery, [user_id]),
    ]);

    res.status(200).json({
      statusCode: 200,
      DeletedUsersData: {
        user: rows[0],
        xpiVideos: xpiVideos.rows,
        picTour: picTour.rows,
        QAFI: QAFI.rows,
        GEBC: GEBC.rows,
        NEWS: NEWS.rows,
        signature: signature.rows,
        letters: letter.rows,
        item: item.rows,
        saveItems: saveItem.rows,
        banner: banner.rows,
        payment: payment.rows,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.body;
    const query = `SELECT * FROM users WHERE id=$1 AND is_deleted=$2`;
    const { rows } = await pool.query(query, [id, "FALSE"]);
    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }
    const update = await pool.query(
      `UPDATE users SET is_subscribed=FALSE,badge=$1,subscription_amount=$2 WHERE id=$3 RETURNING id,username,email,role,image,is_deleted,deleted_date,block,is_subscribed,badge,subscription_amount`,
      [null, null, id]
    );
    if (update.rowCount === 1) {
      res.status(200).json({
        statusCode: 200,
        unsubscribedUser: update.rows[0],
      });
    } else {
      res.status(400).json({
        statusCode: 400,
        message: "Operation not successfull",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

// Helper function to delete media from Cloudinary
const deleteFromCloudinary = async (publicIds = []) => {
  try {
    const results = [];
    for (const id of publicIds) {
      if (!id) continue;
      const publicId = id.split("/").pop().split(".")[0]; // extract from URL
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "auto",
      });
      results.push({ id, result });
    }
    return results;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw error;
  }
};

// Controller function
export const accountDeletePermanently = async (req, res) => {
  const { id } = req.params;

  try {
    const userQuery = `SELECT * FROM users WHERE id = $1 `;
    const { rows } = await pool.query(userQuery, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found or not marked as deleted.",
      });
    }

    await pool.query("BEGIN");

    // 1. Collect Cloudinary public IDs
    const cloudinaryPublicIds = [];

    const queries = [
      `SELECT video, thumbnail FROM xpi_videos WHERE user_id = $1`,
      `SELECT image FROM pic_tours WHERE user_id = $1`,
      `SELECT image FROM QAFI WHERE user_id = $1
        UNION SELECT image FROM GEBC WHERE user_id = $1
        UNION SELECT image FROM NEWS WHERE user_id = $1`,
      `SELECT image FROM item_images WHERE item_id IN (SELECT id FROM item WHERE user_id = $1)`,
      `SELECT image FROM post_letters_images WHERE letter_id IN (SELECT id FROM post_letters WHERE user_id = $1)`,
      `SELECT image FROM signature WHERE user_id = $1`,
      `SELECT image FROM banner WHERE user_id = $1`,
    ];

    for (const query of queries) {
      const res = await pool.query(query, [id]);
      res.rows.forEach((row) => {
        for (const key in row) {
          if (row[key]) cloudinaryPublicIds.push(row[key]);
        }
      });
    }

    // const uniquePublicIds = [...new Set(cloudinaryPublicIds)].filter(Boolean);
    // await deleteFromCloudinary(uniquePublicIds);

    // 2. Delete related data from dependent tables
    const relatedTables = [
      "video_comment",
      "like_video",
      "viewed_video",
      "xpi_videos",
      "pic_comment",
      "like_pic",
      "viewed_pic",
      "pic_tours",
      "qafi_comment",
      "like_qafi",
      "QAFI",
      "GEBC_comment",
      "like_GEBC",
      "GEBC",
      "NEWS_comment",
      "like_NEWS",
      "NEWS",
      "item_images",
      "save_item",
      "send_offer",
      "item",
      "post_letters_images",
      "letter_reciever_info",
      "post_letters",
      "signature",
      "banner",
      "payment",
      "transactions",
      "cards",
      "notification",
    ];

    for (const table of relatedTables) {
      await pool
        .query(`DELETE FROM ${table} WHERE user_id = $1`, [id])
        .catch(console.warn);
    }

    // 3. Finally delete the user
    const deleteUserQuery = `DELETE FROM users WHERE id = $1 RETURNING id, email, username`;
    const deleteUserResult = await pool.query(deleteUserQuery, [id]);

    await pool.query("COMMIT");

    return res.status(200).json({
      statusCode: 200,
      message: "User and all associated media/data permanently deleted.",
      deletedUser: deleteUserResult.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error in accountDeletePermanently:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};
