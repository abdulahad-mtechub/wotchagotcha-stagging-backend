import pool from "../../db.config/index.js";

export const create = async (req, res) => {
  try {
    const { name, description, category_id, category, main_category_id, sub_category_id, sub_category, user_id, image, shared_post_id } =
      req.body;
    const categoryVal = category_id || category || main_category_id || null;
    const subCategoryVal = sub_category_id || sub_category || null;

    const checkUserQuery =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkUserResult = await pool.query(checkUserQuery, [user_id]);

    if (checkUserResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User does not exist" });
    }


    const createQuery = `
            INSERT INTO sports (name, description, image, user_id, category_id, sub_category_id, shared_post_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *
        `;
    const result = await pool.query(createQuery, [
      name || "",
      description || "",
      image || "",
      user_id,
      categoryVal,
      subCategoryVal,
      shared_post_id || null,
    ]);

    if (result.rowCount === 1) {
      const query = `
                SELECT
                    v.id AS id,
                    v.name AS name,
                    v.description AS description, 
                    v.image AS image,
                    vc.name AS category_name,
                    vsc.name AS sub_category_name,
                    v.user_id AS user_id,
                    v.shared_post_id,
                    u.username AS username,
                    u.image AS userImage,
                    u.is_premium AS premium,
                    v.created_at AS created_at,
                    orig.name AS original_name,
                    orig.description AS original_description,
                    orig.image AS original_image,
                    orig_u.username AS original_username,
                    orig_u.image AS original_user_image,
                    orig.created_at AS original_created_at
                FROM sports v
                JOIN users u ON v.user_id = u.id
                LEFT JOIN sports_category vc ON v.category_id = vc.id
                LEFT JOIN sport_sub_category vsc ON v.sub_category_id = vsc.id
                LEFT JOIN sports orig ON v.shared_post_id = orig.id
                LEFT JOIN users orig_u ON orig.user_id = orig_u.id
                WHERE v.id = $1
                GROUP BY v.id, u.username, u.image, u.is_premium, vc.name, vsc.name, orig.id, orig_u.id
            `;
      const data = await pool.query(query, [result.rows[0].id]);
      const sportData = data.rows[0];
      if (sportData.shared_post_id) {
        sportData.original_post = {
          id: sportData.shared_post_id,
          name: sportData.original_name,
          description: sportData.original_description,
          image: sportData.original_image,
          username: sportData.original_username,
          user_image: sportData.original_user_image,
          created_at: sportData.original_created_at,
        };
      } else {
        sportData.original_post = null;
      }
      return res.status(201).json({
        statusCode: 201,
        message: "Sport created successfully",
        data: sportData,
      });
    }
  } catch (error) {
    console.error(error);
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
      image,
    } = req.body;

    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }

    const checkSportQuery = "SELECT * FROM sports WHERE id = $1";
    const checkSportResult = await pool.query(checkSportQuery, [id]);

    if (checkSportResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Sport not exist" });
    }

    const updateQuery =
      "UPDATE sports SET name=$1, description=$2, category_id=$3, sub_category_id=$4, image=$5, user_id=$6 WHERE id=$7 RETURNING *";
    const result = await pool.query(updateQuery, [
      name,
      description,
      category_id,
      sub_category_id,
      image,
      user_id,
      id,
    ]);

    if (result.rowCount === 1) {
      const query = `SELECT
        v.id AS id,
        v.name AS name,
        v.description AS description, 
        v.image AS image,
        vc.name AS category_name,
        vsc.name AS sub_category_name,
        v.user_id AS user_id,
        v.shared_post_id,
        u.username AS username,
        u.image AS userImage,
        u.is_premium AS premium,
        v.created_at AS created_at,
        orig.name AS original_name,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
    FROM sports v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN sports_category vc ON v.category_id = vc.id
    LEFT JOIN sport_sub_category vsc ON v.sub_category_id = vsc.id
    LEFT JOIN sports orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE v.id = $1
    GROUP BY v.id, u.username, u.image, u.is_premium, vc.name, vsc.name, orig.id, orig_u.id;
    
     `;
      const data = await pool.query(query, [result.rows[0].id]);
      const sportData = data.rows[0];
      if (sportData.shared_post_id) {
        sportData.original_post = {
          id: sportData.shared_post_id,
          name: sportData.original_name,
          description: sportData.original_description,
          image: sportData.original_image,
          username: sportData.original_username,
          user_image: sportData.original_user_image,
          created_at: sportData.original_created_at,
        };
      } else {
        sportData.original_post = null;
      }
      return res.status(200).json({
        statusCode: 200,
        message: "Sport updated successfully",
        data: sportData,
      });
    }
  } catch (error) {
    console.error(error);
    if (error.constraint === "sports_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user not found" });
    } else if (error.constraint === "sports_category_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "category not found" });
    } else if (error.constraint === "sports_sub_category_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "sub category not found" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deleteSport = async (req, res) => {
  try {
    const { id } = req.params;

    const checkSportQuery = "SELECT * FROM sports WHERE id = $1";
    const checkSportResult = await pool.query(checkSportQuery, [id]);

    if (checkSportResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Sport not exist" });
    }

    const deleteQuery = "DELETE FROM sports WHERE id=$1 RETURNING *";
    const result = await pool.query(deleteQuery, [id]);

    if (result.rowCount === 1) {
      return res.status(200).json({
        statusCode: 200,
        message: "Sport deleted successfully",
        data: result.rows[0],
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deleteAllSports = async (req, res) => {
  try {
    const deleteQuery = "DELETE FROM sports RETURNING *";
    const result = await pool.query(deleteQuery);

    if (result.rowCount > 0) {
      return res.status(200).json({
        statusCode: 200,
        message: "All sports deleted successfully",
        data: result.rows,
      });
    } else {
      return res.status(404).json({
        statusCode: 404,
        message: "No sport found to delete",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const addComment = async (req, res) => {
  try {
    const { sport_id, user_id, comment } = req.body;

    const checkSportQuery = "SELECT * FROM sports WHERE id = $1";
    const checkSportResult = await pool.query(checkSportQuery, [sport_id]);

    if (checkSportResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Sport not found" });
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
      "INSERT INTO sport_comment (sport_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(insertQuery, [sport_id, user_id, comment]);

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
    const { sport_id } = req.params;
    let page = parseInt(req.query.page || 1);
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;

    const checkSportQuery = "SELECT * FROM sports WHERE id = $1";
    const checkSportResult = await pool.query(checkSportQuery, [sport_id]);

    if (checkSportResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Sport not found" });
    }

    const query = `SELECT
      c.id AS comment_id,
      c.comment AS comment,
      u.id AS user_id,
      u.username AS username,
      u.image AS user_image,
      u.is_premium AS premium,
      c.created_at AS commentCreatedAt,
      c.updated_at AS updated_at
    FROM sport_comment c
    JOIN users u ON c.user_id = u.id
    WHERE c.sport_id = $1
    ORDER BY c.created_at DESC
    LIMIT $2 OFFSET $3`;

    const result = await pool.query(query, [sport_id, perPage, offset]);

    const countQuery = `SELECT COUNT(*) FROM sport_comment WHERE sport_id = $1`;
    const totalCommentsResult = await pool.query(countQuery, [sport_id]);
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

export const getTopSportWithMostComments = async (req, res) => {
  try {
    const query = `
    SELECT
      v.id AS sport_id,
      v.name,
      v.description, 
      v.image,
      vc.name AS category_name,
      vsc.name AS sub_category_name,
      v.user_id,
      u.username,
      u.image AS user_image,
      u.is_premium AS premium,
      v.created_at,
      v.shared_post_id,
      orig.name AS original_name,
      orig.description AS original_description,
      orig.image AS original_image,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at,
      COUNT(DISTINCT c.id) AS comment_count,
      COUNT(DISTINCT l.id) AS total_likes
    FROM sports v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN sports_category vc ON v.category_id = vc.id
    LEFT JOIN sport_sub_category vsc ON v.sub_category_id = vsc.id
    LEFT JOIN sport_comment c ON v.id = c.sport_id
    LEFT JOIN sport_like l ON v.id = l.sport_id
    LEFT JOIN sports orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    GROUP BY v.id, vc.name, vsc.name, u.username, u.image, u.is_premium, orig.id, orig_u.id
    ORDER BY comment_count DESC
    LIMIT 1;
        `;

    const result = await pool.query(query);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "No sport found" });
    }

    const sportData = result.rows[0];
    if (sportData.shared_post_id) {
      sportData.original_post = {
        id: sportData.shared_post_id,
        name: sportData.original_name,
        description: sportData.original_description,
        image: sportData.original_image,
        username: sportData.original_username,
        user_image: sportData.original_user_image,
        created_at: sportData.original_created_at,
      };
    } else {
      sportData.original_post = null;
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Top sport with the most comments retrieved successfully",
      data: sportData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSubcategoriesWithSportsByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;
    const subcategory_id = req.query.subcategory_id;
    const specificPage = parseInt(req.query.page || 1);
    const specificLimit = parseInt(req.query.limit || 5);
    const specificOffset = (specificPage - 1) * specificLimit;
    const defaultLimit = 5;


    // Get all subcategories for the given category
    const subcategoriesQuery = `
      SELECT id, name , french_name, "index", created_at
      FROM sport_sub_category 
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
  v.id AS sport_id,
  v.name,
  v.description, 
  v.image,
  v.user_id,
  v.shared_post_id,
  u.username,
  u.image AS user_image,
  u.is_premium AS premium,
  v.created_at,
  COUNT(DISTINCT c.id) AS comment_count,
  COUNT(DISTINCT l.id) AS total_likes,
  -- Original post details
  orig.name AS original_name,
  orig.description AS original_description,
  orig.image AS original_image,
  orig_u.username AS original_username,
  orig_u.image AS original_user_image,
  orig.created_at AS original_created_at
FROM sports v
LEFT JOIN users u ON v.user_id = u.id
LEFT JOIN sport_comment c ON v.id = c.sport_id
LEFT JOIN sport_like l ON v.id = l.sport_id
LEFT JOIN sports orig ON v.shared_post_id = orig.id
LEFT JOIN users orig_u ON orig.user_id = orig_u.id
WHERE v.sub_category_id = $1 AND v.status != 'blocked'
GROUP BY v.id, u.username, u.image, u.is_premium, orig.name, orig.description, orig.image, orig_u.username, orig_u.image, orig.created_at
ORDER BY v.created_at DESC

      `;

      let sportsResult, countQuery, totalsportsResult, totalSports, totalPages;

      if (subcategory_id && parseInt(subcategory_id) === subcategory.id) {
        // Apply specific pagination for the provided subcategory
        videosQuery += ` LIMIT $2 OFFSET $3`;
        sportsResult = await pool.query(videosQuery, [
          subcategory.id,
          specificLimit,
          specificOffset,
        ]);

        countQuery = `SELECT COUNT(*) FROM sports WHERE sub_category_id = $1 AND status != 'blocked'`;
        totalsportsResult = await pool.query(countQuery, [subcategory.id]);
        totalSports = totalsportsResult.rows[0].count;
        totalPages = Math.ceil(totalSports / specificLimit);
      } else {
        // Apply default pagination for other subcategories
        videosQuery += ` LIMIT $2 OFFSET $3`;
        sportsResult = await pool.query(videosQuery, [
          subcategory.id,
          defaultLimit,
          0,
        ]);

        countQuery = `SELECT COUNT(*) FROM sports WHERE sub_category_id = $1 AND status != 'blocked'`;
        totalsportsResult = await pool.query(countQuery, [subcategory.id]);
        totalSports = totalsportsResult.rows[0].count;
        totalPages = Math.ceil(totalSports / defaultLimit);
      }

      subcategory.sub_category_name = subcategory.name;
      subcategory.sub_category_french_name = subcategory.french_name;
      subcategory.sub_category_id = subcategory.id;
      subcategory.sub_category_index = typeof subcategory.index !== 'undefined' ? subcategory.index : null;
      subcategory.Sport_result = {
        totalSports,
        totalPages,
        currentPage:
          parseInt(subcategory_id) === subcategory.id ? specificPage : 1,
        Sports: sportsResult.rows.map(row => ({
          ...row,
          original_post: row.shared_post_id ? {
            id: row.shared_post_id,
            name: row.original_name,
            description: row.original_description,
            image: row.original_image,
            username: row.original_username,
            user_image: row.original_user_image,
            created_at: row.original_created_at
          } : null
        })),
      };
      delete subcategory.name;
      delete subcategory.id;
      delete subcategory.french_name;
      delete subcategory.index;
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Subcategories with sports retrieved successfully",
      data: subcategories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSportByUserId = async (req, res) => {
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

    const sportsQuery = `
            SELECT
              v.id AS sport_id,
              v.name,
              v.description, 
              v.image,
              v.category_id,
              vc.name AS category_name,
              vc.french_name AS category_french_name,
              v.sub_category_id,
              vsc.name AS sub_category_name,
              vsc.french_name AS sub_category_french_name,
              v.user_id,
              v.shared_post_id,
              u.username,
              u.image AS user_image,
              u.is_premium AS premium,
              v.created_at,
              orig.name AS original_name,
              orig.description AS original_description,
              orig.image AS original_image,
              orig_u.username AS original_username,
              orig_u.image AS original_user_image,
              orig.created_at AS original_created_at,
              COUNT(DISTINCT c.id) AS comment_count,
              COUNT(DISTINCT l.id) AS total_likes
            FROM sports v
            LEFT JOIN users u ON v.user_id = u.id
            LEFT JOIN sports_category vc ON v.category_id = vc.id
            LEFT JOIN sport_sub_category vsc ON v.sub_category_id = vsc.id
            LEFT JOIN sport_comment c ON v.id = c.sport_id
            LEFT JOIN sport_like l ON v.id = l.sport_id
            LEFT JOIN sports orig ON v.shared_post_id = orig.id
            LEFT JOIN users orig_u ON orig.user_id = orig_u.id
            WHERE v.user_id = $1
            GROUP BY v.id, vc.name, vsc.name, u.username, u.image, u.is_premium, vc.french_name, vsc.french_name, orig.id, orig_u.id
            ORDER BY v.created_at DESC
            LIMIT $2 OFFSET $3;
        `;

    const sportsResult = await pool.query(sportsQuery, [
      user_id,
      perPage,
      offset,
    ]);

    // Corrected the table name to "sports"
    const countQuery = `SELECT COUNT(*) FROM sports WHERE user_id = $1`;
    const totalSportsResult = await pool.query(countQuery, [user_id]);
    const totalSports = parseInt(totalSportsResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalSports / perPage);

    return res.status(200).json({
      statusCode: 200,
      message: "Sports retrieved successfully",
      totalSports,
      totalPages,
      // count: sportsResult.rows.length,
      currentPage: page,
      currentPage: page,
      sports: sportsResult.rows.map((row) => {
        if (row.shared_post_id) {
          row.original_post = {
            id: row.shared_post_id,
            name: row.original_name,
            description: row.original_description,
            image: row.original_image,
            username: row.original_username,
            user_image: row.original_user_image,
            created_at: row.original_created_at,
          };
        } else {
          row.original_post = null;
        }
        return row;
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const toggleLikeSport = async (req, res) => {
  try {
    const { sport_id, user_id } = req.body;

    // Check if the video exists
    const checkSportQuery = "SELECT * FROM sports WHERE id = $1";
    const checkSportResult = await pool.query(checkSportQuery, [sport_id]);

    if (checkSportResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Sport not found" });
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
      "SELECT * FROM sport_like WHERE sport_id = $1 AND user_id = $2";
    const checkLikeResult = await pool.query(checkLikeQuery, [
      sport_id,
      user_id,
    ]);

    if (checkLikeResult.rowCount > 0) {
      // If the like exists, unlike the video
      const unlikeQuery =
        "DELETE FROM sport_like WHERE sport_id = $1 AND user_id = $2 RETURNING *";
      const unlikeResult = await pool.query(unlikeQuery, [sport_id, user_id]);

      return res.status(200).json({
        statusCode: 200,
        message: "Sport unliked successfully",
        data: unlikeResult.rows[0],
      });
    } else {
      // If the like does not exist, like the video
      const likeQuery = `
        INSERT INTO sport_like (sport_id, user_id)
        VALUES ($1, $2)
        RETURNING *;
      `;
      const likeResult = await pool.query(likeQuery, [sport_id, user_id]);

      return res.status(201).json({
        statusCode: 201,
        message: "Sport liked successfully",
        data: likeResult.rows[0],
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSportsLikes = async (req, res) => {
  try {
    const { sport_id } = req.params;

    if (!sport_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "The 'sport_id' parameter is required.",
      });
    }

    const query = `
      SELECT COUNT(*) AS like_count 
      FROM sport_like 
      WHERE sport_id = $1
    `;

    const detailsQuery = `
      SELECT * FROM sport_like 
      WHERE sport_id = $1
    `;

    const countResult = await pool.query(query, [sport_id]);
    const detailsResult = await pool.query(detailsQuery, [sport_id]);

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

export const searchSportsByTitle = async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page || 1);
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;

    if (!query) {
      return res.status(400).json({
        statusCode: 400,
        message: "query parameter is required",
      });
    }

    // Search videos by query with pagination
    const searchQuery = `
           SELECT
        v.id AS sport_id,
        v.name,
        v.description, 
        v.image,
        v.category_id,
        vc.name AS category_name,
        v.sub_category_id,
        vsc.name AS sub_category_name,
        v.user_id,
        v.shared_post_id,
        u.username,
        u.image AS user_image,
        u.is_premium AS premium,
        v.created_at,
        orig.name AS original_name,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at,
        COALESCE(likes.total_likes, 0) AS total_likes
      FROM sports v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN sports_category vc ON v.category_id = vc.id
      LEFT JOIN sport_sub_category vsc ON v.sub_category_id = vsc.id
      LEFT JOIN sports orig ON v.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      LEFT JOIN (
        SELECT sport_id, COUNT(*) AS total_likes
        FROM sport_like
        GROUP BY sport_id
      ) likes ON v.id = likes.sport_id
      WHERE v.name ILIKE $1
      GROUP BY v.id, vc.name, vsc.name, u.username, u.image, u.is_premium, orig.id, orig_u.id, likes.total_likes
      ORDER BY v.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const searchResult = await pool.query(searchQuery, [
      `%${query}%`,
      perPage,
      offset,
    ]);

    const countQuery = `SELECT COUNT(*) FROM sports WHERE name ILIKE $1`;
    const totalsportsResult = await pool.query(countQuery, [`%${query}%`]);
    const totalSports = totalsportsResult.rows[0].count;
    const totalPages = Math.ceil(totalSports / perPage);

    return res.status(200).json({
      statusCode: 200,
      message: "Sports retrieved successfully",
      totalSports,
      totalPages,
      currentPage: page,
      currentPage: page,
      sports: searchResult.rows.map((row) => {
        if (row.shared_post_id) {
          row.original_post = {
            id: row.shared_post_id,
            name: row.original_name,
            description: row.original_description,
            image: row.original_image,
            username: row.original_username,
            user_image: row.original_user_image,
            created_at: row.original_created_at,
          };
        } else {
          row.original_post = null;
        }
        return row;
      }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
