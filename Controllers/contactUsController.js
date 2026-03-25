import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
export const createContactUs = async (req, res) => {
  try {
    const { fullname, email_address, message } = req.body;
    const fullNameSafe = (typeof fullname === 'string' && fullname.trim().length > 0) ? fullname.trim() : 'Anonymous';
    const createQuery =
      "INSERT INTO contact_us (full_name,email_address,message) VALUES ($1,$2,$3) RETURNING *";
    const result = await pool.query(createQuery, [fullNameSafe, email_address || null, message || null]);

    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "Message submitted successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
  } catch (error) {
    console.error(error);
    if(error.constraint==='check_valid_status'){
        return res.status(400).json({ statusCode: 400, message: "Status should be either read or unread" });
      }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const deleteMessage = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldMessage = await getSingleRow("contact_us", condition);
    if (oldMessage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Message not found " });
    }
    const delQuery = "DELETE FROM contact_us WHERE id=$1";
    await pool.query(delQuery, [id]);
    res
      .status(200)
      .json({
        statusCode: 200,
        message: "Message deleted successfully",
        deletedMessage: oldMessage[0],
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSpecificMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const condition = {
      column: "id",
      value: id,
    };
    const result = await getSingleRow("contact_us", condition);
    if (result.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Message not found" });
    }
    return res.status(200).json({ statusCode: 200, message: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllMessages = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let messageQuery = `SELECT * FROM contact_us ORDER BY created_at DESC`;

    if (req.query.page === undefined && req.query.limit === undefined) {
      messageQuery = `SELECT * FROM contact_us ORDER BY created_at DESC`;
    } else {
      messageQuery += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(messageQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalMessages: rows.length,
        AllMessages: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalMessagesQuery = `SELECT COUNT(*) AS total FROM public.contact_us`;
      const totalCategoryResult = await pool.query(totalMessagesQuery);
      const totalMessages = totalCategoryResult.rows[0].total;
      const totalPages = Math.ceil(totalMessages / perPage);

      res.status(200).json({
        statusCode: 200,
        totalMessages,
        totalPages,
        AllMessages: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const updateMessage = async (req, res) => {
    try {
      const { id,fullname,email_address,message } = req.body;
  
      // Check if the record with the specified id exists
      const existingRecord = await pool.query(
        "SELECT * FROM contact_us WHERE id = $1",
        [id]
      );
  
      if (existingRecord.rows.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: "Message with the provided id not found",
        });
      }
  
      // Update the existing record
      const updateQuery = `
        UPDATE contact_us
        SET full_name = $2, email_address = $3, message = $4,updated_at=NOW()
        WHERE id = $1
        RETURNING *`;
        
      const updateResult = await pool.query(updateQuery, [id, fullname,email_address,message]);
  
      if (updateResult.rowCount === 1) {
        return res.status(200).json({
          statusCode: 200,
          message: "Message updated successfully",
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
  export const updateMessageStatus = async (req, res) => {
    try {
      const { id,status } = req.body;
  
      // Check if the record with the specified id exists
      const existingRecord = await pool.query(
        "SELECT * FROM contact_us WHERE id = $1",
        [id]
      );
  
      if (existingRecord.rows.length === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: "Message with the provided id not found",
        });
      }
  
      // Update the existing record
      const updateQuery = `
        UPDATE contact_us
        SET status = $2,updated_at=NOW()
        WHERE id = $1
        RETURNING *`;
        
      const updateResult = await pool.query(updateQuery, [id,status]);
  
      if (updateResult.rowCount === 1) {
        return res.status(200).json({
          statusCode: 200,
          message: "Message ststus updated successfully",
          data: updateResult.rows[0],
        });
      } else {
        res.status(400).json({ statusCode: 400, message: "Update failed" });
      }
    } catch (error) {
      console.error(error);
      if(error.constraint==='check_valid_status'){
        return res.status(400).json({ statusCode: 400, message: "Status should be either read or unread" });
      }
      res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
  };

