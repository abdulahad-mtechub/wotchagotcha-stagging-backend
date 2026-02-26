import pool from "../../db.config/index.js";

export const create = async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      sub_category_id,
      user_id,
      video,
      thumbnail,
    } = req.body;
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }
    const createQuery =
      "INSERT INTO cinematics_videos (name,description,video,user_id,thumbnail,category_id, sub_category_id) VALUES($1,$2,$3,$4,$5,$6, $7) RETURNING *";
    const result = await pool.query(createQuery, [
      name,
      description,
      video,
      user_id,
      thumbnail,
      category_id,
      sub_category_id,
    ]);
    if (result.rowCount === 1) {
      const query = `SELECT
        v.id AS id,
        v.name AS name,
        v.description AS description,
        v.thumbnail As thumbnail,
        v.video AS video,
        vc.name AS category_name,
        vsc.name AS sub_category_name,
        NULL AS french_category_name,
        NULL AS french_sub_category_name,
        v.user_id AS user_id,
        u.username AS username,
        u.image AS userImage,
        v.created_at AS created_at
        
    FROM cinematics_videos v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN cinematics_category vc ON v.category_id = vc.id
    LEFT JOIN cinematics_sub_category vsc ON v.sub_category_id = vsc.id
    WHERE v.id = $1
    GROUP BY v.id, u.username, u.image, vc.name, vsc.name
     `;
      const data = await pool.query(query, [result.rows[0].id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Cinematic video created successfully",
        data: data.rows[0],
      });
    }
  } catch (error) {
    console.error(error);
    if (error.constraint === "cinematics_videos_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user not found" });
    } else if (error.constraint === "cinematics_videos_category_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "category not found" });
    } else if (error.constraint === "cinematics_videos_category_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "sub category not found" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const update = async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      category_id,
      sub_category_id,
      user_id,
      video,
      thumbnail,
    } = req.body;

    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }

    const checkVideoQuery = "SELECT * FROM cinematics_videos WHERE id = $1";
    const checkVideoResult = await pool.query(checkVideoQuery, [id]);

    if (checkVideoResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Cinematic video not exist" });
    }

    const updateQuery =
      "UPDATE cinematics_videos SET name=$1, description=$2, category_id=$3, sub_category_id=$4, video=$5, thumbnail=$6, user_id=$7 WHERE id=$8 RETURNING *";
    const result = await pool.query(updateQuery, [
      name,
      description,
      category_id,
      sub_category_id,
      video,
      thumbnail,
      user_id,
      id,
    ]);

    if (result.rowCount === 1) {
      const query = `SELECT
        v.id AS id,
        v.name AS name,
        v.description AS description,
        v.thumbnail As thumbnail,
        v.video AS video,
        vc.name AS category_name,
        vsc.name AS sub_category_name,
        NULL AS french_category_name,
        NULL AS french_sub_category_name,
        v.user_id AS user_id,
        u.username AS username,
        u.image AS userImage,
        v.created_at AS created_at
        
    FROM cinematics_videos v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN cinematics_category vc ON v.category_id = vc.id
    LEFT JOIN cinematics_sub_category vsc ON v.sub_category_id = vsc.id
    WHERE v.id = $1
    GROUP BY v.id, u.username, u.image, vc.name, vsc.name
     `;
      const data = await pool.query(query, [result.rows[0].id]);
      return res.status(200).json({
        statusCode: 200,
        message: "Cinematic video updated successfully",
        data: data.rows[0],
      });
    }
  } catch (error) {
    console.error(error);
    if (error.constraint === "cinematics_videos_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user not found" });
    } else if (error.constraint === "cinematics_videos_category_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "category not found" });
    } else if (error.constraint === "cinematics_videos_sub_category_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "sub category not found" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const checkVideoQuery = "SELECT * FROM cinematics_videos WHERE id = $1";
    const checkVideoResult = await pool.query(checkVideoQuery, [id]);

    if (checkVideoResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Cinematic video not exist" });
    }

    const deleteQuery = "DELETE FROM cinematics_videos WHERE id=$1 RETURNING *";
    const result = await pool.query(deleteQuery, [id]);

    if (result.rowCount === 1) {
      return res.status(200).json({
        statusCode: 200,
        message: "Cinematic video deleted successfully",
        data: result.rows[0],
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deleteAllVideos = async (req, res) => {
  // validate required foreign keys and fields before DB insert
  if (!user_id || !category_id || !sub_category_id) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Missing required fields: user_id, category_id and sub_category_id are required',
    });
  }
  try {
    const deleteQuery = "DELETE FROM cinematics_videos  RETURNING *";
    const result = await pool.query(deleteQuery);

    if (result.rowCount > 0) {
      return res.status(200).json({
        statusCode: 200,
        message: "All cinematic videos deleted successfully",
        data: result.rows,
      });
    } else {
      return res.status(404).json({
        statusCode: 404,
        message: "No cinematic videos found to delete",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const addComment = async (req, res) => {
  try {
    const { video_id, user_id, comment } = req.body;

    const checkVideoQuery = "SELECT * FROM cinematics_videos WHERE id = $1";
    const checkVideoResult = await pool.query(checkVideoQuery, [video_id]);

    if (checkVideoResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Cinematic Video not found" });
    }

    const checkUserQuery =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkUserResult = await pool.query(checkUserQuery, [user_id]);

    if (checkUserResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not found" });
    }

    const insertQuery =
      "INSERT INTO cinematics_video_comment (video_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(insertQuery, [video_id, user_id, comment]);

    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "Comment added successfully",
        data: result.rows[0],
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getComments = async (req, res) => {
  try {
    const { video_id } = req.params;
    let page = parseInt(req.query.page || 1);
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;

    const checkVideoQuery = "SELECT * FROM cinematics_videos WHERE id = $1";
    const checkVideoResult = await pool.query(checkVideoQuery, [video_id]);

    if (checkVideoResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Video not found" });
    }

    const query = `SELECT
      c.id AS comment_id,
      c.comment AS comment,
      u.id AS user_id,
      u.username AS username,
      u.image AS user_image,
      c.created_at AS created_at,
      c.updated_at AS updated_at
    FROM cinematics_video_comment c
    JOIN users u ON c.user_id = u.id
    WHERE c.video_id = $1
    ORDER BY c.created_at DESC
    LIMIT $2 OFFSET $3`;

    const result = await pool.query(query, [video_id, perPage, offset]);

    const countQuery = `SELECT COUNT(*) FROM cinematics_video_comment WHERE video_id = $1`;
    const totalCommentsResult = await pool.query(countQuery, [video_id]);
    const totalComments = totalCommentsResult.rows[0].count;
    const totalPages = Math.ceil(totalComments / perPage);

    return res.status(200).json({
      statusCode: 200,
      totalComments,
      totalPages,
      currentPage: page,
      comments: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getTopVideoWithMostComments = async (req, res) => {
  try {
    const query = `
SELECT
  v.id AS video_id,
  v.name,
  v.description,
  v.thumbnail,
  v.video,
  vc.name AS category_name,
  vsc.name AS sub_category_name,
  NULL AS category_french_name,
  NULL AS sub_category_french_name,
  v.user_id,
  u.username,
  u.image AS user_image,
  v.created_at,
  COUNT(DISTINCT c.id) AS comment_count,
  COUNT(DISTINCT l.id) AS total_likes
FROM cinematics_videos v
JOIN users u ON v.user_id = u.id
LEFT JOIN cinematics_category vc ON v.category_id = vc.id
LEFT JOIN cinematics_sub_category vsc ON v.sub_category_id = vsc.id
LEFT JOIN cinematics_video_comment c ON v.id = c.video_id
LEFT JOIN cinematics_video_like l ON v.id = l.video_id
GROUP BY v.id, vc.name, vsc.name, u.username, u.image
ORDER BY comment_count DESC
LIMIT 1;
    `;

    const result = await pool.query(query);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "No cinematic videos found" });
    }

    return res.status(200).json({
      statusCode: 200,
      message:
        "Top cinematic video with the most comments retrieved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getSubcategoriesWithVideosByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;
    const subcategory_id = req.query.subcategory_id;
    const specificPage = parseInt(req.query.page || 1);
    const specificLimit = parseInt(req.query.limit || 5);
    const specificOffset = (specificPage - 1) * specificLimit;
    const defaultLimit = 5;

    // Check if the category exists
    const checkCategoryQuery =
      "SELECT * FROM cinematics_category WHERE id = $1";
    const checkCategoryResult = await pool.query(checkCategoryQuery, [
      category_id,
    ]);

    if (checkCategoryResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Category not found" });
    }

    // Get all subcategories for the given category
    const subcategoriesQuery = `
      SELECT id, name, french_name, "index", created_at
      FROM cinematics_sub_category 
      WHERE category_id = $1
      ORDER BY created_at DESC
    `;
    const subcategoriesResult = await pool.query(subcategoriesQuery, [
      category_id,
    ]);

    if (subcategoriesResult.rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No subcategories found for this category",
      });
    }

    const subcategories = subcategoriesResult.rows;

    // Get videos for each subcategory with conditional pagination
    for (let subcategory of subcategories) {
      let videosQuery = `
SELECT
  v.id AS video_id,
  v.name,
  v.description,
  v.thumbnail,
  v.video,
  v.user_id,
  u.username,
  u.image AS user_image,
  v.created_at,
  COUNT(DISTINCT c.id) AS comment_count,
  COUNT(DISTINCT l.id) AS total_likes
FROM cinematics_videos v
LEFT JOIN users u ON v.user_id = u.id
LEFT JOIN cinematics_video_comment c ON v.id = c.video_id
LEFT JOIN cinematics_video_like l ON v.id = l.video_id
WHERE v.sub_category_id = $1 AND v.status != 'blocked'
GROUP BY v.id, u.username, u.image
ORDER BY v.created_at DESC

      `;

      let videosResult, countQuery, totalVideosResult, totalVideos, totalPages;

      if (subcategory_id && parseInt(subcategory_id) === subcategory.id) {
        // Apply specific pagination for the provided subcategory
        videosQuery += ` LIMIT $2 OFFSET $3`;
        videosResult = await pool.query(videosQuery, [
          subcategory.id,
          specificLimit,
          specificOffset,
        ]);

        countQuery = `SELECT COUNT(*) FROM cinematics_videos WHERE sub_category_id = $1 AND status != 'blocked'`;
        totalVideosResult = await pool.query(countQuery, [subcategory.id]);
        totalVideos = totalVideosResult.rows[0].count;
        totalPages = Math.ceil(totalVideos / specificLimit);
      } else {
        // Apply default pagination for other subcategories
        videosQuery += ` LIMIT $2 OFFSET $3`;
        videosResult = await pool.query(videosQuery, [
          subcategory.id,
          defaultLimit,
          0,
        ]);

        countQuery = `SELECT COUNT(*) FROM cinematics_videos WHERE sub_category_id = $1 AND status != 'blocked'`;
        totalVideosResult = await pool.query(countQuery, [subcategory.id]);
        totalVideos = totalVideosResult.rows[0].count;
        totalPages = Math.ceil(totalVideos / defaultLimit);
      }

      subcategory.sub_category_name = subcategory.name;
      subcategory.sub_category_french_name = subcategory.french_name;
      subcategory.sub_category_id = subcategory.id;
      // include subcategory index if present
      subcategory.sub_category_index = typeof subcategory.index !== 'undefined' ? subcategory.index : null;
      subcategory.video_result = {
        totalVideos,
        totalPages,
        currentPage:
          parseInt(subcategory_id) === subcategory.id ? specificPage : 1,
        videos: videosResult.rows,
      };
      delete subcategory.name;
      delete subcategory.id;
      delete subcategory.french_name;
      delete subcategory.index;
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Subcategories with videos retrieved successfully",
      data: subcategories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getVideosByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const page = parseInt(req.query.page || 1);
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;

    // Check if the user exists
    const checkUserQuery =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkUserResult = await pool.query(checkUserQuery, [user_id]);

    if (checkUserResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not found" });
    }

    const videosQuery = `
SELECT
  v.id AS video_id,
  v.name,
  v.description,
  v.thumbnail,
  v.video,
  v.category_id,
  vc.name AS category_name,
  NULL AS category_french_name,
  v.sub_category_id,
  vsc.name AS sub_category_name,
  NULL AS sub_category_french_name,
  v.user_id,
  u.username,
  u.image AS user_image,
  v.created_at,
  COUNT(DISTINCT c.id) AS comment_count,
  COUNT(DISTINCT l.id) AS total_likes
FROM cinematics_videos v
LEFT JOIN users u ON v.user_id = u.id
LEFT JOIN cinematics_category vc ON v.category_id = vc.id
LEFT JOIN cinematics_sub_category vsc ON v.sub_category_id = vsc.id
LEFT JOIN cinematics_video_comment c ON v.id = c.video_id
LEFT JOIN cinematics_video_like l ON v.id = l.video_id
WHERE v.user_id = $1
GROUP BY v.id, vc.name, vsc.name, u.username, u.image
ORDER BY v.created_at DESC
LIMIT $2 OFFSET $3;
    `;

    const videosResult = await pool.query(videosQuery, [
      user_id,
      perPage,
      offset,
    ]);

    const countQuery = `SELECT COUNT(*) FROM cinematics_videos WHERE user_id = $1`;
    const totalVideosResult = await pool.query(countQuery, [user_id]);
    const totalVideos = totalVideosResult.rows[0].count;
    const totalPages = Math.ceil(totalVideos / perPage);

    return res.status(200).json({
      statusCode: 200,
      message: "Videos retrieved successfully",
      totalVideos,
      totalPages,
      currentPage: page,
      videos: videosResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const toggleLikeVideo = async (req, res) => {
  try {
    const { video_id, user_id } = req.body;

    // Check if the video exists
    const checkVideoQuery = "SELECT * FROM cinematics_videos WHERE id = $1";
    const checkVideoResult = await pool.query(checkVideoQuery, [video_id]);

    if (checkVideoResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Video not found" });
    }

    // Check if the user exists
    const checkUserQuery =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkUserResult = await pool.query(checkUserQuery, [user_id]);

    if (checkUserResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not found" });
    }

    // Check if the user already liked the video
    const checkLikeQuery =
      "SELECT * FROM cinematics_video_like WHERE video_id = $1 AND user_id = $2";
    const checkLikeResult = await pool.query(checkLikeQuery, [
      video_id,
      user_id,
    ]);

    if (checkLikeResult.rowCount > 0) {
      // If the like exists, unlike the video
      const unlikeQuery =
        "DELETE FROM cinematics_video_like WHERE video_id = $1 AND user_id = $2 RETURNING *";
      const unlikeResult = await pool.query(unlikeQuery, [video_id, user_id]);

      return res.status(200).json({
        statusCode: 200,
        message: "Video unliked successfully",
        data: unlikeResult.rows[0],
      });
    } else {
      // If the like does not exist, like the video
      const likeQuery = `
        INSERT INTO cinematics_video_like (video_id, user_id)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const likeResult = await pool.query(likeQuery, [video_id, user_id]);

      return res.status(201).json({
        statusCode: 201,
        message: "Video liked successfully",
        data: likeResult.rows[0],
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const searchVideosByTitle = async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page || 1);
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;

    if (!query) {
      return res.status(400).json({
        statusCode: 400,
        message: "query query parameter is required",
      });
    }

    // Search videos by query with pagination
    const searchQuery = `
           SELECT
        v.id AS video_id,
        v.name,
        v.description,
        v.thumbnail,
        v.video,
        v.category_id,
        vc.name AS category_name,
        NULL AS category_french_name,
        v.sub_category_id,
        vsc.name AS sub_category_name,
        NULL AS sub_category_french_name,
        v.user_id,
        u.username,
        u.image AS user_image,
        v.created_at,
        COALESCE(likes.total_likes, 0) AS total_likes
      FROM cinematics_videos v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN cinematics_category vc ON v.category_id = vc.id
      LEFT JOIN cinematics_sub_category vsc ON v.sub_category_id = vsc.id
      LEFT JOIN (
        SELECT video_id, COUNT(*) AS total_likes
        FROM cinematics_video_like
        GROUP BY video_id
      ) likes ON v.id = likes.video_id
      WHERE v.name ILIKE $1
      ORDER BY v.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const searchResult = await pool.query(searchQuery, [
      `%${query}%`,
      perPage,
      offset,
    ]);

    const countQuery = `SELECT COUNT(*) FROM cinematics_videos WHERE name ILIKE $1`;
    const totalVideosResult = await pool.query(countQuery, [`%${query}%`]);
    const totalVideos = totalVideosResult.rows[0].count;
    const totalPages = Math.ceil(totalVideos / perPage);

    return res.status(200).json({
      statusCode: 200,
      message: "Videos retrieved successfully",
      totalVideos,
      totalPages,
      currentPage: page,
      videos: searchResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getLikes = async (req, res) => {
  try {
    const { video_id } = req.params;

    if (!video_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "The 'video_id' parameter is required.",
      });
    }

    const query = `
      SELECT COUNT(*) AS like_count 
      FROM cinematics_video_like 
      WHERE video_id = $1
    `;

    const detailsQuery = `
      SELECT * FROM cinematics_video_like 
      WHERE video_id = $1
    `;

    const countResult = await pool.query(query, [video_id]);
    const detailsResult = await pool.query(detailsQuery, [video_id]);

    const likeCount = parseInt(countResult.rows[0]?.like_count) || 0;

    return res.status(200).json({
      statusCode: 200,
      likes: likeCount,
      allLikes: detailsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    return res.status(500).json({
      statusCode: 500,
      message: "An internal server error occurred.",
    });
  }
};
