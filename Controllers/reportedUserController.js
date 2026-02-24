import pool from "../db.config/index.js";

const ALLOWED_STATUSES = new Set(["pending", "approved", , "rejected"]);

export const createReport = async (req, res) => {
  try {
    const { reporter_id, reported_user_id, reason } = req.body;
    if (!reporter_id || !reported_user_id || !reason) {
      return res.status(400).json({ statusCode: 400, message: "Missing required fields" });
    }
    const rid = parseInt(reporter_id);
    const uid = parseInt(reported_user_id);
    if (Number.isNaN(rid) || Number.isNaN(uid)) {
      return res.status(400).json({ statusCode: 400, message: "Invalid user ids" });
    }

    // Optional: verify users exist
    const checkUsers = await pool.query(`SELECT id FROM users WHERE id = ANY($1::int[])`, [[rid, uid]]);
    if (checkUsers.rowCount < 2) {
      return res.status(400).json({ statusCode: 400, message: "Reporter or reported user does not exist" });
    }

    const insert = `
      INSERT INTO reported_user (reporter_id, reported_user_id, reason)
      VALUES ($1, $2, $3)
      RETURNING *`;
    const result = await pool.query(insert, [rid, uid, reason]);
    return res.status(201).json({ statusCode: 201, message: "Report created", data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getReports = async (req, res) => {
  try {
    const { status } = req.query;
    let page = parseInt(req.query.page || 1);
    let limit = parseInt(req.query.limit || 50);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 50;
    const offset = (page - 1) * limit;

    let baseQuery = `SELECT r.*, ru.username as reporter_username, ru.image as reporter_image, uu.username as reported_username, uu.image as reported_image
      FROM reported_user r
      LEFT JOIN users ru ON r.reporter_id = ru.id
      LEFT JOIN users uu ON r.reported_user_id = uu.id`;
    const params = [];
    if (status) {
      params.push(status);
      baseQuery += ` WHERE r.status = $${params.length}`;
    }
    baseQuery += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const { rows } = await pool.query(baseQuery, params);
    res.status(200).json({ statusCode: 200, data: rows, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ statusCode: 400, message: "Invalid or missing status" });
    }
    const update = `UPDATE reported_user SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`;
    const { rows } = await pool.query(update, [status, id]);
    if (rows.length === 0) return res.status(404).json({ statusCode: 404, message: "Report not found" });
    res.status(200).json({ statusCode: 200, message: "Status updated", data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getMyReports = async (req, res) => {
  try {
    const { user_id } = req.params;
    let page = parseInt(req.query.page || 1);
    let limit = parseInt(req.query.limit || 50);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 50;
    const offset = (page - 1) * limit;

    const q = `SELECT r.*, ru.username as reporter_username, ru.image as reporter_image, uu.username as reported_username, uu.image as reported_image
      FROM reported_user r
      LEFT JOIN users ru ON r.reporter_id = ru.id
      LEFT JOIN users uu ON r.reported_user_id = uu.id
      WHERE r.reporter_id = $1
      ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`;
    const { rows } = await pool.query(q, [user_id, limit, offset]);
    res.status(200).json({ statusCode: 200, data: rows, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
