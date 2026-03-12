import pool from "../db.config/index.js";
import { getSingleRow } from "../queries/common.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";

export const createTopVideo = async (req, res) => {
  try {
    const { name, description, video, video_category } = req.body;

    const createQuery =
      "INSERT INTO top_video (name, description, video_category, video) VALUES ($1, $2, $3, $4) RETURNING *";
    const result = await pool.query(createQuery, [
      name,
      description,
      video_category,
      video,
    ]);
    if (result.rowCount === 1) {
      const query = `SELECT
          v.id AS top_video_id,
          v.name AS name,
          v.description,
          v.video_category,
          vc.name AS category_name,
          v.video,
          v.created_at AS created_at 
      FROM top_video v
      LEFT JOIN video_category vc ON v.video_category = vc.id
      WHERE v.id = $1
      GROUP BY v.id, vc.name;
       `;
      const data = await pool.query(query, [result.rows[0].id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Top video uploaded successfully",
        data: data.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "top_video_video_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "vidoe category not exist" });
    }
    return res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error" });
  }
};
export const updateTopVideo = async (req, res) => {
  try {
    const { id, name, description, video, video_category } = req.body;

    // Check if the video with the given ID exists
    const checkQuery = "SELECT * FROM top_video WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Top video not found" });
    }

    // Check if the video category exists
    const checkCategoryQuery = "SELECT * FROM video_category WHERE id = $1";
    const checkCategoryResult = await pool.query(checkCategoryQuery, [
      video_category,
    ]);

    if (checkCategoryResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Video category not found" });
    }

    // Update the top video
    const updateQuery = `
        UPDATE top_video
        SET name = $1, description = $2, video_category = $3, video = COALESCE($4, video)
        WHERE id = $5
        RETURNING *;
      `;

    const updateResult = await pool.query(updateQuery, [
      name,
      description,
      video_category,
      video,
      id,
    ]);
    const query = `SELECT
      v.id AS top_video_id,
      v.name AS name,
      v.description,
      v.video_category,
      vc.name AS video_category_name,
      v.video,
      v.created_at AS created_at 
  FROM top_video v
  LEFT JOIN video_category vc ON v.video_category = vc.id
  WHERE v.id = $1
  GROUP BY v.id, vc.name;
   `;
    const data = await pool.query(query, [id]);
    if (updateResult.rowCount === 1) {
      return res.status(200).json({
        statusCode: 200,
        message: "Top video updated successfully",
        data: data.rows[0],
      });
    }

    return res.status(400).json({ statusCode: 400, message: "Update failed" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "top_video_video_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "video category not exist" });
    }
    return res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllTopVideos = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `SELECT
      v.id AS top_video_id,
      v.name AS name,
      v.description,
      v.video_category,
      vc.name AS video_category_name,
      v.video,
      v.created_at AS created_at 
  FROM top_video v
  LEFT JOIN video_category vc ON v.video_category = vc.id
  WHERE v.video_category = $1
  GROUP BY v.id, vc.name
  ORDER BY v.created_at DESC`;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      query += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [id];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [id, perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalVideos: rows.length,
        AllVideos: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.top_video  WHERE video_category = $1`;
      const totalVideosResult = await pool.query(totalLetterQuery, [id]);
      const totalVideos = totalVideosResult.rows[0].total;
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
export const getAllVideos = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `SELECT
      v.id AS top_video_id,
      v.name AS name,
      v.description,
      v.video_category,
      vc.name AS video_category_name,
      v.video,
      v.created_at AS created_at 
  FROM top_video v
  LEFT JOIN video_category vc ON v.video_category = vc.id
  GROUP BY v.id, vc.name
  ORDER BY v.created_at DESC`;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      query += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalVideos: rows.length,
        AllVideos: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.top_video `;
      const totalVideosResult = await pool.query(totalLetterQuery);
      const totalVideos = totalVideosResult.rows[0].total;
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
export const getTopVideoApp = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `WITH RankedVideos AS (
        SELECT
          v.id AS top_video_id,
          v.name AS name,
          v.description,
          v.video_category,
          vc.name AS video_category_name,
          v.video,
          xv.user_id AS user_id,
          u.username AS username,
          u.image AS userImage,
          v.created_at AS created_at,
          ROW_NUMBER() OVER (PARTITION BY v.video_category ORDER BY v.created_at DESC) AS row_num
        FROM top_video v
        LEFT JOIN video_category vc ON v.video_category = vc.id
        LEFT JOIN xpi_videos xv ON xv.video = v.video
        LEFT JOIN users u ON xv.user_id = u.id
        WHERE v.video_category = $1
      )
      SELECT
        top_video_id,
        name,
        description,
        video_category,
        video_category_name,
        video,
        user_id,
        username,
        userImage,
        created_at
      FROM RankedVideos
      WHERE row_num = 1
      
      `;

    const { rows } = await pool.query(query, [id]);

    return res.status(200).json({
      statusCode: 200,
      // totalPages,
      // totalVideos,
      topVideo: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllSpecificVideos = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `SELECT
      v.id AS top_video_id,
      v.name AS name,
      v.description,
      v.video_category,
      vc.name AS video_category_name,
      v.video,
      v.created_at AS created_at 
  FROM top_video v
  LEFT JOIN video_category vc ON v.video_category = vc.id
  WHERE v.id = $1
  GROUP BY v.id, vc.name`;

    const { rows } = await pool.query(query, [id]);

    return res.status(200).json({
      statusCode: 200,
      // totalPages,
      // totalVideos,
      topVideo: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteTopVideo = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldVideo = await getSingleRow("top_video", condition);
    if (oldVideo.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Top video not found " });
    }
    const oldVideoSplit = oldVideo[0].video.replace("/topVideos/", "");
    const delQuery = "DELETE FROM top_video WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Xpi video not deleted" });
    }
    handle_delete_photos_from_folder([oldVideoSplit], "topVideos");
    res.status(200).json({
      statusCode: 200,
      message: "Top video deleted successfully",
      deletedVideo: oldVideo[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const deleteAllTopVideos = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM top_video RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No top_video found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All top_video deleted successfully",
      deletedVideos: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
//qafi controllers..........................................................
export const createQafiTop = async (req, res) => {
  try {
    const { description, disc_category, image } = req.body;

    const createQuery =
      "INSERT INTO top_QAFI ( description, disc_category, image) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(createQuery, [
      description,
      disc_category,
      image,
    ]);
    if (result.rowCount === 1) {
      const query = `SELECT
          v.id AS top_QAFI_id,
          v.description,
          v.disc_category,
          vc.name AS category_name,
          v.image,
          v.created_at AS created_at 
      FROM top_QAFI v
      LEFT JOIN disc_category vc ON v.disc_category = vc.id
      WHERE v.id = $1
      GROUP BY v.id, vc.name;
       `;
      const data = await pool.query(query, [result.rows[0].id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Top QAFI uploaded successfully",
        data: data.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "top_qafi_disc_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "disc category not exist" });
    }
    return res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error" });
  }
};

export const updateTopQAFI = async (req, res) => {
  try {
    const { id, description, disc_category, image } = req.body;

    // Check if the video with the given ID exists
    const checkQuery = "SELECT * FROM top_QAFI WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Top qafi not found" });
    }

    // Update the top video
    const updateQuery = `
        UPDATE top_QAFI
        SET  description = $1, disc_category = $2, image = COALESCE($3, image)
        WHERE id = $4
        RETURNING *;
      `;

    const updateResult = await pool.query(updateQuery, [
      description,
      disc_category,
      image,
      id,
    ]);
    const query = `SELECT
      v.id AS top_QAFI_id,
      v.description,
      v.disc_category,
      vc.name AS disc_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_QAFI v
  LEFT JOIN disc_category vc ON v.disc_category = vc.id
  WHERE v.id = $1
  GROUP BY v.id, vc.name;
   `;
    const data = await pool.query(query, [id]);
    if (updateResult.rowCount === 1) {
      return res.status(200).json({
        statusCode: 200,
        message: "Top QAFI updated successfully",
        data: data.rows[0],
      });
    }

    return res.status(400).json({ statusCode: 400, message: "Update failed" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "top_qafi_disc_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "disc category not exist" });
    }
    return res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllTopQAFI = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `SELECT
      v.id AS top_QAFI_id,
      v.description,
      v.disc_category,
      vc.name AS disc_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_QAFI v
  LEFT JOIN disc_category vc ON v.disc_category = vc.id
  WHERE v.disc_category = $1
  GROUP BY v.id, vc.name
  ORDER BY v.created_at DESC
   `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      query += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [id];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [id, perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalQAFI: rows.length,
        AllQAFI: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.top_QAFI WHERE disc_category = $1`;
      const totalQAFIResult = await pool.query(totalLetterQuery, [id]);
      const totalQAFI = totalQAFIResult.rows[0].total;
      const totalPages = Math.ceil(totalQAFI / perPage);

      res.status(200).json({
        statusCode: 200,
        totalQAFI,
        totalPages,
        AllQAFI: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllQAFI = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `SELECT
      v.id AS top_QAFI_id,
      v.description,
      v.disc_category,
      vc.name AS disc_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_QAFI v
  LEFT JOIN disc_category vc ON v.disc_category = vc.id
  GROUP BY v.id, vc.name
  ORDER BY v.created_at DESC
   `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      query += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalQAFI: rows.length,
        AllQAFI: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.top_QAFI`;
      const totalQAFIResult = await pool.query(totalLetterQuery);
      const totalQAFI = totalQAFIResult.rows[0].total;
      const totalPages = Math.ceil(totalQAFI / perPage);

      res.status(200).json({
        statusCode: 200,
        totalQAFI,
        totalPages,
        AllQAFI: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getSpecificTopQAFI = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `SELECT
      v.id AS top_QAFI_id,
      v.description,
      v.disc_category,
      vc.name AS disc_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_QAFI v
  LEFT JOIN disc_category vc ON v.disc_category = vc.id
  WHERE v.id = $1
  GROUP BY v.id, vc.name;
   `;

    const { rows } = await pool.query(query, [id]);

    return res.status(200).json({
      statusCode: 200,
      topQAFI: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteTopQAFI = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldVideo = await getSingleRow("top_QAFI", condition);
    if (oldVideo.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Top QAFI not found " });
    }
    const oldVideoSplit = oldVideo[0].image.replace("/topQAFI/", "");
    const delQuery = "DELETE FROM top_QAFI WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Xpi video not deleted" });
    }
    handle_delete_photos_from_folder([oldVideoSplit], "topQAFI");
    res.status(200).json({
      statusCode: 200,
      message: "Top QAFI deleted successfully",
      deletedQAFI: oldVideo[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getTopQAFIApp = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `WITH RankedVideos AS (
        SELECT
        v.id AS top_QAFI_id,
        v.description,
        v.disc_category,
        vc.name AS disc_category_name,
        v.image,
        v.created_at AS created_at,
          ROW_NUMBER() OVER (PARTITION BY v.disc_category ORDER BY v.created_at DESC) AS row_num
        FROM top_QAFI v
        LEFT JOIN disc_category vc ON v.disc_category = vc.id
        WHERE v.disc_category = $1
      )
      SELECT
        top_QAFI_id,
        description,
        disc_category,
        disc_category_name,
        image,
        created_at
      FROM RankedVideos
      WHERE row_num = 1;
      `;

    const { rows } = await pool.query(query, [id]);

    return res.status(200).json({
      statusCode: 200,
      // totalPages,
      // totalVideos,
      topQAFI: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteAllQAFI = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM top_QAFI RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No top_QAFI found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All top_QAFI deleted successfully",
      deletedQAFI: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

//GEBC controllers............................................

export const createGEBCTop = async (req, res) => {
  try {
    const { description, disc_category } = req.body;
    // const checkExistingQuery = "SELECT id FROM top_GEBC WHERE disc_category = $1";
    // const existingVideo = await pool.query(checkExistingQuery, [disc_category]);

    // if (existingVideo.rowCount > 0) {
    //   // If a video with the same category exists, remove it
    //   const videoIdToRemove = existingVideo.rows[0].id;
    //   const removeQuery = "DELETE FROM top_GEBC WHERE id = $1 RETURNING *";
    //   const del=await pool.query(removeQuery, [videoIdToRemove]);
    //   const imageSplit = del.rows[0].image.replace("/topGEBC/", "");
    //   handle_delete_photos_from_folder([imageSplit], "topGEBC");
    // }
    if (req.file) {
      let imagePath = `/topGEBC/${req.file.filename}`;
      const createQuery =
        "INSERT INTO top_GEBC ( description, disc_category, image) VALUES ($1, $2, $3) RETURNING *";
      const result = await pool.query(createQuery, [
        description,
        disc_category,
        imagePath,
      ]);
      if (result.rowCount === 1) {
        const query = `SELECT
          v.id AS top_GEBC_id,
          v.description,
          v.disc_category,
          vc.name AS category_name,
          v.image,
          v.created_at AS created_at 
      FROM top_GEBC v
      LEFT JOIN disc_category vc ON v.disc_category = vc.id
      WHERE v.id = $1
      GROUP BY v.id, vc.name;
       `;
        const data = await pool.query(query, [result.rows[0].id]);
        return res.status(201).json({
          statusCode: 201,
          message: "Top GEBC uploaded successfully",
          data: data.rows[0],
        });
      }
      res.status(400).json({ statusCode: 400, message: "Not uploaded" });
    } else {
      res.status(400).json({ statusCode: 400, message: "image not uploaded" });
    }
  } catch (error) {
    console.error(error);
    if (error.constraint === "top_gebc_disc_category_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "disc category not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const updateTopGEBC = async (req, res) => {
  try {
    const { id, name, description, disc_category } = req.body;

    // Check if the video with the given ID exists
    const checkQuery = "SELECT * FROM top_GEBC WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Top GEBC not found" });
    }

    let imagePath;

    if (req.file) {
      // If a new video file is provided, update the imagePath
      imagePath = `/topGEBC/${req.file.filename}`;
      const imageSplit = checkResult.rows[0].image.replace("/topGEBC/", "");
      handle_delete_photos_from_folder([imageSplit], "topGEBC");
    }

    // Update the top video
    const updateQuery = `
        UPDATE top_GEBC
        SET  description = $1, disc_category = $2, image = COALESCE($3, image)
        WHERE id = $4
        RETURNING *;
      `;

    const updateResult = await pool.query(updateQuery, [
      description,
      disc_category,
      imagePath,
      id,
    ]);
    const query = `SELECT
      v.id AS top_GEBC_id,
      v.description,
      v.disc_category,
      vc.name AS disc_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_GEBC v
  LEFT JOIN disc_category vc ON v.disc_category = vc.id
  WHERE v.id = $1
  GROUP BY v.id, vc.name;
   `;
    const data = await pool.query(query, [id]);
    if (updateResult.rowCount === 1) {
      return res.status(200).json({
        statusCode: 200,
        message: "Top GEBC updated successfully",
        data: data.rows[0],
      });
    }

    return res.status(400).json({ statusCode: 400, message: "Update failed" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "top_gebc_disc_category_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "disc category not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getAllTopGEBC = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `SELECT
      v.id AS top_GEBC_id,
      v.description,
      v.disc_category,
      vc.name AS disc_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_GEBC v
  LEFT JOIN disc_category vc ON v.disc_category = vc.id
  WHERE v.disc_category = $1
  GROUP BY v.id, vc.name
  ORDER BY v.created_at DESC
   `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      query += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [id];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [id, perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalGEBC: rows.length,
        AllGEBC: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.top_GEBC WHERE disc_category = $1`;
      const totalGEBCResult = await pool.query(totalLetterQuery, [id]);
      const totalGEBC = totalGEBCResult.rows[0].total;
      const totalPages = Math.ceil(totalGEBC / perPage);

      res.status(200).json({
        statusCode: 200,
        totalGEBC,
        totalPages,
        AllGEBC: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllGEBC = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `SELECT
      v.id AS top_GEBC_id,
      v.description,
      v.disc_category,
      vc.name AS disc_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_GEBC v
  LEFT JOIN disc_category vc ON v.disc_category = vc.id
  GROUP BY v.id, vc.name
  ORDER BY v.created_at DESC
   `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      query += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalGEBC: rows.length,
        AllGEBC: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.top_GEBC`;
      const totalGEBCResult = await pool.query(totalLetterQuery);
      const totalGEBC = totalGEBCResult.rows[0].total;
      const totalPages = Math.ceil(totalGEBC / perPage);

      res.status(200).json({
        statusCode: 200,
        totalGEBC,
        totalPages,
        AllGEBC: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getSpecificTopGEBC = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `SELECT
      v.id AS top_GEBC_id,
      v.description,
      v.disc_category,
      vc.name AS disc_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_GEBC v
  LEFT JOIN disc_category vc ON v.disc_category = vc.id
  WHERE v.id = $1
  GROUP BY v.id, vc.name;
   `;

    const { rows } = await pool.query(query, [id]);

    return res.status(200).json({
      statusCode: 200,
      topGEBC: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteTopGEBC = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldVideo = await getSingleRow("top_GEBC", condition);
    if (oldVideo.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Top GEBC not found " });
    }
    const oldVideoSplit = oldVideo[0].image.replace("/topGEBC/", "");
    const delQuery = "DELETE FROM top_GEBC WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Xpi video not deleted" });
    }
    handle_delete_photos_from_folder([oldVideoSplit], "topGEBC");
    res.status(200).json({
      statusCode: 200,
      message: "Top QAFI deleted successfully",
      deletedGEBC: oldVideo[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getTopGEBCApp = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `WITH RankedVideos AS (
        SELECT
        v.id AS top_GEBC_id,
        v.description,
        v.disc_category,
        vc.name AS disc_category_name,
        v.image,
        v.created_at AS created_at,
          ROW_NUMBER() OVER (PARTITION BY v.disc_category ORDER BY v.created_at DESC) AS row_num
        FROM top_GEBC v
        LEFT JOIN disc_category vc ON v.disc_category = vc.id
        WHERE v.disc_category = $1
      )
      SELECT
        top_GEBC_id,
        description,
        disc_category,
        disc_category_name,
        image,
        created_at
      FROM RankedVideos
      WHERE row_num = 1;
      `;

    const { rows } = await pool.query(query, [id]);

    return res.status(200).json({
      statusCode: 200,
      // totalPages,
      // totalVideos,
      topQAFI: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteAllGEBC = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM top_GEBC RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No top_GEBC found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All top_GEBC deleted successfully",
      deletedGEBC: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

//NEWS controllers............................................

export const createNewsTop = async (req, res) => {
  try {
    const { description, disc_category } = req.body;
    // const checkExistingQuery = "SELECT id FROM top_NEWS WHERE disc_category = $1";
    // const existingVideo = await pool.query(checkExistingQuery, [disc_category]);

    // if (existingVideo.rowCount > 0) {
    //   // If a video with the same category exists, remove it
    //   const videoIdToRemove = existingVideo.rows[0].id;
    //   const removeQuery = "DELETE FROM top_NEWS WHERE id = $1 RETURNING *";
    //   const del=await pool.query(removeQuery, [videoIdToRemove]);
    //   const imageSplit = del.rows[0].image.replace("/topNEWS/", "");
    //   handle_delete_photos_from_folder([imageSplit], "topNEWS");
    // }
    if (req.file) {
      let imagePath = `/topNEWS/${req.file.filename}`;
      const createQuery =
        "INSERT INTO top_NEWS ( description, disc_category, image) VALUES ($1, $2, $3) RETURNING *";
      const result = await pool.query(createQuery, [
        description,
        disc_category,
        imagePath,
      ]);
      if (result.rowCount === 1) {
        const query = `SELECT
          v.id AS top_NEWS_id,
          v.description,
          v.disc_category,
          vc.name AS category_name,
          v.image,
          v.created_at AS created_at 
      FROM top_NEWS v
      LEFT JOIN disc_category vc ON v.disc_category = vc.id
      WHERE v.id = $1
      GROUP BY v.id, vc.name;
       `;
        const data = await pool.query(query, [result.rows[0].id]);
        return res.status(201).json({
          statusCode: 201,
          message: "Top NEWS uploaded successfully",
          data: data.rows[0],
        });
      }
      res.status(400).json({ statusCode: 400, message: "Not uploaded" });
    } else {
      res.status(400).json({ statusCode: 400, message: "image not uploaded" });
    }
  } catch (error) {
    console.error(error);
    handle_delete_photos_from_folder([req.file?.filename], "topNEWS");
    if (error.constraint === "top_news_disc_category_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "disc category not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const updateTopNews = async (req, res) => {
  try {
    const { id, description, disc_category } = req.body;

    // Check if the video with the given ID exists
    const checkQuery = "SELECT * FROM top_NEWS WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Top NEWS not found" });
    }

    let imagePath;

    if (req.file) {
      // If a new video file is provided, update the imagePath
      imagePath = `/topNEWS/${req.file.filename}`;
      const imageSplit = checkResult.rows[0].image.replace("/topNEWS/", "");
      handle_delete_photos_from_folder([imageSplit], "topNEWS");
    }

    // Update the top video
    const updateQuery = `
        UPDATE top_NEWS
        SET  description = $1, disc_category = $2, image = COALESCE($3, image)
        WHERE id = $4
        RETURNING *;
      `;

    const updateResult = await pool.query(updateQuery, [
      description,
      disc_category,
      imagePath,
      id,
    ]);
    const query = `SELECT
      v.id AS top_NEWS_id,
      v.description,
      v.disc_category,
      vc.name AS disc_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_NEWS v
  LEFT JOIN disc_category vc ON v.disc_category = vc.id
  WHERE v.id = $1
  GROUP BY v.id, vc.name;
   `;
    const data = await pool.query(query, [id]);
    if (updateResult.rowCount === 1) {
      return res.status(200).json({
        statusCode: 200,
        message: "Top NEWS updated successfully",
        data: data.rows[0],
      });
    }

    return res.status(400).json({ statusCode: 400, message: "Update failed" });
  } catch (error) {
    console.error(error);
    handle_delete_photos_from_folder([req.file?.filename], "topNEWS");
    if (error.constraint === "top_news_disc_category_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "disc category not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllTopNews = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `SELECT
      v.id AS top_NEWS_id,
      v.description,
      v.disc_category,
      vc.name AS disc_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_NEWS v
  LEFT JOIN disc_category vc ON v.disc_category = vc.id
  WHERE v.disc_category = $1
  GROUP BY v.id, vc.name
  ORDER BY v.created_at DESC
   `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      query += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [id];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [id, perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalNEWS: rows.length,
        AllNEWS: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.top_NEWS WHERE disc_category = $1`;
      const totalNEWSResult = await pool.query(totalLetterQuery, [id]);
      const totalNEWS = totalNEWSResult.rows[0].total;
      const totalPages = Math.ceil(totalNEWS / perPage);

      res.status(200).json({
        statusCode: 200,
        totalNEWS,
        totalPages,
        AllNEWS: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllNews = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `SELECT
      v.id AS top_NEWS_id,
      v.description,
      v.disc_category,
      vc.name AS disc_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_NEWS v
  LEFT JOIN disc_category vc ON v.disc_category = vc.id
  GROUP BY v.id, vc.name
  ORDER BY v.created_at DESC
   `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      query += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalNEWS: rows.length,
        AllNEWS: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.top_NEWS`;
      const totalNEWSResult = await pool.query(totalLetterQuery);
      const totalNEWS = totalNEWSResult.rows[0].total;
      const totalPages = Math.ceil(totalNEWS / perPage);

      res.status(200).json({
        statusCode: 200,
        totalNEWS,
        totalPages,
        AllNEWS: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getSpecificTopNews = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `SELECT
      v.id AS top_NEWS_id,
      v.description,
      v.disc_category,
      vc.name AS disc_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_NEWS v
  LEFT JOIN disc_category vc ON v.disc_category = vc.id
  WHERE v.id = $1
  GROUP BY v.id, vc.name;
   `;

    const { rows } = await pool.query(query, [id]);

    return res.status(200).json({
      statusCode: 200,
      topNEWS: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteTopNews = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldVideo = await getSingleRow("top_NEWS", condition);
    if (oldVideo.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Top NEWS not found " });
    }
    const oldVideoSplit = oldVideo[0].image.replace("/topNEWS/", "");
    const delQuery = "DELETE FROM top_NEWS WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Xpi video not deleted" });
    }
    handle_delete_photos_from_folder([oldVideoSplit], "topNEWS");
    res.status(200).json({
      statusCode: 200,
      message: "Top NEWS deleted successfully",
      deletedGEBC: oldVideo[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getTopNewsApp = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `WITH RankedVideos AS (
        SELECT
        v.id AS top_NEWS_id,
        v.description,
        v.disc_category,
        vc.name AS disc_category_name,
        v.image,
        v.created_at AS created_at,
          ROW_NUMBER() OVER (PARTITION BY v.disc_category ORDER BY v.created_at DESC) AS row_num
        FROM top_NEWS v
        LEFT JOIN disc_category vc ON v.disc_category = vc.id
        WHERE v.disc_category = $1
      )
      SELECT
        top_NEWS_id,
        description,
        disc_category,
        disc_category_name,
        image,
        created_at
      FROM RankedVideos
      WHERE row_num = 1;
      `;

    const { rows } = await pool.query(query, [id]);

    return res.status(200).json({
      statusCode: 200,
      // totalPages,
      // totalVideos,
      topNews: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteAllNEWS = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM top_NEWS RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No top_NEWS found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All top_NEWS deleted successfully",
      deletedNEWS: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
//Tour controllers............................................

export const createTourTop = async (req, res) => {
  try {
    const { name, description, pic_category, image } = req.body;

    const createQuery =
      "INSERT INTO top_tours ( name,description, pic_category, image) VALUES ($1, $2, $3,$4) RETURNING *";
    const result = await pool.query(createQuery, [
      name,
      description,
      pic_category,
      image,
    ]);
    if (result.rowCount === 1) {
      const query = `SELECT
          v.id AS top_tours_id,
          v.name,
          v.description,
          v.pic_category,
          vc.name AS category_name,
          v.image,
          v.created_at AS created_at 
      FROM top_tours v
      LEFT JOIN pic_category vc ON v.pic_category = vc.id
      WHERE v.id = $1
      GROUP BY v.id, vc.name;
       `;
      const data = await pool.query(query, [result.rows[0].id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Top Tour uploaded successfully",
        data: data.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    // handle_delete_photos_from_folder([req.file?.filename], "topTours");
    if (error.constraint === "top_tours_disc_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "disc category not exist" });
    }
    return res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error" });
  }
};

export const updateTopTour = async (req, res) => {
  try {
    const { id, name, description, pic_category, image } = req.body;

    // Check if the video with the given ID exists
    const checkQuery = "SELECT * FROM top_tours WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Top Tour not found" });
    }

    // Update the top video
    const updateQuery = `
        UPDATE top_tours
        SET  description = $1, pic_category = $2, image = COALESCE($3, image),name=$4
        WHERE id = $5
        RETURNING *;
      `;

    const updateResult = await pool.query(updateQuery, [
      description,
      pic_category,
      image,
      name,
      id,
    ]);
    const query = `SELECT
      v.id AS top_tours_id,
      v.name,
      v.description,
      v.pic_category,
      vc.name AS pic_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_tours v
  LEFT JOIN pic_category vc ON v.pic_category = vc.id
  WHERE v.id = $1
  GROUP BY v.id, vc.name;
   `;
    const data = await pool.query(query, [id]);
    if (updateResult.rowCount === 1) {
      return res.status(200).json({
        statusCode: 200,
        message: "Top Tour updated successfully",
        data: data.rows[0],
      });
    }

    return res.status(400).json({ statusCode: 400, message: "Update failed" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "top_tours_disc_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "disc category not exist" });
    }
    return res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllTopTour = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `SELECT
      v.id AS top_tours_id,
      v.name,
      v.description,
      v.pic_category,
      vc.name AS pic_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_tours v
  LEFT JOIN pic_category vc ON v.pic_category = vc.id
  WHERE v.pic_category = $1
  GROUP BY v.id, vc.name
  ORDER BY v.created_at DESC
   `;
    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      query += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [id];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [id, perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalTours: rows.length,
        AllTours: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.top_tours WHERE pic_category = $1`;
      const totalToursResult = await pool.query(totalLetterQuery, [id]);
      const totalTours = totalToursResult.rows[0].total;
      const totalPages = Math.ceil(totalTours / perPage);

      res.status(200).json({
        statusCode: 200,
        totalTours,
        totalPages,
        AllTours: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllTour = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `SELECT
      v.id AS top_tours_id,
      v.name,
      v.description,
      v.pic_category,
      vc.name AS pic_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_tours v
  LEFT JOIN pic_category vc ON v.pic_category = vc.id
  GROUP BY v.id, vc.name
  ORDER BY v.created_at DESC
   `;
    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      query += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalTours: rows.length,
        AllTours: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.top_tours`;
      const totalToursResult = await pool.query(totalLetterQuery);
      const totalTours = totalToursResult.rows[0].total;
      const totalPages = Math.ceil(totalTours / perPage);

      res.status(200).json({
        statusCode: 200,
        totalTours,
        totalPages,
        AllTours: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getSpecificTopTour = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `SELECT
      v.id AS top_tours_id,
      v.name,
      v.description,
      v.pic_category,
      vc.name AS pic_category_name,
      v.image,
      v.created_at AS created_at 
  FROM top_tours v
  LEFT JOIN pic_category vc ON v.pic_category = vc.id
  WHERE v.id = $1
  GROUP BY v.id, vc.name;
   `;

    const { rows } = await pool.query(query, [id]);

    return res.status(200).json({
      statusCode: 200,
      topTour: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteTopTour = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldVideo = await getSingleRow("top_tours", condition);
    if (oldVideo.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Top Tour not found " });
    }
    const oldVideoSplit = oldVideo[0].image.replace("/topTours/", "");
    const delQuery = "DELETE FROM top_tours WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Top Tour not deleted" });
    }
    handle_delete_photos_from_folder([oldVideoSplit], "topTours");
    res.status(200).json({
      statusCode: 200,
      message: "Top tour deleted successfully",
      deletedGEBC: oldVideo[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getTopTourApp = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `WITH RankedVideos AS (
        SELECT
        v.id AS top_tours_id,
        v.name,
        v.description,
        v.pic_category,
        vc.name AS pic_category_name,
        v.image,
          pt.user_id AS user_id,
          u.username AS username,
          u.image AS userImage,
        v.created_at AS created_at,
          ROW_NUMBER() OVER (PARTITION BY v.pic_category ORDER BY v.created_at DESC) AS row_num
        FROM top_tours v
        LEFT JOIN pic_category vc ON v.pic_category = vc.id
          LEFT JOIN pic_tours pt ON pt.image = v.image
          LEFT JOIN users u ON pt.user_id = u.id
        WHERE v.pic_category = $1
      )
      SELECT
        top_tours_id,
        description,
        pic_category,
        pic_category_name,
        image,
          user_id,
          username,
          userImage,
        created_at
      FROM RankedVideos
      WHERE row_num = 1;
      `;

    const { rows } = await pool.query(query, [id]);

    return res.status(200).json({
      statusCode: 200,
      // totalPages,
      // totalVideos,
      topTour: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteAllTopTours = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM top_tours RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No top_tours found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All top_tours deleted successfully",
      deletedTours: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

//market zone
export const setTopItem = async (req, res) => {
  try {
    const { item_id } = req.body;

    // Step 1: Update all items with top_post = true to set it to false
    // const resetTopPostsQuery = 'UPDATE item SET top_post = FALSE WHERE top_post = TRUE';
    // await pool.query(resetTopPostsQuery);

    // Step 2: Update the specific item to set top_post = true
    const updateItemQuery =
      "UPDATE item SET top_post = TRUE, top_added_date=NOW() WHERE id = $1 AND paid_status=$2";
    const set = await pool.query(updateItemQuery, [item_id, true]);

    if (set.rowCount === 1) {
      const getQuery = `
        SELECT
          item.id,
          item.user_id,
          u.username AS username,
          u.image AS userImage,
          item.item_category,
          ic.name AS item_name,
          item.title,
          item.region,
          item.description,
          item.price,
          item.condition,
          item.location,
          item.top_post,
          item.top_added_date,
          item.paid_status,
          COALESCE(ARRAY_AGG(
            JSONB_BUILD_OBJECT(
              'id', ii.id,
              'image', ii.image
            )
          ), ARRAY[]::JSONB[]) AS images,
          item.country,
          item.country_code
        FROM item
        LEFT JOIN item_images ii ON item.id = ii.item_id
        LEFT JOIN users u ON item.user_id = u.id
        LEFT JOIN item_category ic ON item.item_category = ic.id
        WHERE item.id=$1
        GROUP BY
          item.id,
          item.user_id,
          item.item_category,
          item.title,
          item.description,
          item.price,
          item.condition,
          item.location,
          item.top_post,
          item.paid_status,
          u.username,
          u.image,
          ic.name,
          item.country,
          item.country_code
      `;
      const getData = await pool.query(getQuery, [item_id]);

      res.status(201).json({
        statusCode: 201,
        message: "Item set to top successfully",
        data: getData.rows[0],
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
export const deleteAllTopItem = async (req, res) => {
  try {
    // Step 1: Update all items with top_post = true to set it to false
    const resetTopPostsQuery =
      "UPDATE item SET top_post = FALSE WHERE top_post = TRUE RETURNING *";
    const getData = await pool.query(resetTopPostsQuery);

    res.status(200).json({
      statusCode: 201,
      message: "Delete all top item successfully",
      data: getData.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getSpecificTopItem = async (req, res) => {
  try {
    const { id } = req.params;

    const getQuery = `
      SELECT
        item.id,
        item.user_id,
        u.username AS username,
        u.image AS userImage,
        item.item_category,
        ic.name AS item_name,
        item.title,
        item.region,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.top_added_date,
        item.paid_status,
        COALESCE(ARRAY_AGG(
          JSONB_BUILD_OBJECT(
            'id', ii.id,
            'image', ii.image
          )
        ), ARRAY[]::JSONB[]) AS images
      FROM item
      LEFT JOIN item_images ii ON item.id = ii.item_id
      LEFT JOIN users u ON item.user_id = u.id
      LEFT JOIN item_category ic ON item.item_category = ic.id
      WHERE item.id=$1 AND top_post=$2
      GROUP BY
        item.id,
        item.user_id,
        item.item_category,
        item.title,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        u.username,
        u.image,
        ic.name
    `;

    const { rows } = await pool.query(getQuery, [id, true]);

    return res.status(200).json({
      statusCode: 200,
      topItem: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllTopItem = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `
      SELECT
        item.id,
        item.user_id,
        u.username AS username,
        u.image AS userImage,
        item.item_category,
        ic.name AS item_name,
        item.title,
        item.region,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.top_added_date,
        item.paid_status,
        COALESCE(ARRAY_AGG(
          JSONB_BUILD_OBJECT(
            'id', ii.id,
            'image', ii.image
          )
        ), ARRAY[]::JSONB[]) AS images,
        item.country,
        item.country_code
      FROM item
      LEFT JOIN item_images ii ON item.id = ii.item_id
      LEFT JOIN users u ON item.user_id = u.id
      LEFT JOIN item_category ic ON item.item_category = ic.id
      WHERE top_post=TRUE AND paid_status=TRUE AND u.is_deleted=FALSE
      GROUP BY
        item.id,
        item.user_id,
        item.item_category,
        item.title,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        u.username,
        u.image,
        ic.name,
        item.country,
        item.country_code
        ORDER BY item.top_added_date DESC
    `;
    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      query += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalItems: rows.length,
        AllItems: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalItemsQuery = `SELECT COUNT(*) AS total FROM public.item WHERE top_post=TRUE AND paid_status=TRUE`;
      const totalItemsResult = await pool.query(totalItemsQuery);
      const totalItems = totalItemsResult.rows[0].total;
      const totalPages = Math.ceil(totalItems / perPage);

      res.status(200).json({
        statusCode: 200,
        totalItems,
        totalPages,
        AllItems: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getTopItemApp = async (req, res) => {
  try {
    const { id } = req.params;
    let query = `
      SELECT
        item.id,
        item.user_id,
        u.username AS username,
        u.image AS userImage,
        item.item_category,
        ic.name AS item_name,
        item.title,
        item.region,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.top_added_date,
        item.paid_status,
        COALESCE(ARRAY_AGG(
          JSONB_BUILD_OBJECT(
            'id', ii.id,
            'image', ii.image
          )
        ), ARRAY[]::JSONB[]) AS images
      FROM item
      LEFT JOIN item_images ii ON item.id = ii.item_id
      LEFT JOIN users u ON item.user_id = u.id
      LEFT JOIN item_category ic ON item.item_category = ic.id
      WHERE top_post=TRUE AND paid_status=TRUE AND u.is_deleted=FALSE
      GROUP BY
        item.id,
        item.user_id,
        item.item_category,
        item.title,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        u.username,
        u.image,
        ic.name
        ORDER BY item.top_added_date DESC
        LIMIT 1
    `;

    const { rows } = await pool.query(query);

    return res.status(200).json({
      statusCode: 200,
      // totalPages,
      // totalVideos,
      topitem: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//post letter top
//market zone
export const setTopLetter = async (req, res) => {
  try {
    const { letter_id } = req.body;
    const updateLetterQuery =
      "UPDATE post_letters SET top_letter = TRUE, top_added_date=NOW() WHERE id = $1";
    const set = await pool.query(updateLetterQuery, [letter_id]);

    if (set.rowCount === 1) {
      let letterQuery = `SELECT
      pl.id AS post_id,
      pl.user_id,
      u.username,
      u.image AS userImage,
      pl.post_type,
      pl.receiver_type,
      pl.disc_category,
      d.name AS disc_category_name,
      pl.name,
      pl.address,
      pl.email,
      pl.contact_no,
      pl.subject_place,
      pl.post_date,
      pl.greetings,
      pl.introduction,
      pl.body,
      pl.form_of_appeal,
      pl.video,
      pl.signature_id,
      pl.top_letter,
      top_added_date,
      pl.paid_status,
      COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
      lru.username AS receiver_name,
      lru.image AS reciever_image,
      lri.address AS receiver_address
  FROM
      post_letters AS pl
  LEFT JOIN
      post_letters_images AS pli ON pl.id = pli.letter_id
  LEFT JOIN
      letter_reciever_info AS lri ON pl.id = lri.letter_id
      
 LEFT JOIN
 users AS lru ON lri.reciever_id = lru.id
   LEFT JOIN
      users AS u ON pl.user_id = u.id
   LEFT JOIN
      disc_category AS d ON pl.disc_category = d.id
      WHERE pl.id=$1
  GROUP BY
      pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category, pl.name, pl.address,
      pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
      pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, 
      lru.username,lru.image,
      u.image, lri.address, u.username,d.name
  ORDER BY pl.created_at DESC
    `;
      const getData = await pool.query(letterQuery, [letter_id]);

      res.status(201).json({
        statusCode: 201,
        message: "Letter set to top successfully",
        data: getData.rows[0],
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
export const deleteAllTopLetter = async (req, res) => {
  try {
    // Step 1: Update all items with top_post = true to set it to false
    const resetTopPostsQuery =
      "UPDATE post_letters SET top_letter = FALSE WHERE top_letter = TRUE RETURNING *";
    const getData = await pool.query(resetTopPostsQuery);

    res.status(200).json({
      statusCode: 201,
      message: "Delete all top letter successfully",
      data: getData.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getSpecificTopLetter = async (req, res) => {
  try {
    const { id } = req.params;

    let letterQuery = `SELECT
        pl.id AS post_id,
        pl.user_id,
        u.username,
        u.image AS userImage,
        pl.post_type,
        pl.receiver_type,
        pl.disc_category,
        d.name AS disc_category_name,
        pl.name,
        pl.address,
        pl.email,
        pl.contact_no,
        pl.subject_place,
        pl.post_date,
        pl.greetings,
        pl.introduction,
        pl.body,
        pl.top_letter,
        top_added_date,
        pl.form_of_appeal,
        pl.video,
        pl.signature_id,
        pl.paid_status,
        COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
        lru.username AS receiver_name,
        lru.image AS reciever_image,
        lri.address AS receiver_address
    FROM
        post_letters AS pl
    LEFT JOIN
        post_letters_images AS pli ON pl.id = pli.letter_id
    LEFT JOIN
        letter_reciever_info AS lri ON pl.id = lri.letter_id
        
   LEFT JOIN
   users AS lru ON lri.reciever_id = lru.id
     LEFT JOIN
        users AS u ON pl.user_id = u.id
     LEFT JOIN
        disc_category AS d ON pl.disc_category = d.id
        WHERE pl.id=$1 AND pl.top_letter=$2 AND u.is_deleted=$3
    GROUP BY
        pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category, pl.name, pl.address,
        pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
        pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, 
        lru.username,lru.image,
        u.image, lri.address, u.username,d.name
    ORDER BY pl.created_at DESC
      `;

    const { rows } = await pool.query(letterQuery, [id, true, false]);

    return res.status(200).json({
      statusCode: 200,
      topLetter: rows.length ? rows[0] : [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllTopLetter = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let letterQuery = `SELECT
        pl.id AS post_id,
        pl.user_id,
        u.username,
        u.image AS userImage,
        pl.post_type,
        pl.receiver_type,
        pl.disc_category,
        d.name AS disc_category_name,
        pl.name,
        pl.address,
        pl.email,
        pl.contact_no,
        pl.subject_place,
        pl.post_date,
        pl.greetings,
        pl.introduction,
        pl.body,
        pl.form_of_appeal,
        pl.top_letter,
        top_added_date,
        pl.video,
        pl.signature_id,
        pl.paid_status,
        COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
        lru.username AS receiver_name,
        lru.image AS reciever_image,
        lri.address AS receiver_address
    FROM
        post_letters AS pl
    LEFT JOIN
        post_letters_images AS pli ON pl.id = pli.letter_id
    LEFT JOIN
        letter_reciever_info AS lri ON pl.id = lri.letter_id
        
   LEFT JOIN
   users AS lru ON lri.reciever_id = lru.id
     LEFT JOIN
        users AS u ON pl.user_id = u.id
     LEFT JOIN
        disc_category AS d ON pl.disc_category = d.id
        WHERE pl.top_letter=TRUE AND u.is_deleted=FALSE
    GROUP BY
        pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category, pl.name, pl.address,
        pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
        pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, 
        lru.username,lru.image,
        u.image, lri.address, u.username,d.name
    ORDER BY pl.created_at DESC
      `;
    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      letterQuery += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(letterQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalLetter: rows.length,
        AllLetters: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.post_letters
          LEFT JOIN
          users AS u ON post_letters.user_id = u.id
          WHERE top_letter=TRUE AND u.is_deleted=FALSE`;
      const totalLetterResult = await pool.query(totalLetterQuery);
      const totalLetter = totalLetterResult.rows[0].total;
      const totalPages = Math.ceil(totalLetter / perPage);

      res.status(200).json({
        statusCode: 200,
        totalLetter,
        totalPages,
        AllLetters: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getTopLetterApp = async (req, res) => {
  try {
    let letterQuery = `SELECT
        pl.id AS post_id,
        pl.user_id,
        u.username,
        u.image AS userImage,
        pl.post_type,
        pl.receiver_type,
        pl.disc_category,
        d.name AS disc_category_name,
        pl.name,
        pl.address,
        pl.email,
        pl.contact_no,
        pl.subject_place,
        pl.post_date,
        pl.greetings,
        pl.introduction,
        pl.body,
        pl.form_of_appeal,
        pl.video,
        pl.top_letter,
        top_added_date,
        pl.signature_id,
        pl.paid_status,
        COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
        lru.username AS receiver_name,
        lru.image AS reciever_image,
        lri.address AS receiver_address
    FROM
        post_letters AS pl
    LEFT JOIN
        post_letters_images AS pli ON pl.id = pli.letter_id
    LEFT JOIN
        letter_reciever_info AS lri ON pl.id = lri.letter_id
        
   LEFT JOIN
   users AS lru ON lri.reciever_id = lru.id
     LEFT JOIN
        users AS u ON pl.user_id = u.id
     LEFT JOIN
        disc_category AS d ON pl.disc_category = d.id
        WHERE pl.top_letter=TRUE AND u.is_deleted=FALSE
    GROUP BY
        pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category, pl.name, pl.address,
        pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
        pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, 
        lru.username,lru.image,
        u.image, lri.address, u.username,d.name
        ORDER BY pl.top_added_date DESC
        LIMIT 1
      `;

    const { rows } = await pool.query(letterQuery);

    return res.status(200).json({
      statusCode: 200,
      // totalPages,
      // totalVideos,
      topitem: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendTopVideoComment = async (req, res) => {
  try {
    const { video_id, user_id, comment } = req.body;
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }

    const checkVideoQuery = "SELECT * FROM top_video WHERE id = $1";
    const checkVideoResult = await pool.query(checkVideoQuery, [video_id]);

    if (checkVideoResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "video not exist" });
    }

    const createQuery =
      "INSERT INTO video_comment (top_video_id, user_id, comment) VALUES($1,$2,$3) RETURNING *";
    const result = await pool.query(createQuery, [video_id, user_id, comment]);
    if (result.rowCount === 1) {
      let commentQuery = `SELECT 
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
    } else if (error.constraint === "video_comment_top_video_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "video  not found" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getAllTopVideoComments = async (req, res) => {
  try {
    const { id } = req.params;
    let commentQuery = `SELECT v.id AS commentId,
      v.comment AS comment,
      u.id AS userId,
      u.username AS username,
      u.image AS userImage
      FROM video_comment v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE top_video_id=$1 AND u.is_deleted=FALSE
      ORDER BY v.created_at DESC;
      `;

    const { rows } = await pool.query(commentQuery, [id]);
    res.status(200).json({
      statusCode: 200,
      totalComments: rows.length,
      AllComents: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const likeUnlikeTopVideo = async (req, res) => {
  try {
    const { video_id, user_id } = req.body;
    console.log(video_id);
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }

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
        "DELETE FROM top_video_like WHERE video_id = $1 AND user_id = $2";
      await pool.query(deleteQuery, [video_id, user_id]);
      const allLikesQuery =
        "SELECT COUNT(*) AS total FROM top_video_like WHERE video_id = $1";
      const totalLikes = await pool.query(allLikesQuery, [video_id]);
      return res.status(200).json({
        statusCode: 200,
        message: "Video unliked successfully",
        totalLikes: parseInt(totalLikes.rows[0].total),
        isLiked: false,
      });
    } else {
      const createQuery =
        "INSERT INTO top_video_like (video_id, user_id) VALUES ($1, $2)";
      await pool.query(createQuery, [video_id, user_id]);
      const allLikesQuery =
        "SELECT COUNT(*) AS total FROM top_video_like WHERE video_id = $1";
      const totalLikes = await pool.query(allLikesQuery, [video_id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Video liked successfully",
        totalLikes: parseInt(totalLikes.rows[0].total),
        isLiked: true,
      });
    }
  } catch (error) {
    console.error("error:", error);
    if (error.constraint === "top_video_like_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user not found" });
    } else if (error.constraint === "top_video_like_video_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "video  not found" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
