import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";
export const createXpiVideo = async (req, res) => {
  try {
    const {
      name,
      description,
      video_category,
      sub_category,
      user_id,
      video,
      thumbnail,
    } = req.body;

    // Check if the user exists and is not deleted
    const checkUserQuery =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkUserResult = await pool.query(checkUserQuery, [user_id]);

    if (checkUserResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not exist" });
    }

    // Insert new video record
    const createQuery = `
      INSERT INTO xpi_videos (name, description, video_category, sub_category, video, user_id, thumbnail) 
      VALUES($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`;
    const result = await pool.query(createQuery, [
      name,
      description,
      video_category,
      sub_category,
      video,
      user_id,
      thumbnail,
    ]);

    if (result.rowCount === 1) {
      const query = `
        SELECT
          v.id AS xpi_video_id,
          v.name,
          v.description,
          v.video_category,
          vc.name AS category_name,
          v.sub_category,
          vsc.name AS sub_category_name,
          v.thumbnail,
          v.video,
          v.created_at AS tour_created_at,
          v.user_id,
          u.username AS username,
          u.image AS user_image
        FROM xpi_videos v
        JOIN users u ON v.user_id = u.id
        LEFT JOIN video_category vc ON v.video_category = vc.id
        LEFT JOIN video_sub_category vsc ON v.sub_category = vsc.id
        WHERE v.id = $1
        GROUP BY v.id, u.username, u.image, vc.name, vsc.name`;

      const data = await pool.query(query, [result.rows[0].id]);

      return res.status(201).json({
        statusCode: 201,
        message: "Xpi video uploaded successfully",
        data: data.rows[0],
      });
    }

    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);

    if (error.constraint === "xpi_videos_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "User not found" });
    } else if (error.constraint === "xpi_videos_video_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Video category not found" });
    } else if (error.constraint === "xpi_videos_sub_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Sub category not found" });
    }

    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (req.files.length) {
      const media = req.files.map((file) => `/fileUpload/${file.filename}`);

      res.status(200).json({ statusCode: 200, file: media });
    } else {
      res.status(400).json({ statusCode: 400, message: "file not uploaded" });
    }
  } catch (error) {
    console.error(error);
    handle_delete_photos_from_folder([req.file?.filename], "fileUpload");
    if (error.constraint === "check_valid_status") {
      return res.status(400).json({
        statusCode: 400,
        message:
          "Invalid mass app type use one of these types ('favourites','new_added','phone_based','unused_app')",
      });
    } else if (error.constraint === "mass_app_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user id not exist" });
    } else if (error.constraint === "mass_app_app_category_id_fkey") {
      return res.status(400).json({
        statusCode: 400,
        message: "app category id not exist",
      });
    }
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldVideo = await getSingleRow("xpi_videos", condition);
    if (oldVideo.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Xpi video not found " });
    }
    const oldVideoSplit = oldVideo[0].video.replace("/xpiVideos/", "");
    const delQuery = "DELETE FROM xpi_videos WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Xpi video not deleted" });
    }
    handle_delete_photos_from_folder([oldVideoSplit], "xpiVideos");
    res.status(200).json({
      statusCode: 200,
      message: "Xpi video deleted successfully",
      deletedVideo: oldVideo[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const updateXpiVideo = async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      video_category,
      sub_category,
      video,
      thumbnail,
    } = req.body;
    const condition = {
      column: "id",
      value: id,
    };

    // Check if the video exists
    const oldVideo = await getSingleRow("xpi_videos", condition);
    if (oldVideo.length === 0) {
      handle_delete_photos_from_folder([req.file?.filename], "xpiVideos");
      return res
        .status(404)
        .json({ statusCode: 404, message: "Xpi video not found" });
    }

    // Check if the sub_category exists
    const checkSubCategoryQuery =
      "SELECT * FROM video_sub_category WHERE id = $1";
    const checkSubCategoryResult = await pool.query(checkSubCategoryQuery, [
      sub_category,
    ]);
    if (checkSubCategoryResult.rowCount === 0) {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Sub category not found" });
    }

    const updateQuery = `
      UPDATE xpi_videos 
      SET name=$1, description=$2, video_category=$3, sub_category=$4, video=$5, thumbnail=$6, updated_at=NOW() 
      WHERE id=$7 
      RETURNING *`;
    const result = await pool.query(updateQuery, [
      name,
      description,
      video_category,
      sub_category,
      video,
      thumbnail,
      id,
    ]);

    if (result.rowCount === 1) {
      const query = `
        SELECT
          v.id AS xpi_video_id,
          v.name,
          v.description,
          v.video_category,
          vc.name AS category_name,
          v.sub_category,
          vsc.name AS sub_category_name,
          v.video,
          v.thumbnail,
          v.created_at AS tour_created_at,
          v.user_id,
          u.username AS username,
          u.image AS user_image
        FROM xpi_videos v
        JOIN users u ON v.user_id = u.id
        LEFT JOIN video_category vc ON v.video_category = vc.id
        LEFT JOIN video_sub_category vsc ON v.sub_category = vsc.id
        WHERE v.id = $1
        GROUP BY v.id, u.username, u.image, vc.name, vsc.name`;

      const data = await pool.query(query, [result.rows[0].id]);

      return res
        .status(200)
        .json({ statusCode: 200, updateXpiVideo: data.rows[0] });
    } else {
      res
        .status(404)
        .json({ statusCode: 404, message: "Operation not successful" });
    }
  } catch (error) {
    console.error(error);
    if (error.constraint === "xpi_videos_video_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Video category not found" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAllVideos = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM xpi_videos RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No video found to delete",
      });
    }
    const imageFilenames = rows.map((news) =>
      news.video.replace("/xpiVideos/", "")
    );
    handle_delete_photos_from_folder(imageFilenames, "xpiVideos");
    res.status(200).json({
      statusCode: 200,
      message: "All Videos deleted successfully",
      deletedVideos: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const sendComment = async (req, res) => {
  try {
    const { video_id, user_id, comment, type } = req.body;
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }

    let result;
    if (type === "topvideo") {
      const checkVideoQuery = "SELECT * FROM top_video WHERE id = $1";
      const checkVideoResult = await pool.query(checkVideoQuery, [video_id]);

      if (checkVideoResult.rowCount === 0) {
        return res
          .status(404)
          .json({ statusCode: 404, message: "video not exist" });
      }

      const createQuery =
        "INSERT INTO video_comment (top_video_id,user_id,comment) VALUES($1,$2,$3) RETURNING *";
      result = await pool.query(createQuery, [video_id, user_id, comment]);
    } else {
      const checkVideoQuery = "SELECT * FROM xpi_videos WHERE id = $1";
      const checkVideoResult = await pool.query(checkVideoQuery, [video_id]);

      if (checkVideoResult.rowCount === 0) {
        return res
          .status(404)
          .json({ statusCode: 404, message: "video not exist" });
      }

      const createQuery =
        "INSERT INTO video_comment (video_id,user_id,comment) VALUES($1,$2,$3) RETURNING *";
      result = await pool.query(createQuery, [video_id, user_id, comment]);
    }
    if (result.rowCount === 1) {
      let commentQuery = `SELECT 
      v.video_id AS xpi_video_id,
      v.top_video_id AS top_video_id,
      v.id AS commentId,
            v.comment AS comment,
            u.id AS userId,
            u.username AS username,
            u.image AS userImage
            FROM video_comment v
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
    if (error.constraint === "video_comment_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user not found" });
    } else if (error.constraint === "video_comment_video_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "video  not found" });
    } else if (error.constraint === "video_comment_top_video_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "video  not found" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllCommentsByVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    let commentQuery;
    if (type === "topvideo") {
      commentQuery = `SELECT v.id AS commentId,
      v.comment AS comment,
      u.id AS userId,
      u.username AS username,
      u.image AS userImage
      FROM video_comment v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE top_video_id=$1 AND u.is_deleted=FALSE
      ORDER BY v.created_at DESC;
      `;
    } else {
      commentQuery = `SELECT v.id AS commentId,
      v.comment AS comment,
      u.id AS userId,
      u.username AS username,
      u.image AS userImage
      FROM video_comment v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE video_id=$1 AND u.is_deleted=FALSE
      ORDER BY v.created_at DESC;
      `;
    }

    const { rows } = await pool.query(commentQuery, [id]);
    res.status(200).json({
      statusCode: 200,
      totalComments: rows.length,
      AllComents: rows,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const likeUnlikeVideo = async (req, res) => {
  try {
    const { video_id, user_id, type } = req.body;
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      handle_delete_photos_from_folder([req.file?.filename], "picTourImages");
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }

    if (type === "topvideo") {
      // top video like/unlike
      const checkVideoQuery = "SELECT * FROM top_video WHERE id = $1";
      const checkVideoResult = await pool.query(checkVideoQuery, [video_id]);

      if (checkVideoResult.rowCount === 0) {
        return res
          .status(404)
          .json({ statusCode: 404, message: "video not exist" });
      }

      const checkQuery =
        "SELECT * FROM top_video_like WHERE video_id = $1 AND user_id = $2";
      const checkResult = await pool.query(checkQuery, [video_id, user_id]);

      if (checkResult.rowCount > 0) {
        const deleteQuery =
          "DELETE FROM top_video_like WHERE video_id = $1 AND user_id = $2 RETURNING *";
        const result = await pool.query(deleteQuery, [video_id, user_id]);
        if (result.rowCount === 1) {
          return res.status(200).json({
            statusCode: 200,
            message: "Video unliked successfully",
            data: result.rows[0],
          });
        }
      } else {
        const createQuery =
          "INSERT INTO top_video_like (video_id,user_id) VALUES($1,$2) RETURNING *";
        const result = await pool.query(createQuery, [video_id, user_id]);
        if (result.rowCount === 1) {
          return res.status(201).json({
            statusCode: 201,
            message: "Video liked successfully",
            data: result.rows[0],
          });
        }
      }
    } else {
      // xpi video like/unlike
      const checkQuery =
        "SELECT * FROM like_video WHERE video_id = $1 AND user_id = $2";
      const checkResult = await pool.query(checkQuery, [video_id, user_id]);

      if (checkResult.rowCount > 0) {
        const deleteQuery =
          "DELETE FROM like_video WHERE user_id=$1 AND video_id=$2 RETURNING *";
        const result = await pool.query(deleteQuery, [user_id, video_id]);
        if (result.rowCount === 1) {
          return res.status(200).json({
            statusCode: 201,
            message: "Video Unlike successfully",
            data: result.rows[0],
          });
        }
      }
      const createQuery =
        "INSERT INTO like_video  (video_id,user_id) VALUES($1,$2) RETURNING *";
      const result = await pool.query(createQuery, [video_id, user_id]);
      if (result.rowCount === 1) {
        return res.status(201).json({
          statusCode: 201,
          message: "Video like successfully",
          data: result.rows[0],
        });
      }
    }
    res.status(400).json({ statusCode: 400, message: "Not like" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "like_video_user_id_fkey" || error.constraint === "top_video_like_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user not found" });
    } else if (error.constraint === "like_video_video_id_fkey" || error.constraint === "top_video_like_video_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "video  not found" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const likeVideo = async (req, res) => {
  try {
    const { video_id, user_id } = req.body;
    // Check if the user has already liked the video
    const checkQuery =
      "SELECT * FROM like_video WHERE video_id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [video_id, user_id]);

    if (checkResult.rowCount > 0) {
      // The user has already liked the video, return an error
      return res
        .status(400)
        .json({ statusCode: 400, message: "User has already liked the video" });
    }
    const createQuery =
      "INSERT INTO like_video (video_id,user_id) VALUES($1,$2) RETURNING *";
    const result = await pool.query(createQuery, [video_id, user_id]);
    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "Video like successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const UnlikeVideo = async (req, res) => {
  try {
    const { like_id } = req.body;
    const createQuery = "DELETE FROM like_video WHERE id=$1 RETURNING *";
    const result = await pool.query(createQuery, [like_id]);
    if (result.rowCount === 1) {
      return res.status(200).json({
        statusCode: 201,
        message: "Video Unlike successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "User like not exist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllLikesByVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    let likeQuery;
    if (type === "topvideo") {
      likeQuery = `SELECT v.*
      FROM top_video_like v
      LEFT JOIN
      users AS u ON v.user_id = u.id
      WHERE video_id=$1 AND u.is_deleted=FALSE
      ORDER BY v.created_at DESC;
      `;
    } else {
      likeQuery = `SELECT v.*
      FROM like_video v
      LEFT JOIN
      users AS u ON v.user_id = u.id
      WHERE video_id=$1 AND u.is_deleted=FALSE
      ORDER BY v.created_at DESC;
      `;
    }

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
export const getSpecificVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    let sqlQuery = `
      SELECT
        v.id AS video_id,
        v.name,
        v.description,
        v.video_category,
        vc.name AS category_name,
        vc.french_name AS category_french_name,
        v.sub_category,
        vsc.name AS sub_category_name,
        vsc.french_name AS sub_category_french_name,
        v.video,
        v.thumbnail,
        v.created_at AS video_created_at,
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
          FROM video_comment c
          JOIN users cu ON c.user_id = cu.id
          WHERE c.video_id = v.id
        ) AS comments,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', lv.id,
              'user_id', lv.user_id,
              'video_id', v.id,
              'created_at', lu.created_at,
              'updated_at', lu.updated_at
            )
          ), '[]'::json)
          FROM like_video lv
          JOIN users lu ON lv.user_id = lu.id
          WHERE lv.video_id = v.id
        ) AS likes,
        (
          SELECT count(*) FROM video_comment c WHERE c.video_id = v.id
        ) AS comment_count,
        (
          SELECT count(*) FROM like_video lv WHERE lv.video_id = v.id
        ) AS like_count
    `;

    if (user_id) {
      sqlQuery += `,
        CASE WHEN pl.id IS NOT NULL THEN true ELSE false END AS is_liked`;
    }

    sqlQuery += `
      FROM xpi_videos v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN video_category vc ON v.video_category = vc.id
      LEFT JOIN video_sub_category vsc ON v.sub_category = vsc.id`;

    if (user_id) {
      sqlQuery += `
      LEFT JOIN like_video pl ON v.id = pl.video_id AND pl.user_id = $2`;
    }

    sqlQuery += `
      WHERE v.id = $1 AND u.is_deleted = FALSE
      GROUP BY v.id, u.username, u.image, vc.name, vsc.name, vc.french_name, vsc.french_name`;

    if (user_id) {
      sqlQuery += `, pl.id`;
    }

    const queryParams = [id];
    if (user_id) {
      queryParams.push(user_id);
    }

    const { rows } = await pool.query(sqlQuery, queryParams);

    if (rows.length > 0) {
      return res.status(200).json({ statusCode: 200, Video: rows[0] });
    } else {
      return res
        .status(404)
        .json({ statusCode: 404, message: "No Video found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// export const getSpecificVideo = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const query = `SELECT
