import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";
export const createQafi = async (req, res) => {
  try {
    const { description, category, sub_category, user_id, image, video, shared_post_id } = req.body;
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted = FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User does not exist" });
    }


    const createQuery =
      "INSERT INTO QAFI (description, category, sub_category, image, video, user_id, shared_post_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *";
    const result = await pool.query(createQuery, [
      description || "",
      category,
      sub_category,
      image || "",
      video || "",
      user_id,
      shared_post_id || null
    ]);

    if (result.rowCount === 1) {
      const query = `
        SELECT
          v.id AS qafi_id,
          v.description,
          v.category,
          v.sub_category,
          v.image,
          v.video,
          v.created_at AS tour_created_at,
          v.user_id,
          v.shared_post_id,
          u.username AS username,
          u.image AS userImage,
          orig.description AS original_description,
          orig.image AS original_image,
          orig.video AS original_video,
          orig_u.username AS original_username,
          orig_u.image AS original_user_image,
          orig.created_at AS original_created_at
        FROM QAFI v
        JOIN users u ON v.user_id = u.id
        LEFT JOIN QAFI orig ON v.shared_post_id = orig.id
        LEFT JOIN users orig_u ON orig.user_id = orig_u.id
        WHERE v.id = $1
        GROUP BY v.id, u.username, u.image, orig.id, orig_u.id;
      `;
      const data = await pool.query(query, [result.rows[0].id]);
      const qafiData = data.rows[0];
      if (qafiData.shared_post_id) {
        qafiData.original_post = {
          id: qafiData.shared_post_id,
          description: qafiData.original_description,
          image: qafiData.original_image,
          video: qafiData.original_video,
          username: qafiData.original_username,
          user_image: qafiData.original_user_image,
          created_at: qafiData.original_created_at,
        };
      } else {
        qafiData.original_post = null;
      }
      return res.status(201).json({
        statusCode: 201,
        message: "QAFI posted successfully",
        data: qafiData,
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    handle_delete_photos_from_folder([req.file?.filename], "qafiImages");
    if (error.constraint === "qafi_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Category does not exist" });
    } else if (error.constraint === "qafi_sub_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Sub-category does not exist" });
    } else if (error.constraint === "qafi_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "User does not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deleteQafi = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("qafi", condition);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Qafi not found " });
    }
    const oldImageSplit = oldImage[0].image.replace("/qafiImages/", "");
    const delQuery = "DELETE FROM qafi WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Qafi not deleted" });
    }
    handle_delete_photos_from_folder([oldImageSplit], "qafiImages");
    res.status(200).json({
      statusCode: 200,
      message: "Qafi deleted successfully",
      deletedQafi: oldImage[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const updateQafi = async (req, res) => {
  try {
    const { id, description, category, sub_category, image, video } = req.body;
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("qafi", condition);
    console.log(oldImage);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Qafi not found " });
    }
    let updateData = {
      image: oldImage[0].image,
      video: oldImage[0].video,
    };
    if (image) {
      updateData.image = image;
      const imageSplit = oldImage[0].image.replace("/fileUpload/", "");
      handle_delete_photos_from_folder([imageSplit], "fileUpload");
    }
    if (video) {
      updateData.video = video;
      const videoSplit = (oldImage[0].video || "").replace("/fileUpload/", "");
      if (videoSplit) handle_delete_photos_from_folder([videoSplit], "fileUpload");
    }

    const updateType = `UPDATE qafi SET description=$1, category=$2, sub_category=$3, image=$4, video=$5, "updated_at"=NOW() WHERE id=$6 RETURNING *`;
    const result = await pool.query(updateType, [
      description,
      category,
      sub_category,
      updateData.image,
      updateData.video,
      id,
    ]);
    if (result.rowCount === 1) {
      const query = `
        SELECT
          v.id AS qafi_id,
          v.description,
          v.category,
          v.sub_category,
          v.image,
          v.video,
          v.created_at AS tour_created_at,
          v.user_id,
          v.shared_post_id,
          u.username AS username,
          u.image AS userImage,
          orig.description AS original_description,
          orig.image AS original_image,
          orig.video AS original_video,
          orig_u.username AS original_username,
          orig_u.image AS original_user_image,
          orig.created_at AS original_created_at
        FROM QAFI v
        JOIN users u ON v.user_id = u.id
        LEFT JOIN QAFI orig ON v.shared_post_id = orig.id
        LEFT JOIN users orig_u ON orig.user_id = orig_u.id
        WHERE v.id = $1
        GROUP BY v.id, u.username, u.image, orig.id, orig_u.id;
      `;
      const data = await pool.query(query, [id]);
      const qafiData = data.rows[0];
      if (qafiData.shared_post_id) {
        qafiData.original_post = {
          id: qafiData.shared_post_id,
          description: qafiData.original_description,
          image: qafiData.original_image,
          video: qafiData.original_video,
          username: qafiData.original_username,
          user_image: qafiData.original_user_image,
          created_at: qafiData.original_created_at,
        };
      } else {
        qafiData.original_post = null;
      }
      return res.status(200).json({
        statusCode: 200,
        message: "QAFI updated successfully",
        updateQafi: qafiData,
      });
    } else {
      res
        .status(404)
        .json({ statusCode: 404, message: "Operation not successful" });
    }
  } catch (error) {
    console.error(error);
    if (error.constraint === "qafi_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Category does not exist" });
    } else if (error.constraint === "qafi_sub_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Sub-category does not exist" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteAllQAFIs = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM qafi RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No qafi found to delete",
      });
    }
    const imageFilenames = rows.map((news) =>
      news.image.replace("/qafiImages/", "")
    );
    handle_delete_photos_from_folder(imageFilenames, "qafiImages");
    res.status(200).json({
      statusCode: 200,
      message: "All QAFIs deleted successfully",
      deletedQAFIs: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const sendComment = async (req, res) => {
  try {
    const { QAFI_id, user_id, comment } = req.body;
    const checkQuery = "SELECT * FROM qafi WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [QAFI_id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "QAFI not exist" });
    }
    const checkQuery1 = "SELECT * FROM users WHERE id = $1";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }

    const createQuery =
      "INSERT INTO qafi_comment (QAFI_id,user_id,comment) VALUES($1,$2,$3) RETURNING *";
    const result = await pool.query(createQuery, [QAFI_id, user_id, comment]);
    if (result.rowCount === 1) {
      let commentQuery = `SELECT 
      v.QAFI_id AS qafi_id,
      v.id AS commentId,
            v.comment AS comment,
            u.id AS userId,
            u.username AS username,
            u.image AS userImage,
            q.shared_post_id,
            orig.description AS original_description,
            orig.image AS original_image,
            orig.video AS original_video,
            orig_u.username AS original_username,
            orig_u.image AS original_user_image,
            orig.created_at AS original_created_at
            FROM qafi_comment v
            LEFT JOIN users u ON v.user_id = u.id
            LEFT JOIN qafi q ON v.QAFI_id = q.id
            LEFT JOIN QAFI orig ON q.shared_post_id = orig.id
            LEFT JOIN users orig_u ON orig.user_id = orig_u.id
            WHERE v.id=$1
            ORDER BY v.created_at DESC;
            `;
      const { rows } = await pool.query(commentQuery, [result.rows[0].id]);
      const commentData = rows[0];
      if (commentData && commentData.shared_post_id) {
        commentData.original_post = {
          id: commentData.shared_post_id,
          description: commentData.original_description,
          image: commentData.original_image,
          video: commentData.original_video,
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
export const getAllCommentsByQAFI = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = "SELECT * FROM qafi WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "QAFI does not exist" });
    }

    let commentQuery = `SELECT
      v.id AS commentId,
      v.comment AS comment,
      v.created_at AS commentCreatedAt,
      u.id AS userId,
      u.username AS username,
      u.image AS userImage,
      q.id AS qafi_id,
      q.description,
      q.category AS category_id,
      q.sub_category AS sub_category_id,
      q.image AS qafi_image,
      q.video AS qafi_video,
      q.created_at AS qafi_created_at,
      q.user_id AS qafi_user_id,
      c.name AS category_name,
      sc.name AS sub_category_name
    FROM qafi_comment v
    JOIN qafi q ON v.qafi_id = q.id
    LEFT JOIN users u ON v.user_id = u.id
    LEFT JOIN QAFI_category c ON q.category = c.id
    LEFT JOIN QAFI_sub_category sc ON q.sub_category = sc.id
    WHERE v.QAFI_id = $1
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
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const likeUnlikeQafi = async (req, res) => {
  try {
    const { QAFI_id, user_id } = req.body;
    const checkQafiQuery = "SELECT * FROM qafi WHERE id = $1";
    const checkQafiResult = await pool.query(checkQafiQuery, [QAFI_id]);

    if (checkQafiResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "QAFI not exist" });
    }

    // Check if the user has already liked the video
    const checkQuery =
      "SELECT * FROM like_qafi WHERE QAFI_id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [QAFI_id, user_id]);

    if (checkResult.rowCount > 0) {
      const createQuery =
        "DELETE FROM like_qafi WHERE user_id=$1 AND QAFI_id=$2 RETURNING *";
      const result = await pool.query(createQuery, [user_id, QAFI_id]);
      if (result.rowCount === 1) {
        return res.status(200).json({
          statusCode: 201,
          message: "QAFI Unlike successfully",
          data: result.rows[0],
        });
      }
      //   return res
      //     .status(400)
      //     .json({
      //       statusCode: 400,
      //       message: "User has already liked the pic tour",
      //     });
    }
    const createQuery =
      "INSERT INTO like_qafi (QAFI_id,user_id) VALUES($1,$2) RETURNING *";
    const result = await pool.query(createQuery, [QAFI_id, user_id]);
    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "Qafi like successfully",
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
export const getAllLikesByQafi = async (req, res) => {
  try {
    const { id } = req.params;

    let likeQuery = `
      SELECT
        l.*,
        q.description,
        q.category AS category_id,
        q.sub_category AS sub_category_id,
        q.image AS qafi_image,
        q.video AS qafi_video,
        q.created_at AS qafi_created_at,
        q.user_id AS qafi_user_id,
        u.username AS qafi_username,
        u.image AS qafi_user_image,
        c.name AS category_name,
        sc.name AS sub_category_name
      FROM like_qafi l
      JOIN qafi q ON l.QAFI_id = q.id
      JOIN users u ON q.user_id = u.id
      LEFT JOIN QAFI_category c ON q.category = c.id
      LEFT JOIN QAFI_sub_category sc ON q.sub_category = sc.id
      WHERE l.QAFI_id = $1
      ORDER BY l.created_at DESC;
    `;

    const { rows } = await pool.query(likeQuery, [id]);
    res.status(200).json({
      statusCode: 200,
      totalLikes: rows.length,
      AllLikes: rows,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const getSpecificQafi = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT
    v.id AS qafi_id,
    v.description,
    v.disc_category,
    v.image,
    v.video,
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
        FROM qafi_comment c
        JOIN users cu ON c.user_id = cu.id
        WHERE c.QAFI_id = v.id
    ) AS comments,
    (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', lv.id,
                'user_id', lv.user_id,
                'QAFI_id', v.id,
                'created_at', lu.created_at,
                'updated_at', lu.updated_at
            )
        ), '[]'::json)
        FROM like_qafi lv
        JOIN users lu ON lv.user_id = lu.id
        WHERE lv.QAFI_id = v.id
    ) AS likes,
        v.shared_post_id,
        orig.description AS original_description,
        orig.image AS original_image,
        orig.video AS original_video,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
FROM QAFI v
JOIN users u ON v.user_id = u.id
LEFT JOIN QAFI orig ON v.shared_post_id = orig.id
LEFT JOIN users orig_u ON orig.user_id = orig_u.id
WHERE v.id = $1 AND u.is_deleted=FALSE
GROUP BY v.id, u.username, u.image, orig.id, orig_u.id;

 
 `;

    const { rows } = await pool.query(query, [id]);

    const qafiData = rows[0];
    if (qafiData && qafiData.shared_post_id) {
      qafiData.original_post = {
        id: qafiData.shared_post_id,
        description: qafiData.original_description,
        image: qafiData.original_image,
        video: qafiData.original_video,
        username: qafiData.original_username,
        user_image: qafiData.original_user_image,
        created_at: qafiData.original_created_at,
      };
    } else if (qafiData) {
      qafiData.original_post = null;
    }
    return res.status(200).json({ statusCode: 200, QAFI: qafiData || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllQAFIs = async (req, res) => {
  try {
    let page = parseInt(req.query.page); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit);
    const offset = (page - 1) * perPage;

    let getQuery = `SELECT
      v.id AS qafi_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.video,
      v.created_at AS tour_created_at,
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
      orig.video AS original_video,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at
    FROM qafi v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN QAFI_category c ON v.category = c.id
    LEFT JOIN QAFI_sub_category sc ON v.sub_category = sc.id
    LEFT JOIN QAFI orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE u.is_deleted = FALSE
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
      const formattedRows = rows.map((row) => {
        if (row.shared_post_id) {
          row.original_post = {
            id: row.shared_post_id,
            description: row.original_description,
            image: row.original_image,
            video: row.original_video,
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
        totalQAFIs: formattedRows.length,
        AllQAFIs: formattedRows,
      });
    } else {
      // Calculate the total number of QAFIs (without pagination)
      const countQuery = `SELECT COUNT(*) FROM qafi JOIN users u ON qafi.user_id = u.id WHERE u.is_deleted = FALSE;`;

      const totalQAFIsResult = await pool.query(countQuery);
      const totalQAFIs = totalQAFIsResult.rows[0].count;
      const totalPages = Math.ceil(totalQAFIs / perPage);

      res.status(200).json({
        statusCode: 200,
        totalQAFIs,
        totalPages,
        AllQAFIs: rows.map((row) => {
          if (row.shared_post_id) {
            row.original_post = {
              id: row.shared_post_id,
              description: row.original_description,
              image: row.original_image,
              video: row.original_video,
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

export const getAllQafisByUser = async (req, res) => {
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

    const countQuery = `SELECT COUNT(*) FROM qafi WHERE user_id=$1;`;
    const countResult = await pool.query(countQuery, [id]);
    const totalQAFIs = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalQAFIs / perPage);

    const query = `SELECT
      v.id AS qafi_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.video,
      v.created_at AS tour_created_at,
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
      orig.video AS original_video,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at
    FROM qafi v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN QAFI_category c ON v.category = c.id
    LEFT JOIN QAFI_sub_category sc ON v.sub_category = sc.id
    LEFT JOIN QAFI orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE v.user_id = $1
    GROUP BY v.id, u.username, u.image, c.id, sc.id, orig.id, orig_u.id
    LIMIT $2 OFFSET $3;`;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    return res
      .status(200)
      .json({
        statusCode: 200,
        totalPages,
        totalQAFIs,
        QAFIs: rows.map((row) => {
          if (row.shared_post_id) {
            row.original_post = {
              id: row.shared_post_id,
              description: row.original_description,
              image: row.original_image,
              video: row.original_video,
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

export const getAllQafisByCategory = async (req, res) => {
  try {
    const { id } = req.params;


    let page = parseInt(req.query.page || 1);
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;

    // Count total QAFIs in the given category
    const countQuery = `
      SELECT COUNT(*) FROM QAFI v
      LEFT JOIN QAFI orig ON v.shared_post_id = orig.id
      WHERE (v.category = $1 OR (v.shared_post_id IS NOT NULL AND orig.category = $1))
        AND v.status != 'blocked';
    `;
    const countResult = await pool.query(countQuery, [id]);
    const totalQAFIs = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalQAFIs / perPage);

    // Get QAFIs in the given category with pagination
    const query = `SELECT
      v.id AS qafi_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      sc."index" AS sub_category_index,
      v.image,
      v.video,
      v.created_at AS created_at,
      v.user_id,
      v.shared_post_id,
      u.username AS username,
      u.image AS user_image,
      c.name AS category_name,
      sc.name AS sub_category_name,
      c.french_name AS category_french_name,
      sc.french_name AS sub_category_french_name,
      (SELECT COUNT(*) FROM qafi_comment WHERE qafi_comment.qafi_id = v.id) AS comment_count,
      (SELECT COUNT(*) FROM like_qafi WHERE like_qafi.qafi_id = v.id) AS total_likes,
      -- Original post details
      orig.description AS original_description,
      orig.image AS original_image,
      orig.video AS original_video,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at
    FROM QAFI v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN QAFI_category c ON v.category = c.id
    LEFT JOIN QAFI_sub_category sc ON v.sub_category = sc.id
    LEFT JOIN QAFI orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE (v.category = $1 OR (v.shared_post_id IS NOT NULL AND orig.category = $1)) AND u.is_deleted = FALSE AND v.status != 'blocked'
    ORDER BY v.created_at DESC
    LIMIT $2 OFFSET $3;`;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    // Group QAFIs by sub_category
    const groupedQAFIs = rows.reduce((acc, qafi) => {
      const subCategoryId = qafi.sub_category_id;
      if (!acc[subCategoryId]) {
        acc[subCategoryId] = {
          sub_category_name: qafi.sub_category_name,
          sub_category_french_name: qafi.sub_category_french_name,
          sub_category_id: subCategoryId,
          sub_category_index: qafi.sub_category_index,
          QAFI_result: {
            totalQAFIs: 0,
            totalPages,
            currentPage: page,
            QAFIs: [],
          },
        };
      }

      acc[subCategoryId].QAFI_result.QAFIs.push({
        qafi_id: qafi.qafi_id,
        name: qafi.category_name,
        description: qafi.description,
        image: qafi.image,
        video: qafi.video,
        user_id: qafi.user_id,
        username: qafi.username,
        user_image: qafi.user_image,
        created_at: qafi.created_at,
        comment_count: qafi.comment_count,
        total_likes: qafi.total_likes,
        shared_post_id: qafi.shared_post_id,
        original_post: qafi.shared_post_id ? {
          id: qafi.shared_post_id,
          description: qafi.original_description,
          image: qafi.original_image,
          video: qafi.original_video,
          username: qafi.original_username,
          user_image: qafi.original_user_image,
          created_at: qafi.original_created_at
        } : null
      });

      acc[subCategoryId].QAFI_result.totalQAFIs++;

      return acc;
    }, {});

    // Convert grouped QAFIs into an array format
    const responseData = Object.values(groupedQAFIs);

    return res.status(200).json({
      statusCode: 200,
      message: "Subcategories with QAFIs retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTopQafiWithMostComments = async (req, res) => {
  try {
    const query = `
      SELECT
        q.id AS qafi_id,
        q.description,
        q.image,
        q.video,
        qc.name AS category_name,
        qsc.name AS sub_category_name,
        q.user_id,
        u.username,
        u.image AS user_image,
        q.created_at,
        q.shared_post_id,
        orig.description AS original_description,
        orig.image AS original_image,
        orig.video AS original_video,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at,
        COUNT(DISTINCT c.id) AS comment_count,
        COUNT(DISTINCT l.id) AS total_likes
      FROM QAFI q
      JOIN users u ON q.user_id = u.id
      LEFT JOIN QAFI_category qc ON q.category = qc.id
      LEFT JOIN QAFI_sub_category qsc ON q.sub_category = qsc.id
      LEFT JOIN qafi_comment c ON q.id = c.QAFI_id
      LEFT JOIN like_qafi l ON q.id = l.QAFI_id
      LEFT JOIN QAFI orig ON q.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      GROUP BY q.id, qc.name, qsc.name, u.username, u.image, orig.id, orig_u.id
      ORDER BY comment_count DESC
      LIMIT 1;
    `;

    const result = await pool.query(query);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "No QAFI found" });
    }

    const qafiData = result.rows[0];
    if (qafiData.shared_post_id) {
      qafiData.original_post = {
        id: qafiData.shared_post_id,
        description: qafiData.original_description,
        image: qafiData.original_image,
        video: qafiData.original_video,
        username: qafiData.original_username,
        user_image: qafiData.original_user_image,
        created_at: qafiData.original_created_at,
      };
    } else {
      qafiData.original_post = null;
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Top QAFI with the most comments retrieved successfully",
      data: qafiData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const searchQafi = async (req, res) => {
  try {
    const { name } = req.query;

    // Split the search query into individual words
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, QAFIs: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(v.description ILIKE '%${word}%')`;
    });

    const query = `SELECT
      v.id AS qafi_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.video,
      v.created_at AS tour_created_at,
      v.user_id,
      u.username AS username,
      u.image AS userImage,
      c.name AS category_name,
      sc.name AS sub_category_name
    FROM qafi v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN QAFI_category c ON v.category = c.id
    LEFT JOIN QAFI_sub_category sc ON v.sub_category = sc.id
    WHERE (${conditions.join(" OR ")}) AND u.is_deleted=FALSE
    ORDER BY v.created_at DESC`;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      statusCode: 200,
      totalQAFIs: rows.length,
      QAFIs: rows.map((row) => {
        if (row.shared_post_id) {
          row.original_post = {
            id: row.shared_post_id,
            description: row.original_description,
            image: row.original_image,
            video: row.original_video,
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
    res.status(500).json({ message: "Internal server error" });
  }
};
