import pool from "../db.config/index.js";

const ALLOWED_STATUSES = new Set(["pending", "blocked", "rejected"]);

// ─── User: Create a report ────────────────────────────────────────────────────
export const createItemReport = async (req, res) => {
    try {
        const { module_type, item_id, reporter_user_id, reported_user_id, reason } = req.body;

        if (!module_type || !item_id || !reporter_user_id || !reason) {
            return res.status(400).json({
                statusCode: 400,
                message: "Missing required fields: module_type, item_id, reporter_user_id, reason",
            });
        }

        const rid = parseInt(reporter_user_id);
        const iid = parseInt(item_id);

        if (isNaN(rid) || isNaN(iid)) {
            return res.status(400).json({ statusCode: 400, message: "item_id and reporter_user_id must be valid integers" });
        }

        // 1. Check if the reporter exists
        const reporterCheck = await pool.query("SELECT id FROM users WHERE id = $1 AND is_deleted = FALSE", [rid]);
        if (reporterCheck.rowCount === 0) {
            return res.status(404).json({ statusCode: 404, message: "Reporter user (you) not found or deleted" });
        }

        // 2. Validate module_type and fetch the item (to get the owner/reported_user_id)
        if (!ALLOWED_MODULE_TABLES.has(module_type)) {
            return res.status(400).json({ statusCode: 400, message: `Invalid module_type: ${module_type}` });
        }

        const itemQuery = `SELECT * FROM ${module_type} WHERE id = $1`;
        const itemResult = await pool.query(itemQuery, [iid]);

        if (itemResult.rowCount === 0) {
            return res.status(404).json({ statusCode: 404, message: `Item not found in ${module_type}` });
        }

        // Fetch owner from item, or use body fallback if item table doesn't have user_id
        let uid = itemResult.rows[0].user_id || parseInt(reported_user_id);

        if (!uid || isNaN(uid)) {
            return res.status(400).json({ statusCode: 400, message: "Could not determine the reported user (owner) for this item." });
        }

        // 3. Prevent self-reporting
        if (rid === uid) {
            return res.status(400).json({ statusCode: 400, message: "You cannot report your own item" });
        }

        // 4. Check if the reported user exists
        const reportedCheck = await pool.query("SELECT id FROM users WHERE id = $1 AND is_deleted = FALSE", [uid]);
        if (reportedCheck.rowCount === 0) {
            return res.status(404).json({ statusCode: 404, message: "The owner of this item no longer exists" });
        }

        const insert = `
      INSERT INTO item_report (module_type, item_id, reporter_user_id, reported_user_id, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;
        const result = await pool.query(insert, [module_type, iid, rid, uid, reason]);
        return res.status(201).json({ statusCode: 201, message: "Report submitted successfully", data: result.rows[0] });
    } catch (err) {
        console.error("createItemReport error:", err);
        res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
};

// ─── Admin: Get all reports (with optional filters) ───────────────────────────
export const getAllItemReports = async (req, res) => {
    try {
        const { status, module_type } = req.query;
        let page = parseInt(req.query.page || 1);
        let limit = parseInt(req.query.limit || 20);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 20;
        const offset = (page - 1) * limit;

        const params = [];
        const conditions = [];

        if (status) {
            params.push(status);
            conditions.push(`ir.status = $${params.length}`);
        }
        if (module_type) {
            params.push(module_type);
            conditions.push(`ir.module_type = $${params.length}`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const countQuery = `SELECT COUNT(*) FROM item_report ir ${whereClause}`;
        const { rows: countRows } = await pool.query(countQuery, params);
        const total = parseInt(countRows[0].count);

        params.push(limit, offset);
        const dataQuery = `
      SELECT
        ir.*,
        reporter.username  AS reporter_username,
        reporter.image     AS reporter_image,
        reported.username  AS reported_username,
        reported.image     AS reported_image
      FROM item_report ir
      LEFT JOIN users reporter ON ir.reporter_user_id = reporter.id
      LEFT JOIN users reported ON ir.reported_user_id = reported.id
      ${whereClause}
      ORDER BY ir.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const { rows } = await pool.query(dataQuery, params);

        // Fetch item details for each report
        for (const report of rows) {
            const tableName = report.module_type;
            const itemId = report.item_id;

            if (ALLOWED_MODULE_TABLES.has(tableName)) {
                try {
                    const itemQuery = `SELECT * FROM ${tableName} WHERE id = $1`;
                    const itemResult = await pool.query(itemQuery, [itemId]);
                    report.item_details = itemResult.rows[0] || null;
                } catch (err) {
                    console.error(`Error fetching item details from ${tableName}:`, err);
                    report.item_details = null;
                }
            } else {
                report.item_details = null;
            }
        }

        return res.status(200).json({ statusCode: 200, data: rows, page, limit, total });
    } catch (err) {
        console.error("getAllItemReports error:", err);
        res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
};

// ─── Admin: Get single report by ID ──────────────────────────────────────────
export const getItemReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
      SELECT
        ir.*,
        reporter.username  AS reporter_username,
        reporter.image     AS reporter_image,
        reported.username  AS reported_username,
        reported.image     AS reported_image
      FROM item_report ir
      LEFT JOIN users reporter ON ir.reporter_user_id = reporter.id
      LEFT JOIN users reported ON ir.reported_user_id = reported.id
      WHERE ir.id = $1`;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ statusCode: 404, message: "Report not found" });
        }

        const report = rows[0];
        const tableName = report.module_type;
        const itemId = report.item_id;

        if (ALLOWED_MODULE_TABLES.has(tableName)) {
            try {
                const itemQuery = `SELECT * FROM ${tableName} WHERE id = $1`;
                const itemResult = await pool.query(itemQuery, [itemId]);
                report.item_details = itemResult.rows[0] || null;
            } catch (err) {
                console.error(`Error fetching item details from ${tableName}:`, err);
                report.item_details = null;
            }
        } else {
            report.item_details = null;
        }

        return res.status(200).json({ statusCode: 200, data: report });
    } catch (err) {
        console.error("getItemReportById error:", err);
        res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
};

const ALLOWED_MODULE_TABLES = new Set([
    "xpi_videos",
    "pic_tours",
    "NEWS",
    "post_letters",
    "tv_progmax_videos",
    "QAFI",
    "learning_hobbies_videos",
    "kid_vids_videos",
    "fan_star_videos",
    "cinematics_videos",
    "GEBC",
    "item",
    "sports",
    "top_video",
    "top_tours",
    "top_QAFI",
    "top_GEBC",
    "top_NEWS",
]);

// ─── Admin: Update report status (take action) ────────────────────────────────
export const updateItemReportStatus = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !ALLOWED_STATUSES.has(status)) {
            return res.status(400).json({
                statusCode: 400,
                message: `Invalid status. Allowed values: ${[...ALLOWED_STATUSES].join(", ")}`,
            });
        }

        await client.query("BEGIN");

        const updateReport = `
      UPDATE item_report
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *`;
        const { rows } = await client.query(updateReport, [status, id]);

        if (rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ statusCode: 404, message: "Report not found" });
        }

        const report = rows[0];

        // If status is 'blocked' or 'rejected', also update the status of the reported item in its original table
        if (status === "blocked" || status === "rejected") {
            const tableName = report.module_type;
            const itemId = report.item_id;

            // Security check: ensure the module_type is a valid table name
            if (ALLOWED_MODULE_TABLES.has(tableName)) {
                console.log(`Syncing status '${status}' to table '${tableName}' for item_id ${itemId}`);
                const updateItem = `UPDATE ${tableName} SET status = $1, updated_at = NOW() WHERE id = $2`;
                await client.query(updateItem, [status, itemId]);
            } else {
                console.warn(`Warning: module_type '${tableName}' is not in the whitelist. Skipping item status sync.`);
            }
        }

        await client.query("COMMIT");
        return res.status(200).json({ statusCode: 200, message: "Report status updated and synced to item", data: report });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("updateItemReportStatus error:", err);
        res.status(500).json({ statusCode: 500, message: "Internal server error" });
    } finally {
        client.release();
    }
};

// ─── User: Get reports submitted by a specific user ──────────────────────────
export const getMyItemReports = async (req, res) => {
    try {
        const { user_id } = req.params;
        let page = parseInt(req.query.page || 1);
        let limit = parseInt(req.query.limit || 20);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 20;
        const offset = (page - 1) * limit;

        const query = `
      SELECT
        ir.*,
        reported.username AS reported_username,
        reported.image    AS reported_image
      FROM item_report ir
      LEFT JOIN users reported ON ir.reported_user_id = reported.id
      WHERE ir.reporter_user_id = $1
      ORDER BY ir.created_at DESC
      LIMIT $2 OFFSET $3`;
        const { rows } = await pool.query(query, [user_id, limit, offset]);

        // Fetch item details for each report
        for (const report of rows) {
            const tableName = report.module_type;
            const itemId = report.item_id;

            if (ALLOWED_MODULE_TABLES.has(tableName)) {
                try {
                    const itemQuery = `SELECT * FROM ${tableName} WHERE id = $1`;
                    const itemResult = await pool.query(itemQuery, [itemId]);
                    report.item_details = itemResult.rows[0] || null;
                } catch (err) {
                    console.error(`Error fetching item details from ${tableName}:`, err);
                    report.item_details = null;
                }
            } else {
                report.item_details = null;
            }
        }

        return res.status(200).json({ statusCode: 200, data: rows, page, limit });
    } catch (err) {
        console.error("getMyItemReports error:", err);
        res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
};

// ─── Admin: Delete a report ───────────────────────────────────────────────────
export const deleteItemReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`DELETE FROM item_report WHERE id = $1 RETURNING id`, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ statusCode: 404, message: "Report not found" });
        }
        return res.status(200).json({ statusCode: 200, message: "Report deleted successfully" });
    } catch (err) {
        console.error("deleteItemReport error:", err);
        res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
};
