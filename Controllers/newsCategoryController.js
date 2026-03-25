// import Amenities from "../model/amenitiesModel.js";
import pool from "../db.config/index.js";
import { getSingleRow } from "../queries/common.js";
export const create = async (req, res) => {
    try {
        const { name } = req.body;
        const createQuery =
            "INSERT INTO public.NEWS_category (name) VALUES ($1) RETURNING *";
        const result = await pool.query(createQuery, [name]);

        if (result.rowCount === 1) {
            return res.status(201).json({
                statusCode: 201,
                message: "Category created successfully",
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
        const oldCategory = await getSingleRow("public.NEWS_category", condition);
        if (oldCategory.length === 0) {
            return res
                .status(404)
                .json({ statusCode: 404, message: "Category not found" });
        }
        const delQuery = "DELETE FROM public.NEWS_category WHERE id=$1";
        await pool.query(delQuery, [id]);
        res.status(200).json({
            statusCode: 200,
            message: "Category deleted successfully",
            deletedCategory: oldCategory[0],
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
        const result = await getSingleRow("public.NEWS_category", condition);
        if (result.length === 0) {
            return res
                .status(404)
                .json({ statusCode: 404, message: "Category not found" });
        }
        return res.status(200).json({ statusCode: 200, Category: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllCategories = async (req, res) => {
    try {
        let page = parseInt(req.query.page || 1);
        const perPage = parseInt(req.query.limit || 5);
        const offset = (page - 1) * perPage;

        let categoryQuery = `
        SELECT c.*, COUNT(sc.id) AS sub_category_count
        FROM public.NEWS_category c
        LEFT JOIN public.NEWS_sub_category sc ON c.id = sc.category_id
        GROUP BY c.id
        ORDER BY c.created_at DESC`;

        if (req.query.page === undefined && req.query.limit === undefined) {
            categoryQuery = `
          SELECT c.*, COUNT(sc.id) AS sub_category_count
          FROM public.NEWS_category c
          LEFT JOIN public.NEWS_sub_category sc ON c.id = sc.category_id
          GROUP BY c.id
          ORDER BY c.created_at DESC`;
        } else {
            categoryQuery += ` LIMIT $1 OFFSET $2;`;
        }

        let queryParameters = [];
        if (req.query.page !== undefined || req.query.limit !== undefined) {
            queryParameters = [perPage, offset];
        }

        const { rows } = await pool.query(categoryQuery, queryParameters);

        if (req.query.page === undefined && req.query.limit === undefined) {
            res.status(200).json({
                statusCode: 200,
                totalCategories: rows.length,
                AllCategories: rows,
            });
        } else {
            const totalCategoriesQuery = `SELECT COUNT(*) AS total FROM public.NEWS_category`;
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
        res.status(500).json({ statusCode: 500, message: "Internal server error", error });
    }
};

export const updateCatgory = async (req, res) => {
    try {
        const { name, id } = req.body;
        const query = "SELECT * FROM public.NEWS_category WHERE id=$1";
        const oldCategory = await pool.query(query, [id]);
        if (oldCategory.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        const updateCategory = `UPDATE public.NEWS_category SET name=$1, updated_at=NOW() WHERE id=$2 RETURNING *`;
        const result = await pool.query(updateCategory, [name, id]);
        if (result.rowCount === 1) {
            return res.status(200).json({
                statusCode: 200,
                message: "Category updated successfully",
                Category: result.rows[0],
            });
        } else {
            res.status(404).json({ statusCode: 404, message: "Operation not successful" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteAllCategory = async (req, res) => {
    try {
        const query = "DELETE FROM public.NEWS_category RETURNING *";
        const { rows } = await pool.query(query);

        if (rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: "No categories found to delete",
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

        const searchWords = name.split(/\s+/).filter(Boolean);

        if (searchWords.length === 0) {
            return res.status(200).json({ statusCode: 200, Categories: [] });
        }

        const conditions = searchWords.map((word) => {
            return `(name ILIKE '%${word}%')`;
        });

        const categoryQuery = `SELECT *
                             FROM public.NEWS_category
                             WHERE ${conditions.join(" OR ")}
                             ORDER BY created_at DESC`;
        const { rows } = await pool.query(categoryQuery);
        return res.status(200).json({ statusCode: 200, totalResults: rows.length, Categories: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};