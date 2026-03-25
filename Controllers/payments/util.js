import pool from "../../db.config/index.js";

export const sendSuccessResponse = (res, message, data) => {
  res.status(200).json({
    success: true,
    message: message,
    result: data,
  });
};

export const sendErrorResponse = (res, statusCode, message, error) => {
  res.status(statusCode).json({
    success: false,
    message: message,
    error: error,
  });
};

export const checkUserExist = async (userId) => {
  const userResult = await pool.query(`SELECT * FROM users WHERE id = $1`, [
    userId,
  ]);

  if (userResult.rowCount < 1) {
    return false;
  } else {
    return userResult.rows[0];
  }
};

export const updateUserWithCustomerId = async (customerId, userId) => {
  const updateUserResult = await pool.query(
    `UPDATE users SET customer_id = $1 WHERE id = $2 RETURNING *`,
    [customerId, userId]
  );
  if (updateUserResult.rowCount === 0) {
    throw new Error("Failed to update user with customer ID.");
  }
  return updateUserResult.rows[0];
};

export const insertCards = async (cardData, customerId, userId) => {
  await pool.query(
    `INSERT INTO cards (customer_id, card_id, exp_month, exp_year, last_digit, finger_print, brand_name, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      customerId,
      cardData.id,
      cardData.card.exp_month,
      cardData.card.exp_year,
      cardData.card.last4,
      cardData.card.fingerprint,
      cardData.card.brand,
      userId,
    ]
  );
};

export const saveTransactions = async (userId, bannerId, amount) => {
  await pool.query(
    "INSERT INTO transactions (user_id, banner_id, amount) VALUES($1, $2, $3)",
    [userId, bannerId, amount]
  );
};

export const retrieveTransactions = async (userId, limit, offset) => {
  const query = `
    SELECT 
      t.id AS id, 
      t.amount AS amount, 
      t.credit AS credit, 
      t.created_at AS created_at, 
      json_build_object(
        'username', COALESCE(u.username, 'N/A'), 
        'image', COALESCE(u.image, 'N/A')
      ) AS user, 
      json_build_object(
        'image', b.image, 
        'top_banner', b.top_banner, 
        'paid_status', b.paid_status, 
        'status', b.status
      ) AS banner 
    FROM 
      transactions t 
      LEFT JOIN users u ON t.user_id = u.id 
      LEFT JOIN banner b ON t.banner_id = b.id 
    WHERE 
      t.user_id = $1 
    LIMIT 
      $2 OFFSET $3
  `;

  const result = await pool.query(query, [userId, limit, offset]);

  if (result.rowCount < 1) {
    return false;
  } else {
    return {
      count: result.rowCount,
      data: result.rows,
    };
  }
};


export const retrieveCards = async (userId, limit, offset) => {
  const query = `SELECT 
    c.id AS id, 
    c.customer_id AS customer_id,
    c.card_id AS card_id,
    c.exp_month AS exp_month,
    c.exp_year AS exp_year,
    c.last_digit AS last_digit,
    c.finger_print AS finger_print,
    c.brand_name AS brand_name,
    c.created_at AS created_at,
    c.updated_at AS updated_at, json_build_object( 'id', u.id, 
    'email', u.email, 'username', COALESCE(u.username, 'N/A'), 
        'image', COALESCE(u.image, 'N/A') ) AS user FROM cards c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.user_id = $1 LIMIT $2 OFFSET $3;

     `;

  const result = await pool.query(query, [userId, limit, offset]);

  if (result.rowCount < 1) {
    return false;
  } else {
    return {
      count: result.rowCount,
      data: result.rows,
    };
  }
};
