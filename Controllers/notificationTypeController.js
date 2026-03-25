// import Amenities from "../model/amenitiesModel.js";
import pool from "../db.config/index.js";
import {  getSingleRow } from "../queries/common.js";
export const createType = async (req, res) => {
  try {
    const { name } = req.body;
    const createQuery =
      "INSERT INTO notification_type (name) VALUES ($1) RETURNING *";
    const result = await pool.query(createQuery, [name]);

    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "Notification type created successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const deleteType = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldType = await getSingleRow("notification_type", condition);
    if (oldType.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "notification type not found " });
    }
    const delQuery = "DELETE FROM notification_type WHERE id=$1";
    await pool.query(delQuery, [id]);
    res
      .status(200)
      .json({ statusCode: 200, message: "Notification type deleted successfully",deleteType:oldType[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSpecificType = async (req, res) => {
  try {
    const { id } = req.params;
    const condition = {
      column: "id",
      value: id,
    };
    const result = await getSingleRow("notification_type", condition);
    if(result.length===0){
      return res.status(404).json({ statusCode: 404, message:"Notification type not found" });
    }
    return res.status(200).json({ statusCode: 200, type: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllTypes = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let typeQuery = `SELECT * FROM notification_type ORDER BY created_at DESC`;

    if (req.query.page === undefined && req.query.limit === undefined) {
      typeQuery = `SELECT * FROM notification_type ORDER BY created_at DESC`;
    } else {
      typeQuery += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(typeQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalTypes:rows.length,
        AllTypes: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalTypesQuery = `SELECT COUNT(*) AS total FROM public.notification_type`;
      const totalTypeResult = await pool.query(totalTypesQuery);
      const totalTypes = totalTypeResult.rows[0].total;
      const totalPages = Math.ceil(totalTypes / perPage);

      res.status(200).json({
        statusCode: 200,
        totalTypes,
        totalPages,
        AllTypes: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const updateType = async (req, res) => {
  try {
    const { name, id } = req.body;
    const query = "SELECT * FROM notification_type WHERE id=$1";
    const oldType = await pool.query(query, [id]);
    if (oldType.rows.length === 0) {
      return res.status(404).json({ message: "Notification type not found" });
    }

    const updateType = `UPDATE notification_type SET name=$1, "updated_at"=NOW() WHERE id=$2 RETURNING *`;
    const result = await pool.query(updateType, [name, id]);
    if (result.rowCount === 1) {
      return res
        .status(200)
        .json({ statusCode: 200,message:"Notification type  updated successfully", type: result.rows[0] });
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
export const deleteAllType = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = 'DELETE FROM notification_type RETURNING *';
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'No notification type found to delete',
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: 'All notification type deleted successfully',
      deletedTypes: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: 'Internal server error' });
  }
};
