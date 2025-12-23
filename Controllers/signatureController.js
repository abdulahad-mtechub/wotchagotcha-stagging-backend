import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";
export const createSignature = async (req, res) => {
  try {
    const { user_id, image } = req.body;
    // if (req.file) {
    const checkQuery = "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult = await pool.query(checkQuery, [user_id]);

    if (checkResult.rowCount === 0) {
      // handle_delete_photos_from_folder([req.file?.filename], "signatureImages");
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }
    // let imagePath = `/signatureImages/${req.file.filename}`;
    const createQuery =
      "INSERT INTO signature (user_id,image) VALUES($1,$2) RETURNING *";
    const result = await pool.query(createQuery, [
      user_id,
      // imagePath,
      image,
    ]);
    if (result.rowCount === 1) {
      const data = await pool.query(
        `
            SELECT
            s.id AS signature_id,
            s.image AS signature_image,
            s.created_at AS signature_created_at,
            s.user_id AS user_id,
            u.username AS username,
            u.image AS userImage
        FROM signature s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id=$1
        `,
        [result.rows[0].id]
      );
      return res
        .status(201)
        .json({
          statusCode: 201,
          message: "Signature created successfully",
          data: data.rows[0],
        });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
    // } else {
    //   res.status(400).json({ statusCode: 400, message: "image not uploaded" });
    // }
  } catch (error) {
    handle_delete_photos_from_folder([req.file?.filename], "signatureImages");
    if (error.constraint === "signature_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Receiver user does not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deleteSignature = async (req, res) => {
  const { id } = req.params;
  console.log("hsgdshgdiusagfjsyh");
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("signature", condition);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Signature not found " });
    }
    const oldImageSplit = oldImage[0].image.replace("/signatureImages/", "");
    const delQuery = "DELETE FROM signature WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "signature not deleted" });
    }
    handle_delete_photos_from_folder([oldImageSplit], "signatureImages");
    res
      .status(200)
      .json({
        statusCode: 200,
        message: "Signature deleted successfully",
        deletedSignature: oldImage[0],
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSpecificSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await pool.query(
      `SELECT
            s.id AS signature_id,
            s.image AS signature_image,
            s.created_at AS signature_created_at,
            s.user_id AS user_id,
            u.username AS username,
            u.image AS userImage
        FROM signature s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id=$1 AND u.is_deleted=FALSE
        `,
      [id]
    );
    return res
      .status(200)
      .json({ statusCode: 200, Signature: data.rows[0] || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllSignature = async (req, res) => {
  try {
    console.log(req.query);
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let signatureQuery = ` SELECT
    s.id AS signature_id,
    s.image AS signature_image,
    s.created_at AS signature_created_at,
    s.user_id AS user_id,
    u.username AS username,
    u.image AS userImage
FROM signature s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.is_deleted=FALSE
ORDER BY s.created_at DESC
`;

    if (req.query.page === undefined && req.query.limit === undefined) {
      console.log("00000");
      // If no query parameters for pagination are provided, fetch all categories without pagination
      signatureQuery = ` SELECT
      s.id AS signature_id,
      s.image AS signature_image,
      s.created_at AS signature_created_at,
      s.user_id AS user_id,
      u.username AS username,
      u.image AS userImage
  FROM signature s
  LEFT JOIN users u ON s.user_id = u.id
  WHERE u.is_deleted=FALSE
  ORDER BY s.created_at DESC
  `;
    } else {
      signatureQuery += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(signatureQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalSignatures: rows.length,
        AllSignatures: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalBlogsQuery = `SELECT COUNT(*) AS total FROM public.signature
      LEFT JOIN users u ON signature.user_id = u.id
  WHERE u.is_deleted=FALSE
      `;
      const totalBlogsResult = await pool.query(totalBlogsQuery);
      const totalSignatures = totalBlogsResult.rows[0].total;
      const totalPages = Math.ceil(totalSignatures / perPage);

      res.status(200).json({
        statusCode: 200,
        totalSignatures,
        totalPages,
        AllSignature: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllSignatureByUserId = async (req, res) => {
  try {
    console.log(req.query);
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let signatureQuery = ` SELECT
      s.id AS signature_id,
      s.image AS signature_image,
      s.created_at AS signature_created_at,
      s.user_id AS user_id,
      u.username AS username,
      u.image AS userImage
  FROM signature s
  LEFT JOIN users u ON s.user_id = u.id
  WHERE s.user_id=$1 AND u.is_deleted=FALSE
  ORDER BY s.created_at DESC
  `;

    if (req.query.page === undefined && req.query.limit === undefined) {
      console.log("00000");
      // If no query parameters for pagination are provided, fetch all categories without pagination
      signatureQuery = ` SELECT
        s.id AS signature_id,
        s.image AS signature_image,
        s.created_at AS signature_created_at,
        s.user_id AS user_id,
        u.username AS username,
        u.image AS userImage
    FROM signature s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.user_id=$1 AND u.is_deleted=FALSE
    ORDER BY s.created_at DESC
    `;
    } else {
      signatureQuery += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [id];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [id, perPage, offset];
    }

    const { rows } = await pool.query(signatureQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalSignatures: rows.length,
        AllSignatures: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalBlogsQuery = `SELECT COUNT(*) AS total FROM public.signature
        LEFT JOIN users u ON signature.user_id = u.id
        WHERE signature.user_id=$1 AND u.is_deleted=FALSE
        `;
      const totalBlogsResult = await pool.query(totalBlogsQuery, [id]);
      const totalSignatures = totalBlogsResult.rows[0].total;
      const totalPages = Math.ceil(totalSignatures / perPage);

      res.status(200).json({
        statusCode: 200,
        totalSignatures,
        totalPages,
        AllSignature: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const updateSignature = async (req, res) => {
  try {
    const { id, image } = req.body;
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("signature", condition);
    if (!oldImage) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Signature not found " });
    }
    let updateData = {
      image: oldImage[0].image,
    };
    if (image) {
      updateData.image = image;
      const imageSplit = oldImage[0].image.replace("/fileUpload/", "");
      handle_delete_photos_from_folder([imageSplit], "fileUpload");
    }

    const updateType = `UPDATE signature SET image=$1,"updated_at"=NOW() WHERE id=$2 RETURNING *`;
    const result = await pool.query(updateType, [updateData.image, id]);
    if (result.rowCount === 1) {
      const data = await pool.query(
        `
            SELECT
            s.id AS signature_id,
            s.image AS signature_image,
            s.created_at AS signature_created_at,
            s.user_id AS user_id,
            u.username AS username,
            u.image AS userImage
        FROM signature s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id=$1
        `,
        [result.rows[0].id]
      );
      return res
        .status(200)
        .json({ statusCode: 200, updateSignature: data.rows[0] });
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
export const deleteAllSignature = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM signature RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No signature found to delete",
      });
    }
    const imageFilenames = rows.map((news) =>
      news.image.replace("/signatureImages/", "")
    );
    handle_delete_photos_from_folder(imageFilenames, "signatureImages");
    res.status(200).json({
      statusCode: 200,
      message: "All signature deleted successfully",
      deletedSignature: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
