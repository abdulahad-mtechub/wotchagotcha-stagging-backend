import pool from "../db.config/index.js";

// ─── User: Toggle Follow (Follow/Unfollow) ──────────────────────────────────
export const toggleFollow = async (req, res) => {
    try {
        const { follower_id, following_id } = req.body;

        if (!follower_id || !following_id) {
            return res.status(400).json({
                statusCode: 400,
                message: "Missing required fields: follower_id, following_id",
            });
        }

        const fid = parseInt(follower_id);
        const fwid = parseInt(following_id);

        if (isNaN(fid) || isNaN(fwid)) {
            return res.status(400).json({ statusCode: 400, message: "IDs must be valid integers" });
        }

        if (fid === fwid) {
            return res.status(400).json({ statusCode: 400, message: "You cannot follow yourself" });
        }

        // Check if follow record exists
        const checkQuery = `SELECT * FROM follow WHERE follower_id = $1 AND following_id = $2`;
        const { rows: existingFollow } = await pool.query(checkQuery, [fid, fwid]);

        if (existingFollow.length > 0) {
            // Unfollow: delete record
            const deleteQuery = `DELETE FROM follow WHERE follower_id = $1 AND following_id = $2`;
            await pool.query(deleteQuery, [fid, fwid]);
            return res.status(200).json({ statusCode: 200, message: "Unfollowed successfully", action: "unfollow" });
        } else {
            // Follow: insert record
            const insertQuery = `INSERT INTO follow (follower_id, following_id) VALUES ($1, $2) RETURNING *`;
            const { rows } = await pool.query(insertQuery, [fid, fwid]);
            return res.status(201).json({ statusCode: 201, message: "Followed successfully", action: "follow", data: rows[0] });
        }
    } catch (err) {
        console.error("toggleFollow error:", err);
        res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
};

// ─── User: Get Followers List ────────────────────────────────────────────────
export const getFollowers = async (req, res) => {
    try {
        const { id } = req.params;
        let page = parseInt(req.query.page || 1);
        let limit = parseInt(req.query.limit || 20);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 20;
        const offset = (page - 1) * limit;

        // Support separate pagination for the 'following' list if provided
        let followingPage = parseInt(req.query.following_page || req.query.page || 1);
        let followingLimit = parseInt(req.query.following_limit || req.query.limit || 20);
        if (isNaN(followingPage) || followingPage < 1) followingPage = 1;
        if (isNaN(followingLimit) || followingLimit < 1) followingLimit = 20;
        const followingOffset = (followingPage - 1) * followingLimit;

        const followersCountQuery = `SELECT COUNT(*) FROM follow WHERE following_id = $1`;
        const followingCountQuery = `SELECT COUNT(*) FROM follow WHERE follower_id = $1`;

        const [followersResult, followingResult] = await Promise.all([
            pool.query(followersCountQuery, [id]),
            pool.query(followingCountQuery, [id])
        ]);

        const totalFollowers = parseInt(followersResult.rows[0].count);
        const totalFollowing = parseInt(followingResult.rows[0].count);

        const followersQuery = `
            SELECT 
                f.id as follow_id,
                f.created_at as follow_date,
                u.id as user_id,
                u.username,
                u.image
            FROM follow f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = $1
            ORDER BY f.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const followingQuery = `
            SELECT 
                f.id as follow_id,
                f.created_at as follow_date,
                u.id as user_id,
                u.username,
                u.image
            FROM follow f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = $1
            ORDER BY f.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const [followersRows, followingRows] = await Promise.all([
            pool.query(followersQuery, [id, limit, offset]),
            pool.query(followingQuery, [id, followingLimit, followingOffset])
        ]);

        return res.status(200).json({
            statusCode: 200,
            followers: followersRows.rows,
            following: followingRows.rows,
            page,
            limit,
            followingPage,
            followingLimit,
            totalFollowers,
            totalFollowing
        });
    } catch (err) {
        console.error("getFollowers error:", err);
        res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
};

// ─── User: Get Following List ────────────────────────────────────────────────
export const getFollowing = async (req, res) => {
    try {
        const { id } = req.params;
        let page = parseInt(req.query.page || 1);
        let limit = parseInt(req.query.limit || 20);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 20;
        const offset = (page - 1) * limit;

        const followersCountQuery = `SELECT COUNT(*) FROM follow WHERE following_id = $1`;
        const followingCountQuery = `SELECT COUNT(*) FROM follow WHERE follower_id = $1`;

        const [followersResult, followingResult] = await Promise.all([
            pool.query(followersCountQuery, [id]),
            pool.query(followingCountQuery, [id])
        ]);

        const totalFollowers = parseInt(followersResult.rows[0].count);
        const totalFollowing = parseInt(followingResult.rows[0].count);

        const dataQuery = `
            SELECT 
                f.id as follow_id,
                f.created_at as follow_date,
                u.id as user_id,
                u.username,
                u.image
            FROM follow f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = $1
            ORDER BY f.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const { rows } = await pool.query(dataQuery, [id, limit, offset]);

        return res.status(200).json({
            statusCode: 200,
            data: rows,
            page,
            limit,
            totalFollowers,
            totalFollowing
        });
    } catch (err) {
        console.error("getFollowing error:", err);
        res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
};

// ─── User: Check Follow Status ──────────────────────────────────────────────
export const checkFollowStatus = async (req, res) => {
    try {
        const { follower, following } = req.params;
        const query = `SELECT * FROM follow WHERE follower_id = $1 AND following_id = $2`;
        const { rows } = await pool.query(query, [follower, following]);

        return res.status(200).json({
            statusCode: 200,
            isFollowing: rows.length > 0,
            data: rows.length > 0 ? rows[0] : null
        });
    } catch (err) {
        console.error("checkFollowStatus error:", err);
        res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
};
