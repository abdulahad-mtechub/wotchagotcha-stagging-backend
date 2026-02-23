import pool from "../db.config/index.js";
import { getSingleRow } from "../queries/common.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";

export const createItem = async (req, res) => {
  try {
    const {
      user_id,
      item_category,
      sub_category,
      title,
      images,
      description,
      price,
      condition,
      location,
      region,
      paid_status,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "User id is missing",
      });
    }

    // if (req.files.length === 0) {
    //   return res.status(400).json({ message: "Images is required" });
    // }
    // if (req.fileValidationError) {
    //   const media = req.files.map((file) => file.filename);
    //   console.log("Media received----->", media);
    //   handle_delete_photos_from_folder(media, "itemImages");
    //   return res.status(400).json({ error: req.fileValidationError });
    // }
    // const images = req.files.map((file) => `/itemImages/${file.filename}`);
    const createQuery = `INSERT INTO item (user_id,item_category, sub_category, title, description, price,condition,location,paid_status,region) 
        VALUES ($1, $2, $3, $4, $5,$6,$7,$8,$9,$10) RETURNING *`;
    const result = await pool.query(createQuery, [
      user_id,
      item_category,
      sub_category || null,
      title,
      description,
      price,
      condition,
      location,
      paid_status,
      region?.toLowerCase(),
    ]);

    if (result.rowCount === 1) {
      for (const imageUrl of images) {
        const imageResult = await pool.query(
          "INSERT INTO item_images (item_id, image) VALUES ($1, $2)",
          [result.rows[0].id, imageUrl]
        );
        if (imageResult.rowCount === 0) {
          await pool.query("DELETE FROM products WHERE id=$1", [
            result.rows[0].id,
          ]);
          await pool.query("DELETE FROM product_images WHERE product_id=$1", [
            result.rows[0].id,
          ]);
        }
      }
      const getQuery = `
        SELECT
          item.id,
          item.user_id,
          u.username AS username,
          u.image AS userImage,
          item.item_category,
          ic.name AS item_category_name,
          item.title,
          item.region,
          item.description,
          item.price,
          item.condition,
          item.location,
          item.top_post,
          item.paid_status,
          COALESCE(ARRAY_AGG(
            JSONB_BUILD_OBJECT(
              'id', ii.id,
              'image', ii.image
            )
          ), ARRAY[]::JSONB[]) AS images
        FROM item
        LEFT JOIN item_images ii ON item.id = ii.item_id
        LEFT JOIN users u ON item.user_id = u.id
        LEFT JOIN item_category ic ON item.item_category = ic.id
        LEFT JOIN item_sub_category isc ON item.sub_category = isc.id
        WHERE item.id = $1
        GROUP BY
          item.id,
          item.user_id,
          item.item_category,
          item.sub_category,
          item.title,
          item.description,
          item.price,
          item.condition,
          item.location,
          item.top_post,
          item.paid_status,
          u.username,
          u.image,
          ic.name;
      `;

      const getData = await pool.query(getQuery, [result.rows[0].id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Created successfully",
        data: getData.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "check_condition_type") {
      return res.status(400).json({
        statusCode: 400,
        message:
          "Condition attribute data must be same as written in research document",
      });
    } else if (error.constraint === "item_item_category_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Item category not exist" });
    } else if (error.constraint === "item_user_id_fkey") {
      return res
        .status(400)
        .json({ statusCode: 400, message: "user does not exist" });
    }
    res
      .status(500)
      .json({ statusCode: 500, error, message: "Internal server error" });
  }
};
export const updateItem = async (req, res) => {
  try {
    const {
      item_id,
      item_category,
      sub_category,
      title,
      description,
      price,
      condition,
      location,
      region,
      paid_status,
      oldImagesId,
      newImages, // This is the array of image URLs
    } = req.body;

    const oldImageArray = Array.isArray(oldImagesId)
      ? oldImagesId
      : [oldImagesId];
    const query = "SELECT * FROM item WHERE id=$1";
    const oldImage = await pool.query(query, [item_id]);
    if (oldImage.rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (newImages && newImages.length) {
      for (let index = 0; index < newImages.length; index++) {
        if (oldImageArray) {
          const updateQuery = `UPDATE item_images SET image=$1 WHERE item_id=$2 AND id=$3`;
          const updateImageResult = await pool.query(updateQuery, [
            newImages[index],
            item_id,
            oldImageArray[index],
          ]);
          if (updateImageResult.rowCount === 0) {
            const insertQuery = `INSERT INTO item_images (item_id, image) VALUES ($1, $2)`;
            await pool.query(insertQuery, [item_id, newImages[index]]);
          }
        } else {
          const insertQuery = `INSERT INTO item_images (item_id, image) VALUES ($1, $2)`;
          await pool.query(insertQuery, [item_id, newImages[index]]);
        }
      }
    } else if (oldImagesId) {
      if (oldImageArray.length > 0) {
        for (const oldImageUrl of oldImageArray) {
          const deleteOldImagesQuery = `
                  DELETE FROM item_images
                  WHERE item_id = $1
                  AND id = $2
              `;
          await pool.query(deleteOldImagesQuery, [item_id, oldImageUrl]);
          //for deleting image in local folder
          const oldImageFilenames = oldImageArray?.map((imageUrl) =>
            imageUrl.replace("/itemImages/", "")
          );
          handle_delete_photos_from_folder(oldImageFilenames, "itemImages");
        }
      }
    }

    const updateProduct = `UPDATE item SET item_category=$1, sub_category=$2, title=$3,description=$4,price=$5,condition=$6,location=$7,region=$8,paid_status=$9, "updated_at"=NOW() WHERE id=$10 RETURNING *`;
    const result = await pool.query(updateProduct, [
      item_category,
      sub_category || null,
      title,
      description,
      price,
      condition,
      location,
      region,
      paid_status,
      item_id,
    ]);
    if (result.rowCount === 1) {
      const getQuery = `
            SELECT
              item.id,
              item.user_id,
              u.username AS username,
              u.image AS userImage,
              item.item_category,
              item.sub_category,
              ic.name AS item_category_name,
              isc.name AS item_sub_category_name,
              item.title,
              item.region,
              item.description,
              item.price,
              item.condition,
              item.location,
              item.top_post,
              item.paid_status,
              COALESCE(ARRAY_AGG(
                JSONB_BUILD_OBJECT(
                  'id', ii.id,
                  'image', ii.image
                )
              ), ARRAY[]::JSONB[]) AS images
            FROM item
            LEFT JOIN item_images ii ON item.id = ii.item_id
            LEFT JOIN users u ON item.user_id = u.id
            LEFT JOIN item_category ic ON item.item_category = ic.id
            LEFT JOIN item_sub_category isc ON item.sub_category = isc.id
            WHERE item.id = $1
            GROUP BY
              item.id,
              item.user_id,
              item.item_category,
              item.sub_category,
              item.title,
              item.description,
              item.price,
              item.condition,
              item.location,
              item.top_post,
              item.paid_status,
              u.username,
              u.image,
              ic.name,
              isc.name;
      `;

      const getData = await pool.query(getQuery, [item_id]);

      return res.status(200).json({ statusCode: 200, Item: getData.rows[0] });
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
// export const updateItem = async (req, res) => {
//     try {
//       console.log("sdfsff")
//       const {
//         item_id,
//         item_category,
//         title,
//         description,
//         price,
//         condition,
//         location,
//         region,
//         paid_status,
//         oldImagesId
//     } =
//         req.body;
//         console.log(oldImagesId);
//         const oldImageArray = Array.isArray(oldImagesId) ? oldImagesId : [oldImagesId];
//       const query = "SELECT * FROM item WHERE id=$1";
//       const oldImage = await pool.query(query, [item_id]);
//       if (oldImage.rows.length === 0) {
//         return res.status(404).json({ message: "Item not found" });
//       }

//       if (req.files && req.files.length) {
//         console.log("file a gai ha ");
//         //for new image preparation
//         const newImages = req.files.map(
//           (file) => `/itemImages/${file.filename}`
//         );

//           for (let index = 0; index < newImages.length; index++) {
//             if (oldImageArray) {
//               console.log("old image bi ha  ");
//             const updateQuery = `UPDATE item_images SET image=$1 WHERE item_id=$2 AND id=$3`;

//             const updateImageResult = await pool.query(updateQuery, [
//               newImages[index],
//               item_id,
//               oldImageArray[index],
//             ]);
//             if (updateImageResult.rowCount === 0) {
//               console.log("new add hoi ha ku kay wo old image say match ni kr rhi");
//               const insertQuery = `INSERT INTO item_images (item_id, image) VALUES ($1, $2)`;

//                await pool.query(insertQuery, [
//                 item_id,
//                 newImages[index],

//               ]);
//             }
//           }
//           else{
//             console.log("old image ni ha  ");
//             const insertQuery = `INSERT INTO item_images (item_id, image) VALUES ($1, $2)`;

//                  await pool.query(insertQuery, [
//                   item_id,
//                   newImages[index],
//                 ]);
//           }
//         }

//         // if (updateImageResult.rowCount === 0) {
//         //   return res.status(400).json({ message: "Product image not updated " });
//         // }
//         // for (const image of newImages) {

//         //   const updateQuery=`UPDATE product_images SET image_url=$1 WHERE product_id=$2`
//         //   const updateImageResult=await pool.query(updateQuery,[image,id])
//         //   if(updateImageResult.rowCount===0){
//         //     return res.status(400).json({message:"Product image not updated "})
//         //   }
//         // }
//       }
//       else if(oldImagesId){
//         if(oldImageArray.length>0){
//         for (const oldImageUrl of oldImageArray) {
//           const deleteOldImagesQuery = `
//             DELETE FROM item_images
//             WHERE item_id = $1
//             AND id = $2
//           `;

//          await pool.query(deleteOldImagesQuery, [item_id, oldImageUrl]);
//            //for deleting image in local folder
//            const oldImageFilenames = oldImageArray?.map((imageUrl) =>
//            imageUrl.replace("/itemImages/", "")
//          );
//          handle_delete_photos_from_folder(oldImageFilenames, "itemImages");
//           // Check result or handle errors if needed
//         }
//       }
//       }
//   //    // Ensure supplier_id is a valid integer or set it to null if it's not
//   // const supplierIdToUse = Number.isInteger(supplier_id) ? supplier_id : null;

//       const updateProduct = `UPDATE item SET item_category=$1,title=$2,description=$3,price=$4,condition=$5,location=$6,region=$7,paid_status=$8, "updated_at"=NOW() WHERE id=$9 RETURNING *`;
//       const result = await pool.query(updateProduct, [
//         item_category,
//         title,
//         description,
//         price,
//         condition,
//         location,
//         region,
//         paid_status,
//         item_id
//       ]);
//       if (result.rowCount === 1) {
//         const getQuery = `
//         SELECT
//           item.id,
//           item.user_id,
//           u.username AS username,
//           u.image AS userImage,
//           item.item_category,
//           ic.name AS item_category_name,
//           item.title,
//           item.region,
//           item.description,
//           item.price,
//           item.condition,
//           item.location,
//           item.top_post,
//           item.paid_status,
//           COALESCE(ARRAY_AGG(
//             JSONB_BUILD_OBJECT(
//               'id', ii.id,
//               'image', ii.image
//             )
//           ), ARRAY[]::JSONB[]) AS images
//         FROM item
//         LEFT JOIN item_images ii ON item.id = ii.item_id
//         LEFT JOIN users u ON item.user_id = u.id
//         LEFT JOIN item_category ic ON item.item_category = ic.id
//         WHERE item.id = $1
//         GROUP BY
//           item.id,
//           item.user_id,
//           item.item_category,
//           item.title,
//           item.description,
//           item.price,
//           item.condition,
//           item.location,
//           item.top_post,
//           item.paid_status,
//           u.username,
//           u.image,
//           ic.name;
//       `;

//       const getData = await pool.query(getQuery, [item_id]);

//         return res.status(200).json({ statusCode: 200, Item: getData.rows[0] });
//       } else {
//         res
//           .status(404)
//           .json({ statusCode: 404, message: "Operation not successfull" });
//       }
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: "Internal server error" });
//     }
//   };
export const deleteitem = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("item", condition);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Item not found " });
    }

    const condition1 = {
      column: "item_id",
      value: id,
    };
    const oldImage1 = await getSingleRow("item_images", condition1);
    for (const data of oldImage1) {
      const split = data.image.replace("/itemImages/", "");
      handle_delete_photos_from_folder([split], "itemImages");
    }

    const delQuery = "DELETE FROM item WHERE id=$1 RETURNING *";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Item not deleted" });
    }

    res.status(200).json({
      statusCode: 200,
      message: "Item deleted successfully",
      deletedItem: oldImage[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const changePaidStatus = async (req, res) => {
  const { id, status } = req.body;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("item", condition);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Item not found " });
    }

    const delQuery = "UPDATE item SET paid_status=$1 WHERE id=$2 RETURNING *";
    await pool.query(delQuery, [status, id]);

    const getQuery = `
     SELECT
       item.id,
       item.user_id,
       u.username AS username,
       u.image AS userImage,
       item.item_category,
       ic.name AS item_category_name,
       item.title,
       item.region,
       item.description,
       item.price,
       item.condition,
       item.location,
       item.top_post,
       item.paid_status,
       COALESCE(ARRAY_AGG(
         JSONB_BUILD_OBJECT(
           'id', ii.id,
           'image', ii.image
         )
       ), ARRAY[]::JSONB[]) AS images
     FROM item
     LEFT JOIN item_images ii ON item.id = ii.item_id
     LEFT JOIN users u ON item.user_id = u.id
     LEFT JOIN item_category ic ON item.item_category = ic.id
     WHERE item.id = $1
     GROUP BY
       item.id,
       item.user_id,
       item.item_category,
       item.title,
       item.description,
       item.price,
       item.condition,
       item.location,
       item.top_post,
       item.paid_status,
       u.username,
       u.image,
       ic.name;
   `;

    const getData = await pool.query(getQuery, [id]);
    res.status(200).json({
      statusCode: 200,
      message: "Item status change successfully",
      item: getData.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSpecificItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    let sqlQuery = `
      SELECT
        item.id,
        item.user_id,
        u.username AS username,
        u.image AS userImage,
        item.item_category,
        ic.name AS item_category_name,
        item.title,
        item.region,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        COALESCE(ARRAY_AGG(
          JSONB_BUILD_OBJECT(
            'id', ii.id,
            'image', ii.image
          )
        ), ARRAY[]::JSONB[]) AS images`;

    if (user_id) {
      sqlQuery += `,
        CASE WHEN si.id IS NOT NULL THEN true ELSE false END AS is_saved`;
    }

    sqlQuery += `
      FROM item
      LEFT JOIN item_images ii ON item.id = ii.item_id
      LEFT JOIN users u ON item.user_id = u.id
      LEFT JOIN item_category ic ON item.item_category = ic.id`;

    if (user_id) {
      sqlQuery += `
        LEFT JOIN save_item si ON item.id = si.item_id AND si.user_id = $2`;
    }

    sqlQuery += `
      WHERE item.id = $1 AND u.is_deleted=FALSE`;

    if (user_id) {
      sqlQuery += `
        GROUP BY
          item.id,
          item.user_id,
          item.item_category,
          item.title,
          item.description,
          item.price,
          item.condition,
          item.location,
          item.top_post,
          item.paid_status,
          u.username,
          u.image,
          ic.name,
          si.id`;
    } else {
      sqlQuery += `
        GROUP BY
          item.id,
          item.user_id,
          item.item_category,
          item.title,
          item.description,
          item.price,
          item.condition,
          item.location,
          item.top_post,
          item.paid_status,
          u.username,
          u.image,
          ic.name`;
    }

    const queryParams = [id];

    if (user_id) {
      queryParams.push(user_id);
    }

    const data = await pool.query(sqlQuery, queryParams);
    return res.status(200).json({ statusCode: 200, item: data.rows[0] || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllItemByCatgory = async (req, res) => {
  try {
    const { id } = req.params;
    const { region } = req.query;
    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let queryParameters = [id];
    let regionCondition = "";

    if (region) {
      queryParameters.push(region);
      regionCondition =
        "AND LOWER(item.region) ILIKE LOWER($" + queryParameters.length + ")";
    }

    let query = `
        SELECT
          item.id,
          item.user_id,
          u.username AS username,
          u.image AS userImage,
          item.item_category,
          ic.name AS item_category_name,
          item.title,
          item.region,
          item.description,
          item.price,
          item.condition,
          item.location,
          item.top_post,
          item.paid_status,
          COALESCE(ARRAY_AGG(
            JSONB_BUILD_OBJECT(
              'id', ii.id,
              'image', ii.image
            )
          ), ARRAY[]::JSONB[]) AS images
        FROM item
        LEFT JOIN item_images ii ON item.id = ii.item_id
        LEFT JOIN users u ON item.user_id = u.id
        LEFT JOIN item_category ic ON item.item_category = ic.id
        WHERE item.item_category = $1 AND u.is_deleted=FALSE
        ${regionCondition}
        GROUP BY
          item.id,
          item.user_id,
          item.item_category,
          item.title,
          item.region,
          item.description,
          item.price,
          item.condition,
          item.location,
          item.top_post,
          item.paid_status,
          u.username,
          u.image,
          ic.name
          ORDER BY item.created_at DESC
      `;

    if (req.query.page !== undefined && req.query.limit !== undefined) {
      query +=
        " LIMIT $" +
        (queryParameters.length + 1) +
        " OFFSET $" +
        (queryParameters.length + 2);
      queryParameters.push(perPage, offset);
    }

    const data = await pool.query(query, queryParameters);
    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalItems: data.rows.length,
        AllItems: data.rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      let totalItemsQuery = `
        SELECT COUNT(*) AS total FROM item
        LEFT JOIN users u ON item.user_id = u.id
        WHERE item.item_category = $1 AND u.is_deleted=FALSE ${regionCondition}
      `;
      const totalItemsResult = await pool.query(
        totalItemsQuery,
        region ? [id, region.toLowerCase()] : [id]
      );
      const totalItems = totalItemsResult.rows[0].total;
      const totalPages = Math.ceil(totalItems / perPage);

      res.status(200).json({
        statusCode: 200,
        totalItems,
        totalPages,
        AllItems: data.rows,
      });
    }
    //   return res.status(200).json({ statusCode: 200, item: data.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllItemsByUser = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let getQuery = `
      SELECT
        item.id,
        item.user_id,
        u.username AS username,
        u.image AS userImage,
        item.item_category,
        ic.name AS item_category_name,
        item.title,
        item.region,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        COALESCE(ARRAY_AGG(
          JSONB_BUILD_OBJECT(
            'id', ii.id,
            'image', ii.image
          )
        ), ARRAY[]::JSONB[]) AS images
      FROM item
      LEFT JOIN item_images ii ON item.id = ii.item_id
      LEFT JOIN users u ON item.user_id = u.id
      LEFT JOIN item_category ic ON item.item_category = ic.id
      WHERE item.user_id = $1 AND u.is_deleted=FALSE
      GROUP BY
        item.id,
        item.user_id,
        item.item_category,
        item.title,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        u.username,
        u.image,
        ic.name
        ORDER BY item.created_at DESC
    `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      getQuery += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [id];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [id, perPage, offset];
    }

    const { rows } = await pool.query(getQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalItems: rows.length,
        AllItems: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalItemQuery = `SELECT COUNT(*) AS total FROM public.item
        LEFT JOIN users u ON item.user_id = u.id
        WHERE item.user_id=$1 AND u.is_deleted=FALSE`;
      const totalItemsResult = await pool.query(totalItemQuery, [id]);
      const totalItems = totalItemsResult.rows[0].total;
      const totalPages = Math.ceil(totalItems / perPage);

      res.status(200).json({
        statusCode: 200,
        totalItems,
        totalPages,
        AllItems: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllItems = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let getQuery = `
      SELECT
        item.id,
        item.user_id,
        u.username AS username,
        u.image AS userImage,
        item.item_category,
        ic.name AS item_category_name,
        item.title,
        item.region,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        COALESCE(ARRAY_AGG(
          JSONB_BUILD_OBJECT(
            'id', ii.id,
            'image', ii.image
          )
        ), ARRAY[]::JSONB[]) AS images
      FROM item
      LEFT JOIN item_images ii ON item.id = ii.item_id
      LEFT JOIN users u ON item.user_id = u.id
      LEFT JOIN item_category ic ON item.item_category = ic.id
      WHERE u.is_deleted=FALSE
      GROUP BY
        item.id,
        item.user_id,
        item.item_category,
        item.title,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        u.username,
        u.image,
        ic.name
        ORDER BY item.created_at DESC
    `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      getQuery += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(getQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalItems: rows.length,
        AllItems: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalItemQuery = `SELECT COUNT(*) AS total FROM public.item
        LEFT JOIN users u ON item.user_id = u.id
        WHERE u.is_deleted=FALSE
        `;
      const totalItemsResult = await pool.query(totalItemQuery);
      const totalItems = totalItemsResult.rows[0].total;
      const totalPages = Math.ceil(totalItems / perPage);

      res.status(200).json({
        statusCode: 200,
        totalItems,
        totalPages,
        AllItems: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllItemsByPaid = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let getQuery = `
      SELECT
        item.id,
        item.user_id,
        u.username AS username,
        u.image AS userImage,
        item.item_category,
        ic.name AS item_category_name,
        item.title,
        item.region,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        COALESCE(ARRAY_AGG(
          JSONB_BUILD_OBJECT(
            'id', ii.id,
            'image', ii.image
          )
        ), ARRAY[]::JSONB[]) AS images
      FROM item
      LEFT JOIN item_images ii ON item.id = ii.item_id
      LEFT JOIN users u ON item.user_id = u.id
      LEFT JOIN item_category ic ON item.item_category = ic.id
      WHERE item.paid_status=$1 AND u.is_deleted=FALSE
      GROUP BY
        item.id,
        item.user_id,
        item.item_category,
        item.title,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        u.username,
        u.image,
        ic.name
        ORDER BY item.created_at DESC
    `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      getQuery += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [true];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [true, perPage, offset];
    }

    const { rows } = await pool.query(getQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalItems: rows.length,
        AllItems: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalItemQuery = `SELECT COUNT(*) AS total FROM public.item
        LEFT JOIN users u ON item.user_id = u.id
        WHERE item.paid_status=$1 AND u.is_deleted=FALSE`;
      const totalItemsResult = await pool.query(totalItemQuery, [true]);
      const totalItems = totalItemsResult.rows[0].total;
      const totalPages = Math.ceil(totalItems / perPage);

      res.status(200).json({
        statusCode: 200,
        totalItems,
        totalPages,
        AllItems: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const searchitems = async (req, res) => {
  try {
    const { name } = req.query;

    // Split the search query into individual words
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, items: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(title ILIKE '%${word}%' OR description ILIKE '%${word}%' OR condition ILIKE '%${word}%')`;
    });

    const getQuery = `
        SELECT
          item.id,
          item.user_id,
          u.username AS username,
          u.image AS userImage,
          item.item_category,
          ic.name AS item_category_name,
          item.title,
          item.region,
          item.description,
          item.price,
          item.condition,
          item.location,
          item.top_post,
          item.paid_status,
          COALESCE(ARRAY_AGG(
            JSONB_BUILD_OBJECT(
              'id', ii.id,
              'image', ii.image
            )
          ), ARRAY[]::JSONB[]) AS images
        FROM item
        LEFT JOIN item_images ii ON item.id = ii.item_id
        LEFT JOIN users u ON item.user_id = u.id
        LEFT JOIN item_category ic ON item.item_category = ic.id
        WHERE ${conditions.join(" OR ")} AND u.is_deleted=FALSE
        GROUP BY
          item.id,
          item.user_id,
          item.item_category,
          item.title,
          item.description,
          item.price,
          item.condition,
          item.location,
          item.top_post,
          item.paid_status,
          u.username,
          u.image,
          ic.name;
      `;
    const { rows } = await pool.query(getQuery);
    return res
      .status(200)
      .json({ statusCode: 200, totalResults: rows.length, letters: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendOffer = async (req, res) => {
  try {
    const { item_id, sender_id, price } = req.body;

    if (!item_id || !sender_id || !price) {
      return res.status(400).json({
        statusCode: 400,
        message: "All fields are required",
      });
    }

    const createQuery =
      "INSERT INTO send_offer (item_id,sender_id,price) VALUES ($1,$2,$3) RETURNING *";
    const result = await pool.query(createQuery, [item_id, sender_id, price]);

    if (result.rowCount === 1) {
      const getQuery = `
        SELECT
      so.id AS offer_id,
      so.price AS offer_price,
      so.status AS offer_status,
      so.created_at AS offer_created_at,
      u.id AS sender_id,
      u.username AS sender_username,
      u.image AS sender_image,
      i.id AS item_id,
      i.user_id,
      i.title AS item_title,
      i.item_category,
      ic.name AS item_category_name,
      i.title,
      i.region,
      i.description,
      i.price,
      i.condition,
      i.location,
      i.top_post,
      i.paid_status
    
  FROM send_offer so
  JOIN item i ON so.item_id = i.id
  LEFT JOIN item_images ii ON i.id = ii.item_id
  LEFT JOIN item_category ic ON i.item_category = ic.id
  JOIN users u ON so.sender_id = u.id
  WHERE so.id=$1
  `;
      const getData = await pool.query(getQuery, [result.rows[0].id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Your offer sent successfully",
        data: getData.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "send_offer_sender_id_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "Sender user does not exist" });
    } else if (error.constraint === "send_offer_item_id_fkey") {
      res.status(400).json({ statusCode: 400, message: "Item does not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const updateOfferStatus = async (req, res) => {
  try {
    const { offer_id, status } = req.body;

    if (
      status.toLowerCase() !== "accepted" &&
      status.toLowerCase() !== "rejected"
    ) {
      return res.status(400).json({
        statusCode: 400,
        message: "Status must be accepted or rejected",
      });
    }
    const createQuery =
      "UPDATE  send_offer SET status=$1 WHERE id=$2 RETURNING *";
    const result = await pool.query(createQuery, [status, offer_id]);

    if (result.rowCount === 1) {
      const getQuery = `
        SELECT
      so.id AS offer_id,
      so.price AS offer_price,
      so.status AS offer_status,
      so.created_at AS offer_created_at,
      u.id AS sender_id,
      u.username AS sender_username,
      u.image AS sender_image,
      i.id AS item_id,
      i.user_id,
      i.title AS item_title,
      i.item_category,
      ic.name AS item_category_name,
      i.title,
      i.region,
      i.description,
      i.price,
      i.condition,
      i.location,
      i.top_post,
      i.paid_status
    
  FROM send_offer so
  JOIN item i ON so.item_id = i.id
  LEFT JOIN item_images ii ON i.id = ii.item_id
  LEFT JOIN item_category ic ON i.item_category = ic.id
  JOIN users u ON so.sender_id = u.id
  WHERE so.id=$1
  `;
      const getData = await pool.query(getQuery, [result.rows[0].id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Your offer status updated successfully",
        data: getData.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "send_offer_sender_id_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "Sender user does not exist" });
    } else if (error.constraint === "send_offer_item_id_fkey") {
      res.status(400).json({ statusCode: 400, message: "Item does not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const getQuery = `
        SELECT
        so.id AS offer_id,
        so.price AS offer_price,
        so.created_at AS offer_created_at,
        u.id AS sender_id,
        u.username AS sender_username,
        u.image AS sender_image,
        i.id AS item_id,
        i.title AS item_title,
        i.region AS item_region,
        i.description AS item_description,
        i.price AS item_price,
        i.condition AS item_condition,
        i.location AS item_location,
        i.top_post AS item_top_post,
        i.paid_status AS item_paid_status,
        COALESCE(ARRAY_AGG(
          JSONB_BUILD_OBJECT(
            'id', ii.id,
            'image', ii.image
          )
        ), ARRAY[]::JSONB[]) AS images
      
      FROM send_offer so
      JOIN item i ON so.item_id = i.id
      JOIN users u ON so.sender_id = u.id
      LEFT JOIN item_images ii ON i.id = ii.item_id
      WHERE so.id = $1 AND (so.sender_id=u.id AND u.is_deleted=FALSE) 
      GROUP BY
        so.id, so.price, so.created_at, u.id, u.username, u.image, i.id, i.title, i.region,
        i.description, i.price, i.condition, i.location, i.top_post, i.paid_status;
      
  `;
    const getData = await pool.query(getQuery, [id]);
    return res.status(200).json({
      statusCode: 200,
      data: getData.rows[0] || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getAllOfferByItem = async (req, res) => {
  try {
    const { id } = req.params;
    const getQuery = `
        SELECT
        i.id AS item_id,
        i.title AS item_title,
        i.region AS item_region,
        i.description AS item_description,
        i.price AS item_price,
        i.condition AS item_condition,
        i.location AS item_location,
        i.top_post AS item_top_post,
        i.paid_status AS item_paid_status,
        COALESCE(ARRAY_AGG(
          JSONB_BUILD_OBJECT(
            'offer_id', so.id,
            'price', so.price,
            'created_at', so.created_at,
            'sender_id', u.id,
            'sender_username', u.username,
            'sender_image', u.image
          )
        ), ARRAY[]::JSONB[]) AS offers
      FROM item i
      LEFT JOIN send_offer so ON i.id = so.item_id
      LEFT JOIN users u ON so.sender_id = u.id
      WHERE i.id = $1 AND u.is_deleted=FALSE
    
      GROUP BY
        i.id, i.title, i.region, i.description, i.price, i.condition, i.location, i.top_post, i.paid_status,so.created_at
      
        ORDER BY so.created_at DESC
  `;
    const getData = await pool.query(getQuery, [id]);
    return res.status(201).json({
      statusCode: 201,
      total: getData.rows.length,
      data: getData.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deleteAllItems = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query1 = "SELECT *  FROM item_images";
    const images = await pool.query(query1);

    if (images.rows.length > 0) {
      const imageFilenames = images.rows?.map((news) =>
        news.image.replace("/itemImages/", "")
      );
      handle_delete_photos_from_folder(imageFilenames, "itemImages");
    }

    const query = "DELETE FROM item RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No item found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All items deleted successfully",
      deletedItem: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const saveItem = async (req, res) => {
  try {
    const { item_id, user_id } = req.body;

    if (!item_id || !user_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "All fields are required",
      });
    }

    const checkUser = await pool.query(`SELECT * FROM users WHERE id=$1`, [
      user_id,
    ]);

    if (checkUser.rows.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not exist" });
    }

    const query = "SELECT * FROM save_item WHERE item_id=$1 AND user_id=$2";
    const oldItem = await pool.query(query, [item_id, user_id]);
    if (oldItem.rows.length > 0) {
      return res.status(404).json({ message: "Item already saved" });
    }
    const createQuery =
      "INSERT INTO save_item (item_id,user_id) VALUES ($1,$2) RETURNING *";
    const result = await pool.query(createQuery, [item_id, user_id]);

    if (result.rowCount === 1) {
      const getQuery = `
        SELECT
          item.id,
          item.user_id,
          u.username AS username,
          u.image AS userImage,
          item.item_category,
          ic.name AS item_category_name,
          item.title,
          item.region,
          item.description,
          item.price,
          item.condition,
          item.location,
          item.top_post,
          item.paid_status,
          COALESCE(ARRAY_AGG(
            JSONB_BUILD_OBJECT(
              'id', ii.id,
              'image', ii.image
            )
          ), ARRAY[]::JSONB[]) AS images,
          CASE WHEN si.id IS NOT NULL THEN true ELSE false END AS is_saved
        FROM save_item
        LEFT JOIN item  ON save_item.item_id = item.id
        LEFT JOIN item_images ii ON item.id = ii.item_id
        LEFT JOIN users u ON item.user_id = u.id
        LEFT JOIN item_category ic ON item.item_category = ic.id
        LEFT JOIN save_item si ON item.id = si.item_id AND si.user_id=$2
        WHERE save_item.id = $1
        GROUP BY
          item.id,
          item.user_id,
          item.item_category,
          item.title,
          item.description,
          item.price,
          item.condition,
          item.location,
          item.top_post,
          item.paid_status,
          u.username,
          u.image,
          ic.name,
          si.id;
      `;

      const getData = await pool.query(getQuery, [result.rows[0].id, user_id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Item saved successfully",
        data: getData.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "save_item_user_id_fkey") {
      res.status(400).json({ statusCode: 400, message: "user does not exist" });
    } else if (error.constraint === "save_item_item_id_fkey") {
      res.status(400).json({ statusCode: 400, message: "Item does not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const unSaveItem = async (req, res) => {
  try {
    const { item_id, user_id } = req.body;

    if (!item_id || !user_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "All fields are required",
      });
    }

    const checkUser = await pool.query(`SELECT * FROM users WHERE id=$1`, [
      user_id,
    ]);

    if (checkUser.rows.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not exist" });
    }

    const query = "SELECT * FROM save_item WHERE item_id=$1 AND user_id=$2";
    const oldItem = await pool.query(query, [item_id, user_id]);
    if (oldItem.rows.length === 0) {
      return res.status(404).json({ message: "Saved item not found" });
    }
    const deleteItem = await pool.query(
      `DELETE FROM save_item WHERE item_id=$1 AND user_id=$2`,
      [item_id, user_id]
    );

    if (deleteItem.rowCount === 1) {
      //   const getQuery = `
      //   SELECT
      //     item.id,
      //     item.user_id,
      //     u.username AS username,
      //     u.image AS userImage,
      //     item.item_category,
      //     ic.name AS item_name,
      //     item.title,
      //     item.region,
      //     item.description,
      //     item.price,
      //     item.condition,
      //     item.location,
      //     item.top_post,
      //     item.paid_status,
      //     COALESCE(ARRAY_AGG(
      //       JSONB_BUILD_OBJECT(
      //         'id', ii.id,
      //         'image', ii.image
      //       )
      //     ), ARRAY[]::JSONB[]) AS images,
      //     CASE WHEN si.id IS NOT NULL THEN true ELSE false END AS is_saved
      //   FROM save_item
      //   LEFT JOIN item  ON save_item.item_id = item.id
      //   LEFT JOIN item_images ii ON item.id = ii.item_id
      //   LEFT JOIN users u ON item.user_id = u.id
      //   LEFT JOIN item_category ic ON item.item_category = ic.id
      //   LEFT JOIN save_item si ON item.id = si.item_id AND si.user_id = $2
      //   WHERE save_item.item_id = $1 AND save_item.user_id=$2
      //   GROUP BY
      //     item.id,
      //     item.user_id,
      //     item.item_category,
      //     item.title,
      //     item.description,
      //     item.price,
      //     item.condition,
      //     item.location,
      //     item.top_post,
      //     item.paid_status,
      //     u.username,
      //     u.image,
      //     ic.name
      //     si.id;
      // `;

      // const getData = await pool.query(getQuery, [item_id,user_id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Item unsave successfully",
        data: oldItem.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllSavedItemsByUser = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    const checkUser = await pool.query(
      `SELECT * FROM users WHERE id=$1 AND is_deleted=FALSE`,
      [id]
    );

    if (checkUser.rows.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not exist" });
    }
    let getQuery = `
      SELECT
        item.id,
        item.user_id,
        u.username AS username,
        u.image AS userImage,
        item.item_category,
        ic.name AS item_category_name,
        item.title,
        item.region,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        COALESCE(ARRAY_AGG(
          JSONB_BUILD_OBJECT(
            'id', ii.id,
            'image', ii.image
          )
        ), ARRAY[]::JSONB[]) AS images,
        CASE WHEN si.id IS NOT NULL THEN true ELSE false END AS is_saved
      FROM save_item
      LEFT JOIN item  ON save_item.item_id = item.id
      LEFT JOIN item_images ii ON item.id = ii.item_id
      LEFT JOIN users u ON item.user_id = u.id
      LEFT JOIN item_category ic ON item.item_category = ic.id
      LEFT JOIN save_item si ON item.id = si.item_id AND si.user_id = $1
      WHERE save_item.user_id = $1
      GROUP BY
        item.id,
        item.user_id,
        item.item_category,
        item.title,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        u.username,
        u.image,
        ic.name,
        si.id
    `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      getQuery += ` LIMIT $2 OFFSET $3;`;
    }
    let queryParameters = [id];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [id, perPage, offset];
    }

    const { rows } = await pool.query(getQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalItems: rows.length,
        AllSavedItems: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalItemQuery = `SELECT COUNT(*) AS total FROM public.save_item WHERE user_id=$1`;
      const totalItemsResult = await pool.query(totalItemQuery, [id]);
      const totalItems = totalItemsResult.rows[0].total;
      const totalPages = Math.ceil(totalItems / perPage);

      res.status(200).json({
        statusCode: 200,
        totalItems,
        totalPages,
        AllSavedItems: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const searchSaveItems = async (req, res) => {
  try {
    const { name } = req.query;
    const { id } = req.params;
    // Split the search query into individual words
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, items: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(item.title ILIKE '%${word}%' OR item.description ILIKE '%${word}%' OR item.condition ILIKE '%${word}%')`;
    });

    let getQuery = `
      SELECT
        item.id,
        item.user_id,
        u.username AS username,
        u.image AS userImage,
        item.item_category,
        ic.name AS item_category_name,
        item.title,
        item.region,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        COALESCE(ARRAY_AGG(
          JSONB_BUILD_OBJECT(
            'id', ii.id,
            'image', ii.image
          )
        ), ARRAY[]::JSONB[]) AS images,
        CASE WHEN si.id IS NOT NULL THEN true ELSE false END AS is_saved
      FROM save_item
      LEFT JOIN item  ON save_item.item_id = item.id
      LEFT JOIN item_images ii ON item.id = ii.item_id
      LEFT JOIN users u ON item.user_id = u.id
      LEFT JOIN item_category ic ON item.item_category = ic.id
      LEFT JOIN save_item si ON item.id = si.item_id AND si.user_id = $1
      WHERE save_item.user_id = $1 AND u.is_deleted=FALSE AND ${conditions.join(
        " OR "
      )} 
      GROUP BY
        item.id,
        item.user_id,
        item.item_category,
        item.title,
        item.description,
        item.price,
        item.condition,
        item.location,
        item.top_post,
        item.paid_status,
        u.username,
        u.image,
        ic.name,
        si.id
    `;
    const { rows } = await pool.query(getQuery, [id]);
    return res
      .status(200)
      .json({ statusCode: 200, totalResults: rows.length, items: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const toggleAlert = async (req, res) => {
  try {
    const { user_id, category_id } = req.body;

    if (!user_id || !category_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "All fields are required",
      });
    }

    const checkUser = await pool.query(`SELECT * FROM users WHERE id=$1`, [
      user_id,
    ]);

    if (checkUser.rows.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User not exist" });
    }

    const checkCategory = await pool.query(
      `SELECT * FROM item_category WHERE id=$1`,
      [category_id]
    );

    if (checkCategory.rows.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Category not exist" });
    }

    const checkAlert = await pool.query(
      `SELECT * FROM alerts WHERE user_id=$1 AND category_id=$2`,
      [user_id, category_id]
    );

    if (checkAlert.rows.length > 0) {
      await pool.query(
        `DELETE FROM alerts WHERE user_id=$1 AND category_id=$2`,
        [user_id, category_id]
      );

      return res
        .status(201)
        .json({ statusCode: 201, message: "Alert removed successfully" });
    }

    await pool.query(
      `INSERT INTO alerts (user_id, category_id) VALUES ($1, $2)`,
      [user_id, category_id]
    );

    return res.status(201).json({
      statusCode: 201,
      message: "You will be notified when a new item is added to this category",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAlert = async (req, res) => {
  try {
    const { user_id, category_id } = req.body;

    const checkAlert = await pool.query(
      `SELECT id FROM alerts WHERE user_id=$1 AND category_id=$2`,
      [user_id, category_id]
    );

    if (checkAlert.rows.length > 0) {
      return res.status(200).json({ statusCode: 200, alert: true });
    }

    return res.status(200).json({ statusCode: 200, alert: false });
  } catch (error) {
    console.error(error);
  }
};
