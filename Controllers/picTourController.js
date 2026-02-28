import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";

export const createPicTour = async (req, res) => {
  try {
    const { name, description, pic_category, pic_category_id, category_id, main_category_id, sub_category, sub_category_id, user_id, image, shared_post_id } =
      req.body;
    const picCategoryVal = pic_category_id || pic_category || category_id || main_category_id || null;
    const subCategoryVal = sub_category_id || sub_category || null;


    // Insert new pic tour record
    const createQuery = `
      INSERT INTO pic_tours (name, description, pic_category, sub_category, image, user_id, shared_post_id) 
      VALUES($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`;
    const result = await pool.query(createQuery, [
      name || "",
      description || "",
      picCategoryVal,
      subCategoryVal,
      image || "",
      user_id,
      shared_post_id || null,
    ]);

    if (result.rowCount === 1) {
      const query = `
        SELECT
          v.id AS tour_id,
          v.name,
          v.description,
          v.pic_category,
          pc.name AS category_name,
          v.sub_category,
          psc.name AS sub_category_name,
          v.image,
          v.created_at AS tour_created_at,
          v.user_id,
          v.shared_post_id,
          u.username AS username,
          u.image AS userImage,
          orig.name AS original_name,
          orig.description AS original_description,
          orig.image AS original_image,
          orig_u.username AS original_username,
          orig_u.image AS original_user_image,
          orig.created_at AS original_created_at
        FROM pic_tours v
        JOIN users u ON v.user_id = u.id
        LEFT JOIN pic_category pc ON v.pic_category = pc.id
        LEFT JOIN pic_sub_category psc ON v.sub_category = psc.id
        LEFT JOIN pic_tours orig ON v.shared_post_id = orig.id
        LEFT JOIN users orig_u ON orig.user_id = orig_u.id
        WHERE v.id = $1
        GROUP BY v.id, u.username, u.image, pc.name, psc.name, orig.id, orig_u.id`;

      const data = await pool.query(query, [result.rows[0].id]);

      const tourData = data.rows[0];
      if (tourData.shared_post_id) {
        tourData.original_post = {
          id: tourData.shared_post_id,
          name: tourData.original_name,
          description: tourData.original_description,
          image: tourData.original_image,
          username: tourData.original_username,
          user_image: tourData.original_user_image,
          created_at: tourData.original_created_at,
        };
      } else {
        tourData.original_post = null;
      }

      return res.status(201).json({
        statusCode: 201,
        message: "Pic tour uploaded successfully",
        data: tourData,
      });
    }

    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    handle_delete_photos_from_folder([req.file?.filename], "picTourImages");

    if (error.constraint === "pic_tours_pic_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Pic category does not exist" });
    } else if (error.constraint === "pic_tours_sub_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Sub category does not exist" });
    } else if (error.constraint === "pic_tours_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "User does not exist" });
    }

    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deletePicTour = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("pic_tours", condition);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Pic tour not found " });
    }
    const oldImageSplit = oldImage[0].image.replace("/picTourImages/", "");
    const delQuery = "DELETE FROM pic_tours WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Pic tour not deleted" });
    }
    handle_delete_photos_from_folder([oldImageSplit], "picTourImages");
    res.status(200).json({
      statusCode: 200,
      message: "Pic Tour deleted successfully",
      deletedPicTour: oldImage[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const updatePicTour = async (req, res) => {
  try {
    const { id, name, description, pic_category, sub_category, image } =
      req.body;
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("pic_tours", condition);
    console.log("oldImage", oldImage);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Pic Tour not found" });
    }

    const checkUserQuery =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkUserResult = await pool.query(checkUserQuery, [
      oldImage[0].user_id,
    ]);

    if (checkUserResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User does not exist" });
    }


    let updateData = {
      image: oldImage[0].image,
    };
    if (image) {
      updateData.image = image;
      const imageSplit = oldImage[0].image.replace("/fileUpload/", "");
      handle_delete_photos_from_folder([imageSplit], "fileUpload");
    }

    const updateType = `
      UPDATE pic_tours 
      SET name=$1, description=$2, pic_category=$3, sub_category=$4, image=$5, updated_at=NOW() 
      WHERE id=$6 
      RETURNING *`;
    const result = await pool.query(updateType, [
      name,
      description,
      pic_category,
      sub_category,
      updateData.image,
      id,
    ]);

    if (result.rowCount === 1) {
      const query = `
        SELECT
          v.id AS tour_id,
          v.name,
          v.description,
          v.pic_category,
          pc.name AS category_name,
          v.sub_category,
          psc.name AS sub_category_name,
          v.image,
          v.created_at AS tour_created_at,
          v.user_id,
          v.shared_post_id,
          u.username AS username,
          u.image AS userImage,
          orig.name AS original_name,
          orig.description AS original_description,
          orig.image AS original_image,
          orig_u.username AS original_username,
          orig_u.image AS original_user_image,
          orig.created_at AS original_created_at
        FROM pic_tours v
        JOIN users u ON v.user_id = u.id
        LEFT JOIN pic_category pc ON v.pic_category = pc.id
        LEFT JOIN pic_sub_category psc ON v.sub_category = psc.id
        LEFT JOIN pic_tours orig ON v.shared_post_id = orig.id
        LEFT JOIN users orig_u ON orig.user_id = orig_u.id
        WHERE v.id = $1
        GROUP BY v.id, u.username, u.image, pc.name, psc.name, orig.id, orig_u.id`;

      const data = await pool.query(query, [result.rows[0].id]);

      const tourData = data.rows[0];
      if (tourData.shared_post_id) {
        tourData.original_post = {
          id: tourData.shared_post_id,
          name: tourData.original_name,
          description: tourData.original_description,
          image: tourData.original_image,
          username: tourData.original_username,
          user_image: tourData.original_user_image,
          created_at: tourData.original_created_at,
        };
      } else {
        tourData.original_post = null;
      }

      return res.status(200).json({
        statusCode: 200,
        message: "Pic Tour updated successfully",
        updatePicTour: tourData,
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
export const deleteAllPicTours = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM pic_tours RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No pic tour found to delete",
      });
    }
    const imageFilenames = rows.map((news) =>
      news.image.replace("/picTourImages/", "")
    );
    handle_delete_photos_from_folder(imageFilenames, "picTourImages");
    res.status(200).json({
      statusCode: 200,
      message: "All Pic Tours deleted successfully",
      deletedVideos: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const sendComment = async (req, res) => {
  try {
    const { pic_tours_id, user_id, comment, type } = req.body;
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      handle_delete_photos_from_folder([req.file?.filename], "picTourImages");
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }
    let result;
    if (type === "toptour") {
      const checkTopQuery = "SELECT * FROM top_tours WHERE id = $1";
      const checkTopResult = await pool.query(checkTopQuery, [pic_tours_id]);
      if (checkTopResult.rowCount === 0) {
        return res
          .status(404)
          .json({ statusCode: 404, message: "Pic tour does not exist" });
      }
      const createQuery =
        "INSERT INTO pic_comment (top_tours_id,user_id,comment) VALUES($1,$2,$3) RETURNING *";
      result = await pool.query(createQuery, [pic_tours_id, user_id, comment]);
    } else {
      const createQuery =
        "INSERT INTO pic_comment (pic_tours_id,user_id,comment) VALUES($1,$2,$3) RETURNING *";
      result = await pool.query(createQuery, [pic_tours_id, user_id, comment]);
    }
    if (result.rowCount === 1) {
      let commentQuery = `SELECT 
      v.pic_tours_id AS tour_id,
      v.top_tours_id AS top_tours_id,
      v.id AS commentId,
        v.comment AS comment,
        u.id AS userId,
        u.username AS username,
        u.image AS userImage
        FROM pic_comment v
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
    if (error.constraint === "pic_comment_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user does not exist" });
    } else if (error.constraint === "pic_comment_pic_tours_id_fkey" || error.constraint === "pic_comment_top_tours_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user does not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllCommentsByPicTours = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    let commentQuery;
    if (type === "toptour") {
      commentQuery = `SELECT v.id AS commentId,
      v.comment AS comment,
      u.id AS userId,
      u.username AS username,
      u.image AS userImage
      FROM pic_comment v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE top_tours_id=$1 AND u.is_deleted=FALSE
      ORDER BY v.created_at DESC;
      `;
    } else {
      commentQuery = `SELECT v.id AS commentId,
      v.comment AS comment,
      u.id AS userId,
      u.username AS username,
      u.image AS userImage
      FROM pic_comment v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE pic_tours_id=$1 AND u.is_deleted=FALSE
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

export const likePicTour = async (req, res) => {
  try {
    const { pic_tour_id, user_id, type } = req.body;

    if (type === "toptour") {
      // top tours like
      const checkTopQuery = "SELECT * FROM top_tours WHERE id = $1";
      const checkTopResult = await pool.query(checkTopQuery, [pic_tour_id]);
      if (checkTopResult.rowCount === 0) {
        return res
          .status(404)
          .json({ statusCode: 404, message: "Pic tour does not exist" });
      }

      const checkQuery =
        "SELECT * FROM top_tours_like WHERE pic_tours_id = $1 AND user_id = $2";
      const checkResult = await pool.query(checkQuery, [pic_tour_id, user_id]);

      if (checkResult.rowCount > 0) {
        return res.status(400).json({
          statusCode: 400,
          message: "User has already liked the pic tour",
        });
      }

      const createQuery =
        "INSERT INTO top_tours_like (pic_tours_id,user_id) VALUES($1,$2) RETURNING *";
      const result = await pool.query(createQuery, [pic_tour_id, user_id]);
      if (result.rowCount === 1) {
        return res.status(201).json({
          statusCode: 201,
          message: "Pic tour like successfully",
          data: result.rows[0],
        });
      }
    } else {
      const { pic_tour_id: id, user_id: uid } = req.body;
      const checkQuery =
        "SELECT * FROM like_pic WHERE pic_tours_id = $1 AND user_id = $2";
      const checkResult = await pool.query(checkQuery, [id, uid]);

      if (checkResult.rowCount > 0) {
        return res.status(400).json({
          statusCode: 400,
          message: "User has already liked the pic tour",
        });
      }
      const createQuery =
        "INSERT INTO like_pic (pic_tours_id,user_id) VALUES($1,$2) RETURNING *";
      const result = await pool.query(createQuery, [id, uid]);
      if (result.rowCount === 1) {
        return res.status(201).json({
          statusCode: 201,
          message: "Pic tour like successfully",
          data: result.rows[0],
        });
      }
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "like_pic_pic_tours_id_fkey" || error.constraint === "top_tours_like_pic_tours_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Pic tour does not exist" });
    } else if (error.constraint === "like_pic_user_id_fkey" || error.constraint === "top_tours_like_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user does not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const likeUnlikePicTour = async (req, res) => {
  try {
    const { pic_tour_id, user_id, type } = req.body;
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      handle_delete_photos_from_folder([req.file?.filename], "picTourImages");
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }
    if (type === "toptour") {
      const checkTopQuery = "SELECT * FROM top_tours WHERE id = $1";
      const checkTopResult = await pool.query(checkTopQuery, [pic_tour_id]);

      if (checkTopResult.rowCount === 0) {
        return res
          .status(404)
          .json({ statusCode: 404, message: "Pic Tour not exist" });
      }

      const checkQuery =
        "SELECT * FROM top_tours_like WHERE pic_tours_id = $1 AND user_id = $2";
      const checkResult = await pool.query(checkQuery, [pic_tour_id, user_id]);

      if (checkResult.rowCount > 0) {
        const deleteQuery =
          "DELETE FROM top_tours_like WHERE user_id=$1 AND pic_tours_id=$2 RETURNING *";
        const result = await pool.query(deleteQuery, [user_id, pic_tour_id]);
        if (result.rowCount === 1) {
          return res.status(200).json({
            statusCode: 201,
            message: "Tour Unlike successfully",
            data: result.rows[0],
          });
        }
      }
      const createQuery =
        "INSERT INTO top_tours_like (pic_tours_id,user_id) VALUES($1,$2) RETURNING *";
      const result = await pool.query(createQuery, [pic_tour_id, user_id]);
      if (result.rowCount === 1) {
        return res.status(201).json({
          statusCode: 201,
          message: "Tour like successfully",
          data: result.rows[0],
        });
      }
    } else {
      const checkQafiQuery = "SELECT * FROM pic_tours WHERE id = $1";
      const checkQafiResult = await pool.query(checkQafiQuery, [pic_tour_id]);

      if (checkQafiResult.rowCount === 0) {
        return res
          .status(404)
          .json({ statusCode: 404, message: "Pic Tour not exist" });
      }

      // Check if the user has already liked the video
      const checkQuery =
        "SELECT * FROM like_pic WHERE pic_tours_id = $1 AND user_id = $2";
      const checkResult = await pool.query(checkQuery, [pic_tour_id, user_id]);

      if (checkResult.rowCount > 0) {
        const createQuery =
          "DELETE FROM like_pic WHERE user_id=$1 AND pic_tours_id=$2 RETURNING *";
        const result = await pool.query(createQuery, [user_id, pic_tour_id]);
        if (result.rowCount === 1) {
          return res.status(200).json({
            statusCode: 201,
            message: "Tour Unlike successfully",
            data: result.rows[0],
          });
        }
      }
      const createQuery =
        "INSERT INTO like_pic (pic_tours_id,user_id) VALUES($1,$2) RETURNING *";
      const result = await pool.query(createQuery, [pic_tour_id, user_id]);
      if (result.rowCount === 1) {
        return res.status(201).json({
          statusCode: 201,
          message: "Tour like successfully",
          data: result.rows[0],
        });
      }
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "like_pic_pic_tours_id_fkey" || error.constraint === "top_tours_like_pic_tours_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Pic tour does not exist" });
    } else if (error.constraint === "like_pic_user_id_fkey" || error.constraint === "top_tours_like_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user does not exist" });
    }
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
export const getAllLikesByPicTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    let likeQuery;
    if (type === "toptour") {
      likeQuery = `SELECT v.*
      FROM top_tours_like v
      LEFT JOIN users ON v.user_id =users.id
      WHERE pic_tours_id=$1 AND users.is_deleted=FALSE
      ORDER BY v.created_at DESC;
      `;
    } else {
      likeQuery = `SELECT v.*
      FROM like_pic v
      LEFT JOIN users ON v.user_id =users.id
      WHERE pic_tours_id=$1 AND users.is_deleted=FALSE
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

export const getSpecificPicTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    let sqlQuery = `
      SELECT
        v.id AS pic_tour_id,
        v.name,
        v.description,
        v.pic_category,
        pc.name AS category_name,
        pc.french_name AS category_french_name,
        v.sub_category,
        psc.name AS sub_category_name,
        psc.french_name As sub_category_french_name,
        v.image,
        v.created_at AS tour_created_at,
        v.user_id,
        u.username AS username,
        u.image AS userImage,
        (SELECT COUNT(*) FROM like_pic lv WHERE lv.pic_tours_id = v.id) AS like_count,
        (SELECT COUNT(*) FROM pic_comment c WHERE c.pic_tours_id = v.id) AS comment_count,
        (SELECT COUNT(*) FROM viewed_pic vv WHERE vv.pic_tours_id = v.id) AS view_count,
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
          FROM pic_comment c
          JOIN users cu ON c.user_id = cu.id
          WHERE c.pic_tours_id = v.id
        ) AS comments,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', lv.id,
              'user_id', lv.user_id,
              'pic_tours_id', v.id,
              'created_at', lu.created_at,
              'updated_at', lu.updated_at
            )
          ), '[]'::json)
          FROM like_pic lv
          JOIN users lu ON lv.user_id = lu.id 
          WHERE lv.pic_tours_id = v.id 
        ) AS likes,
        v.shared_post_id,
        orig.name AS original_name,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at`;

    if (user_id) {
      sqlQuery += `,
        CASE WHEN pl.id IS NOT NULL THEN true ELSE false END AS is_liked`;
    }

    sqlQuery += `
      FROM pic_tours v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN pic_category pc ON v.pic_category = pc.id
      LEFT JOIN pic_sub_category psc ON v.sub_category = psc.id
      LEFT JOIN pic_tours orig ON v.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id`;

    if (user_id) {
      sqlQuery += `
        LEFT JOIN like_pic pl ON v.id = pl.pic_tours_id AND pl.user_id = $2`;
    }

    sqlQuery += `
      WHERE v.id = $1 AND u.is_deleted = FALSE
      GROUP BY v.id, u.username, u.image, pc.name, psc.name , pc.french_name, psc.french_name, orig.id, orig_u.id`;

    if (user_id) {
      sqlQuery += `, pl.id`;
    }

    const queryParams = [id];

    if (user_id) {
      queryParams.push(user_id);
    }

    const { rows } = await pool.query(sqlQuery, queryParams);

    if (rows.length > 0) {
      const tourData = rows[0];
      if (tourData.shared_post_id) {
        tourData.original_post = {
          id: tourData.shared_post_id,
          name: tourData.original_name,
          description: tourData.original_description,
          image: tourData.original_image,
          username: tourData.original_username,
          user_image: tourData.original_user_image,
          created_at: tourData.original_created_at,
        };
      } else {
        tourData.original_post = null;
      }
      return res.status(200).json({ statusCode: 200, picTour: tourData });
    } else {
      return res
        .status(404)
        .json({ statusCode: 404, message: "No pic tour found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllPicTour = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10); // Number of results per page
    const offset = (page - 1) * perPage;

    const countQuery = `
      SELECT COUNT(*) FROM pic_tours 
      JOIN users u ON pic_tours.user_id = u.id
      WHERE u.is_deleted = FALSE;
    `;
    const countResult = await pool.query(countQuery);
    const totalTours = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalTours / perPage);

    const query = `
      SELECT
        v.id AS pic_tour_id,
        v.name,
        v.description,
        v.pic_category,
        pc.name AS category_name,
        v.sub_category,
        psc.name AS sub_category_name,
        v.image,
        v.created_at AS tour_created_at,
        v.user_id,
        v.shared_post_id,
        u.username AS username,
        u.image AS userImage,
        orig.name AS original_name,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
      FROM pic_tours v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN pic_category pc ON v.pic_category = pc.id
      LEFT JOIN pic_sub_category psc ON v.sub_category = psc.id
      LEFT JOIN pic_tours orig ON v.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      WHERE u.is_deleted = FALSE
      GROUP BY v.id, u.username, u.image, pc.name, psc.name, orig.id, orig_u.id
      ORDER BY v.created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const { rows } = await pool.query(query, [perPage, offset]);

    return res.status(200).json({
      statusCode: 200,
      totalPages,
      totalTours,
      Tours: rows.map((row) => {
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
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllPicToursByUser = async (req, res) => {
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

    const countQuery = `SELECT COUNT(*) FROM pic_tours WHERE user_id=$1;`;
    const countResult = await pool.query(countQuery, [id]);
    const totalTours = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalTours / perPage);

    const query = `
      SELECT
        v.id AS pic_tour_id,
        v.name,
        v.description,
        v.pic_category,
        pc.name AS category_name,
        pc.french_name AS category_french_name,
        v.sub_category,
        psc.name AS sub_category_name,
        psc.french_name AS sub_category_french_name,
        v.image,
        v.created_at AS tour_created_at,
        v.user_id,
        u.username AS username,
        u.image AS userImage,
        v.shared_post_id,
        orig.name AS original_name,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
      FROM pic_tours v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN pic_category pc ON v.pic_category = pc.id
      LEFT JOIN pic_sub_category psc ON v.sub_category = psc.id
      LEFT JOIN pic_tours orig ON v.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      WHERE v.user_id = $1
      GROUP BY v.id, u.username, u.image, pc.name, psc.name, pc.french_name, psc.french_name, orig.id, orig_u.id
      ORDER BY v.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    return res
      .status(200)
      .json({
        statusCode: 200,
        totalPages,
        totalTours,
        Tours: rows.map((row) => {
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
        })
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllRecentToursByCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10); // Number of results per page
    const offset = (page - 1) * perPage;

    const countQuery = `
      SELECT COUNT(*) FROM pic_tours v
      JOIN users u ON v.user_id = u.id
      WHERE v.pic_category = $1 AND u.is_deleted = FALSE;
    `;
    const countResult = await pool.query(countQuery, [id]);
    const totalTours = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalTours / perPage);

    const query = `
      SELECT
        v.id AS pic_tour_id,
        v.name,
        v.description,
        v.pic_category,
        pc.name AS category_name,
        v.sub_category,
        psc.name AS sub_category_name,
        v.image,
        v.created_at AS tour_created_at,
        v.user_id,
        v.shared_post_id,
        u.username AS username,
        u.image AS userImage,
        orig.name AS original_name,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
      FROM pic_tours v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN pic_category pc ON v.pic_category = pc.id
      LEFT JOIN pic_sub_category psc ON v.sub_category = psc.id
      LEFT JOIN pic_tours orig ON v.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      WHERE v.pic_category = $3 AND u.is_deleted = FALSE
      GROUP BY v.id, u.username, u.image, pc.name, psc.name, orig.id, orig_u.id
      ORDER BY v.created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const { rows } = await pool.query(query, [perPage, offset, id]);

    return res.status(200).json({
      statusCode: 200,
      totalPages,
      totalTours,
      Tours: rows.map((row) => {
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
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllPicTourByCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5); // Number of results per page
    const offset = (page - 1) * perPage;

    // Count total tours
    const countQuery = `
      SELECT COUNT(*) FROM pic_tours v 
      JOIN users u ON v.user_id = u.id
      LEFT JOIN pic_tours orig ON v.shared_post_id = orig.id
      WHERE (v.pic_category = $1 OR (v.shared_post_id IS NOT NULL AND orig.pic_category = $1)) 
        AND u.is_deleted = FALSE AND v.status != 'blocked';
    `;
    const countResult = await pool.query(countQuery, [id]);
    const totalTours = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalTours / perPage);

    // Get tours with subcategory information
    const query = `
      SELECT
        v.id AS pic_tour_id,
        v.name,
        v.description,
        v.pic_category,
        v.sub_category,
        psc.name AS sub_category_name,
        psc."index" AS sub_category_index,
        psc.french_name AS sub_category_french_name,
        v.image,
        v.created_at AS tour_created_at,
        v.user_id,
        v.shared_post_id,
        u.username AS username,
        u.image AS userImage,
        (
          SELECT COUNT(*) FROM pic_comment pc WHERE pc.pic_tours_id = v.id
        ) AS comment_count,
        (
          SELECT COUNT(*) FROM like_pic lp WHERE lp.pic_tours_id = v.id
        ) AS total_likes,
        -- Original post details
        orig.name AS original_name,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
      FROM pic_tours v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN pic_sub_category psc ON v.sub_category = psc.id
      LEFT JOIN pic_tours orig ON v.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      WHERE (v.pic_category = $1 OR (v.shared_post_id IS NOT NULL AND orig.pic_category = $1)) 
        AND u.is_deleted = FALSE AND v.status != 'blocked'
      ORDER BY v.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    // Group tours by subcategory
    const groupedBySubCategory = rows.reduce((acc, row) => {
      const subCategoryName = row.sub_category_name || "Uncategorized";
      const subCategoryFrenchName = row.sub_category_french_name;
      const subCategoryId = row.sub_category || null;

      if (!acc[subCategoryId]) {
        acc[subCategoryId] = {
          sub_category_name: subCategoryName,
          sub_category_french_name: subCategoryFrenchName,
          sub_category_index: row.sub_category_index,
          sub_category_id: subCategoryId,
          tour_result: {
            totalTours: 0,
            totalPages: totalPages,
            currentPage: page,
            Tours: [],
          },
        };
      }

      acc[subCategoryId].tour_result.Tours.push({
        tour_id: row.pic_tour_id,
        name: row.name,
        description: row.description,
        image: row.image,
        user_id: row.user_id,
        username: row.username,
        user_image: row.userImage,
        created_at: row.tour_created_at,
        comment_count: row.comment_count,
        total_likes: row.total_likes,
        shared_post_id: row.shared_post_id,
        original_post: row.shared_post_id ? {
          id: row.shared_post_id,
          name: row.original_name,
          description: row.original_description,
          image: row.original_image,
          username: row.original_username,
          user_image: row.original_user_image,
          created_at: row.original_created_at
        } : null
      });

      acc[subCategoryId].tour_result.totalTours += 1;

      return acc;
    }, {});

    let data = Object.values(groupedBySubCategory);

    // Sort subcategories by the newest tour's created_at (DESC)
    data.sort((a, b) => {
      const aNewest = new Date(a.tour_result.Tours[0]?.created_at || 0);
      const bNewest = new Date(b.tour_result.Tours[0]?.created_at || 0);
      return bNewest - aNewest;
    });

    return res.status(200).json({
      statusCode: 200,
      message: "Subcategories with news retrieved successfully",
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getMostViewedToursByCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10); // Number of results per page
    const offset = (page - 1) * perPage;

    const countQuery = `
      SELECT COUNT(*) FROM pic_tours
      JOIN users u ON pic_tours.user_id = u.id
      WHERE pic_category = $1 AND u.is_deleted = FALSE;
    `;
    const countResult = await pool.query(countQuery, [id]);
    const totalTours = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalTours / perPage);

    const query = `
      SELECT
        v.id AS pic_tour_id,
        v.name,
        v.description,
        v.pic_category,
        pc.name AS category_name,
        v.sub_category,
        psc.name AS sub_category_name,
        v.image,
        v.created_at AS tour_created_at,
        v.user_id,
        u.username AS username,
        u.image AS userImage,
        v.shared_post_id,
        orig.name AS original_name,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at,
        COUNT(vv.pic_tours_id) AS view_count
      FROM pic_tours v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN viewed_pic vv ON v.id = vv.pic_tours_id
      LEFT JOIN pic_category pc ON v.pic_category = pc.id
      LEFT JOIN pic_sub_category psc ON v.sub_category = psc.id
      LEFT JOIN pic_tours orig ON v.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      WHERE v.pic_category = $1 AND u.is_deleted = FALSE
      GROUP BY v.id, u.username, u.image, pc.name, psc.name, orig.id, orig_u.id
      ORDER BY view_count DESC
      LIMIT $2 OFFSET $3;
    `;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    return res.status(200).json({
      statusCode: 200,
      totalPages,
      totalTours,
      Tours: rows.map((row) => {
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
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllTrendingToursByCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10); // Number of results per page
    const offset = (page - 1) * perPage;

    const countQuery = `
      SELECT COUNT(*) FROM pic_tours
      JOIN users u ON pic_tours.user_id = u.id
      WHERE pic_category = $1 AND u.is_deleted = FALSE;
    `;
    const countResult = await pool.query(countQuery, [id]);
    const totalTours = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalTours / perPage);

    const query = `
      SELECT
        v.id AS pic_tour_id,
        v.name,
        v.description,
        v.pic_category,
        pc.name AS category_name,
        v.sub_category,
        psc.name AS sub_category_name,
        v.image,
        v.created_at AS tour_created_at,
        v.user_id,
        u.username AS username,
        u.image AS userImage,
        v.shared_post_id,
        orig.name AS original_name,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at,
        (SELECT COUNT(*) FROM like_pic lv WHERE lv.pic_tours_id = v.id) AS like_count,
        (SELECT COUNT(*) FROM pic_comment c WHERE c.pic_tours_id = v.id) AS comment_count,
        (SELECT COUNT(*) FROM viewed_pic vv WHERE vv.pic_tours_id = v.id) AS view_count
      FROM pic_tours v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN pic_category pc ON v.pic_category = pc.id
      LEFT JOIN pic_sub_category psc ON v.sub_category = psc.id
      LEFT JOIN pic_tours orig ON v.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      WHERE v.pic_category = $1 AND u.is_deleted = FALSE
      GROUP BY v.id, u.username, u.image, pc.name, psc.name, orig.id, orig_u.id
      ORDER BY view_count DESC, v.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    return res.status(200).json({
      statusCode: 200,
      totalPages,
      totalTours,
      Tours: rows.map((row) => {
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
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getComentedTours = async (req, res) => {
  try {
    const { id } = req.params;

    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10); // Number of results per page
    const offset = (page - 1) * perPage;

    const countQuery = `
      SELECT COUNT(*) FROM pic_tours 
      JOIN users u ON pic_tours.user_id = u.id
      WHERE pic_category = $1 AND u.is_deleted = FALSE;
    `;
    const countResult = await pool.query(countQuery, [id]);
    const totalTours = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalTours / perPage);

    const query = `
      SELECT
        v.id AS pic_tour_id,
        v.name,
        v.description,
        v.pic_category,
        pc.name AS category_name,
        v.sub_category,
        psc.name AS sub_category_name,
        v.image,
        v.created_at AS tour_created_at,
        v.user_id,
        u.username AS username,
        u.image AS userImage,
        v.shared_post_id,
        orig.name AS original_name,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at,
        COUNT(c.id) AS comment_count
      FROM pic_tours v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN pic_comment c ON v.id = c.pic_tours_id
      LEFT JOIN pic_category pc ON v.pic_category = pc.id
      LEFT JOIN pic_sub_category psc ON v.sub_category = psc.id
      LEFT JOIN pic_tours orig ON v.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      WHERE v.pic_category = $1 AND u.is_deleted = FALSE
      GROUP BY v.id, u.username, u.image, pc.name, psc.name, orig.id, orig_u.id
      ORDER BY comment_count DESC
      LIMIT $2 OFFSET $3;
    `;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    return res.status(200).json({
      statusCode: 200,
      totalPages,
      totalTours,
      Tours: rows.map((row) => {
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
    res.status(500).json({ message: "Internal server error" });
  }
};

export const viewTour = async (req, res) => {
  try {
    const { pic_tours_id, user_id } = req.body;
    // Check if the user has already viewed the video
    const checkQuery =
      "SELECT * FROM viewed_pic WHERE pic_tours_id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [pic_tours_id, user_id]);

    if (checkResult.rowCount > 0) {
      // The user has already viewed the video, return an error
      return res
        .status(200)
        .json({ statusCode: 200, message: "User has already view the tours" });
    }
    const createQuery =
      "INSERT INTO viewed_pic (pic_tours_id,user_id) VALUES($1,$2) RETURNING *";
    const result = await pool.query(createQuery, [pic_tours_id, user_id]);
    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "Tours view successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "viewed_pic_pic_tours_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Pic tour does not exist" });
    } else if (error.constraint === "viewed_pic_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: " user does not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const searchTour = async (req, res) => {
  try {
    const { name } = req.query;

    // Split the search query into individual words
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, Suppliers: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(name ILIKE '%${word}%' OR description ILIKE '%${word}%')`;
    });

    const query = `SELECT
    v.id AS pic_tour_id,
    v.name,
    v.description,
    v.pic_category,
    v.image,
    v.created_at AS tour_created_at,
    v.user_id,
    v.shared_post_id,
    u.username AS username,
    u.image AS userImage,
    orig.name AS original_name,
    orig.description AS original_description,
    orig.image AS original_image,
    orig_u.username AS original_username,
    orig_u.image AS original_user_image,
    orig.created_at AS original_created_at
        FROM pic_tours v
        JOIN users u ON v.user_id = u.id
        LEFT JOIN pic_tours orig ON v.shared_post_id = orig.id
        LEFT JOIN users orig_u ON orig.user_id = orig_u.id
        WHERE ${conditions.join(" OR ")} AND u.is_deleted=FALSE
        GROUP BY v.id, u.username, u.image, orig.id, orig_u.id
        ORDER BY v.created_at DESC
        `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      statusCode: 200,
      totalTours: rows.length,
      Tours: rows.map((row) => {
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
    res.status(500).json({ message: "Internal server error" });
  }
};
