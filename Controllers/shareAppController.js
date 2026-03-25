import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
export const createShareApp = async (req, res) => {
  try {
    const { link } = req.body;
    const isExist=await pool.query(`SELECT * FROM share_app`)
    if(isExist.rows.length>0){
      return  res.status(400).json({ statusCode: 400, message: "Share link already added.You can add only one time then just update it",existinglink:isExist.rows[0] });
    }
    const createQuery =
      "INSERT INTO share_app (link) VALUES ($1) RETURNING *";
    const result = await pool.query(createQuery, [link]);

    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "Share link created successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
  } catch (error) {
    console.error(error);
   if(error.constraint==='check_valid_link_updated'){
        return res.status(400).json({ statusCode: 400, message: "Invalid link format" });
      }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const deleteShareApp = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldlink = await getSingleRow("share_app", condition);
    if (oldlink.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Share link not found " });
    }
    const delQuery = "DELETE FROM share_app WHERE id=$1";
    await pool.query(delQuery, [id]);
    res
      .status(200)
      .json({
        statusCode: 200,
        message: "Share link deleted successfully",
        link: oldlink[0],
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSpecificLink = async (req, res) => {
  try {
    const { id } = req.params;
    const condition = {
      column: "id",
      value: id,
    };
    const result = await getSingleRow("share_app", condition);
    if (result.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Share link not found" });
    }
    return res.status(200).json({ statusCode: 200, link: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAlllinks = async (req, res) => {
  try {
   
    let linkQuery = `SELECT * FROM share_app ORDER BY created_at DESC`;

    

    const { rows } = await pool.query(linkQuery);
      res.status(200).json({
        statusCode: 200,
        totalLinks: rows.length,
        AllLinks: rows,
      });
    
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const updateLink = async (req, res) => {
  try {
    const { link, id } = req.body;
    const query = "SELECT * FROM share_app WHERE id=$1";
    const oldlink = await pool.query(query, [id]);
    if (oldlink.rows.length === 0) {
      return res.status(404).json({ message: "Share link not found" });
    }

    const updatelink = `UPDATE share_app SET link=$1, "updated_at"=NOW() WHERE id=$2 RETURNING *`;
    const result = await pool.query(updatelink, [link, id]);
    if (result.rowCount === 1) {
      return res
        .status(200)
        .json({
          statusCode: 200,
          message: "Share link updated successfully",
          link: result.rows[0],
        });
    } else {
      res
        .status(404)
        .json({ statusCode: 404, message: "Operation not successfull" });
    }
  } catch (error) {
    console.error(error);
    if(error.constraint==='check_valid_link'){
        return res.status(400).json({ statusCode: 400, message: "Invalid link format" });
      }
    res.status(500).json({ message: "Internal server error" });
  }
};

