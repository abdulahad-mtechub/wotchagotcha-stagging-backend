// import Amenities from "../model/amenitiesModel.js";
import pool from "../db.config/index.js";
import { getSingleRow } from "../queries/common.js";
export const create = async (req, res) => {
  try {
    const { category_id, name } = req.body;

    // Check if the category exists
    const categoryCheckQuery = "SELECT * FROM public.QAFI_category WHERE id=$1";
    const categoryCheckResult = await pool.query(categoryCheckQuery, [
      category_id,
    ]);

    if (categoryCheckResult.rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Category not found",
      });
    }

    const createQuery =
      "INSERT INTO public.QAFI_sub_category (category_id, name) VALUES ($1, $2) RETURNING *";
    const result = await pool.query(createQuery, [category_id, name]);

    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "Sub-category created successfully",
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
    const oldSubCategory = await getSingleRow(
      "public.QAFI_sub_category",
      condition
    );
    if (oldSubCategory.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Sub-category not found" });
    }
    const delQuery = "DELETE FROM public.QAFI_sub_category WHERE id=$1";
    await pool.query(delQuery, [id]);
    res.status(200).json({
      statusCode: 200,
      message: "Sub-category deleted successfully",
      deletedSubCategory: oldSubCategory[0],
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
    const result = await getSingleRow("public.QAFI_sub_category", condition);
    if (result.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Sub-category not found" });
    }
    return res.status(200).json({ statusCode: 200, SubCategory: result });
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
    let subCategoryQuery = `
      SELECT sc.*
      FROM public.QAFI_sub_category sc
      ORDER BY sc.created_at DESC`;

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no query parameters for pagination are provided, fetch all sub-categories without pagination
      subCategoryQuery = `
        SELECT sc.*
        FROM public.QAFI_sub_category sc
        ORDER BY sc.created_at DESC`;
    } else {
      subCategoryQuery += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(subCategoryQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalSubCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalSubCategories: rows.length,
        AllSubCategories: rows,
      });
    } else {
      // Calculate the total number of sub-categories (without pagination)
      const totalSubCategoriesQuery = `SELECT COUNT(*) AS total FROM public.QAFI_sub_category`;
      const totalSubCategoryResult = await pool.query(totalSubCategoriesQuery);
      const totalSubCategories = totalSubCategoryResult.rows[0].total;
      const totalPages = Math.ceil(totalSubCategories / perPage);

      res.status(200).json({
        statusCode: 200,
        totalSubCategories,
        totalPages,
        AllSubCategories: rows,
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
    const { category_id } = req.query;

    const subCategoryQuery = `
      SELECT sc.*
      FROM public.QAFI_sub_category sc
      WHERE sc.category_id = $1
      ORDER BY sc.id DESC`;

    const { rows } = await pool.query(subCategoryQuery, [category_id]);

    res.status(200).json({
      statusCode: 200,
      totalSubCategories: rows.length,
      AllCategories: rows,
    });
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

    // Check if the sub-category exists
    const subCategoryQuery =
      "SELECT * FROM public.QAFI_sub_category WHERE id=$1";
    const oldSubCategory = await pool.query(subCategoryQuery, [id]);
    if (oldSubCategory.rows.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Sub-category not found" });
    }

    // Check if the category exists
    const categoryCheckQuery = "SELECT * FROM public.QAFI_category WHERE id=$1";
    const categoryCheckResult = await pool.query(categoryCheckQuery, [
      category_id,
    ]);

    if (categoryCheckResult.rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Category not found",
      });
    }

    const updateSubCategory = `UPDATE public.QAFI_sub_category SET name=$1, category_id=$2, updated_at=NOW() WHERE id=$3 RETURNING *`;
    const result = await pool.query(updateSubCategory, [name, category_id, id]);
    if (result.rowCount === 1) {
      return res.status(200).json({
        statusCode: 200,
        message: "Sub-category updated successfully",
        SubCategory: result.rows[0],
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
    // Perform a query to delete all sub-categories from the database
    const query = "DELETE FROM public.QAFI_sub_category RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No sub-categories found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All sub-categories deleted successfully",
      deletedSubCategories: rows,
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
      return res.status(200).json({ statusCode: 200, SubCategories: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(name ILIKE '%${word}%')`;
    });

    const subCategoryQuery = `SELECT
    *
    FROM
    public.QAFI_sub_category
    WHERE ${conditions.join(" OR ")}
    ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(subCategoryQuery);
    return res.status(200).json({
      statusCode: 200,
      totalResults: rows.length,
      SubCategories: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
