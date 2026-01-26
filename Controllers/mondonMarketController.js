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
