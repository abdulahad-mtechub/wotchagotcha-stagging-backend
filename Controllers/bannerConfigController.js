import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
export const createConfig = async (req, res) => {
  try {
    const { description, length, width, cost, top_banner_cost } = req.body;
    const isExist = await pool.query(`SELECT * FROM banner_configuration`);
    if (isExist.rows.length > 0) {
      return res.status(400).json({
        statusCode: 400,
        message:
          "Banner configuration already added.You can add only one time then just update it",
        existingBannerConfig: isExist.rows[0],
      });
    }
    const createQuery =
      "INSERT INTO banner_configuration (description,length,width,cost, top_banner_cost) VALUES ($1,$2,$3,$4, $5) RETURNING *";
    const result = await pool.query(createQuery, [
      description,
      length,
      width,
      cost,
      top_banner_cost,
    ]);

    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "Banner configuartion created successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const deleteConfig = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldCatgory = await getSingleRow("banner_configuration", condition);
    if (oldCatgory.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Banner configuration not found " });
    }
    const delQuery = "DELETE FROM banner_configuration WHERE id=$1";
    await pool.query(delQuery, [id]);
    res.status(200).json({
      statusCode: 200,
      message: "Banner configuration deleted successfully",
      deleteCOnfig: oldCatgory[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSpecificConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const condition = {
      column: "id",
      value: id,
    };
    const result = await getSingleRow("banner_configuration", condition);
    if (result.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Banner configuration not found" });
    }
    return res.status(200).json({ statusCode: 200, Config: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllBannerConfig = async (req, res) => {
  try {
    let banner_query = `SELECT * FROM banner_configuration ORDER BY created_at DESC LIMIT 1`;
    const { rows } = await pool.query(banner_query);
    res.status(200).json({
      statusCode: 200,
      result: rows[0],
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const updateConfig = async (req, res) => {
  try {
    const {
      id,
      description,
      length,
      width,
      cost,
      top_banner_cost = 0,
    } = req.body;

    // Check if the record with the specified id exists
    const existingRecord = await pool.query(
      "SELECT * FROM banner_configuration WHERE id = $1",
      [id]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Banner configuration with the provided id not found",
      });
    }

    // Update the existing record
    const updateQuery = `
        UPDATE banner_configuration
        SET description = $2, length = $3, width = $4, cost = $5, top_banner_cost = $6, updated_at=NOW()
        WHERE id = $1
        RETURNING *`;

    const updateResult = await pool.query(updateQuery, [
      id,
      description,
      length,
      width,
      cost,
      top_banner_cost,
    ]);

    if (updateResult.rowCount === 1) {
      return res.status(200).json({
        statusCode: 200,
        message: "Banner configuration updated successfully",
        data: updateResult.rows[0],
      });
    } else {
      res.status(400).json({ statusCode: 400, message: "Update failed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deleteAllCategory = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM disc_category RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No category found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All categories deleted successfully",
      deletedCategories: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const searchCategories = async (req, res) => {
  try {
    const { name } = req.query;

    // Split the search query into individual words
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, Suppliers: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(name ILIKE '%${word}%')`;
    });

    const userQuery = `SELECT
    *
    FROM
    disc_category
   
    WHERE ${conditions.join(" OR ")}
    ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(userQuery);
    return res
      .status(200)
      .json({ statusCode: 200, totalResults: rows.length, Categories: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