//     v.id AS video_id,
//     v.name,
//     v.description,
//     v.video_category,
//     v.video,
//     v.created_at AS video_created_at,
//     v.user_id,
//     u.username AS username,
//     u.image AS userImage,
//     (
//         SELECT COALESCE(json_agg(
//             json_build_object(
//                 'comment_id', c.id,
//                 'comment', c.comment,
//                 'user_id', c.user_id,
//                 'username', cu.username,
//                 'userimage', cu.image,
//                 'comment_created_at', c.created_at
//             )
//         ), '[]'::json)
//         FROM video_comment c
//         JOIN users cu ON c.user_id = cu.id
//         WHERE c.video_id = v.id
//     ) AS comments,
//     (
//         SELECT COALESCE(json_agg(
//             json_build_object(
//                 'id', lv.id,
//                 'user_id', lv.user_id,
//                 'video_id', v.id,
//                 'created_at', lu.created_at,
//                 'updated_at', lu.updated_at
//             )
//         ), '[]'::json)
//         FROM like_video lv
//         JOIN users lu ON lv.user_id = lu.id
//         WHERE lv.video_id = v.id
//     ) AS likes
// FROM xpi_videos v
// JOIN users u ON v.user_id = u.id
// WHERE v.id = $1
// GROUP BY v.id, u.username, u.image;

