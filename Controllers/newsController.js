import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";
export const createNews = async (req, res) => {
  try {
    const { description, category, sub_category, user_id, image, shared_post_id } = req.body;


    // Check if the user exists
    const userCheckQuery =
      "SELECT * FROM users WHERE id=$1 AND is_deleted=FALSE";
    const userCheckResult = await pool.query(userCheckQuery, [user_id]);

    if (userCheckResult.rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "User does not exist",
      });
    }

    const createQuery =
      "INSERT INTO NEWS (description, category, sub_category, image, user_id, shared_post_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *";
    const result = await pool.query(createQuery, [
      description || "",
      category,
      sub_category,
      image || "",
      user_id,
      shared_post_id || null,
    ]);

    if (result.rowCount === 1) {
      const query = `SELECT
        v.id AS NEWS_id,
        v.description,
        v.category,
        v.sub_category,
        v.image,
        v.created_at AS news_created_at,
        v.user_id,
        v.shared_post_id,
        u.username AS username,
        u.image AS userImage,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
      FROM NEWS v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN NEWS orig ON v.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      WHERE v.id = $1
      GROUP BY v.id, u.username, u.image, orig.id, orig_u.id;
     `;
      const data = await pool.query(query, [result.rows[0].id]);
      const newsData = data.rows[0];
      if (newsData.shared_post_id) {
        newsData.original_post = {
          id: newsData.shared_post_id,
          description: newsData.original_description,
          image: newsData.original_image,
          username: newsData.original_username,
          user_image: newsData.original_user_image,
          created_at: newsData.original_created_at,
        };
      } else {
        newsData.original_post = null;
      }
      return res.status(201).json({
        statusCode: 201,
        message: "NEWS posted successfully",
        data: newsData,
      });
    }

    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "news_category_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "Category does not exist" });
    } else if (error.constraint === "news_sub_category_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "Sub-category does not exist" });
    } else if (error.constraint === "news_user_id_fkey") {
      res.status(400).json({ statusCode: 400, message: "User does not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deleteNews = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("NEWS", condition);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "NEWS not found " });
    }
    const oldImageSplit = oldImage[0].image.replace("/newsImages/", "");
    const delQuery = "DELETE FROM NEWS WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "NEWS not deleted" });
    }
    handle_delete_photos_from_folder([oldImageSplit], "newsImages");
    res.status(200).json({
      statusCode: 200,
      message: "NEWS deleted successfully",
      deletedNews: oldImage[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const updateNews = async (req, res) => {
  try {
    const { id, description, category, sub_category, image } = req.body;
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("NEWS", condition);
    console.log(oldImage);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "NEWS not found" });
    }


    let updateData = {
      image: oldImage[0].image,
    };
    if (image) {
      updateData.image = image;
      const imageSplit = oldImage[0].image.replace("/fileUpload/", "");
      handle_delete_photos_from_folder([imageSplit], "fileUpload");
    }

    const updateType = `UPDATE NEWS SET description=$1, category=$2, sub_category=$3, image=$4, "updated_at"=NOW() WHERE id=$5 RETURNING *`;
    const result = await pool.query(updateType, [
      description,
      category,
      sub_category,
      updateData.image,
      id,
    ]);
    if (result.rowCount === 1) {
      const query = `SELECT
      v.id AS NEWS_id,
      v.description,
      v.category,
      v.sub_category,
      v.image,
      v.created_at AS news_created_at,
      v.user_id,
      v.shared_post_id,
      u.username AS username,
      u.image AS userImage,
      orig.description AS original_description,
      orig.image AS original_image,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at
    FROM NEWS v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN NEWS orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE v.id = $1
    GROUP BY v.id, u.username, u.image, orig.id, orig_u.id;
   `;
      const data = await pool.query(query, [id]);
      const newsData = data.rows[0];
      if (newsData.shared_post_id) {
        newsData.original_post = {
          id: newsData.shared_post_id,
          description: newsData.original_description,
          image: newsData.original_image,
          username: newsData.original_username,
          user_image: newsData.original_user_image,
          created_at: newsData.original_created_at,
        };
      } else {
        newsData.original_post = null;
      }
      return res.status(200).json({
        statusCode: 200,
        message: "NEWS updated successfully",
        updateNews: newsData,
      });
    } else {
      res
        .status(404)
        .json({ statusCode: 404, message: "Operation not successful" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAllNews = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM NEWS RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No news found to delete",
      });
    }
    const imageFilenames = rows.map((news) =>
      news.image.replace("/newsImages/", "")
    );
    handle_delete_photos_from_folder(imageFilenames, "newsImages");
    res.status(200).json({
      statusCode: 200,
      message: "All News deleted successfully",
      deletedNews: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const sendComment = async (req, res) => {
  try {
    const { NEWS_id, user_id, comment } = req.body;
    const checkQuery = "SELECT * FROM NEWS WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [NEWS_id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "News not exist" });
    }
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }

    const createQuery =
      "INSERT INTO NEWS_comment (NEWS_id,user_id,comment) VALUES($1,$2,$3) RETURNING *";
    const result = await pool.query(createQuery, [NEWS_id, user_id, comment]);
    if (result.rowCount === 1) {
      let commentQuery = `SELECT
      nc.NEWS_id AS news_id,
      nc.id AS commentId,
      nc.comment AS comment,
      nc.user_id AS userId,
      u.username AS username,
      u.image AS userImage,
      n.shared_post_id,
      orig.description AS original_description,
      orig.image AS original_image,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at
    FROM NEWS_comment nc
    LEFT JOIN users u ON nc.user_id = u.id
    LEFT JOIN NEWS n ON nc.NEWS_id = n.id
    LEFT JOIN NEWS orig ON n.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE nc.id=$1
    ORDER BY nc.created_at DESC;
        `;
      const { rows } = await pool.query(commentQuery, [result.rows[0].id]);
      const commentData = rows[0];
      if (commentData && commentData.shared_post_id) {
        commentData.original_post = {
          id: commentData.shared_post_id,
          description: commentData.original_description,
          image: commentData.original_image,
          username: commentData.original_username,
          user_image: commentData.original_user_image,
          created_at: commentData.original_created_at,
        };
      } else if (commentData) {
        commentData.original_post = null;
      }
      return res.status(201).json({
        statusCode: 201,
        message: "Comment posted successfully",
        data: commentData,
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllCommentsByNews = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = "SELECT * FROM NEWS WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "News does not exist" });
    }

    let commentQuery = `
      SELECT
        v.id AS commentId,
        v.comment AS comment,
        v.created_at AS commentCreatedAt,
        u.id AS userId,
        u.username AS username,
        u.image AS userImage,
        n.id AS news_id,
        n.description,
        n.category AS category_id,
        n.sub_category AS sub_category_id,
        n.image AS news_image,
        n.created_at AS news_created_at,
        c.name AS category_name,
        sc.name AS sub_category_name,
        n.shared_post_id,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
      FROM NEWS_comment v
      JOIN NEWS n ON v.NEWS_id = n.id
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN NEWS_category c ON n.category = c.id
      LEFT JOIN NEWS_sub_category sc ON n.sub_category = sc.id
      LEFT JOIN NEWS orig ON n.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      WHERE v.NEWS_id = $1 AND u.is_deleted=FALSE
      ORDER BY v.created_at DESC;
    `;

    const { rows } = await pool.query(commentQuery, [id]);
    const commentsWithOriginalPost = rows.map(row => {
      if (row.shared_post_id) {
        row.original_post = {
          id: row.shared_post_id,
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
    });
    res.status(200).json({
      statusCode: 200,
      totalComments: commentsWithOriginalPost.length,
      AllComments: commentsWithOriginalPost,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const likeUnlikeNews = async (req, res) => {
  try {
    const { NEWS_id, user_id } = req.body;
    const checkQafiQuery = "SELECT * FROM NEWS WHERE id = $1";
    const checkQafiResult = await pool.query(checkQafiQuery, [NEWS_id]);

    if (checkQafiResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "News not exist" });
    }
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }
    // Check if the user has already liked the video
    const checkQuery =
      "SELECT * FROM like_NEWS WHERE NEWS_id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [NEWS_id, user_id]);

    if (checkResult.rowCount > 0) {
      const createQuery =
        "DELETE FROM like_NEWS WHERE user_id=$1 AND NEWS_id=$2 RETURNING *";
      const result = await pool.query(createQuery, [user_id, NEWS_id]);
      if (result.rowCount === 1) {
        return res.status(200).json({
          statusCode: 201,
          message: "News Unlike successfully",
          data: result.rows[0],
        });
      }
    }
    const createQuery =
      "INSERT INTO like_NEWS (NEWS_id,user_id) VALUES($1,$2) RETURNING *";
    const result = await pool.query(createQuery, [NEWS_id, user_id]);
    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "NEWS like successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const UnlikePicTour = async (req, res) => {
  try {
    const { like_id } = req.body;
    const createQuery = "DELETE FROM like_pic WHERE id=$1 RETURNING *";
    const result = await pool.query(createQuery, [like_id]);
    if (result.rowCount === 1) {
      return res.status(200).json({
        statusCode: 201,
        message: "Pic tour Unlike successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "User like not exist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllLikesByNews = async (req, res) => {
  try {
    const { id } = req.params;

    let likeQuery = `
      SELECT
        l.*,
        u.username AS username,
        u.image AS userImage,
        n.description,
        n.category AS category_id,
        n.sub_category AS sub_category_id,
        n.image AS news_image,
        n.created_at AS news_created_at,
        c.name AS category_name,
        sc.name AS sub_category_name,
        n.shared_post_id,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
      FROM like_NEWS l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN NEWS n ON l.NEWS_id = n.id
      LEFT JOIN NEWS_category c ON n.category = c.id
      LEFT JOIN NEWS_sub_category sc ON n.sub_category = sc.id
      LEFT JOIN NEWS orig ON n.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      WHERE l.NEWS_id = $1 AND u.is_deleted=FALSE
      ORDER BY l.created_at DESC;
    `;

    const { rows } = await pool.query(likeQuery, [id]);
    const likesWithOriginalPost = rows.map(row => {
      if (row.shared_post_id) {
        row.original_post = {
          id: row.shared_post_id,
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
    });
    res.status(200).json({
      statusCode: 200,
      totalLikes: likesWithOriginalPost.length,
      AllLikes: likesWithOriginalPost,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const getSpecificNews = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT
    v.id AS News_id,
    v.description,
    v.disc_category,
    v.image,
    v.created_at AS tour_created_at,
    v.user_id,
    u.username AS username,
    u.image AS userImage,
    (
        SELECT COALESCE(json_agg(
            json_build_object(
                'comment_id', c.id,
                'comment', c.comment,
                'user_id', c.user_id,
                'username', cu.username,
                'userimage', cu.image,
                'comment_created_at', c.created_at
            )
        ), '[]'::json)
        FROM NEWS_comment c
        JOIN users cu ON c.user_id = cu.id
        WHERE c.NEWS_id = v.id
    ) AS comments,
    (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', lv.id,
                'user_id', lv.user_id,
                'news_id', v.id,
                'created_at', lu.created_at,
                'updated_at', lu.updated_at
            )
        ), '[]'::json)
        FROM like_NEWS lv
        JOIN users lu ON lv.user_id = lu.id
        WHERE lv.NEWS_id = v.id
    ) AS likes,
        v.shared_post_id,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
FROM NEWS v
JOIN users u ON v.user_id = u.id
LEFT JOIN NEWS orig ON v.shared_post_id = orig.id
LEFT JOIN users orig_u ON orig.user_id = orig_u.id
WHERE v.id = $1 AND u.is_deleted=FALSE
GROUP BY v.id, u.username, u.image, orig.id, orig_u.id;

 
 `;

    const { rows } = await pool.query(query, [id]);
    if (rows.length > 0) {
      const newsData = rows[0];
      if (newsData.shared_post_id) {
        newsData.original_post = {
          id: newsData.shared_post_id,
          description: newsData.original_description,
          image: newsData.original_image,
          username: newsData.original_username,
          user_image: newsData.original_user_image,
          created_at: newsData.original_created_at,
        };
      } else {
        newsData.original_post = null;
      }
      return res.status(200).json({ statusCode: 200, News: newsData });
    } else {
      res.status(404).json({ statusCode: 404, message: "No news found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllNews = async (req, res) => {
  try {
    let page = parseInt(req.query.page); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit);
    const offset = (page - 1) * perPage;

    let getQuery = `SELECT
      v.id AS NEWS_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.created_at AS news_created_at,
      v.user_id,
      v.shared_post_id,
      u.username AS username,
      u.image AS userImage,
      c.name AS category_name,
      sc.name AS sub_category_name,
      c.french_name AS category_french_name,
      sc.french_name AS sub_category_french_name,
      orig.description AS original_description,
      orig.image AS original_image,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at
    FROM NEWS v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN NEWS_category c ON v.category = c.id
    LEFT JOIN NEWS_sub_category sc ON v.sub_category = sc.id
    LEFT JOIN NEWS orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE u.is_deleted=FALSE
    GROUP BY v.id, u.username, u.image, c.id, sc.id, orig.id, orig_u.id
    ORDER BY v.created_at DESC`;

    if (req.query.page !== undefined && req.query.limit !== undefined) {
      getQuery += ` LIMIT $1 OFFSET $2;`;
    }

    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(getQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalNEWS: rows.length,
        News: rows.map((row) => {
          if (row.shared_post_id) {
            row.original_post = {
              id: row.shared_post_id,
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
    } else {
      // Calculate the total number of NEWS (without pagination)
      const countQuery = `SELECT COUNT(*) FROM NEWS JOIN users u ON NEWS.user_id = u.id WHERE u.is_deleted = FALSE;`;

      const totalNEWSResult = await pool.query(countQuery);
      const totalNEWS = totalNEWSResult.rows[0].count;
      const totalPages = Math.ceil(totalNEWS / perPage);

      res.status(200).json({
        statusCode: 200,
        totalNEWS,
        totalPages,
        AllNEWS: rows.map((row) => {
          if (row.shared_post_id) {
            row.original_post = {
              id: row.shared_post_id,
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
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllNewsByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User does not exist" });
    }

    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10); // Number of results per page
    const offset = (page - 1) * perPage;

    const countQuery = `SELECT COUNT(*) FROM NEWS WHERE user_id=$1;`;
    const countResult = await pool.query(countQuery, [id]);
    const totalNews = parseInt(countResult.rows[0].count);

    const totalPages = Math.ceil(totalNews / perPage);

    const query = `SELECT
      v.id AS NEWS_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.created_at AS news_created_at,
      v.user_id,
      u.username AS username,
      u.image AS userImage,
      c.name AS category_name,
      sc.name AS sub_category_name,
      c.french_name AS category_french_name,
      sc.french_name AS sub_category_french_name,
      v.shared_post_id,
      orig.description AS original_description,
      orig.image AS original_image,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at
    FROM NEWS v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN NEWS_category c ON v.category = c.id
    LEFT JOIN NEWS_sub_category sc ON v.sub_category = sc.id
    LEFT JOIN NEWS orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE v.user_id = $1 AND u.is_deleted=FALSE
    GROUP BY v.id, u.username, u.image, c.id, sc.id, orig.id, orig_u.id
    ORDER BY v.created_at DESC
    LIMIT $2 OFFSET $3;`;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    return res
      .status(200)
      .json({
        statusCode: 200,
        totalPages,
        totalNews,
        News: rows.map((row) => {
          if (row.shared_post_id) {
            row.original_post = {
              id: row.shared_post_id,
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
        })
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllNewsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5); // Number of results per page
    const offset = (page - 1) * perPage;

    // Count total news in the given category
    const countQuery = `
      SELECT COUNT(*) FROM NEWS v
      LEFT JOIN NEWS orig ON v.shared_post_id = orig.id
      WHERE (v.category = $1 OR (v.shared_post_id IS NOT NULL AND orig.category = $1))
        AND v.status != 'blocked';
    `;
    const countResult = await pool.query(countQuery, [id]);
    const totalNews = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalNews / perPage);

    // Get news in the given category with pagination
    const query = `SELECT
      v.id AS news_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      sc."index" AS sub_category_index,
      orig.sub_category AS original_sub_category_id,
      orig_sc.name AS original_sub_category_name,
      orig_sc.french_name AS original_sub_category_french_name,
      orig_sc."index" AS original_sub_category_index,
      v.image,
      v.created_at AS created_at,
      v.user_id,
      v.shared_post_id,
      u.username AS username,
      u.image AS user_image,
      c.name AS category_name,
      sc.name AS sub_category_name,
      c.french_name AS category_french_name,
      sc.french_name AS sub_category_french_name,
      (SELECT COUNT(*) FROM NEWS_comment WHERE NEWS_comment.NEWS_id = v.id) AS comment_count,
      (SELECT COUNT(*) FROM like_NEWS WHERE like_NEWS.NEWS_id = v.id) AS total_likes,
      -- Original post details
      orig.description AS original_description,
      orig.image AS original_image,
      orig.sub_category AS original_sub_category_id,
      orig_sc.name AS original_sub_category_name,
      orig_sc.french_name AS original_sub_category_french_name,
      orig_sc."index" AS original_sub_category_index,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at
    FROM NEWS v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN NEWS_category c ON v.category = c.id
    LEFT JOIN NEWS_sub_category sc ON v.sub_category = sc.id
    LEFT JOIN NEWS orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    LEFT JOIN NEWS_sub_category orig_sc ON orig.sub_category = orig_sc.id
    WHERE (v.category = $1 OR (v.shared_post_id IS NOT NULL AND orig.category = $1))
      AND u.is_deleted=FALSE AND v.status != 'blocked'
    ORDER BY v.created_at DESC
    LIMIT $2 OFFSET $3;`;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    // Group news by sub_category
    const groupedNews = rows.reduce((acc, news) => {
      const subCategoryId = news.sub_category_id || news.original_sub_category_id || null;
      const subCategoryName = news.sub_category_name || news.original_sub_category_name || null;
      const subCategoryFrenchName = news.sub_category_french_name || news.original_sub_category_french_name || null;
      const subCategoryIndex = news.sub_category_index || news.original_sub_category_index || null;

      if (!acc[subCategoryId]) {
        acc[subCategoryId] = {
          sub_category_name: subCategoryName,
          sub_category_french_name: subCategoryFrenchName,
          sub_category_index: subCategoryIndex,
          sub_category_id: subCategoryId,
          news_result: {
            totalNews: 0,
            totalPages,
            currentPage: page,
            News: [],
          },
        };
      }

      acc[subCategoryId].news_result.News.push({
        news_id: news.news_id,
        name: news.category_name,
        description: news.description,
        image: news.image,
        user_id: news.user_id,
        username: news.username,
        user_image: news.user_image,
        created_at: news.created_at,
        comment_count: news.comment_count,
        total_likes: news.total_likes,
        shared_post_id: news.shared_post_id,
        original_post: news.shared_post_id
          ? {
            id: news.shared_post_id,
            description: news.original_description,
            image: news.original_image,
            username: news.original_username,
            user_image: news.original_user_image,
            created_at: news.original_created_at,
            sub_category_id: news.original_sub_category_id,
            sub_category_name: news.original_sub_category_name,
          }
          : null,
      });

      acc[subCategoryId].news_result.totalNews++;

      return acc;
    }, {});

    // Convert grouped news into an array format
    let responseData = Object.values(groupedNews);

    // Sort subcategories by the newest news item's created_at (DESC)
    responseData.sort((a, b) => {
      const aNewest = new Date(a.news_result.News[0]?.created_at || 0);
      const bNewest = new Date(b.news_result.News[0]?.created_at || 0);
      return bNewest - aNewest;
    });

    return res.status(200).json({
      statusCode: 200,
      message: "Subcategories with news retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTopNewsWithMostComments = async (req, res) => {
  try {
    const query = `
      SELECT
        n.id AS news_id,
        n.description,
        n.image,
        nc.name AS category_name,
        nsc.name AS sub_category_name,
        n.user_id,
        u.username,
        u.image AS user_image,
        n.created_at,
        n.shared_post_id,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at,
        COUNT(DISTINCT c.id) AS comment_count,
        COUNT(DISTINCT l.id) AS total_likes
      FROM NEWS n
      JOIN users u ON n.user_id = u.id
      LEFT JOIN NEWS_category nc ON n.category = nc.id
      LEFT JOIN NEWS_sub_category nsc ON n.sub_category = nsc.id
      LEFT JOIN NEWS_comment c ON n.id = c.NEWS_id
      LEFT JOIN like_NEWS l ON n.id = l.NEWS_id
      LEFT JOIN NEWS orig ON n.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      GROUP BY n.id, nc.name, nsc.name, u.username, u.image, orig.id, orig_u.id
      ORDER BY comment_count DESC
      LIMIT 1;
    `;

    const result = await pool.query(query);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "No news found" });
    }

    const topNews = result.rows[0];
    if (topNews.shared_post_id) {
      topNews.original_post = {
        id: topNews.shared_post_id,
        description: topNews.original_description,
        image: topNews.original_image,
        username: topNews.original_username,
        user_image: topNews.original_user_image,
        created_at: topNews.original_created_at,
      };
    } else {
      topNews.original_post = null;
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Top news with the most comments retrieved successfully",
      data: topNews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const searchNews = async (req, res) => {
  try {
    const { name } = req.query;

    // Split the search query into individual words
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, News: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(v.description ILIKE '%${word}%')`;
    });

    const query = `SELECT
      v.id AS NEWS_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.created_at AS news_created_at,
      v.user_id,
      v.shared_post_id,
      u.username AS username,
      u.image AS userImage,
      c.name AS category_name,
      sc.name AS sub_category_name,
      orig.description AS original_description,
      orig.image AS original_image,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at
    FROM NEWS v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN NEWS_category c ON v.category = c.id
    LEFT JOIN NEWS_sub_category sc ON v.sub_category = sc.id
    LEFT JOIN NEWS orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE (${conditions.join(" OR ")}) AND u.is_deleted=FALSE
    GROUP BY v.id, u.username, u.image, c.id, sc.id, orig.id, orig_u.id
    ORDER BY v.created_at DESC`;

    const { rows } = await pool.query(query);

    return res
      .status(200)
      .json({
        statusCode: 200,
        totalNews: rows.length,
        News: rows.map((row) => {
          if (row.shared_post_id) {
            row.original_post = {
              id: row.shared_post_id,
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
        })
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
