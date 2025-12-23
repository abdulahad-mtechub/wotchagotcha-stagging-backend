// import Amenities from "../model/amenitiesModel.js";
import pool from "../../db.config/index.js";
import { getSingleRow } from "../../queries/common.js";
export const create = async (req, res) => {
  try {
    const { category_id, name } = req.body;
    // check if category find
    const query = "SELECT * FROM sports_category WHERE id=$1";
    const category = await pool.query(query, [category_id]);
    if (category.rows.length === 0) {
      return res.status(404).json({ message: "Sport Catgory not found" });
    }
    const createQuery =
      "INSERT INTO sport_sub_category (category_id, name) VALUES ($1, $2) RETURNING *";
    const result = await pool.query(createQuery, [category_id, name]);

    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "Sport category created successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldCatgory = await getSingleRow("sport_sub_category", condition);
    if (oldCatgory.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Sport subcategory category not found ",
      });
    }
    const delQuery = "DELETE FROM sport_sub_category WHERE id=$1";
    await pool.query(delQuery, [id]);
    res.status(200).json({
      statusCode: 200,
      message: "Sport category deleted successfully",
      deleteCategory: oldCatgory[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSpecificCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT sbc.*, c.name AS category_name, c.french_name AS category_french_name FROM sport_sub_category sbc LEFT JOIN sports_category c ON sbc.category_id = c.id WHERE sbc.id = $1`;
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Sport category not found" });
    }
    return res.status(200).json({ statusCode: 200, Category: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllSubCategories = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let supplierQuery = `SELECT sbc.*, c.name AS category_name, c.french_name AS category_french_name FROM sport_sub_category sbc LEFT JOIN sports_category c ON sbc.category_id = c.id  ORDER BY sbc.created_at DESC`;

    if (req.query.page === undefined && req.query.limit === undefined) {
      console.log("00000");
      // If no query parameters for pagination are provided, fetch all categories without pagination
      supplierQuery = `SELECT sbc.*, c.name AS category_name, c.french_name AS category_french_name FROM sport_sub_category sbc LEFT JOIN sports_category c ON sbc.category_id = c.id  ORDER BY sbc.created_at DESC`;
    } else {
      supplierQuery += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(supplierQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalCategories: rows.length,
        AllCategories: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalCategoriesQuery = `SELECT COUNT(*) AS total FROM public.sport_sub_category`;
      const totalCategoryResult = await pool.query(totalCategoriesQuery);
      const totalCategories = totalCategoryResult.rows[0].total;
      const totalPages = Math.ceil(totalCategories / perPage);

      res.status(200).json({
        statusCode: 200,
        totalCategories,
        totalPages,
        AllCategories: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const getAllSubCategoriesByCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const perPage = parseInt(req.query.limit || 5);
    const category_id = parseInt(req.query.category_id);
    const offset = (page - 1) * perPage;

    let queryParameters = [];
    let supplierQuery = `
      SELECT
        sbc.*,
        c.name AS category_name,
        c.french_name AS category_french_name
      FROM sport_sub_category sbc
      LEFT JOIN sports_category c ON sbc.category_id = c.id
    `;

    // Filter by category_id if provided
    if (!isNaN(category_id)) {
      supplierQuery += ` WHERE sbc.category_id = $1`;
      queryParameters.push(category_id);
    }

    supplierQuery += ` ORDER BY sbc.created_at ASC`;

    if (req.query.page !== undefined && req.query.limit !== undefined) {
      supplierQuery += ` LIMIT $${queryParameters.length + 1} OFFSET $${
        queryParameters.length + 2
      }`;
      queryParameters.push(perPage, offset);
    }

    const { rows } = await pool.query(supplierQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      res.status(200).json({
        statusCode: 200,
        totalCategories: rows.length,
        AllCategories: rows,
      });
    } else {
      // Calculate the total number of subcategories (without pagination)
      let totalCategoriesQuery = `SELECT COUNT(*) AS total FROM sport_sub_category`;
      let totalQueryParameters = [];

      if (!isNaN(category_id)) {
        totalCategoriesQuery += ` WHERE category_id = $1`;
        totalQueryParameters.push(category_id);
      }

      const totalCategoryResult = await pool.query(
        totalCategoriesQuery,
        totalQueryParameters
      );
      const totalCategories = totalCategoryResult.rows[0].total;
      const totalPages = Math.ceil(totalCategories / perPage);

      res.status(200).json({
        statusCode: 200,
        totalCategories,
        totalPages,
        AllCategories: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const updateCatgory = async (req, res) => {
  try {
    const { name, id, category_id } = req.body;
    const queryCategory = "SELECT * FROM sports_category WHERE id=$1";
    const querySubCategory = "SELECT * FROM sport_sub_category WHERE id=$1";
    const category = await pool.query(queryCategory, [category_id]);
    if (category.rows.length === 0) {
      return res.status(404).json({ message: "Sport Catgory not found" });
    }
    const oldCatgory = await pool.query(querySubCategory, [id]);
    if (oldCatgory.rows.length === 0) {
      return res.status(404).json({ message: "Sport Sub Catgory not found" });
    }

    const updateCategory = `UPDATE sport_sub_category SET name=$1, category_id =$2, updated_at=NOW() WHERE id=$3 RETURNING *`;
    const result = await pool.query(updateCategory, [name, category_id, id]);
    if (result.rowCount === 1) {
      return res.status(200).json({
        statusCode: 200,
        message: "Category updated successfully",
        Category: result.rows[0],
      });
    } else {
      res
        .status(404)
        .json({ statusCode: 404, message: "Operation not successfull" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteAllCategory = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM sport_sub_category RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No sport category found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All sport categories deleted successfully",
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
    sport_sub_category
   
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
