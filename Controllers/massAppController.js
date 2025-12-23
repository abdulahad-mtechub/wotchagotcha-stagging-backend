import moment from "moment";
import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";
export const createMassApp = async (req, res) => {
  try {
    const { user_id, app_category_id, name, type, image } = req.body;

    // if (req.file) {
    // let imagePath = `/massAppImages/${req.file.filename}`;
    const createQuery = `INSERT INTO mass_app (user_id,app_category_id, name, icon, type) VALUES($1,$2,$3,$4,$5) RETURNING *`;
    const result = await pool.query(createQuery, [
      user_id,
      app_category_id,
      name,
      // imagePath,
      image,
      type,
    ]);
    if (result.rowCount === 1) {
      const getQuery = `
        SELECT mass_app.id AS mass_app_id,
        mass_app.user_id AS user_id,
        users.username AS username,
        users.image AS userImage,
        users.email AS userEmail,
        mass_app.app_category_id AS app_category_id,
        app_category.name AS app_category_name,
        app_category.french_name AS app_category_french_name,
        mass_app.name AS mass_app_name,
        mass_app.icon AS mass_app_icon,
        mass_app.type AS mass_app_type
        FROM mass_app
        LEFT JOIN users ON mass_app.user_id = users.id
        LEFT JOIN app_category ON mass_app.app_category_id = app_category.id
        WHERE mass_app.id = $1
        
        `;
      const massApp = await pool.query(getQuery, [result.rows[0].id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Mass app created successfully",
        data: massApp.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
    // } else {
    //   res.status(400).json({ statusCode: 400, message: "image not uploaded" });
    // }
  } catch (error) {
    console.error(error);
    handle_delete_photos_from_folder([req.file?.filename], "massAppImages");
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

export const removeMassApp = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("mass_app", condition);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "mass app not found " });
    }
    const oldImageSplit = oldImage[0].icon.replace("/fileUpload/", "");
    const delQuery = "DELETE FROM mass_app WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "mass app not deleted" });
    }
    handle_delete_photos_from_folder([oldImageSplit], "fileUpload");
    res.status(200).json({
      statusCode: 200,
      message: "Mass app deleted successfully",
      deletedApp: oldImage[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSpecificBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const getQuery = `
    SELECT banner.*, users.username AS user_username, users.image AS user_image
    FROM banner
    LEFT JOIN users ON banner.user_id = users.id
    WHERE (users.is_deleted = FALSE OR users.is_deleted IS NULL)
    AND banner.id = $1
`;

    const banner = await pool.query(getQuery, [id]);
    if (banner.rows.length > 0) {
      return res.status(200).json({
        statusCode: 200,
        banner: {
          ...banner.rows[0],
          startdate: moment(banner.rows[0].startdate).format("YYYY-MM-DD"),
          enddate: moment(banner.rows[0].enddate).format("YYYY-MM-DD"),
        },
      });
    } else {
      res.status(404).json({ statusCode: 404, message: "No banner found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllAppByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let getQuery = `
        SELECT mass_app.id AS mass_app_id,
        mass_app.user_id AS user_id,
        users.username AS username,
        users.image AS userImage,
        users.email AS userEmail,
        mass_app.app_category_id AS app_category_id,
        app_category.name AS app_category_name,
        app_category.french_name AS app_category_french_name,
        mass_app.name AS mass_app_name,
        mass_app.icon AS mass_app_icon,
        mass_app.type AS mass_app_type
        FROM mass_app
        LEFT JOIN users ON mass_app.user_id = users.id 
        LEFT JOIN app_category ON mass_app.app_category_id = app_category.id
        WHERE mass_app.app_category_id = $1 AND users.is_deleted=FALSE
        ORDER BY mass_app.created_at DESC
        
        `;
    if (req.query.page === undefined && req.query.limit === undefined) {
      //   // If no query parameters for pagination are provided, fetch all categories without pagination
      //   blogQuery = ` SELECT banner.*, users.username AS user_username, users.image AS user_image
      //   FROM banner
      //   LEFT JOIN users ON banner.user_id = users.id
      //   ORDER BY created_at DESC`;
    } else {
      getQuery += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [id];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [id, perPage, offset];
    }

    const { rows } = await pool.query(getQuery, queryParameters);
    if (req.query.page === undefined && req.query.limit === undefined) {
      res.status(200).json({
        statusCode: 200,
        totalMassApps: rows.length,
        AllMassApps: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalMassAppsQuery = `SELECT COUNT(*) AS total FROM public.mass_app
      LEFT JOIN users ON mass_app.user_id = users.id
      WHERE mass_app.app_category_id = $1 AND users.is_deleted=FALSE`;
      const totalMassAppsResult = await pool.query(totalMassAppsQuery, [id]);
      const totalMassApps = totalMassAppsResult.rows[0].total;
      const totalPages = Math.ceil(totalMassApps / perPage);

      res.status(200).json({
        statusCode: 200,
        totalMassApps,
        totalPages,
        AllMassApps: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllFavouritesApp = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;

    let getQuery = `
      SELECT mass_app.id AS mass_app_id,
      mass_app.user_id AS user_id,
      users.username AS username,
      users.image AS userImage,
      users.email AS userEmail,
      mass_app.app_category_id AS app_category_id,
      app_category.name AS app_category_name,
      app_category.french_name AS app_category_french_name,
      mass_app.name AS mass_app_name,
      mass_app.icon AS mass_app_icon,
      mass_app.type AS mass_app_type
      FROM mass_app
      LEFT JOIN users ON mass_app.user_id = users.id
      LEFT JOIN app_category ON mass_app.app_category_id = app_category.id
      WHERE mass_app.app_category_id=$1
    `;

    let whereClause = [];
    let queryParameters = [id];
    let parameterIndex = 2; // Start with the first parameter index

    if (req.query.type) {
      whereClause.push(`AND mass_app.type = $${parameterIndex}`);
      queryParameters.push(req.query.type);
      parameterIndex++; // Increment the parameter index
    }

    if (req.query.user_id) {
      whereClause.push(
        ` mass_app.user_id = $${parameterIndex} AND users.is_deleted=FALSE`
      );
      queryParameters.push(req.query.user_id);
      parameterIndex++; // Increment the parameter index
    }

    if (whereClause.length > 0) {
      getQuery += `  ${whereClause.join(" AND ")}`;
    }
    getQuery += ` ORDER BY mass_app.created_at`;
    if (req.query.page !== undefined || req.query.limit !== undefined) {
      getQuery += ` LIMIT $${parameterIndex} OFFSET $${parameterIndex + 1}`;
      queryParameters.push(perPage, offset);
    }

    console.log(getQuery);
    console.log(queryParameters);
    const { rows } = await pool.query(getQuery, queryParameters);
    if (req.query.page === undefined && req.query.limit === undefined) {
      res.status(200).json({
        statusCode: 200,
        totalMassApps: rows.length,
        AllMassApps: rows,
      });
    } else {
      // Calculate the total number of records (without pagination)
      let totalMassAppsQuery = `SELECT COUNT(*) AS total FROM public.mass_app
        LEFT JOIN users ON mass_app.user_id = users.id
        WHERE mass_app.app_category_id=$1
        `;

      const newArray = queryParameters.slice(0, queryParameters.length - 2);
      // console.log(newArray);
      if (whereClause.length > 0) {
        totalMassAppsQuery += ` ${whereClause.join(" AND ")}`;
      }

      console.log(totalMassAppsQuery);
      const totalMassAppsResult = await pool.query(
        totalMassAppsQuery,
        newArray
      ); // Use a separate array for total count query parameters

      const totalMassApps = totalMassAppsResult.rows[0].total;
      const totalPages = Math.ceil(totalMassApps / perPage);

      res.status(200).json({
        statusCode: 200,
        totalMassApps,
        totalPages,
        AllMassApps: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const addfavourite = async (req, res) => {
  try {
    const { id, type } = req.body;

    if (!id) {
      return res.status(400).json({
        statusCode: 400,
        message: "Missing app ID in the request body",
      });
    }

    const existingBanner = await pool.query(
      "SELECT * FROM mass_app WHERE id = $1",
      [id]
    );

    if (existingBanner.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "App with the provided ID not found",
      });
    }

    const updateQuery = `
        UPDATE mass_app
        SET type = $2
        WHERE id = $1
        RETURNING *`;

    const result = await pool.query(updateQuery, [id, type]);

    if (result.rowCount === 1) {
      const getQuery = `
        SELECT mass_app.id AS mass_app_id,
        mass_app.user_id AS user_id,
        users.username AS username,
        users.image AS userImage,
        users.email AS userEmail,
        mass_app.app_category_id AS app_category_id,
        app_category.name AS app_category_name,
        app_category.french_name AS app_category_french_name,
        mass_app.name AS mass_app_name,
        mass_app.icon AS mass_app_icon,
        mass_app.type AS mass_app_type
        FROM mass_app
        LEFT JOIN users ON mass_app.user_id = users.id
        LEFT JOIN app_category ON mass_app.app_category_id = app_category.id
        WHERE mass_app.id = $1
        
        `;
      const massApp = await pool.query(getQuery, [id]);
      return res.status(200).json({
        statusCode: 200,
        message: `App added to ${type} section successfully`,
        data: massApp.rows[0],
      });
    }

    res.status(400).json({ statusCode: 400, message: "Update failed" });
  } catch (error) {
    if (error.constraint === "check_valid_status") {
      return res.status(400).json({
        statusCode: 400,
        message:
          "Invalid mass app type use one of these types ('favourites','new_added','phone_based','unused_app')",
      });
    }
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const removefavourite = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        statusCode: 400,
        message: "Missing app ID in the request body",
      });
    }

    const existingBanner = await pool.query(
      "SELECT * FROM mass_app WHERE id = $1 AND type=$2",
      [id, "favourites"]
    );

    if (existingBanner.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message:
          "App with the provided ID not found or this app is not in favourite list",
      });
    }

    const updateQuery = `
          UPDATE mass_app
          SET type = $2
          WHERE id = $1
          RETURNING *`;

    const result = await pool.query(updateQuery, [id, "phone_based"]);

    if (result.rowCount === 1) {
      const getQuery = `
          SELECT mass_app.id AS mass_app_id,
          mass_app.user_id AS user_id,
          users.username AS username,
          users.image AS userImage,
          users.email AS userEmail,
          mass_app.app_category_id AS app_category_id,
          app_category.name AS app_category_name,
          app_category.french_name AS app_category_french_name,
          mass_app.name AS mass_app_name,
          mass_app.icon AS mass_app_icon,
          mass_app.type AS mass_app_type
          FROM mass_app
          LEFT JOIN users ON mass_app.user_id = users.id
          LEFT JOIN app_category ON mass_app.app_category_id = app_category.id
          WHERE mass_app.id = $1
          
          `;
      const massApp = await pool.query(getQuery, [id]);
      return res.status(200).json({
        statusCode: 200,
        message: `App removed to ${existingBanner.rows[0].type} section successfully`,
        data: massApp.rows[0],
      });
    }

    res.status(400).json({ statusCode: 400, message: "Update failed" });
  } catch (error) {
    if (error.constraint === "check_valid_status") {
      return res.status(400).json({
        statusCode: 400,
        message:
          "Invalid mass app type use one of these types ('favourites','new_added','phone_based','unused_app')",
      });
    }
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const searchApps = async (req, res) => {
  try {
    const { searchWord } = req.query;

    // Split the search query into individual words
    const searchWords = searchWord.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, Banners: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(mass_app.name ILIKE '%${word}%')`;
    });
    const searchQuery = `
    SELECT mass_app.id AS mass_app_id,
    mass_app.user_id AS user_id,
    users.username AS username,
    users.image AS userImage,
    users.email AS userEmail,
    mass_app.app_category_id AS app_category_id,
    app_category.name AS app_category_name,
    app_category.french_name AS app_category_french_name,
    mass_app.name AS mass_app_name,
    mass_app.icon AS mass_app_icon,
    mass_app.type AS mass_app_type
    FROM mass_app
    LEFT JOIN users ON mass_app.user_id = users.id
    LEFT JOIN app_category ON mass_app.app_category_id = app_category.id
    WHERE ${conditions.join(" OR ")} AND users.is_deleted=FALSE
    ORDER BY mass_app.created_at DESC
    `;

    const { rows } = await pool.query(searchQuery);

    return res
      .status(200)
      .json({ statusCode: 200, totalResults: rows.length, Apps: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
