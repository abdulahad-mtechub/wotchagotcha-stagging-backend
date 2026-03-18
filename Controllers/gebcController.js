import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";
export const createGEBC = async (req, res) => {
  try {
    const { name, description, category, category_id, main_category_id, sub_category, sub_category_id, user_id, image, shared_post_id } = req.body;
    const categoryVal = category_id || category || main_category_id || null;
    const subCategoryVal = sub_category_id || sub_category || null;

    // Check if the user exists
    const userCheckQuery =
      "SELECT * FROM users WHERE id=$1 AND is_deleted=FALSE";
    const userCheckResult = await pool.query(userCheckQuery, [user_id]);

    if (userCheckResult.rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "user not exist",
      });
    }


    const createQuery =
      "INSERT INTO GEBC (name, description, category, sub_category, image, user_id, shared_post_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *";
    const result = await pool.query(createQuery, [
      name || "",
      description || "",
      categoryVal,
      subCategoryVal,
      image || "",
      user_id,
      shared_post_id || null,
    ]);

    if (result.rowCount === 1) {
      const query = `SELECT
        v.id AS gebc_id,
        v.description,
        v.category,
        v.sub_category,
        v.image,
        v.created_at AS tour_created_at,
        v.user_id,
        v.shared_post_id,
        u.username AS username,
        u.image AS userImage,
        u.is_premium AS premium,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
      FROM GEBC v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN GEBC orig ON v.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      WHERE v.id = $1
      GROUP BY v.id, u.username, u.image, u.is_premium, orig.id, orig_u.id;`;
      const data = await pool.query(query, [result.rows[0].id]);
      const gebcData = data.rows[0];
      if (gebcData.shared_post_id) {
        gebcData.original_post = {
          id: gebcData.shared_post_id,
          name: gebcData.original_name,
          description: gebcData.original_description,
          image: gebcData.original_image,
          username: gebcData.original_username,
          user_image: gebcData.original_user_image,
          created_at: gebcData.original_created_at,
        };
      } else {
        gebcData.original_post = null;
      }
      return res.status(201).json({
        statusCode: 201,
        message: "GEBC posted successfully",
        data: gebcData,
      });
    }

    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "gebc_category_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "Disc category does not exist" });
    } else if (error.constraint === "gebc_sub_category_fkey") {
      res.status(400).json({
        statusCode: 400,
        message:
          "Sub-category does not exist or does not belong to the category",
      });
    } else if (error.constraint === "gebc_user_id_fkey") {
      res.status(400).json({ statusCode: 400, message: "user not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deleteGEBC = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("GEBC", condition);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "GEBC not found " });
    }
    const oldImageSplit = oldImage[0].image.replace("/gebcImages/", "");
    const delQuery = "DELETE FROM GEBC WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "GEBC not deleted" });
    }
    handle_delete_photos_from_folder([oldImageSplit], "gebcImages");
    res.status(200).json({
      statusCode: 200,
      message: "GEBC deleted successfully",
      deletedGEBC: oldImage[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const updateGEBC = async (req, res) => {
  try {
    const { id, name, description, category, sub_category, image } = req.body;
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("gebc", condition);
    console.log(oldImage);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "GEBC not found" });
    }

    // Check if the category exists
    const categoryCheckQuery = "SELECT * FROM public.GEBC_category WHERE id=$1";
    const categoryCheckResult = await pool.query(categoryCheckQuery, [
      category,
    ]);

    if (categoryCheckResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Category not exist" });
    }

    // Check if the sub-category exists
    const subCategoryCheckQuery =
      "SELECT * FROM public.GEBC_sub_category WHERE id=$1 AND category_id=$2";
    const subCategoryCheckResult = await pool.query(subCategoryCheckQuery, [
      sub_category,
      category,
    ]);

    if (subCategoryCheckResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Category not exist" });
    }

    let updateData = {
      image: oldImage[0].image,
    };
    if (image) {
      updateData.image = image;
      const imageSplit = oldImage[0].image.replace("/fileUpload/", "");
      handle_delete_photos_from_folder([imageSplit], "fileUpload");
    }

    const updateType = `UPDATE GEBC SET name=$1, description=$2, category=$3, sub_category=$4, image=$5, "updated_at"=NOW() WHERE id=$6 RETURNING *`;
    const result = await pool.query(updateType, [
      name,
      description,
      category,
      sub_category,
      updateData.image,
      id,
    ]);
    if (result.rowCount === 1) {
      const query = `SELECT
        v.id AS gebc_id,
        v.description,
        v.category,
        v.sub_category,
        v.image,
        v.created_at AS tour_created_at,
        v.user_id,
        v.shared_post_id,
        u.username AS username,
        u.image AS userImage,
        u.is_premium AS premium,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
      FROM GEBC v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN GEBC orig ON v.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      WHERE v.id = $1
      GROUP BY v.id, u.username, u.image, u.is_premium, orig.id, orig_u.id;`;
      const data = await pool.query(query, [id]);
      const gebcData = data.rows[0];
      if (gebcData.shared_post_id) {
        gebcData.original_post = {
          id: gebcData.shared_post_id,
          name: gebcData.original_name,
          description: gebcData.original_description,
          image: gebcData.original_image,
          username: gebcData.original_username,
          user_image: gebcData.original_user_image,
          created_at: gebcData.original_created_at,
        };
      } else {
        gebcData.original_post = null;
      }
      return res.status(200).json({
        statusCode: 200,
        message: "GEBC updated successfully",
        updateGEBC: gebcData,
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

export const deleteAllGEBCs = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM GEBC RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No GEBC found to delete",
      });
    }
    const imageFilenames = rows.map((news) =>
      news.image.replace("/gebcImages/", "")
    );
    handle_delete_photos_from_folder(imageFilenames, "gebcImages");
    res.status(200).json({
      statusCode: 200,
      message: "All GEBC deleted successfully",
      deletedGEBC: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const sendComment = async (req, res) => {
  try {
    const { GEBC_id, user_id, comment } = req.body;
    const checkQuery = "SELECT * FROM GEBC WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [GEBC_id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "GEBC not exist" });
    }
    const checkQuery1 = "SELECT * FROM users WHERE id = $1";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }

    const createQuery =
      "INSERT INTO GEBC_comment (GEBC_id,user_id,comment) VALUES($1,$2,$3) RETURNING *";
    const result = await pool.query(createQuery, [GEBC_id, user_id, comment]);
    if (result.rowCount === 1) {
      let commentQuery = `SELECT 
      v.GEBC_id AS GEBC_id,
      v.id AS commentId,
            v.comment AS comment,
            v.created_at AS commentCreatedAt,
            u.id AS userId,
            u.username AS username,
            u.image AS userImage,
            u.is_premium AS premium
            FROM GEBC_comment v
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
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllCommentsByGEBC = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = "SELECT * FROM GEBC WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "GEBC does not exist" });
    }

    let commentQuery = `
      SELECT
        v.id AS commentId,
        v.comment AS comment,
        v.created_at AS commentCreatedAt,
        u.id AS userId,
        u.username AS username,
        u.image AS userImage,
        u.is_premium AS premium,
        g.id AS gebc_id,
        g.name,
        g.description,
        g.category AS category_id,
        g.sub_category AS sub_category_id,
        g.image AS gebc_image,
        g.created_at AS gebc_created_at,
        g.user_id AS gebc_user_id,
        c.name AS category_name,
        sc.name AS sub_category_name
      FROM GEBC_comment v
      JOIN GEBC g ON v.GEBC_id = g.id
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN GEBC_category c ON g.category = c.id
      LEFT JOIN GEBC_sub_category sc ON g.sub_category = sc.id
      WHERE v.GEBC_id = $1 AND u.is_deleted=FALSE
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

export const likeUnlikeGEBC = async (req, res) => {
  try {
    const { GEBC_id, user_id } = req.body;
    const checkQafiQuery = "SELECT * FROM GEBC WHERE id = $1";
    const checkQafiResult = await pool.query(checkQafiQuery, [GEBC_id]);

    if (checkQafiResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "GEBC not exist" });
    }

    // Check if the user has already liked the video
    const checkQuery =
      "SELECT * FROM like_GEBC WHERE GEBC_id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [GEBC_id, user_id]);

    if (checkResult.rowCount > 0) {
      const createQuery =
        "DELETE FROM like_GEBC WHERE user_id=$1 AND GEBC_id=$2 RETURNING *";
      const result = await pool.query(createQuery, [user_id, GEBC_id]);
      if (result.rowCount === 1) {
        return res.status(200).json({
          statusCode: 201,
          message: "GEBC Unlike successfully",
          data: result.rows[0],
        });
      }
    }
    const createQuery =
      "INSERT INTO like_GEBC (GEBC_id,user_id) VALUES($1,$2) RETURNING *";
    const result = await pool.query(createQuery, [GEBC_id, user_id]);
    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "GEBC like successfully",
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
export const getAllLikesByGBEC = async (req, res) => {
  try {
    const { id } = req.params;
    let likeQuery = `SELECT v.*
      FROM like_GEBC v
      WHERE GEBC_id=$1
      ORDER BY v.created_at DESC;
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

export const getSpecificGEBC = async (req, res) => {
  try {
    const { id } = req.params;
      const query = `SELECT
        v.id AS gebc_id,
        v.name,
        v.description,
        v.category,
        v.image,
        v.created_at AS tour_created_at,
        v.user_id,
        v.shared_post_id,
        u.username AS username,
        u.image AS userImage,
        u.is_premium AS premium,
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
            FROM GEBC_comment c
            JOIN users cu ON c.user_id = cu.id
            WHERE c.GEBC_id = v.id
        ) AS comments,
        (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', lv.id,
                    'user_id', lv.user_id,
                    'GEBC_id', v.id,
                    'created_at', lu.created_at,
                    'updated_at', lu.updated_at
                )
            ), '[]'::json)
            FROM like_GEBC lv
            JOIN users lu ON lv.user_id = lu.id
            WHERE lv.GEBC_id = v.id
        ) AS likes,
        orig.name AS original_name,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at
    FROM GEBC v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN GEBC orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE v.id = $1 AND u.is_deleted=FALSE
    GROUP BY v.id, u.username, u.image, u.is_premium, orig.id, orig_u.id;
 `;

    const { rows } = await pool.query(query, [id]);
    if (rows.length > 0) {
      const gebcData = rows[0];
      if (gebcData.shared_post_id) {
        gebcData.original_post = {
          id: gebcData.shared_post_id,
          name: gebcData.original_name,
          description: gebcData.original_description,
          image: gebcData.original_image,
          username: gebcData.original_username,
          user_image: gebcData.original_user_image,
          created_at: gebcData.original_created_at,
        };
      } else {
        gebcData.original_post = null;
      }
      return res.status(200).json({ statusCode: 200, GEBC: gebcData });
    } else {
      res.status(404).json({ statusCode: 404, message: "No GEBC found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllGEBCs = async (req, res) => {
  try {
    let page = parseInt(req.query.page); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit);
    const offset = (page - 1) * perPage;

    let getQuery = `SELECT
      v.id AS gebc_id,
      v.name,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.created_at AS tour_created_at,
      v.user_id,
      v.shared_post_id,
      u.username AS username,
      u.image AS userImage,
      u.is_premium AS premium,
      c.name AS category_name,
      sc.name AS sub_category_name,
      c.french_name AS category_french_name,
      sc.french_name AS sub_category_french_name,
      orig.name AS original_name,
      orig.description AS original_description,
      orig.image AS original_image,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at
    FROM GEBC v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN GEBC_category c ON v.category = c.id
    LEFT JOIN GEBC_sub_category sc ON v.sub_category = sc.id
    LEFT JOIN GEBC orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE u.is_deleted=FALSE
    ORDER BY v.created_at DESC`;

    if (req.query.page !== undefined && req.query.limit !== undefined) {
      getQuery += ` LIMIT $1 OFFSET $2;`;
    }

    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(getQuery, queryParameters);

    const responseRows = rows.map((row) => {
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
    });

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalGEBC: responseRows.length,
        AllGEBCs: responseRows,
      });
    } else {
      // Calculate the total number of GEBCs (without pagination)
      const countQuery = `SELECT COUNT(*) FROM GEBC JOIN users u ON GEBC.user_id = u.id WHERE u.is_deleted = FALSE;`;

      const totalGEBCResult = await pool.query(countQuery);
      const totalGEBC = totalGEBCResult.rows[0].count;
      const totalPages = Math.ceil(totalGEBC / perPage);

      const responseRows = rows.map((row) => {
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
        totalGEBC,
        totalPages,
        AllGEBCs: responseRows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const getAllGEBCByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery =
      "SELECT * FROM users WHERE id = $1 AND users.is_deleted=FALSE";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User does not exist" });
    }

    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10); // Number of results per page
    const offset = (page - 1) * perPage;

    const countQuery = `SELECT COUNT(*) FROM GEBC WHERE user_id=$1;`;
    const countResult = await pool.query(countQuery, [id]);
    const totalGEBCs = parseInt(countResult.rows[0].count);

    const totalPages = Math.ceil(totalGEBCs / perPage);

    const query = `SELECT
      v.id AS gebc_id,
      v.name,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.created_at AS tour_created_at,
      v.user_id,
      v.shared_post_id,
      u.username AS username,
      u.image AS userImage,
      u.is_premium AS premium,
      c.name AS category_name,
      sc.name AS sub_category_name,
      c.french_name AS category_french_name,
      sc.french_name AS sub_category_french_name,
      orig.name AS original_name,
      orig.description AS original_description,
      orig.image AS original_image,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at
    FROM GEBC v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN GEBC_category c ON v.category = c.id
    LEFT JOIN GEBC_sub_category sc ON v.sub_category = sc.id
    LEFT JOIN GEBC orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE v.user_id = $1 AND u.is_deleted=FALSE
    ORDER BY v.created_at DESC
    LIMIT $2 OFFSET $3;`;

    const responseRows = rows.map((row) => {
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
    });

    return res
      .status(200)
      .json({ statusCode: 200, totalPages, totalGEBCs, GEBCs: responseRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllGEBCsByCategory = async (req, res) => {
  try {
    const { id } = req.params;


    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5); // Number of results per page
    const offset = (page - 1) * perPage;

    // Count total GEBCs in the given category
    const countQuery = `
      SELECT COUNT(*) FROM GEBC v
      LEFT JOIN GEBC orig ON v.shared_post_id = orig.id
      WHERE (v.category = $1 OR (v.shared_post_id IS NOT NULL AND orig.category = $1))
        AND v.status != 'blocked';
    `;
    const countResult = await pool.query(countQuery, [id]);
    const totalGEBCs = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalGEBCs / perPage);

    // Get GEBCs in the given category with pagination
    const query = `SELECT
      v.id AS id,
      v.name,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      sc."index" AS sub_category_index,
      v.image,
      v.created_at AS created_at,
      v.user_id,
      v.shared_post_id,
      u.username AS username,
      u.image AS user_image,
      u.is_premium AS premium,
      c.name AS category_name,
      sc.name AS sub_category_name,
      c.french_name AS category_french_name,
      sc.french_name AS sub_category_french_name,
      (SELECT COUNT(*) FROM GEBC_comment WHERE GEBC_comment.GEBC_id = v.id) AS comment_count,
      (SELECT COUNT(*) FROM like_GEBC WHERE like_GEBC.GEBC_id = v.id) AS total_likes,
      -- Original post details
      orig.name AS original_name,
      orig.description AS original_description,
      orig.image AS original_image,
      orig_u.username AS original_username,
      orig_u.image AS original_user_image,
      orig.created_at AS original_created_at
    FROM GEBC v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN GEBC_category c ON v.category = c.id
    LEFT JOIN GEBC_sub_category sc ON v.sub_category = sc.id
    LEFT JOIN GEBC orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE (v.category = $1 OR (v.shared_post_id IS NOT NULL AND orig.category = $1)) AND u.is_deleted=FALSE AND v.status != 'blocked'
    ORDER BY v.created_at DESC
    LIMIT $2 OFFSET $3;`;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    // Group GEBCs by sub_category
    const groupedGEBCs = rows.reduce((acc, gebc) => {
      const subCategoryId = gebc.sub_category_id;
      if (!acc[subCategoryId]) {
        acc[subCategoryId] = {
          sub_category_name: gebc.sub_category_name,
          sub_category_french_name: gebc.sub_category_french_name,
          sub_category_id: subCategoryId,
          sub_category_index: gebc.sub_category_index,
          GEBC_result: {
            totalGEBCs: 0,
            totalPages,
            currentPage: page,
            GEBCs: [],
          },
        };
      }

      acc[subCategoryId].GEBC_result.GEBCs.push({
        gebc_id: gebc.id, // Use 'id' instead of 'GEBC_id'
        name: gebc.name,
        description: gebc.description,
        image: gebc.image,
        user_id: gebc.user_id,
        username: gebc.username,
        user_image: gebc.user_image,
        created_at: gebc.created_at,
        comment_count: gebc.comment_count,
        total_likes: gebc.total_likes,
        shared_post_id: gebc.shared_post_id,
        original_post: gebc.shared_post_id ? {
          id: gebc.shared_post_id,
          name: gebc.original_name,
          description: gebc.original_description,
          image: gebc.original_image,
          username: gebc.original_username,
          user_image: gebc.original_user_image,
          created_at: gebc.original_created_at
        } : null
      });

      acc[subCategoryId].GEBC_result.totalGEBCs++;

      return acc;
    }, {});

    // Convert grouped GEBCs into an array format
    const responseData = Object.values(groupedGEBCs);

    return res.status(200).json({
      statusCode: 200,
      message: "Subcategories with GEBCs retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTopGEBWithMostComments = async (req, res) => {
  try {
    const query = `
      SELECT
        g.id AS gebc_id,
        g.description,
        g.image,
        gc.name AS category_name,
        gsc.name AS sub_category_name,
        g.user_id,
        g.shared_post_id,
        u.username,
        u.image AS user_image,
        g.created_at,
        orig.description AS original_description,
        orig.image AS original_image,
        orig_u.username AS original_username,
        orig_u.image AS original_user_image,
        orig.created_at AS original_created_at,
        COUNT(DISTINCT c.id) AS comment_count,
        COUNT(DISTINCT l.id) AS total_likes
      FROM GEBC g
      JOIN users u ON g.user_id = u.id
      LEFT JOIN GEBC_category gc ON g.category = gc.id
      LEFT JOIN GEBC_sub_category gsc ON g.sub_category = gsc.id
      LEFT JOIN GEBC_comment c ON g.id = c.GEBC_id
      LEFT JOIN like_GEBC l ON g.id = l.GEBC_id
      LEFT JOIN GEBC orig ON g.shared_post_id = orig.id
      LEFT JOIN users orig_u ON orig.user_id = orig_u.id
      GROUP BY g.id, gc.name, gsc.name, u.username, u.image, orig.id, orig_u.id
      ORDER BY comment_count DESC
      LIMIT 1;
    `;

    const result = await pool.query(query);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "No GEBC found" });
    }

    const videoData = result.rows[0];
    if (videoData.shared_post_id) {
      videoData.original_post = {
        id: videoData.shared_post_id,
        name: videoData.original_name,
        description: videoData.original_description,
        image: videoData.original_image,
        username: videoData.original_username,
        user_image: videoData.original_user_image,
        created_at: videoData.original_created_at,
      };
    } else {
      videoData.original_post = null;
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Top GEBC with the most comments retrieved successfully",
      data: videoData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const searchGEBCs = async (req, res) => {
  try {
    const { name } = req.query;

    // Split the search query into individual words
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, GEBCs: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(v.description ILIKE '%${word}%')`;
    });

    const query = `SELECT
      v.id AS gebc_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.created_at AS tour_created_at,
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
    FROM GEBC v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN GEBC_category c ON v.category = c.id
    LEFT JOIN GEBC_sub_category sc ON v.sub_category = sc.id
    LEFT JOIN GEBC orig ON v.shared_post_id = orig.id
    LEFT JOIN users orig_u ON orig.user_id = orig_u.id
    WHERE (${conditions.join(" OR ")}) AND u.is_deleted=FALSE
    ORDER BY v.created_at DESC`;

    const { rows } = await pool.query(query);

    const responseRows = rows.map((row) => {
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
    });

    return res
      .status(200)
      .json({ statusCode: 200, totalGEBCs: responseRows.length, GEBCs: responseRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
