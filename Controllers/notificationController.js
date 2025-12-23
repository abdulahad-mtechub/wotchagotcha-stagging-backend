import pool from "../db.config/index.js";
import { getSingleRow } from "../queries/common.js";

export const createNotification = async (req, res) => {
  try {
    const { sender_id, receiver_id, type, title, content } = req.body;
    const createQuery = `
        INSERT INTO public.notification (sender_id, receiver_id, type, title, content)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`;
    const result = await pool.query(createQuery, [
      sender_id,
      receiver_id,
      type,
      title,
      content,
    ]);

    if (result.rowCount === 1) {
      const query = `
        SELECT
          n.id AS notification_id,
          n.title,
          n.content,
          n.is_read,
          n.created_at AS notification_created_at,
          t.name AS notification_type_name,
          u.id AS sender_id,
          u.username AS sender_username,
          u.image AS sender_image,
          r.id AS receiver_id,
          r.username AS receiver_username,
          r.image AS receiver_image
         
        FROM notification n
        JOIN users u ON n.sender_id = u.id
        JOIN users r ON n.receiver_id = r.id
        JOIN notification_type t ON n.type = t.id
        WHERE n.id=$1;`;

      const notifications = await pool.query(query, [result.rows[0].id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Notification created successfully",
        data: notifications.rows[0],
      });
    }
    res
      .status(400)
      .json({ statusCode: 400, message: "Notification not created" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "notification_sender_id_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "Sender user does not exist" });
    } else if (error.constraint === "notification_receiver_id_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "Receiver user does not exist" });
    } else if (error.constraint === "notification_type_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "notification type does not exist" });
    } else {
      res
        .status(500)
        .json({ statusCode: 500, message: "Internal server error" });
    }
  }
};
export const getAllNotificationsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `
      SELECT
        n.id AS notification_id,
        n.title,
        n.content,
        n.is_read,
        n.created_at AS notification_created_at,
        t.name AS notification_type_name,
        u.id AS sender_id,
        u.username AS sender_username,
        u.image AS sender_image,
        r.id AS receiver_id,
        r.username AS receiver_username,
        r.image AS receiver_image
       
      FROM notification n
      JOIN users u ON n.sender_id = u.id
      JOIN users r ON n.receiver_id = r.id
      JOIN notification_type t ON n.type = t.id
      WHERE n.receiver_id=$1 AND r.is_deleted=FALSE
      ORDER BY n.created_at DESC `;

    if (req.query.page !== undefined && req.query.limit !== undefined) {
      query += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [user_id];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [user_id, perPage, offset];
    }
    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalNotifications: rows.length,
        AllNotifications: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalTypesQuery = `SELECT COUNT(*) AS total FROM public.notification n
        JOIN users r ON n.receiver_id = r.id
        WHERE n.receiver_id=$1 AND r.is_deleted=FALSE`;
      const totalTypeResult = await pool.query(totalTypesQuery, [user_id]);

      const totalNotifications = totalTypeResult.rows[0].total;
      const totalPages = Math.ceil(totalNotifications / perPage);
      res.status(200).json({
        statusCode: 200,
        totalNotifications,
        totalPages,
        AllNotifications: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllReadNotificationsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `
      SELECT
        n.id AS notification_id,
        n.title,
        n.content,
        n.is_read,
        n.created_at AS notification_created_at,
        t.name AS notification_type_name,
        u.id AS sender_id,
        u.username AS sender_username,
        u.image AS sender_image,
        r.id AS receiver_id,
        r.username AS receiver_username,
        r.image AS receiver_image
       
      FROM notification n
      JOIN users u ON n.sender_id = u.id
      JOIN users r ON n.receiver_id = r.id
      JOIN notification_type t ON n.type = t.id
      WHERE n.receiver_id=$1 AND n.is_read=TRUE AND r.is_deleted=FALSE
      ORDER BY n.created_at DESC `;

    if (req.query.page !== undefined && req.query.limit !== undefined) {
      query += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [user_id];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [user_id, perPage, offset];
    }
    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalNotifications: rows.length,
        AllNotifications: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalTypesQuery = `SELECT COUNT(*) AS total FROM public.notification n
        JOIN users r ON n.receiver_id = r.id
        WHERE n.receiver_id=$1 AND n.is_read=TRUE AND r.is_deleted=FALSE`;
      const totalTypeResult = await pool.query(totalTypesQuery, [user_id]);

      const totalNotifications = totalTypeResult.rows[0].total;
      const totalPages = Math.ceil(totalNotifications / perPage);
      res.status(200).json({
        statusCode: 200,
        totalNotifications,
        totalPages,
        AllNotifications: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllUnReadNotificationsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let query = `
      SELECT
        n.id AS notification_id,
        n.title,
        n.content,
        n.is_read,
        n.created_at AS notification_created_at,
        t.name AS notification_type_name,
        u.id AS sender_id,
        u.username AS sender_username,
        u.image AS sender_image,
        r.id AS receiver_id,
        r.username AS receiver_username,
        r.image AS receiver_image
       
      FROM notification n
      JOIN users u ON n.sender_id = u.id
      JOIN users r ON n.receiver_id = r.id
      JOIN notification_type t ON n.type = t.id
      WHERE n.receiver_id=$1 AND n.is_read=FALSE AND r.is_deleted=FALSE
      ORDER BY n.created_at DESC `;

    if (req.query.page !== undefined && req.query.limit !== undefined) {
      query += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [user_id];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [user_id, perPage, offset];
    }
    const { rows } = await pool.query(query, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalNotifications: rows.length,
        AllNotifications: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalTypesQuery = `SELECT COUNT(*) AS total FROM public.notification n
        JOIN users r ON n.receiver_id = r.id
        WHERE n.receiver_id=$1 AND n.is_read=FALSE AND r.is_deleted=FALSE`;
      const totalTypeResult = await pool.query(totalTypesQuery, [user_id]);

      const totalNotifications = totalTypeResult.rows[0].total;
      const totalPages = Math.ceil(totalNotifications / perPage);
      res.status(200).json({
        statusCode: 200,
        totalNotifications,
        totalPages,
        AllNotifications: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldType = await getSingleRow("notification", condition);
    if (oldType.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "notification  not found " });
    }
    const delQuery = "DELETE FROM notification WHERE id=$1";
    await pool.query(delQuery, [id]);
    res
      .status(200)
      .json({
        statusCode: 200,
        message: "Notification  deleted successfully",
        deleteNotification: oldType[0],
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const readNotification = async (req, res) => {
  try {
    const { notification_id } = req.body;
    const query = "SELECT * FROM notification WHERE id=$1";
    const oldType = await pool.query(query, [notification_id]);
    if (oldType.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const updateType = `UPDATE notification SET is_read=TRUE, "updated_at"=NOW() WHERE id=$1`;
    const result = await pool.query(updateType, [notification_id]);
    if (result.rowCount === 1) {
      let query = `
        SELECT
          n.id AS notification_id,
          n.title,
          n.content,
          n.is_read,
          n.created_at AS notification_created_at,
          t.name AS notification_type_name,
          u.id AS sender_id,
          u.username AS sender_username,
          u.image AS sender_image,
          r.id AS receiver_id,
          r.username AS receiver_username,
          r.image AS receiver_image
         
        FROM notification n
        JOIN users u ON n.sender_id = u.id
        JOIN users r ON n.receiver_id = r.id
        JOIN notification_type t ON n.type = t.id
        WHERE n.id=$1 AND r.is_deleted=FALSE
        ORDER BY n.created_at DESC `;
      const { rows } = await pool.query(query, [notification_id]);
      return res
        .status(200)
        .json({
          statusCode: 200,
          message: "Notification read successfully",
          readNotification: rows[0],
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
