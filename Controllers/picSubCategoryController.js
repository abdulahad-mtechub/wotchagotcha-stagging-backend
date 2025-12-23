// import Amenities from "../model/amenitiesModel.js";
import pool from "../db.config/index.js";
import { getSingleRow } from "../queries/common.js";
export const create = async (req, res) => {
  try {
    const { category_id, name } = req.body;
    // check if category exists
    const query = "SELECT * FROM pic_category WHERE id=$1";
    const category = await pool.query(query, [category_id]);
    if (category.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    const createQuery =
      "INSERT INTO pic_sub_category (category_id, name) VALUES ($1, $2) RETURNING *";
    const result = await pool.query(createQuery, [category_id, name]);

    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "Subcategory created successfully",
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
    const oldCategory = await getSingleRow("pic_sub_category", condition);
    if (oldCategory.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Subcategory not found" });
    }
    const delQuery = "DELETE FROM pic_sub_category WHERE id=$1";
    await pool.query(delQuery, [id]);
    res.status(200).json({
      statusCode: 200,
      message: "Subcategory deleted successfully",
      deleteCategory: oldCategory[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSpecificCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT sbc.*, c.name AS category_name, c.french_name AS category_french_name
                       FROM pic_sub_category sbc 
                       LEFT JOIN pic_category c ON sbc.category_id = c.id 
                       WHERE sbc.id = $1`;
    const result = await pool.query(query, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Subcategory not found" });
    }
    return res.status(200).json({ statusCode: 200, Category: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllSubCategories = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1);
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `SELECT sbc.*, c.name AS category_name,c.french_name AS category_french_name
                     FROM pic_sub_category sbc 
                     LEFT JOIN pic_category c ON sbc.category_id = c.id  
                     ORDER BY sbc.created_at DESC`;

    if (req.query.page !== undefined && req.query.limit !== undefined) {
      query += ` LIMIT $1 OFFSET $2`;
    }
    let queryParameters = [];
    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(query, queryParameters);
    if (req.query.page === undefined && req.query.limit === undefined) {
      res.status(200).json({
        statusCode: 200,
        totalCategories: rows.length,
        AllCategories: rows,
      });
    } else {
      const totalCategoriesQuery = `SELECT COUNT(*) AS total FROM pic_sub_category`;
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
    let query = `
            SELECT sbc.*, c.name AS category_name, c.french_name AS category_french_name
            FROM pic_sub_category sbc 
            LEFT JOIN pic_category c ON sbc.category_id = c.id`;

    if (!isNaN(category_id)) {
      query += ` WHERE sbc.category_id = $1`;
      queryParameters.push(category_id);
    }

    query += ` ORDER BY sbc.created_at ASC`;
    if (req.query.page !== undefined && req.query.limit !== undefined) {
      query += ` LIMIT $${queryParameters.length + 1} OFFSET $${
        queryParameters.length + 2
      }`;
      queryParameters.push(perPage, offset);
    }

    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      res.status(200).json({
        statusCode: 200,
        totalCategories: rows.length,
        AllCategories: rows,
      });
    } else {
      let totalCategoriesQuery = `SELECT COUNT(*) AS total FROM pic_sub_category`;
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
    const queryCategory = "SELECT * FROM pic_category WHERE id=$1";
    const querySubCategory = "SELECT * FROM pic_sub_category WHERE id=$1";
    const category = await pool.query(queryCategory, [category_id]);
    if (category.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    const oldCategory = await pool.query(querySubCategory, [id]);
    if (oldCategory.rows.length === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    const updateCategory = `UPDATE pic_sub_category SET name=$1, category_id =$2, updated_at=NOW() WHERE id=$3 RETURNING *`;
    const result = await pool.query(updateCategory, [name, category_id, id]);
    if (result.rowCount === 1) {
      return res.status(200).json({
        statusCode: 200,
        message: "Subcategory updated successfully",
        Category: result.rows[0],
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
export const deleteAllCategory = async (req, res) => {
  try {
    const query = "DELETE FROM pic_sub_category RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No subcategories found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All subcategories deleted successfully",
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
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, Categories: [] });
    }

    const conditions = searchWords.map((word) => {
      return `(name ILIKE '%${word}%')`;
    });

    const query = `SELECT * FROM pic_sub_category WHERE ${conditions.join(
      " OR "
    )} ORDER BY created_at DESC`;
    const { rows } = await pool.query(query);
    return res.status(200).json({
      statusCode: 200,
      totalResults: rows.length,
      Categories: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