//  `;

//     const { rows } = await pool.query(query, [id]);
//     if (rows.length > 0) {
//       return res.status(200).json({ statusCode: 200, Video: rows[0] });
//     } else {
//       res.status(404).json({ statusCode: 404, message: "No Video found" });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
export const getAllVideos = async (req, res) => {
  try {
    console.log(req.query);
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;

    let query = `
      SELECT
        v.id AS video_id,
        v.name,
        v.description,
        v.video_category,
        vc.name AS category_name,
        vc.french_name AS category_french_name,
        v.sub_category,
        vsc.name AS sub_category_name,
        vsc.french_name AS sub_category_french_name,
        v.video,
        v.thumbnail,
        v.created_at AS video_created_at,
        v.user_id,
        u.username AS username,
        u.image AS userImage
      FROM xpi_videos v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN video_category vc ON v.video_category = vc.id
      LEFT JOIN video_sub_category vsc ON v.sub_category = vsc.id
      WHERE u.is_deleted = FALSE
      ORDER BY v.created_at DESC
    `;

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      query += ` LIMIT $1 OFFSET $2;`;
    }

    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalVideos and totalPages
      res.status(200).json({
        statusCode: 200,
        totalVideos: rows.length,
        AllVideos: rows,
      });
    } else {
      // Calculate the total number of videos (without pagination)
      const countQuery = `
        SELECT COUNT(*) FROM xpi_videos
        JOIN users u ON xpi_videos.user_id = u.id
        WHERE u.is_deleted = FALSE
      ;`;
      const totalVideosResult = await pool.query(countQuery);
      const totalVideos = totalVideosResult.rows[0].count;
      const totalPages = Math.ceil(totalVideos / perPage);

      res.status(200).json({
        statusCode: 200,
        totalVideos,
        totalPages,
        AllVideos: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

// export const getAllVideos = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
//     const perPage = parseInt(req.query.limit || 10); // Number of results per page

//     const offset = (page - 1) * perPage;

//     const countQuery = `SELECT COUNT(*) FROM xpi_videos
//     JOIN users u ON xpi_videos.user_id = u.id
//     WHERE u.is_deleted=FALSE
//     ;`;
//     const countResult = await pool.query(countQuery);
//     const totalVideos = parseInt(countResult.rows[0].count);

//     const totalPages = Math.ceil(totalVideos / perPage);

//     const query = `SELECT
//           v.id AS video_id,
//           v.name,
//           v.description,
//           v.video_category,
//           vc.name AS category_name,
//           v.video,
//           v.thumbnail,
//           v.created_at AS video_created_at,
//           v.user_id,
//           u.username AS username,
//           u.image AS userImage

//       FROM xpi_videos v
//       JOIN users u ON v.user_id = u.id
//       LEFT JOIN video_category vc ON v.video_category = vc.id
//       WHERE u.is_deleted=FALSE
//       ORDER BY v.created_at DESC
//       LIMIT $1 OFFSET $2;`;

//     const { rows } = await pool.query(query, [perPage, offset]);

//     return res.status(200).json({
//       statusCode: 200,
//       totalPages,
//       totalVideos,
//       Videos: rows,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

export const getAllVideosByUser = async (req, res) => {
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

    const countQuery = `SELECT COUNT(*) FROM xpi_videos WHERE user_id=$1;`;
    const countResult = await pool.query(countQuery, [id]);
    const totalVideos = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalVideos / perPage);

    const query = `
      SELECT
        v.id AS video_id,
        v.name,
        v.description,
        v.video_category,
        vc.name AS category_name,
        vc.french_name AS category_french_name,
        v.sub_category,
        vsc.name AS sub_category_name,
        vsc.french_name AS sub_category_french_name,
        v.video,
        v.thumbnail,
        v.created_at AS video_created_at,
        v.user_id,
        u.username AS username,
        u.image AS userImage
      FROM xpi_videos v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN video_category vc ON v.video_category = vc.id
      LEFT JOIN video_sub_category vsc ON v.sub_category = vsc.id
      WHERE v.user_id = $1
      GROUP BY v.id, u.username, u.image, vc.name, vsc.name, vc.french_name, vsc.french_name
      LIMIT $2 OFFSET $3;
    `;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    return res.status(200).json({
      statusCode: 200,
      totalPages,
      totalVideos,
      Videos: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllVideosByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = "SELECT * FROM video_category WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Video Category does not exist" });
    }

    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10);
    const offset = (page - 1) * perPage;

    const countQuery = `
      SELECT COUNT(*) FROM xpi_videos
      LEFT JOIN users AS u ON xpi_videos.user_id = u.id
      WHERE video_category = $1 AND u.is_deleted = FALSE;
    `;
    const countResult = await pool.query(countQuery, [id]);
    const totalVideos = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalVideos / perPage);

    const query = `
  SELECT
    v.id AS video_id,
    v.name,
    v.description,
    v.video_category,
    vc.name AS category_name,
    vc.french_name AS category_french_name,
    v.sub_category,
    vsc.name AS sub_category_name,
    vsc.french_name AS sub_category_french_name,
    vsc."index" AS sub_category_index,
    v.video,
    v.thumbnail,
    v.created_at AS video_created_at,
    v.user_id,
    u.username AS username, 
    u.image AS user_image,  
    (
      SELECT COUNT(*) FROM video_comment vc WHERE vc.video_id = v.id
    ) AS comment_count,
    (
      SELECT COUNT(*) FROM like_video lv WHERE lv.video_id = v.id
    ) AS total_likes
  FROM xpi_videos v
  JOIN users u ON v.user_id = u.id
  LEFT JOIN video_category vc ON v.video_category = vc.id
  LEFT JOIN video_sub_category vsc ON v.sub_category = vsc.id
  WHERE v.video_category = $1 AND u.is_deleted = FALSE
  ORDER BY v.created_at DESC
  LIMIT $2 OFFSET $3;
`;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    // Group videos by subcategory
    const groupedBySubCategory = rows.reduce((acc, row) => {
      const subCategoryName = row.sub_category_name || "Uncategorized";
      const subCategoryFrenchName = row.sub_category_french_name;
      const subCategoryId = row.sub_category || null;

      if (!acc[subCategoryId]) {
        acc[subCategoryId] = {
          sub_category_name: subCategoryName,
          sub_category_french_name: subCategoryFrenchName,
          sub_category_id: subCategoryId,
          sub_category_index: row.sub_category_index,

          video_result: {
            totalVideos: 0,
            totalPages: totalPages,
            currentPage: page,
            Videos: [],
          },
        };
      }

      acc[subCategoryId].video_result.Videos.push({
        video_id: row.video_id,
        name: row.name,
        description: row.description,
        video: row.video,
        thumbnail: row.thumbnail,
        user_id: row.user_id,
        username: row.username,
        userimage: row.user_image,
        created_at: row.video_created_at,
        comment_count: row.comment_count,
        total_likes: row.total_likes,
      });

      acc[subCategoryId].video_result.totalVideos += 1;

      return acc;
    }, {});

    let data = Object.values(groupedBySubCategory);
    
    // Sort subcategories by the newest video's created_at (DESC)
    data.sort((a, b) => {
      const aNewest = new Date(a.video_result.Videos[0]?.created_at || 0);
      const bNewest = new Date(b.video_result.Videos[0]?.created_at || 0);
      return bNewest - aNewest;
    });

    return res.status(200).json({
      statusCode: 200,
      message: "Subcategories with videos retrieved successfully",
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMostViewedVideosByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = "SELECT * FROM video_category WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Video Category does not exist" });
    }

    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10); // Number of results per page
    const offset = (page - 1) * perPage;

    const countQuery = `
      SELECT COUNT(*) FROM xpi_videos
      LEFT JOIN users AS u ON xpi_videos.user_id = u.id
      WHERE video_category = $1 AND u.is_deleted = FALSE;
    `;
    const countResult = await pool.query(countQuery, [id]);
    const totalVideos = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalVideos / perPage);

    const query = `
      SELECT
        v.id AS video_id,
        v.name,
        v.description,
        v.video_category,
        vc.name AS category_name,
        vc.french_name As category_french_name,
        v.sub_category,
        vsc.name AS sub_category_name,
        vsc.french_name AS sub_category_french_name,
        v.video,
        v.thumbnail,
        v.created_at AS video_created_at,
        v.user_id,
        u.username AS username,
        u.image AS userImage,
        COUNT(vv.video_id) AS view_count,
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
          FROM video_comment c
          JOIN users cu ON c.user_id = cu.id
          WHERE c.video_id = v.id
        ) AS comments,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', lv.id,
              'user_id', lv.user_id,
              'video_id', v.id,
              'created_at', lu.created_at,
              'updated_at', lu.updated_at
            )
          ), '[]'::json)
          FROM like_video lv
          JOIN users lu ON lv.user_id = lu.id
          WHERE lv.video_id = v.id
        ) AS likes
      FROM xpi_videos v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN viewed_video vv ON v.id = vv.video_id
      LEFT JOIN video_category vc ON v.video_category = vc.id
      LEFT JOIN video_sub_category vsc ON v.sub_category = vsc.id
      WHERE v.video_category = $1 AND u.is_deleted = FALSE
      GROUP BY v.id, u.username, u.image, vc.name, vsc.name, vc.french_name, vsc.french_name
      ORDER BY view_count DESC
      LIMIT $2 OFFSET $3;
    `;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    return res.status(200).json({
      statusCode: 200,
      totalPages,
      totalVideos,
      Videos: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllTrendingVideosByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = "SELECT * FROM video_category WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Video Category not exist" });
    }
    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10); // Number of results per page

    const offset = (page - 1) * perPage;

    const countQuery = `SELECT COUNT(*) FROM xpi_videos
    LEFT JOIN
      users AS u ON xpi_videos.user_id = u.id
    WHERE video_category=$1 AND u.is_deleted=FALSE;`;
    const countResult = await pool.query(countQuery, [id]);
    const totalVideos = parseInt(countResult.rows[0].count);

    const totalPages = Math.ceil(totalVideos / perPage);
    const query = `SELECT
      v.id AS video_id,
      v.name,
      v.description,
      v.video_category,
      vc.name AS category_name,
      vc.french_name AS category_french_name,
      v.video,
      v.created_at AS video_created_at,
      v.thumbnail,
      v.user_id,
      u.username AS username,
      u.image AS userImage,
      (SELECT COUNT(*) FROM like_video lv WHERE lv.video_id = v.id) AS like_count,
      (SELECT COUNT(*) FROM video_comment c WHERE c.video_id = v.id) AS comment_count,
      (SELECT COUNT(*) FROM viewed_video vv WHERE vv.video_id = v.id) AS view_count
     
    FROM xpi_videos v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN like_video lv ON v.id = lv.video_id
    LEFT JOIN viewed_video vv ON v.id = vv.video_id
    LEFT JOIN video_comment c ON v.id = c.video_id
    LEFT JOIN video_category vc ON v.video_category = vc.id
    WHERE v.video_category = $1 AND u.is_deleted=FALSE
    GROUP BY v.id, u.username, u.image,vc.name, vc.french_name
    ORDER BY  view_count DESC,video_created_at DESC
    LIMIT $2 OFFSET $3;
    
       `;
    //  like_count DESC, comment_count DESC,
    const { rows } = await pool.query(query, [id, perPage, offset]);

    return res
      .status(200)
      .json({ statusCode: 200, totalPages, totalVideos, Videos: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllRecentVideosByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = "SELECT * FROM video_category WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Video Category not exist" });
    }
    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10); // Number of results per page

    const offset = (page - 1) * perPage;

    const countQuery = `SELECT COUNT(*) FROM xpi_videos
    LEFT JOIN
      users AS u ON xpi_videos.user_id = u.id
      WHERE u.is_deleted=FALSE
      
    ;`;
    const countResult = await pool.query(countQuery);
    const totalVideos = parseInt(countResult.rows[0].count);

    const totalPages = Math.ceil(totalVideos / perPage);

    const query = `SELECT
            v.id AS video_id,
            v.name,
            v.description,
            v.video_category,
            vc.name AS category_name,
            vc.french_name AS category_french_name,
            v.video,
            v.thumbnail,
            v.created_at AS video_created_at,
            v.user_id,
            u.username AS username,
            u.image AS userImage
           
        FROM xpi_videos v
        JOIN users u ON v.user_id = u.id
        LEFT JOIN video_category vc ON v.video_category = vc.id
        WHERE v.video_category=$3 AND u.is_deleted=FALSE
        ORDER BY v.created_at DESC
        LIMIT $1 OFFSET $2;`;

    const { rows } = await pool.query(query, [perPage, offset, id]);

    return res.status(200).json({
      statusCode: 200,
      totalPages,
      totalVideos,
      Videos: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getComentedVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = "SELECT * FROM video_category WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Video Category does not exist" });
    }

    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10); // Number of results per page
    const offset = (page - 1) * perPage;

    const countQuery = `
      SELECT COUNT(*) FROM xpi_videos
      LEFT JOIN users AS u ON xpi_videos.user_id = u.id
      WHERE video_category = $1 AND u.is_deleted = FALSE;
    `;
    const countResult = await pool.query(countQuery, [id]);
    const totalVideos = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalVideos / perPage);

    const query = `
      SELECT
        v.id AS video_id,
        v.name,
        v.description,
        v.video_category,
        vc.name AS category_name,
        vc.french_name AS category_french_name,
        v.sub_category,
        vsc.name AS sub_category_name,
        vsc.french_name AS sub_category_french_name,
        v.video,
        v.thumbnail,
        v.created_at AS video_created_at,
        v.user_id,
        u.username AS username,
        u.image AS userImage,
        COUNT(c.id) AS comment_count
      FROM xpi_videos v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN video_comment c ON v.id = c.video_id
      LEFT JOIN video_category vc ON v.video_category = vc.id
      LEFT JOIN video_sub_category vsc ON v.sub_category = vsc.id
      WHERE v.video_category = $1 AND u.is_deleted = FALSE
      GROUP BY v.id, u.username, u.image, vc.name, vsc.name, vc.french_name , vsc.french_name
      ORDER BY comment_count DESC
      LIMIT $2 OFFSET $3;
    `;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    return res.status(200).json({
      statusCode: 200,
      totalPages,
      totalVideos,
      Videos: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const viewVideo = async (req, res) => {
  try {
    const { video_id, user_id } = req.body;
    // Check if the user has already liked the video
    const checkQuery =
      "SELECT * FROM viewed_video WHERE video_id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [video_id, user_id]);

    if (checkResult.rowCount > 0) {
      // The user has already viewed the video, return an error
      const count = await pool.query(
        `SELECT COUNT(*) FROM   viewed_video WHERE video_id=$1    `,
        [video_id]
      );
      return res.status(200).json({
        statusCode: 200,
        message: "User has already view the video",
        totalViews: count.rows[0].count,
      });
    }
    const createQuery =
      "INSERT INTO viewed_video (video_id,user_id) VALUES($1,$2) RETURNING *";
    const result = await pool.query(createQuery, [video_id, user_id]);
    if (result.rowCount === 1) {
      const count = await pool.query(
        `SELECT COUNT(*) FROM   viewed_video WHERE video_id=$1    `,
        [video_id]
      );
      return res.status(201).json({
        statusCode: 201,
        message: "Video view successfully",
        totalViews: count.rows[0].count,
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "viewed_video_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user not found" });
    } else if (error.constraint === "viewed_video_video_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "video  not found" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const searchVideos = async (req, res) => {
  try {
    const { name } = req.query;

    // Split the search query into individual words
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, Videos: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(v.name ILIKE '%${word}%' OR v.description ILIKE '%${word}%')`;
    });
    const query = `SELECT
          v.id AS video_id,
          v.name AS name,
          v.description,
          v.video_category,
          vc.name AS category_name,
          v.video,
          v.thumbnail,
          v.created_at AS video_created_at,
          v.user_id,
          u.username AS username,
          u.image AS userImage
         
      FROM xpi_videos v

      JOIN users u ON v.user_id = u.id
      LEFT JOIN video_category vc ON v.video_category = vc.id
      WHERE ${conditions.join(" OR ")} AND u.is_deleted=FALSE
      ORDER BY v.created_at DESC`;

    // const query = `SELECT
    //       v.id AS video_id,
    //       v.name,
    //       v.description,
    //       v.video_category,
    //       vc.name AS category_name,
    //       v.video,
    //       v.created_at AS video_created_at,
    //       v.user_id,
    //       u.username AS username,
    //       u.image AS userImage

    //   FROM xpi_videos v
    //   JOIN users u ON v.user_id = u.id
    //   JOIN video_category vc ON v.video_category = vc.id
    //   WHERE ${conditions.join(" OR ")}
    //   ORDER BY v.created_at DESC
    //   `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      statusCode: 200,
      totalVideos: rows.length,
      Videos: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createTopVideo = async (req, res) => {
  try {
    const { video_id } = req.body;
    if (!video_id) {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Video id is required" });
    }
    const checkQafiQuery = "SELECT * FROM xpi_videos WHERE id = $1";
    const checkQafiResult = await pool.query(checkQafiQuery, [video_id]);

    if (checkQafiResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Xpi videos not exist" });
    }

    const createQuery =
      "UPDATE  xpi_videos SET top=$1,updated_at=NOW() WHERE  top=$2";
    await pool.query(createQuery, [false, true]);

    const updateTop = await pool.query(
      `UPDATE xpi_videos SET top=$1,updated_at=NOW() WHERE id=$2 `,
      [true, video_id]
    );
    if (updateTop.rowCount === 1) {
      const query = `SELECT
        v.id AS video_id,
        v.name,
        v.description,
        v.video_category,
        vc.name AS category_name,
        v.video,
        v.thumbnail,
        v.created_at AS video_created_at,
        v.user_id,
        u.username AS username,
        u.image AS userImage
       
    FROM xpi_videos v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN video_category vc ON v.video_category = vc.id
    WHERE v.id = $1
    GROUP BY v.id, u.username, u.image,vc.name
     `;

      const { rows } = await pool.query(query, [video_id]);
      return res.status(200).json({
        statusCode: 201,
        message: "Video goes to top successfully",
        data: rows[0],
      });
    } else {
      res
        .status(400)
        .json({ statusCode: 400, message: "Operation not successfull" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getTopVideo = async (req, res) => {
  try {
    const query = `SELECT
          v.id AS video_id,
          v.name,
          v.description,
          v.video_category,
          vc.name AS category_name,
          vc.french_name AS category_french_name,
          v.video,
          v.created_at AS video_created_at,
          v.user_id,
          u.username AS username,
          u.image AS userImage
         
      FROM xpi_videos v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN video_category vc ON v.video_category = vc.id
      WHERE top=$1
      ORDER BY v.created_at DESC
     `;

    const { rows } = await pool.query(query, [true]);

    return res.status(200).json({
      statusCode: 200,
      topVideo: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
