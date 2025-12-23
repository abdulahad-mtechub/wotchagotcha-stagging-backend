// import Amenities from "../model/amenitiesModel.js";
import pool from "../../db.config/index.js";
import { getSingleRow } from "../../queries/common.js";
export const create = async (req, res) => {
  try {
    const { name } = req.body;
    const createQuery =
      "INSERT INTO tv_progmax_category (name) VALUES ($1) RETURNING *";
    const result = await pool.query(createQuery, [name]);

    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "category created successfully",
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
    const oldCatgory = await getSingleRow("tv_progmax_category", condition);
    if (oldCatgory.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "category not found " });
    }
    const delQuery = "DELETE FROM tv_progmax_category WHERE id=$1";
    await pool.query(delQuery, [id]);
    res.status(200).json({
      statusCode: 200,
      message: "category deleted successfully",
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
    const condition = {
      column: "id",
      value: id,
    };
    const result = await getSingleRow("tv_progmax_category", condition);
    if (result.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Fan Star category not found" });
    }
    return res.status(200).json({ statusCode: 200, Category: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllCategories = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let supplierQuery = `
      SELECT c.*, COUNT(sc.id) AS sub_category_count
      FROM tv_progmax_category c
      LEFT JOIN tv_progmax_sub_category sc ON c.id = sc.category_id
      GROUP BY c.id
      ORDER BY c.created_at DESC `;

    if (req.query.page === undefined && req.query.limit === undefined) {
      console.log("00000");
      // If no query parameters for pagination are provided, fetch all categories without pagination
      supplierQuery = `
        SELECT c.*, COUNT(sc.id) AS sub_category_count
        FROM tv_progmax_category c
        LEFT JOIN tv_progmax_sub_category sc ON c.id = sc.category_id
        GROUP BY c.id
        ORDER BY c.created_at DESC`;
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
      const totalCategoriesQuery = `SELECT COUNT(*) AS total FROM public.tv_progmax_category`;
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

export const updateCatgory = async (req, res) => {
  try {
    const { name, id } = req.body;
    const query = "SELECT * FROM tv_progmax_category WHERE id=$1";
    const oldCatgory = await pool.query(query, [id]);
    if (oldCatgory.rows.length === 0) {
      return res.status(404).json({ message: "Fan Star Catgory not found" });
    }

    const updateCategory = `UPDATE tv_progmax_category SET name=$1, "updated_at"=NOW() WHERE id=$2 RETURNING *`;
    const result = await pool.query(updateCategory, [name, id]);
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
    const query = "DELETE FROM tv_progmax_category RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No category found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All category deleted successfully",
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
    tv_progmax_category
   
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
