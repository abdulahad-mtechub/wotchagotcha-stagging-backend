import pool from "../db.config/index.js";
import { getSingleRow } from "../queries/common.js";

export const createPage = async (req, res) => {
  try {
    const { page_key, content } = req.body;
    if (!page_key || !content) {
      return res.status(400).json({ statusCode: 400, message: "page_key and content are required" });
    }

    const exist = await pool.query("SELECT * FROM app_pages WHERE page_key = $1", [page_key]);
    if (exist.rows.length > 0) {
      return res.status(400).json({ statusCode: 400, message: "Page already exists. Use update." });
    }

    const insertQ = "INSERT INTO app_pages (page_key, content) VALUES ($1,$2) RETURNING *";
    const { rows } = await pool.query(insertQ, [page_key, content]);

    return res.status(201).json({ statusCode: 201, message: "Page created", data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const updatePage = async (req, res) => {
  try {
    const { id, content } = req.body;
    if (!id || content === undefined) {
      return res.status(400).json({ statusCode: 400, message: "id and content are required" });
    }

    const existing = await pool.query("SELECT * FROM app_pages WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ statusCode: 404, message: "Page not found" });
    }

    const updateQ = `
      UPDATE app_pages
      SET content = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(updateQ, [id, content]);
    return res.status(200).json({ statusCode: 200, message: "Page updated", data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getPage = async (req, res) => {
  try {
    const { key } = req.params;
    const condition = { column: "page_key", value: key };
    const result = await getSingleRow("app_pages", condition);
    if (result.length === 0) {
      return res.status(404).json({ statusCode: 404, message: "Page not found" });
    }
    return res.status(200).json({ statusCode: 200, page: result[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export default {
  createPage,
  updatePage,
  getPage,
};
