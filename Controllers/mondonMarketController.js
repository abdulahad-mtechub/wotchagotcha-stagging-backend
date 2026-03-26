import pool from "../db.config/index.js";

export const sendMondonComment = async (req, res) => {
  try {
    // Accept either `item_id` (preferred) or legacy `mondon_market_id` from client
    const itemId = req.body.item_id ?? req.body.mondon_market_id;
    const { user_id, comment } = req.body;
    const checkUserQuery = "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkUserResult = await pool.query(checkUserQuery, [user_id]);

    if (checkUserResult.rowCount === 0) {
      return res.status(404).json({ statusCode: 404, message: "user not exist" });
    }

    // Ensure item exists
    const checkItem = await pool.query("SELECT id FROM item WHERE id=$1", [itemId]);
    if (checkItem.rowCount === 0) {
      return res.status(400).json({ statusCode: 400, message: "Mondon market (item) does not exist" });
    }

    const createQuery =
      "INSERT INTO mondon_market_comment (item_id,user_id,comment) VALUES($1,$2,$3) RETURNING *";
    const result = await pool.query(createQuery, [itemId, user_id, comment]);
    if (result.rowCount === 1) {
      let commentQuery = `SELECT 
      v.item_id AS item_id,
      v.id AS commentId,
            v.comment AS comment,
            v.created_at AS commentCreatedAt,
            u.id AS userId,
            u.username AS username,
            u.image AS userImage
            FROM mondon_market_comment v
            LEFT JOIN users u ON v.user_id = u.id
            WHERE v.id=$1
            ORDER BY v.created_at DESC;
            `;
      const { rows } = await pool.query(commentQuery, [result.rows[0].id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Comment posted successfully",
        data: rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "mondon_market_comment_item_id_fkey") {
      return res.status(400).json({ statusCode: 400, message: "Mondon market (item) does not exist" });
    } else if (error.constraint === "mondon_market_comment_user_id_fkey") {
      return res.status(400).json({ statusCode: 400, message: "user does not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getAllCommentsByMondonMarket = async (req, res) => {
  try {
    const { id } = req.params; // id = item id
    let commentQuery = `SELECT v.id AS commentId,
      v.comment AS comment,
      v.created_at AS commentCreatedAt,
      u.id AS userId,
      u.username AS username,
      u.image AS userImage
      FROM mondon_market_comment v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE item_id=$1 AND u.is_deleted=FALSE
      ORDER BY v.created_at DESC;
      `;

    const { rows } = await pool.query(commentQuery, [id]);
    res.status(200).json({
      statusCode: 200,
      totalComments: rows.length,
      AllComments: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const likeUnlikeMondonMarket = async (req, res) => {
  try {
    // Accept either `item_id` (preferred) or legacy `mondon_market_id`
    const itemId = req.body.item_id ?? req.body.mondon_market_id;
    const { user_id } = req.body;

    if (!itemId || !user_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "item_id (or mondon_market_id) and user_id are required",
      });
    }

    const checkUserQuery = "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkUserResult = await pool.query(checkUserQuery, [user_id]);
    if (checkUserResult.rowCount === 0) {
      return res.status(404).json({ statusCode: 404, message: "user not exist" });
    }

    const checkItem = await pool.query("SELECT id FROM item WHERE id = $1", [itemId]);
    if (checkItem.rowCount === 0) {
      return res.status(400).json({ statusCode: 400, message: "Mondon market (item) does not exist" });
    }

    const checkLikeQuery =
      "SELECT * FROM mondon_market_like WHERE item_id = $1 AND user_id = $2";
    const checkLikeResult = await pool.query(checkLikeQuery, [itemId, user_id]);

    if (checkLikeResult.rowCount > 0) {
      const unlikeQuery =
        "DELETE FROM mondon_market_like WHERE user_id = $1 AND item_id = $2 RETURNING *";
      const unlikeResult = await pool.query(unlikeQuery, [user_id, itemId]);
      return res.status(200).json({
        statusCode: 200,
        message: "Mondon market unlike successfully",
        data: unlikeResult.rows[0],
      });
    }

    const likeQuery =
      "INSERT INTO mondon_market_like (item_id, user_id) VALUES ($1, $2) RETURNING *";
    const likeResult = await pool.query(likeQuery, [itemId, user_id]);
    return res.status(201).json({
      statusCode: 201,
      message: "Mondon market like successfully",
      data: likeResult.rows[0],
    });
  } catch (error) {
    console.error(error);
    if (error.constraint === "mondon_market_like_item_id_fkey") {
      return res.status(400).json({ statusCode: 400, message: "Mondon market (item) does not exist" });
    }
    if (error.constraint === "mondon_market_like_user_id_fkey") {
      return res.status(400).json({ statusCode: 400, message: "user does not exist" });
    }
    return res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getAllLikesByMondonMarket = async (req, res) => {
  try {
    const { id } = req.params; // id = item id
    const likeQuery = `
      SELECT
        v.id AS like_id,
        v.item_id,
        v.user_id,
        v.created_at AS like_created_at,
        u.username AS username,
        u.image AS userImage
      FROM mondon_market_like v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.item_id = $1 AND u.is_deleted = FALSE
      ORDER BY v.created_at DESC
    `;

    const { rows } = await pool.query(likeQuery, [id]);
    return res.status(200).json({
      statusCode: 200,
      totalLikes: rows.length,
      AllLikes: rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ statusCode: 500, message: "Internal server error", error });
  }
};
