import pool from "../../db.config/index.js";

// Allowed base module names -> maps to table name prefixes in DB
const ALLOWED_MODULES = new Set([
  "app",
  "video",
  "pic",
  "item",
  "disc",
  "qafi",
  "gebc",
  "news",
  "cinematics",
  "fan_star",
  "tv_progmax",
  "kid_vids",
  "learning_hobbies",
  "sports",
]);

// Normalize frontend module values. Accept either the base name (e.g. "video")
// or the frontend value that includes the suffix (e.g. "video_category").
const getBaseModule = (m) => {
  if (typeof m !== "string") return null;
  const trimmed = m.trim();
  if (trimmed.endsWith("_category")) {
    const base = trimmed.slice(0, -"_category".length);
    return ALLOWED_MODULES.has(base) ? base : null;
  }
  return ALLOWED_MODULES.has(trimmed) ? trimmed : null;
};

export const bulkUpdateCategoryIndex = async (req, res) => {
  try {
    const { module, items } = req.body;
    const base = getBaseModule(module);
    if (!base) {
      return res.status(400).json({ statusCode: 400, message: "Invalid module" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ statusCode: 400, message: "items must be a non-empty array" });
    }

    const tableName = `${base}_category`;

    // Start transaction
    await pool.query("BEGIN");
    let updated = 0;
    for (const it of items) {
      const id = parseInt(it.id);
      const idx = parseInt(it.index || 0);
      if (Number.isNaN(id) || Number.isNaN(idx)) continue;
      const q = `UPDATE ${tableName} SET "index" = $1, updated_at = NOW() WHERE id = $2`;
      const r = await pool.query(q, [idx, id]);
      updated += r.rowCount;
    }
    await pool.query("COMMIT");

    return res.status(200).json({ statusCode: 200, message: "Category indexes updated", updated });
  } catch (error) {
    console.error(error);
    try {
      await pool.query("ROLLBACK");
    } catch (e) {
      console.error("rollback failed", e);
    }
    return res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const bulkUpdateSubCategoryIndex = async (req, res) => {
  try {
    const { module, category_id, items } = req.body;
    const base = getBaseModule(module);
    if (!base) {
      return res.status(400).json({ statusCode: 400, message: "Invalid module" });
    }
    const catId = parseInt(category_id);
    if (Number.isNaN(catId)) {
      return res.status(400).json({ statusCode: 400, message: "Invalid category_id" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ statusCode: 400, message: "items must be a non-empty array" });
    }

    const tableName = `${base}_sub_category`;

    await pool.query("BEGIN");
    let updated = 0;
    for (const it of items) {
      const id = parseInt(it.id);
      const idx = parseInt(it.index || 0);
      if (Number.isNaN(id) || Number.isNaN(idx)) continue;
      const q = `UPDATE ${tableName} SET "index" = $1, updated_at = NOW() WHERE id = $2 AND category_id = $3`;
      const r = await pool.query(q, [idx, id, catId]);
      updated += r.rowCount;
    }
    await pool.query("COMMIT");

    return res.status(200).json({ statusCode: 200, message: "Subcategory indexes updated", updated });
  } catch (error) {
    console.error(error);
    try {
      await pool.query("ROLLBACK");
    } catch (e) {
      console.error("rollback failed", e);
    }
    return res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export default { bulkUpdateCategoryIndex, bulkUpdateSubCategoryIndex };
