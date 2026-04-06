import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";
import moment from "moment";
export const createPostLetter = async (req, res) => {
  try {
    const {
      user_id,
      post_type,
      receiver_type,
      image,
      video,
      disc_category,
      disc_sub_category,
      name,
      address,
      email,
      contact_no,
      subject_place,
      post_date,
      greetings,
      introduction,
      body,
      form_of_appeal,
      signature_id,
      paid_status,
      receiver_id,
      //   reciever_name,
      receiver_address,
      shared_post_id,
    } = req.body;
    if (image?.length > 0 && video) {
      return res.status(400).json({
        statusCode: 400,
        message: "You can upload either images or video ",
      });
    }
    if (image?.length > 5) {
      return res
        .status(400)
        .json({ statusCode: 400, message: "You can upload maximum 5 images" });
    }
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      // handle_delete_photos_from_folder([req.file?.filename], "picTourImages");
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }

    // post_letters.signature_id is NOT NULL — resolve when client omits it
    let finalSignatureId =
      signature_id != null && signature_id !== ""
        ? Number(signature_id)
        : null;
    if (finalSignatureId != null && Number.isNaN(finalSignatureId)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid signature_id",
      });
    }
    if (finalSignatureId != null) {
      const sigCheck = await pool.query(
        "SELECT id FROM signature WHERE id = $1 AND user_id = $2",
        [finalSignatureId, user_id]
      );
      if (sigCheck.rowCount === 0) {
        return res.status(400).json({
          statusCode: 400,
          message: "signature_id not found or does not belong to this user",
        });
      }
    } else if (
      shared_post_id != null &&
      shared_post_id !== "" &&
      !Number.isNaN(Number(shared_post_id))
    ) {
      // Share/repost: reuse original letter's signature (sharer may have no signature row)
      const orig = await pool.query(
        "SELECT signature_id FROM post_letters WHERE id = $1",
        [shared_post_id]
      );
      if (orig.rowCount === 0) {
        return res.status(404).json({
          statusCode: 404,
          message: "shared_post_id not found",
        });
      }
      const sid = orig.rows[0].signature_id;
      if (sid == null) {
        return res.status(400).json({
          statusCode: 400,
          message: "Original letter has no signature; cannot share",
        });
      }
      const sigExists = await pool.query(
        "SELECT id FROM signature WHERE id = $1",
        [sid]
      );
      if (sigExists.rowCount === 0) {
        return res.status(400).json({
          statusCode: 400,
          message: "Original letter signature no longer exists",
        });
      }
      finalSignatureId = sid;
    } else {
      const defaultSig = await pool.query(
        "SELECT id FROM signature WHERE user_id = $1 ORDER BY id ASC LIMIT 1",
        [user_id]
      );
      if (defaultSig.rowCount === 0) {
        return res.status(400).json({
          statusCode: 400,
          message:
            "signature_id is required, or create a signature first for this user",
        });
      }
      finalSignatureId = defaultSig.rows[0].id;
    }
    // console.log(req.body.receiver_type);
    // if (req.files.length) {
    // if (req.fileValidationError) {
    //   const media = req.files.map((file) => file.filename);
    //   console.log("Media received----->", media);
    //   handle_delete_photos_from_folder(media, "letterMedia");
    //   return res.status(400).json({ error: req.fileValidationError });
    // }
    // const userExists = await pool.query("SELECT 1 FROM users WHERE id = $1", [user_id]);
    // const signatureExists = await pool.query("SELECT 1 FROM signature WHERE id = $1", [signature_id]);
    // const dicCategoryExist = await pool.query("SELECT 1 FROM disc_category WHERE id = $1", [disc_category]);

    // if (userExists.rowCount === 0 || signatureExists.rowCount === 0 || dicCategoryExist.rowCount === 0) {
    //   const nonExistentEntities = [];
    //   if (userExists.rowCount === 0) nonExistentEntities.push("User");
    //   if (signatureExists.rowCount === 0) nonExistentEntities.push("Signature");
    //   if (dicCategoryExist.rowCount === 0) nonExistentEntities.push("Disc Category");

    //   const media = req.files.map((file) => file.filename);
    //   console.log("Media received----->", media);
    //   handle_delete_photos_from_folder(media, "letterMedia");

    //   return res.status(404).json({
    //     statusCode: 404,
    //     message: `The following entities do not exist: ${nonExistentEntities.join(', ')}`,
    //   });
    // }

    //   let mediaPath = `/letterMedia/${req.file.filename}`;
    let mediaPath = null;

    if (image?.length > 0) {
      mediaPath = image.map((file) => file);
    } else if (video) {
      mediaPath = video;
    }
    // if (req.files[0].mimetype.startsWith("image/")) {
    //   mediaPath = req.files.map((file) => `/letterMedia/${file.filename}`);
    // } else if (req.files[0].mimetype.startsWith("video/")) {
    //   mediaPath = `/letterMedia/${req.files[0].filename}`;
    // }
    console.log(mediaPath);
    // DB check_paid_status: paid_status = (post_type = 'private') — public is always unpaid
    const isPaid = post_type === "private";
    const createQuery = `INSERT INTO post_letters (user_id,post_type,receiver_type,disc_category , disc_sub_category,name,address,email,
            contact_no,subject_place,post_date,greetings,introduction,body,form_of_appeal,video,
            signature_id,paid_status, shared_post_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17 , $18, $19) RETURNING *`;
    const result = await pool.query(createQuery, [
      user_id,
      post_type,
      receiver_type,
      disc_category,
      disc_sub_category || null,
      name || "",
      address || "",
      email || "",
      contact_no || "",
      subject_place || "",
      post_date || new Date().toISOString(),
      greetings || "",
      introduction || "",
      body || "",
      form_of_appeal || "",
      image?.length > 0 ? null : mediaPath,
      finalSignatureId,
      isPaid,
      shared_post_id || null,
    ]);

    if (result.rowCount === 1) {
      // if (req.files[0].mimetype.startsWith("image/")) {
      if (image?.length > 0) {
        for (const image of mediaPath) {
          await pool.query(
            `INSERT INTO post_letters_images(letter_id,image) VALUES($1,$2)
                `,
            [result.rows[0].id, image]
          );
        }
      }
      if (post_type === "private") {
        await pool.query(
          `INSERT INTO letter_reciever_info(letter_id,reciever_id,address) VALUES($1,$2,$3)
            `,
          [result.rows[0].id, receiver_id, receiver_address]
        );
      }
      const data = await pool.query(
        `SELECT
          pl.id AS post_id,
          pl.user_id,
          u.username,
          u.image AS userImage,
          pl.post_type,
          pl.receiver_type,
          pl.disc_category,
          d.name AS disc_category_name,
          pl.disc_sub_category,
          sc.name AS disc_sub_category_name,
          pl.name,
          pl.address,
          pl.email,
          pl.contact_no,
          pl.subject_place,
          pl.post_date,
          pl.greetings,
          pl.introduction,
          pl.body,
          pl.form_of_appeal,
          pl.video,
          pl.signature_id,
          pl.paid_status,
          COALESCE(
            json_agg(
              json_build_object('id', pli.id, 'image', pli.image)
            ) FILTER (WHERE pli.id IS NOT NULL),
            '[]'::json
          ) AS images,
          lru.username AS receiver_name,
          lru.image AS reciever_image,
          lri.address AS receiver_address,
          pl.shared_post_id,
          orig.name AS original_name,
          orig.address AS original_address,
          orig.body AS original_body,
          orig_u.username AS original_username,
          orig_u.image AS original_user_image,
          orig.created_at AS original_created_at
      FROM
          post_letters AS pl
      LEFT JOIN
          post_letters_images AS pli ON pl.id = pli.letter_id
          LEFT JOIN
          users AS u ON pl.user_id = u.id
      LEFT JOIN
          letter_reciever_info AS lri ON pl.id = lri.letter_id
          LEFT JOIN
          users AS lru ON lri.reciever_id = lru.id
   
       LEFT JOIN
          disc_category AS d ON pl.disc_category = d.id
       LEFT JOIN 
          disc_sub_category AS sc ON pl.disc_sub_category = sc.id
       LEFT JOIN
          post_letters AS orig ON pl.shared_post_id = orig.id
       LEFT JOIN
          users AS orig_u ON orig.user_id = orig_u.id
      
      WHERE
          pl.id = $1
      GROUP BY
          pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category, sc.name, pl.name, pl.address,
          pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
          pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, lru.username,lru.image,
          u.image, lri.address, u.username,d.name, orig.id, orig_u.id;

        `,
        [result.rows[0].id]
      );
      if (data.rows[0].shared_post_id) {
        data.rows[0].original_post = {
          id: data.rows[0].shared_post_id,
          name: data.rows[0].original_name,
          address: data.rows[0].original_address,
          body: data.rows[0].original_body,
          username: data.rows[0].original_username,
          user_image: data.rows[0].original_user_image,
          created_at: data.rows[0].original_created_at,
        };
      } else {
        data.rows[0].original_post = null;
      }

      return res.status(201).json({
        statusCode: 201,
        message: "Letter created successfully",
        data: {
          ...data.rows[0],
          post_date: moment(data.rows[0].post_date).format("MM-DD-YYYY"),
        },
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not created" });
    // } else {
    //   res.status(400).json({ statusCode: 400, message: "media not uploaded" });
    // }
  } catch (error) {
    // const media = Array.isArray(req.body.image)?req.body.image.map((file) => file);
    // console.log("Media recieved----->", media);
    // handle_delete_photos_from_folder(media, "letterMedia");
    console.error(error);
    if (error.constraint === "check_paid_status") {
      return res.status(400).json({
        statusCode: 400,
        message: "Paid status wrong (set according to post type)",
      });
    } else if (error.constraint === "check_receiver_type") {
      return res.status(400).json({
        statusCode: 400,
        message: "reciever type should be same as mentioned in postman doc",
      });
    } else if (error.constraint === "post_letters_user_id_fkey") {
      return res.status(400).json({
        statusCode: 400,
        message: "user_id not exist",
      });
    } else if (error.constraint === "post_letters_disc_category_fkey") {
      return res.status(400).json({
        statusCode: 400,
        message: "disc_category not exist",
      });
    } else if (error.constraint === "post_letters_signature_id_fkey") {
      return res.status(400).json({
        statusCode: 400,
        message: "signature_id not exist",
      });
    }
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const updatePostLetter = async (req, res) => {
  try {
    const {
      letterId,
      user_id,
      post_type,
      receiver_type,
      disc_category,
      disc_sub_category,
      name,
      address,
      email,
      contact_no,
      subject_place,
      post_date,
      greetings,
      introduction,
      body,
      form_of_appeal,
      signature_id,
      paid_status,
      reciever_id,
      reciever_address,
    } = req.body;
    const condition = {
      column: "id",
      value: letterId,
    };

    const oldImage = await getSingleRow("post_letters", condition);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Post letter not found " });
    }
    // Check if a record exists for the letter
    const ifExistQuery = `SELECT * FROM letter_reciever_info WHERE letter_id = $1`;
    const ifExistResult = await pool.query(ifExistQuery, [letterId]);
    if (ifExistResult.rows.length > 0) {
      if (post_type === "private") {
        const updateRecieverInfoQuery = `UPDATE letter_reciever_info SET reciever_id = $1, address = $2 WHERE letter_id = $3`;
        await pool.query(updateRecieverInfoQuery, [
          reciever_id,
          reciever_address,
          letterId,
        ]);
      } else {
        const deleteRecieverInfoQuery = `DELETE FROM letter_reciever_info WHERE letter_id = $1`;
        await pool.query(deleteRecieverInfoQuery, [letterId]);
      }
    } else {
      if (post_type === "private") {
        // Insert the new receiver info
        const insertRecieverInfoQuery = `INSERT INTO letter_reciever_info (letter_id, reciever_id, address) VALUES ($1, $2, $3)`;
        await pool.query(insertRecieverInfoQuery, [
          letterId,
          reciever_id,
          reciever_address,
        ]);
      }
    }
    const updateFields = [];
    const queryParams = [letterId];

    if (user_id !== undefined) {
      updateFields.push(`user_id = $${queryParams.length + 1}`);
      queryParams.push(user_id);
    }

    if (post_type !== undefined) {
      updateFields.push(`post_type = $${queryParams.length + 1}`);
      queryParams.push(post_type);
      // Keep paid_status aligned with DB check_paid_status
      updateFields.push(`paid_status = $${queryParams.length + 1}`);
      queryParams.push(post_type === "private");
    }

    if (receiver_type !== undefined) {
      updateFields.push(`receiver_type = $${queryParams.length + 1}`);
      queryParams.push(receiver_type);
    }

    if (disc_category !== undefined) {
      updateFields.push(`disc_category = $${queryParams.length + 1}`);
      queryParams.push(disc_category);
    }
    if (disc_sub_category !== undefined) {
      updateFields.push(`disc_sub_category = $${queryParams.length + 1}`);
      queryParams.push(disc_sub_category);
    }

    if (name !== undefined) {
      updateFields.push(`name = $${queryParams.length + 1}`);
      queryParams.push(name);
    }

    if (address !== undefined) {
      updateFields.push(`address = $${queryParams.length + 1}`);
      queryParams.push(address);
    }

    if (email !== undefined) {
      updateFields.push(`email = $${queryParams.length + 1}`);
      queryParams.push(email);
    }

    if (contact_no !== undefined) {
      updateFields.push(`contact_no = $${queryParams.length + 1}`);
      queryParams.push(contact_no);
    }

    if (subject_place !== undefined) {
      updateFields.push(`subject_place = $${queryParams.length + 1}`);
      queryParams.push(subject_place);
    }

    if (post_date !== undefined) {
      updateFields.push(`post_date = $${queryParams.length + 1}`);
      queryParams.push(post_date);
    }

    if (greetings !== undefined) {
      updateFields.push(`greetings = $${queryParams.length + 1}`);
      queryParams.push(greetings);
    }

    if (introduction !== undefined) {
      updateFields.push(`introduction = $${queryParams.length + 1}`);
      queryParams.push(introduction);
    }

    if (body !== undefined) {
      updateFields.push(`body = $${queryParams.length + 1}`);
      queryParams.push(body);
    }

    if (form_of_appeal !== undefined) {
      updateFields.push(`form_of_appeal = $${queryParams.length + 1}`);
      queryParams.push(form_of_appeal);
    }

    if (signature_id !== undefined) {
      updateFields.push(`signature_id = $${queryParams.length + 1}`);
      queryParams.push(signature_id);
    }

    if (paid_status !== undefined && post_type === undefined) {
      const expectedPaid = oldImage[0].post_type === "private";
      const wantsPaid = paid_status === "paid" || paid_status === true;
      if (wantsPaid !== expectedPaid) {
        return res.status(400).json({
          statusCode: 400,
          message: "Paid status wrong (set according to post type)",
        });
      }
      updateFields.push(`paid_status = $${queryParams.length + 1}`);
      queryParams.push(wantsPaid);
    }

    // Construct the full update query
    let updateQuery = `UPDATE post_letters SET ${updateFields.join(
      ", "
    )} WHERE id = $1 RETURNING *`;

    const result = await pool.query(updateQuery, queryParams);

    // Fetch the updated data to send back in the response
    const data = await pool.query(
      `SELECT
            pl.id AS post_id,
            pl.user_id,
            u.username,
            u.image AS userImage,
            pl.post_type,
            pl.receiver_type,
            pl.disc_category,
            d.name AS disc_category_name,
            pl.disc_sub_category,
            sc.name AS sub_category_name,
            pl.name,
            pl.address,
            pl.email,
            pl.contact_no,
            pl.subject_place,
            pl.post_date,
            pl.greetings,
            pl.introduction,
            pl.body,
            pl.form_of_appeal,
            pl.video,
            pl.signature_id,
            pl.paid_status,
            COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
            lru.username AS receiver_name,
            lru.image AS reciever_image,
            lri.address AS receiver_address
          FROM
            post_letters AS pl
          LEFT JOIN
            post_letters_images AS pli ON pl.id = pli.letter_id
            LEFT JOIN
            users AS u ON pl.user_id = u.id
          LEFT JOIN
            letter_reciever_info AS lri ON pl.id = lri.letter_id
            LEFT JOIN
            users AS lru ON lri.reciever_id = lru.id
          LEFT JOIN
            disc_category AS d ON pl.disc_category = d.id
            LEFT JOIN
            disc_sub_category AS sc ON pl.disc_sub_category = sc.id
          WHERE
            pl.id = $1
          GROUP BY
            pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category,
            sc.name, pl.name, pl.address,
            pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
            pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, lru.username, lru.image,
            u.image, lri.address, u.username, d.name;
          `,
      [letterId]
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Post letter updated successfully",
      data: {
        ...data.rows[0],
        post_date: moment(data.rows[0].post_date).format("MM-DD-YYYY"),
      },
    });
    // }

    // return res.status(404).json({ statusCode: 404, message: "Post letter not found" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "check_paid_status") {
      return res.status(500).json({
        statusCode: 500,
        message: "Paid status wrong (set according to post type)",
      });
    } else if (error.constraint === "check_receiver_type") {
      return res.status(400).json({
        statusCode: 400,
        message: "reciever type should be same as mentioned in postman doc",
      });
    } else if (error.constraint === "post_letters_user_id_fkey") {
      return res.status(400).json({
        statusCode: 400,
        message: "user_id not exist",
      });
    } else if (error.constraint === "post_letters_disc_category_fkey") {
      return res.status(400).json({
        statusCode: 400,
        message: "disc_category not exist",
      });
    } else if (error.constraint === "post_letters_signature_id_fkey") {
      return res.status(400).json({
        statusCode: 400,
        message: "signature_id not exist",
      });
    }
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const updatePostLetterImages = async (req, res) => {
  try {
    let { letterId, oldImageIds, image, video } = req.body;

    const condition = {
      column: "id",
      value: letterId,
    };
    const oldImage = await getSingleRow("post_letters", condition);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Post letter not found " });
    }

    oldImageIds = Array.isArray(oldImageIds) ? oldImageIds : [oldImageIds];

    if ((image && image.length) || video) {
      if (video) {
        const updateQuery = `UPDATE post_letters SET video=$1 WHERE  id=$2`;

        const updateImageResult = await pool.query(updateQuery, [
          video,
          letterId,
        ]);
        if (updateImageResult.rowCount === 0) {
          return res
            .status(400)
            .json({ statusCode: 400, message: "Video cannot updated" });
        }
        await pool.query(`DELETE FROM post_letters_images WHERE letter_id=$1`, [
          letterId,
        ]);
      } else {
        await pool.query(`UPDATE post_letters SET video=$1`, [""]);

        for (let index = 0; index < image.length; index++) {
          if (oldImageIds && oldImageIds.length > 0) {
            console.log("old image bi ha  ");
            const updateQuery = `UPDATE post_letters_images SET image=$1 WHERE  id=$2`;

            const updateImageResult = await pool.query(updateQuery, [
              image[index],
              oldImageIds[index],
            ]);
            if (updateImageResult.rowCount === 0) {
              console.log(
                "new add hoi ha ku kay wo old image say match ni kr rhi"
              );
              const insertQuery = `INSERT INTO post_letters_images (letter_id, image) VALUES ($1, $2)`;

              await pool.query(insertQuery, [letterId, image[index]]);
            }
          } else {
            console.log("old image ni ha  ");
            const insertQuery = `INSERT INTO post_letters_images (letter_id, image) VALUES ($1, $2)`;

            await pool.query(insertQuery, [letterId, image[index]]);
          }
        }
      }
    } else if (oldImageIds) {
      if (oldImageIds.length > 0) {
        for (const oldImageId of oldImageIds) {
          const deleteOldImagesQuery = `
          DELETE FROM post_letters_images
          WHERE letter_id = $1
          AND id = $2
        `;

          await pool.query(deleteOldImagesQuery, [letterId, oldImageId]);
        }
      }
    }
    const data = await pool.query(
      `SELECT
            pl.id AS post_id,
            pl.user_id,
            u.username,
            u.image AS userImage,
            pl.post_type,
            pl.receiver_type,
            pl.disc_category,
            d.name AS disc_category_name,
            pl.name,
            pl.address,
            pl.email,
            pl.contact_no,
            pl.subject_place,
            pl.post_date,
            pl.greetings,
            pl.introduction,
            pl.body,
            pl.form_of_appeal,
            pl.video,
            pl.signature_id,
            pl.paid_status,
            COALESCE(
              json_agg(
                json_build_object('id', pli.id, 'image', pli.image)
              ) FILTER (WHERE pli.id IS NOT NULL),
              '[]'::json
            ) AS images,
            lru.username AS receiver_name,
            lru.image AS reciever_image,
            lri.address AS receiver_address
          FROM
            post_letters AS pl
          LEFT JOIN
            post_letters_images AS pli ON pl.id = pli.letter_id
            LEFT JOIN
            users AS u ON pl.user_id = u.id
          LEFT JOIN
            letter_reciever_info AS lri ON pl.id = lri.letter_id
            LEFT JOIN
            users AS lru ON lri.reciever_id = lru.id
          LEFT JOIN
            disc_category AS d ON pl.disc_category = d.id
          WHERE
            pl.id = $1
          GROUP BY
            pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category, pl.name, pl.address,
            pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
            pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, lru.username, lru.image,
            u.image, lri.address, u.username, d.name;
          `,
      [letterId]
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Post letter images updated successfully",
      data: {
        ...data.rows[0],
        post_date: moment(data.rows[0].post_date).format("MM-DD-YYYY"),
      },
    });
    // }

    // return res.status(404).json({ statusCode: 404, message: "Post letter not found" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "check_paid_status") {
      return res.status(500).json({
        statusCode: 500,
        message: "Paid status wrong (set according to post type)",
      });
    }
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
// export const updatePostLetterImages = async (req, res) => {
//   try {
//     let { letterId, oldImageIds,images,video } = req.body;
//     console.log(oldImageIds);
//     const condition = {
//       column: "id",
//       value: letterId,
//     };
//     const oldImage = await getSingleRow("post_letters", condition);
//     if (oldImage.length === 0) {
//       return res
//         .status(404)
//         .json({ statusCode: 404, message: "Post letter not found " });
//     }
//      oldImageIds = Array.isArray(oldImageIds) ? oldImageIds : [oldImageIds];
//      console.log(oldImageIds.length);
//     if (req.files && req.files.length) {
//       if (req.fileValidationError) {
//         const media = req.files.map((file) => file.filename);
//         console.log("Media received----->", media);
//         handle_delete_photos_from_folder(media, "letterMedia");
//         return res.status(400).json({ error: req.fileValidationError });
//       }
//       if (req.files[0].mimetype.startsWith("video/")) {
//         const updateQuery = `UPDATE post_letters SET video=$1 WHERE  id=$2`;

//         const updateImageResult = await pool.query(updateQuery, [
//          req.files[0].filename,
//          letterId,
//         ]);
//         if(updateImageResult.rowCount===0){
//           return res.status(400).json({statusCode:400,message:"Video cannot updated"})
//         }
//         await pool.query(`DELETE FROM post_letters_images WHERE letter_id=$1`,[letterId])
//       }else{
//         await pool.query(`UPDATE post_letters SET video=$1`,[''])
//         const newImages = req.files.map(
//           (file) => `/letterMedia/${file.filename}`
//         );

//         for (let index = 0; index < newImages.length; index++) {
//           if (oldImageIds && oldImageIds.length >0 ) {
//             console.log("old image bi ha  ");
//             const updateQuery = `UPDATE post_letters_images SET image=$1 WHERE  id=$2`;

//             const updateImageResult = await pool.query(updateQuery, [
//               newImages[index],
//               oldImageIds[index],
//             ]);
//             if (updateImageResult.rowCount === 0) {
//               console.log(
//                 "new add hoi ha ku kay wo old image say match ni kr rhi"
//               );
//               const insertQuery = `INSERT INTO post_letters_images (letter_id, image) VALUES ($1, $2)`;

//               await pool.query(insertQuery, [letterId, newImages[index]]);
//             }else{
//               const del=oldImageIds[index].replace("/letterMedia/", "")
//             handle_delete_photos_from_folder([del], "letterMedia");
//             }
//           } else {
//             console.log("old image ni ha  ");
//             const insertQuery = `INSERT INTO post_letters_images (letter_id, image) VALUES ($1, $2)`;

//             await pool.query(insertQuery, [letterId, newImages[index]]);
//           }
//         }
//       }

//     } else if(oldImageIds){
//       if(oldImageIds.length>0){
//       for (const oldImageId of oldImageIds) {
//         const deleteOldImagesQuery = `
//           DELETE FROM post_letters_images
//           WHERE letter_id = $1
//           AND id = $2
//         `;

//        await pool.query(deleteOldImagesQuery, [letterId, oldImageId]);
//          //for deleting image in local folder
//          const oldImageFilenames = oldImageIds?.map((imageUrl) =>
//          imageUrl.replace("/letterMedia/", "")
//        );
//        handle_delete_photos_from_folder(oldImageFilenames, "letterMedia");
//         // Check result or handle errors if needed
//       }
//     }
//     }
//     const data = await pool.query(
//       `SELECT
//             pl.id AS post_id,
//             pl.user_id,
//             u.username,
//             u.image AS userImage,
//             pl.post_type,
//             pl.receiver_type,
//             pl.disc_category,
//             d.name AS disc_category_name,
//             pl.name,
//             pl.address,
//             pl.email,
//             pl.contact_no,
//             pl.subject_place,
//             pl.post_date,
//             pl.greetings,
//             pl.introduction,
//             pl.body,
//             pl.form_of_appeal,
//             pl.video,
//             pl.signature_id,
//             pl.paid_status,
//             COALESCE(
//               json_agg(
//                 json_build_object('id', pli.id, 'image', pli.image)
//               ) FILTER (WHERE pli.id IS NOT NULL),
//               '[]'::json
//             ) AS images,
//             lru.username AS receiver_name,
//             lru.image AS reciever_image,
//             lri.address AS receiver_address
//           FROM
//             post_letters AS pl
//           LEFT JOIN
//             post_letters_images AS pli ON pl.id = pli.letter_id
//             LEFT JOIN
//             users AS u ON pl.user_id = u.id
//           LEFT JOIN
//             letter_reciever_info AS lri ON pl.id = lri.letter_id
//             LEFT JOIN
//             users AS lru ON lri.reciever_id = lru.id
//           LEFT JOIN
//             disc_category AS d ON pl.disc_category = d.id
//           WHERE
//             pl.id = $1
//           GROUP BY
//             pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category, pl.name, pl.address,
//             pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
//             pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, lru.username, lru.image,
//             u.image, lri.address, u.username, d.name;
//           `,
//       [letterId]
//     );

//     return res.status(200).json({
//       statusCode: 200,
//       message: "Post letter images updated successfully",
//       data: {
//         ...data.rows[0],
//         post_date: moment(data.rows[0].post_date).format("MM-DD-YYYY"),
//       },
//     });
//     // }

//     // return res.status(404).json({ statusCode: 404, message: "Post letter not found" });
//   } catch (error) {
//     console.error(error);
//     if (error.constraint === "check_paid_status") {
//       return res
//         .status(500)
//         .json({
//           statusCode: 500,
//           message: "Paid status wrong (set according to post type)",
//         });
//     }
//     res
//       .status(500)
//       .json({ statusCode: 500, message: "Internal server error", error });
//   }
// };
export const deleteLetter = async (req, res) => {
  const { id } = req.params;

  console.log("enter to delete api ....");
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("post_letters", condition);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Post letter not found " });
    }
    if (oldImage[0].video) {
      const split = oldImage[0].video.replace("/letterMedia/", "");
      handle_delete_photos_from_folder([split], "letterMedia");
    } else {
      const condition = {
        column: "letter_id",
        value: id,
      };
      const oldImage = await getSingleRow("post_letters_images", condition);
      for (const data of oldImage) {
        const split = data.image?.replace("/letterMedia/", "");
        handle_delete_photos_from_folder([split], "letterMedia");
      }
    }
    const delQuery = "DELETE FROM post_letters WHERE id=$1 RETURNING *";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Letter not deleted" });
    }

    res.status(200).json({
      statusCode: 200,
      message: "Post letter deleted successfully",
      deletedLetter: oldImage[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getSpecificLetter = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await pool.query(
      `SELECT
        pl.id AS post_id,
        pl.user_id,
        u.username,
        u.image AS userImage,
        pl.post_type,
        pl.receiver_type,
        pl.disc_category,
        d.name AS disc_category_name,
        pl.disc_sub_category,
        sc.name as disc_sub_category_name,
        pl.name,
        pl.address,
        pl.email,
        pl.contact_no,
        pl.subject_place,
        pl.post_date,
        pl.greetings,
        pl.introduction,
        pl.body,
        pl.form_of_appeal,
        pl.video,
        pl.signature_id,
        pl.paid_status,
        COALESCE(
          json_agg(
            json_build_object('id', pli.id, 'image', pli.image)
          ) FILTER (WHERE pli.id IS NOT NULL),
          '[]'::json
        ) AS images,
       
        lru.username AS receiver_name,
        lru.image AS reciever_image,
        lri.address AS receiver_address
    FROM
        post_letters AS pl
    LEFT JOIN
        users AS u ON pl.user_id = u.id
    LEFT JOIN
        post_letters_images AS pli ON pl.id = pli.letter_id
    LEFT JOIN
        letter_reciever_info AS lri ON pl.id = lri.letter_id
    LEFT JOIN
        users AS lru ON lri.reciever_id = lru.id
  
     LEFT JOIN
        disc_category AS d ON pl.disc_category = d.id

      LEFT JOIN
        disc_sub_category AS sc ON pl.disc_sub_category = sc.id
    WHERE
        pl.id = $1 AND u.is_deleted=FALSE
    GROUP BY
        pl.id, pl.user_id, pl.post_type, pl.receiver_type, sc.name, pl.disc_category, pl.name, pl.address,
        pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
        pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, lru.username,lru.image,
        u.image, lri.address, u.username,d.name;

      `,
      [id]
    );
    return res
      .status(200)
      .json({ statusCode: 200, postLetter: data.rows[0] || [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllLetter = async (req, res) => {
  try {
    console.log(req.query);
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let signatureQuery = `SELECT
    pl.id AS post_id,
    pl.user_id,
    u.username,
    u.image AS userImage,
    pl.post_type,
    pl.receiver_type,
    pl.disc_category,
    d.name AS disc_category_name,
    d.french_name AS disc_category_french_name,
    pl.disc_sub_category,
    sc.name as disc_sub_category_name,
    sc.french_name AS disc_sub_category_french_name,
    pl.name,
    pl.address,
    pl.email,
    pl.contact_no,
    pl.subject_place,
    pl.post_date,
    pl.greetings,
    pl.introduction,
    pl.body,
    pl.form_of_appeal,
    pl.video,
    pl.signature_id,
    pl.top_letter,
    sig.image AS signature_image,
    pl.paid_status,
    COALESCE(ARRAY_AGG(pli.image) FILTER (WHERE pli.id IS NOT NULL), ARRAY[]::TEXT[]) AS images,
    lru.username AS receiver_name,
    lru.image AS reciever_image,
    lri.address AS receiver_address,
    pl.shared_post_id,
    orig.name AS original_name,
    orig.address AS original_address,
    orig.body AS original_body,
    orig_u.username AS original_username,
    orig_u.image AS original_user_image,
    orig.created_at AS original_created_at
FROM
    post_letters AS pl
    LEFT JOIN
    users AS u ON pl.user_id = u.id
LEFT JOIN
    post_letters_images AS pli ON pl.id = pli.letter_id
LEFT JOIN
    letter_reciever_info AS lri ON pl.id = lri.letter_id
    LEFT JOIN
    users AS lru ON lri.reciever_id = lru.id
    LEFT JOIN
    signature sig ON pl.signature_id = sig.id

 LEFT JOIN
    disc_category AS d ON pl.disc_category = d.id
    LEFT JOIN
    disc_sub_category AS sc ON pl.disc_sub_category = sc.id
 LEFT JOIN
    post_letters AS orig ON pl.shared_post_id = orig.id
 LEFT JOIN
    users AS orig_u ON orig.user_id = orig_u.id

    WHERE u.is_deleted=FALSE
GROUP BY
    pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category,sc.name, pl.name, pl.address,
    pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
    pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, 
    lru.username,lru.image,
    u.image, lri.address, u.username,d.name, sig.image, d.french_name, sc.french_name, orig.id, orig_u.id
ORDER BY pl.created_at DESC
  `;


    if (req.query.page === undefined && req.query.limit === undefined) {
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
      const AllLetters = rows.map((row) => {
        if (row.shared_post_id) {
          row.original_post = {
            id: row.shared_post_id,
            name: row.original_name,
            address: row.original_address,
            body: row.original_body,
            username: row.original_username,
            user_image: row.original_user_image,
            created_at: row.original_created_at,
          };
        } else {
          row.original_post = null;
        }
        return row;
      });
      res.status(200).json({
        statusCode: 200,
        totalLetters: rows.length,
        AllLetters: AllLetters,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.post_letters 
      LEFT JOIN
      users AS u ON post_letters.user_id = u.id
      WHERE u.is_deleted=FALSE
      `;
      const totalLettersResult = await pool.query(totalLetterQuery);
      const totalLetters = totalLettersResult.rows[0].total;
      const totalPages = Math.ceil(totalLetters / perPage);

      const AllLetter = rows.map((row) => {
        if (row.shared_post_id) {
          row.original_post = {
            id: row.shared_post_id,
            name: row.original_name,
            address: row.original_address,
            body: row.original_body,
            username: row.original_username,
            user_image: row.original_user_image,
            created_at: row.original_created_at,
          };
        } else {
          row.original_post = null;
        }
        return row;
      });

      res.status(200).json({
        statusCode: 200,
        totalLetters,
        totalPages,
        AllLetter: AllLetter,
      });
    }

  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllLetterByUser = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let signatureQuery = `SELECT
      pl.id AS post_id,
      pl.user_id,
      u.username,
      u.image AS userImage,
      pl.post_type,
      pl.receiver_type,
      pl.disc_category,
      d.name AS disc_category_name,
      d.french_name AS disc_category_french_name,
      pl.disc_sub_category,
      sc.name as disc_sub_category_name,
      sc.french_name AS disc_sub_category_french_name,
      pl.name,
      pl.address,
      pl.email,
      pl.contact_no,
      pl.subject_place,
      pl.post_date,
      pl.greetings,
      pl.introduction,
      pl.body,
      pl.form_of_appeal,
      pl.video,
      pl.signature_id,
      sig.image AS signature_image,
      pl.paid_status,
      COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
      lru.username AS receiver_name,
      lru.image AS reciever_image,
      lri.address AS receiver_address
  FROM
      post_letters AS pl
  LEFT JOIN
      post_letters_images AS pli ON pl.id = pli.letter_id
  LEFT JOIN
    signature sig ON pl.signature_id = sig.id
  LEFT JOIN
      letter_reciever_info AS lri ON pl.id = lri.letter_id
      
 LEFT JOIN
 users AS lru ON lri.reciever_id = lru.id
   LEFT JOIN
      users AS u ON pl.user_id = u.id
   LEFT JOIN
      disc_category AS d ON pl.disc_category = d.id
      LEFT JOIN
      disc_sub_category AS sc ON pl.disc_sub_category = sc.id


      WHERE pl.user_id=$1 AND u.is_deleted=FALSE
  GROUP BY
      pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category,sc.name, pl.name, pl.address,
      pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
      pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, 
      lru.username,lru.image,
      u.image, lri.address, u.username,d.name, sig.image, d.french_name, sc.french_name
  ORDER BY pl.created_at DESC
    `;

    if (req.query.page === undefined && req.query.limit === undefined) {
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
        totalLetters: rows.length,
        AllLetters: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.post_letters
      LEFT JOIN
      users AS u ON post_letters.user_id = u.id
      
      WHERE post_letters.user_id=$1 AND u.is_deleted=FALSE`;
      const totalLettersResult = await pool.query(totalLetterQuery, [id]);
      const totalLetters = totalLettersResult.rows[0].total;
      const totalPages = Math.ceil(totalLetters / perPage);

      res.status(200).json({
        statusCode: 200,
        totalLetters,
        totalPages,
        AllLetter: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllLetterByPostType = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const { postType } = req.query;
    if (postType !== "public" && postType !== "private") {
      return res.status(400).json({
        statusCode: 400,
        message: "Post type should be public or private",
      });
    }

    const offset = (page - 1) * perPage;
    let signatureQuery = `SELECT
      pl.id AS post_id,
      pl.user_id,
      u.username,
      u.image AS userImage,
      pl.post_type,
      pl.receiver_type,
      pl.disc_category,
      d.name AS disc_category_name,
      pl.disc_sub_category,
      sc.name as disc_sub_category_name,
      pl.name,
      pl.address,
      pl.email,
      pl.contact_no,
      pl.subject_place,
      pl.post_date,
      pl.greetings,
      pl.introduction,
      pl.body,
      pl.form_of_appeal,
      pl.video,
      pl.signature_id,
      sig.image AS signature_image,
      pl.paid_status,
      COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
      lru.username AS receiver_name,
      lru.image AS reciever_image,
      lri.address AS receiver_address
    FROM
      post_letters AS pl
    LEFT JOIN
      post_letters_images AS pli ON pl.id = pli.letter_id
    LEFT JOIN
      letter_reciever_info AS lri ON pl.id = lri.letter_id
    LEFT JOIN
      users AS lru ON lri.reciever_id = lru.id
    LEFT JOIN
      signature sig ON pl.signature_id = sig.id
    LEFT JOIN
      users AS u ON pl.user_id = u.id
    LEFT JOIN
      disc_category AS d ON pl.disc_category = d.id
      LEFT JOIN
      disc_sub_category AS sc ON pl.disc_sub_category = sc.id
    WHERE pl.post_type = $1 AND pl.disc_category = $2 AND u.is_deleted = FALSE
    GROUP BY
      pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category,sc.name, pl.name, pl.address,
      pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
      pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, lru.username, lru.image,
      u.image, lri.address, u.username, d.name, sig.image
    ORDER BY pl.created_at
    `;

    let queryParameters = [postType, id];

    if (req.query.page !== undefined && req.query.limit !== undefined) {
      signatureQuery += ` LIMIT $3 OFFSET $4;`;
      queryParameters.push(perPage, offset);
    }

    console.log(queryParameters);
    const { rows } = await pool.query(signatureQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalLetters: rows.length,
        AllLetters: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.post_letters
      LEFT JOIN
      users AS u ON post_letters.user_id = u.id
      WHERE post_letters.post_type = $1 AND u.is_deleted = FALSE AND post_letters.disc_category = $2`;
      const totalLettersResult = await pool.query(totalLetterQuery, [
        postType,
        id,
      ]);
      const totalLetters = totalLettersResult.rows[0].total;
      const totalPages = Math.ceil(totalLetters / perPage);

      res.status(200).json({
        statusCode: 200,
        totalLetters,
        totalPages,
        AllLetter: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const getAllLetterByDiscCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let signatureQuery = `SELECT
      pl.id AS post_id,
      pl.user_id,
      u.username,
      u.image AS userImage,
      pl.post_type,
      pl.receiver_type,
      pl.disc_category,
      d.name AS disc_category_name,
      d.french_name AS disc_category_french_name,
      pl.disc_sub_category,
      sc.name as disc_sub_category_name,
      sc.french_name AS disc_sub_category_french_name,
      pl.name,
      pl.address,
      pl.email,
      pl.contact_no,
      pl.subject_place,
      pl.post_date,
      pl.greetings,
      pl.introduction,
      pl.body,
      pl.form_of_appeal,
      pl.video,
      pl.signature_id,
      sig.image AS signature_image,
      pl.paid_status,
      COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
      lri.reciever_id,
      lri.address AS receiver_address
  FROM
      post_letters AS pl
  LEFT JOIN
      post_letters_images AS pli ON pl.id = pli.letter_id
  LEFT JOIN
      letter_reciever_info AS lri ON pl.id = lri.letter_id
  LEFT JOIN
     signature sig ON pl.signature_id = sig.id
   LEFT JOIN
      users AS u ON pl.user_id = u.id
   LEFT JOIN
      disc_category AS d ON pl.disc_category = d.id
      LEFT JOIN
         disc_sub_category AS sc ON pl.disc_sub_category = sc.id
      WHERE pl.disc_category=$1 AND u.is_deleted=FALSE

  GROUP BY
      pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category, sc.name , pl.name, pl.address,
      pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
      pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, lri.reciever_id,
      u.image, lri.address, u.username,d.name, sig.image, d.french_name, sc.french_name
  ORDER BY pl.created_at
    `;

    if (req.query.page === undefined && req.query.limit === undefined) {
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
        totalLetters: rows.length,
        AllLetters: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.post_letters
      LEFT JOIN
      users AS u ON post_letters.user_id = u.id
      WHERE post_letters.disc_category=$1 AND u.is_deleted=FALSE`;
      const totalLettersResult = await pool.query(totalLetterQuery, [id]);
      const totalLetters = totalLettersResult.rows[0].total;
      const totalPages = Math.ceil(totalLetters / perPage);

      res.status(200).json({
        statusCode: 200,
        totalLetters,
        totalPages,
        AllLetter: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const getAllLetterPublicGeneral = async (req, res) => {
  try {
    console.log(req.query);
    const { id } = req.params;
    console.log(id);
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);

    const offset = (page - 1) * perPage;
    let signatureQuery = `SELECT
      pl.id AS post_id,
      pl.user_id,
      u.username,
      u.image AS userImage,
      pl.post_type,
      pl.receiver_type,
      pl.disc_category,
      d.name AS disc_category_name,
      pl.disc_sub_category,
      sc.name as disc_sub_category_name,
      pl.name,
      pl.address,
      pl.email,
      pl.contact_no,
      pl.subject_place,
      pl.post_date,
      pl.greetings,
      pl.introduction,
      pl.body,
      pl.form_of_appeal,
      pl.video,
      pl.signature_id,
      sig.image AS signature_image,
      pl.paid_status,
      COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
      lru.username AS receiver_name,
      lru.image AS reciever_image,
      lri.address AS receiver_address
  FROM
      post_letters AS pl
  LEFT JOIN
      post_letters_images AS pli ON pl.id = pli.letter_id
        LEFT JOIN
    signature sig ON pl.signature_id = sig.id
  LEFT JOIN
      letter_reciever_info AS lri ON pl.id = lri.letter_id
      LEFT JOIN
      users AS lru ON lri.reciever_id = lru.id

   LEFT JOIN
      users AS u ON pl.user_id = u.id
   LEFT JOIN
      disc_category AS d ON pl.disc_category = d.id
      LEFT JOIN
      disc_sub_category AS sc ON pl.disc_sub_category = sc.id
      WHERE
       pl.post_type = $2
      AND pl.receiver_type = $3 AND
      pl.disc_category = $1 
      AND u.is_deleted=FALSE
  GROUP BY
      pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category,sc.name, pl.name, pl.address,
      pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
      pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, lru.username,lru.image,
      u.image, lri.address, u.username,d.name, sig.image

    `;

    if (req.query.page === undefined && req.query.limit === undefined) {
    } else {
      signatureQuery += ` LIMIT $4 OFFSET $5;`;
    }
    let queryParameters = [id, "public", "general"];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [id, "public", "general", perPage, offset];
    }
    const { rows } = await pool.query(signatureQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalLetters: rows.length,
        AllLetters: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.post_letters pl  
      LEFT JOIN
      users AS u ON pl.user_id = u.id
      WHERE pl.disc_category=$1 AND (pl.post_type=$2 AND receiver_type=$3) AND u.is_deleted=FALSE`;
      const totalLettersResult = await pool.query(totalLetterQuery, [
        id,
        "public",
        "general",
      ]);
      const totalLetters = totalLettersResult.rows[0].total;
      const totalPages = Math.ceil(totalLetters / perPage);

      res.status(200).json({
        statusCode: 200,
        totalLetters,
        totalPages,
        AllLetter: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const getAllLetterPublicOther = async (req, res) => {
  try {
    console.log(req.query);
    const { id } = req.params;
    console.log(id);
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);

    const offset = (page - 1) * perPage;
    let signatureQuery = `SELECT
      pl.id AS post_id,
      pl.user_id,
      u.username,
      u.image AS userImage,
      pl.post_type,
      pl.receiver_type,
      pl.disc_category,
      d.name AS disc_category_name,
      pl.disc_sub_category,
      sc.name as disc_sub_category_name,
      pl.name,
      pl.address,
      pl.email,
      pl.contact_no,
      pl.subject_place,
      pl.post_date,
      pl.greetings,
      pl.introduction,
      pl.body,
      pl.form_of_appeal,
      pl.video,
      pl.signature_id,
      sig.image AS signature_image,
      pl.paid_status,
      COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
      lru.username AS receiver_name,
      lru.image AS reciever_image,
      lri.address AS receiver_address
  FROM
      post_letters AS pl
  LEFT JOIN
      post_letters_images AS pli ON pl.id = pli.letter_id
        LEFT JOIN
    signature sig ON pl.signature_id = sig.id
  LEFT JOIN
      letter_reciever_info AS lri ON pl.id = lri.letter_id
      LEFT JOIN
      users AS lru ON lri.reciever_id = lru.id
   LEFT JOIN
      users AS u ON pl.user_id = u.id
   LEFT JOIN
      disc_category AS d ON pl.disc_category = d.id
      LEFT JOIN
      disc_sub_category AS sc ON pl.disc_sub_category = sc.id
      WHERE
      pl.disc_category = $1 AND u.is_deleted=FALSE
      AND  (post_type = 'public' AND receiver_type IN ('celebrities', 'authorities', 'leader'))   
  GROUP BY
      pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category,sc.name, pl.name, pl.address,
      pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
      pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, lru.username,lru.image,
      u.image, lri.address, u.username,d.name, sig.image

    `;

    if (req.query.page === undefined && req.query.limit === undefined) {
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
        totalLetters: rows.length,
        AllLetters: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.post_letters pl   
      LEFT JOIN
      users AS u ON pl.user_id = u.id
        WHERE pl.disc_category = $1 AND u.is_deleted=FALSE
        AND  (post_type = 'public' AND receiver_type IN ('celebrities', 'authorities', 'leader'))    `;
      const totalLettersResult = await pool.query(totalLetterQuery, [id]);
      const totalLetters = totalLettersResult.rows[0].total;
      const totalPages = Math.ceil(totalLetters / perPage);

      res.status(200).json({
        statusCode: 200,
        totalLetters,
        totalPages,
        AllLetter: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const getAllLetterPrivate = async (req, res) => {
  try {
    console.log(req.query);
    const { id } = req.params;
    console.log(id);
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);

    const offset = (page - 1) * perPage;
    let signatureQuery = `SELECT
      pl.id AS post_id,
      pl.user_id,
      u.username,
      u.image AS userImage,
      pl.post_type,
      pl.receiver_type,
      pl.disc_category,
      d.name AS disc_category_name,
        pl.disc_sub_category,
      sc.name as disc_sub_category_name,
      pl.name,
      pl.address,
      pl.email,
      pl.contact_no,
      pl.subject_place,
      pl.post_date,
      pl.greetings,
      pl.introduction,
      pl.body,
      pl.form_of_appeal,
      pl.video,
      pl.signature_id,
      sig.image AS signature_image,
      pl.paid_status,
      COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
      lru.username AS receiver_name,
          lru.image AS reciever_image,
          lri.address AS receiver_address
  FROM
      post_letters AS pl
  LEFT JOIN
      post_letters_images AS pli ON pl.id = pli.letter_id
  LEFT JOIN
      letter_reciever_info AS lri ON pl.id = lri.letter_id
        LEFT JOIN
    signature sig ON pl.signature_id = sig.id
      LEFT JOIN
      users AS lru ON lri.reciever_id = lru.id
   LEFT JOIN
      users AS u ON pl.user_id = u.id
   LEFT JOIN
      disc_category AS d ON pl.disc_category = d.id
      LEFT JOIN
      disc_sub_category AS sc ON pl.disc_sub_category = sc.id
      WHERE
      pl.disc_category = $1 AND u.is_deleted=FALSE
      AND  (post_type = 'private' AND receiver_type IN ('friends', 'peers', 'followers'))   
  GROUP BY
      pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category,sc.name, pl.name, pl.address,
      pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
      pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, lru.username,lru.image,
      u.image, lri.address, u.username,d.name, sig.image

    `;

    if (req.query.page === undefined && req.query.limit === undefined) {
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
        totalLetters: rows.length,
        AllLetters: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.post_letters pl 
      LEFT JOIN
      users AS u ON pl.user_id = u.id  
        WHERE pl.disc_category = $1 AND u.is_deleted=FALSE
        AND  (post_type = 'private' AND receiver_type IN ('friends', 'peers', 'followers'))     `;
      const totalLettersResult = await pool.query(totalLetterQuery, [id]);
      const totalLetters = totalLettersResult.rows[0].total;
      const totalPages = Math.ceil(totalLetters / perPage);

      res.status(200).json({
        statusCode: 200,
        totalLetters,
        totalPages,
        AllLetter: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const getAllLetterPrivateOther = async (req, res) => {
  try {
    console.log(req.query);
    const { id } = req.params;
    console.log(id);
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);

    const offset = (page - 1) * perPage;
    let signatureQuery = `SELECT
      pl.id AS post_id,
      pl.user_id,
      u.username,
      u.image AS userImage,
      pl.post_type,
      pl.receiver_type,
      pl.disc_category,
      d.name AS disc_category_name,
        pl.disc_sub_category,
      sc.name as disc_sub_category_name,
      pl.name,
      pl.address,
      pl.email,
      pl.contact_no,
      pl.subject_place,
      pl.post_date,
      pl.greetings,
      pl.introduction,
      pl.body,
      pl.form_of_appeal,
      pl.video,
      pl.signature_id,
      sig.image AS signature_image,
      pl.paid_status,
      COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
      lru.username AS receiver_name,
          lru.image AS reciever_image,
          lri.address AS receiver_address
  FROM
      post_letters AS pl
  LEFT JOIN
      post_letters_images AS pli ON pl.id = pli.letter_id
        LEFT JOIN
    signature sig ON pl.signature_id = sig.id
  LEFT JOIN
      letter_reciever_info AS lri ON pl.id = lri.letter_id
      LEFT JOIN
      users AS lru ON lri.reciever_id = lru.id
   LEFT JOIN
      users AS u ON pl.user_id = u.id
   LEFT JOIN
      disc_category AS d ON pl.disc_category = d.id
      LEFT JOIN
      disc_sub_category AS sc ON pl.disc_sub_category = sc.id
      WHERE
      pl.disc_category = $1 AND u.is_deleted=FALSE
      AND  (post_type = 'private' AND receiver_type IN ('celebrities', 'authorities', 'leader'))   
  GROUP BY
      pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category,sc.name, pl.name, pl.address,
      pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
      pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, 
      lru.username,lru.image,
      u.image, lri.address, u.username,d.name, sig.image

    `;

    if (req.query.page === undefined && req.query.limit === undefined) {
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
        totalLetters: rows.length,
        AllLetters: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.post_letters pl   
      LEFT JOIN
      users AS u ON pl.user_id = u.id
        WHERE pl.disc_category = $1 AND u.is_deleted=FALSE
        AND  (post_type = 'private' AND receiver_type IN ('celebrities', 'authorities', 'leader'))     `;
      const totalLettersResult = await pool.query(totalLetterQuery, [id]);
      const totalLetters = totalLettersResult.rows[0].total;
      const totalPages = Math.ceil(totalLetters / perPage);

      res.status(200).json({
        statusCode: 200,
        totalLetters,
        totalPages,
        AllLetter: rows,
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
    console.log(req.body);
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
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [oldImage[0].user_id]);

    if (checkResult1.rowCount === 0) {
      handle_delete_photos_from_folder([image], "picTourImages");
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }
    let updateData = {
      image: oldImage[0].image,
    };
    if (image) {
      updateData.image = image;
      const imageSplit = oldImage[0].image?.replace("/fileUpload/", "");
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
export const searchLetters = async (req, res) => {
  try {
    const { name } = req.query;

    // Split the search query into individual words
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, letters: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(subject_place ILIKE '%${word}%' OR greetings ILIKE '%${word}%' OR introduction ILIKE '%${word}%' OR body ILIKE '%${word}%' OR form_of_appeal ILIKE '%${word}%')`;
    });

    let signatureQuery = `SELECT
    pl.id AS post_id,
    pl.user_id,
    u.username,
    u.image AS userImage,
    pl.post_type,
    pl.receiver_type,
    pl.disc_category,
    d.name AS disc_category_name,
      pl.disc_sub_category,
      sc.name as disc_sub_category_name,
    pl.name,
    pl.address,
    pl.email,
    pl.contact_no,
    pl.subject_place,
    pl.post_date,
    pl.greetings,
    pl.introduction,
    pl.body,
    pl.form_of_appeal,
    pl.video,
    pl.signature_id,
    sig.image AS signature_image,
    pl.paid_status,
    COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
    lru.username AS receiver_name,
    lru.image AS reciever_image,
    lri.address AS receiver_address
FROM
    post_letters AS pl
    LEFT JOIN
    users AS u ON pl.user_id = u.id
      LEFT JOIN
    signature sig ON pl.signature_id = sig.id
LEFT JOIN
    post_letters_images AS pli ON pl.id = pli.letter_id
LEFT JOIN
    letter_reciever_info AS lri ON pl.id = lri.letter_id
    LEFT JOIN
    users AS lru ON lri.reciever_id = lru.id

 LEFT JOIN
    disc_category AS d ON pl.disc_category = d.id
    LEFT JOIN
    disc_sub_category AS sc ON pl.disc_sub_category = sc.id
    WHERE ${conditions.join(" OR ")} AND u.is_deleted=FALSE
GROUP BY
    pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category,sc.name, pl.name, pl.address,
    pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
    pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, 
    lru.username,lru.image,
    u.image, lri.address, u.username,d.name, sig.image
ORDER BY pl.created_at DESC
  `;
    const { rows } = await pool.query(signatureQuery);
    return res
      .status(200)
      .json({ statusCode: 200, totalResults: rows.length, letters: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllRecievedLetter = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let signatureQuery = `SELECT
      pl.id AS post_id,
      pl.user_id,
      u.username,
      u.image AS userImage,
      pl.post_type,
      pl.receiver_type,
      pl.disc_category,
      d.name AS disc_category_name,
        pl.disc_sub_category,
      sc.name as disc_sub_category_name,
      pl.name,
      pl.address,
      pl.email,
      pl.contact_no,
      pl.subject_place,
      pl.post_date,
      pl.greetings,
      pl.introduction,
      pl.body,
      pl.form_of_appeal,
      pl.video,
      pl.signature_id,
      sig.image AS signature_image,
      pl.paid_status,
      COALESCE(ARRAY_AGG(pli.image), ARRAY[]::TEXT[]) AS images,
      lru.username AS receiver_name,
      lru.image AS reciever_image,
      lri.address AS receiver_address
  FROM
      post_letters AS pl
  LEFT JOIN
      post_letters_images AS pli ON pl.id = pli.letter_id
  LEFT JOIN
      letter_reciever_info AS lri ON pl.id = lri.letter_id
      
 LEFT JOIN
 users AS lru ON lri.reciever_id = lru.id
   LEFT JOIN
    signature sig ON pl.signature_id = sig.id
   LEFT JOIN
      users AS u ON pl.user_id = u.id
   LEFT JOIN
      disc_category AS d ON pl.disc_category = d.id
      LEFT JOIN
      disc_sub_category AS sc ON pl.disc_sub_category = sc.id
      WHERE lri.reciever_id=$1 AND u.is_deleted=FALSE
  GROUP BY
      pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category,sc.name, pl.name, pl.address,
      pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
      pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, 
      lru.username,lru.image,
      u.image, lri.address, u.username,d.name, sig.image
  ORDER BY pl.created_at DESC
    `;

    if (req.query.page === undefined && req.query.limit === undefined) {
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
        totalLetters: rows.length,
        AllLetters: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalLetterQuery = `SELECT COUNT(*) AS total FROM public.post_letters
      LEFT JOIN
      users AS u ON post_letters.user_id = u.id
      LEFT JOIN
      post_letters_images AS pli ON post_letters.id = pli.letter_id
  LEFT JOIN
      letter_reciever_info AS lri ON post_letters.id = lri.letter_id
      WHERE lri.reciever_id=$1 AND u.is_deleted=FALSE`;
      const totalLettersResult = await pool.query(totalLetterQuery, [id]);
      const totalLetters = totalLettersResult.rows[0].total;
      const totalPages = Math.ceil(totalLetters / perPage);

      res.status(200).json({
        statusCode: 200,
        totalLetters,
        totalPages,
        AllLetter: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const setTopLetter = async (req, res) => {
  try {
    const { letter_id } = req.body;

    // Step 1: Update all letters with top_letter = true to set it to false (if required)
    // const resetTopLettersQuery = 'UPDATE post_letters SET top_letter = FALSE WHERE top_letter = TRUE';
    // await pool.query(resetTopLettersQuery);

    // Step 2: Update the specific letter to set top_letter = true
    const updateLetterQuery = `
      UPDATE post_letters 
      SET top_letter = TRUE, top_added_date = NOW() 
      WHERE id = $1 AND paid_status = $2`;
    const set = await pool.query(updateLetterQuery, [letter_id, true]);

    if (set.rowCount === 1) {
      const getQuery = `
        SELECT
          pl.id,
          pl.user_id,
          u.username AS username,
          u.image AS userImage,
          pl.post_type,
          pl.receiver_type,
          pl.disc_category,
          dc.name AS category_name,
          pl.disc_sub_category,
          sc.name AS sub_category_name,
          pl.name,
          pl.address,
          pl.email,
          pl.contact_no,
          pl.subject_place,
          pl.post_date,
          pl.greetings,
          pl.introduction,
          pl.body,
          pl.form_of_appeal,
          pl.video,
          pl.signature_id,
          s.signature_image,
          pl.top_letter,
          pl.top_added_date,
          pl.paid_status,
          COALESCE(ARRAY_AGG(
            JSONB_BUILD_OBJECT(
              'id', pli.id,
              'image', pli.image
            )
          ), ARRAY[]::JSONB[]) AS images
        FROM post_letters pl
        LEFT JOIN post_letters_images pli ON pl.id = pli.letter_id
        LEFT JOIN users u ON pl.user_id = u.id
        LEFT JOIN disc_category dc ON pl.disc_category = dc.id
        LEFT JOIN disc_sub_category sc ON pl.disc_sub_category = sc.id
        LEFT JOIN signature s ON pl.signature_id = s.id
        WHERE pl.id = $1
        GROUP BY
          pl.id,
          pl.user_id,
          pl.post_type,
          pl.receiver_type,
          pl.disc_category,
          sc.name,
          pl.name,
          pl.address,
          pl.email,
          pl.contact_no,
          pl.subject_place,
          pl.post_date,
          pl.greetings,
          pl.introduction,
          pl.body,
          pl.form_of_appeal,
          pl.video,
          pl.signature_id,
          s.signature_image,
          pl.top_letter,
          pl.top_added_date,
          pl.paid_status,
          u.username,
          u.image,
          dc.name
      `;
      const getData = await pool.query(getQuery, [letter_id]);

      res.status(201).json({
        statusCode: 201,
        message: "Letter set to top successfully",
        data: getData.rows[0],
      });
    } else {
      res
        .status(400)
        .json({ statusCode: 400, message: "Operation not successful" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getAllLettersByCategory = async (req, res) => {
  const { category_id } = req.params;
  const {
    page = 1,
    limit = 100,
    sortField = "created_at",
    sortOrder = "DESC",
  } = req.query;
  const offset = (page - 1) * limit;

  try {
    const { rowCount: category } = await pool.query(
      `SELECT * FROM disc_category WHERE id = $1 LIMIT 1`,
      [category_id]
    );

    if (category === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Category not found" });
    }

    const query = `
        SELECT
          pl.id AS post_id,
          pl.user_id,
          u.username,
          u.image AS userImage,
          pl.post_type,
          pl.receiver_type,
          pl.disc_category,
          d.name AS disc_category_name,
          d.french_name As disc_category_french_name,
          pl.disc_sub_category,
          sc.name AS sub_category_name,
          sc."index" AS sub_category_index,
          sc.french_name AS sub_category_french_name,
          pl.name,
          pl.address,
          pl.email,
          pl.contact_no,
          pl.subject_place,
          pl.post_date,
          pl.greetings,
          pl.introduction,
          pl.body,
          pl.form_of_appeal,
          pl.video,
          pl.signature_id,
          sig.image AS signature_image,
          pl.paid_status,
          COALESCE(
            ARRAY_AGG(pli.image) FILTER (WHERE pli.image IS NOT NULL AND btrim(pli.image) <> ''),
            ARRAY[]::TEXT[]
          ) AS images,
          lru.username AS receiver_name,
          lru.image AS reciever_image,
          lri.address AS receiver_address
      FROM
          post_letters AS pl
      LEFT JOIN
          post_letters_images AS pli ON pl.id = pli.letter_id
      LEFT JOIN
          letter_reciever_info AS lri ON pl.id = lri.letter_id
          
    LEFT JOIN
    users AS lru ON lri.reciever_id = lru.id
      LEFT JOIN
        signature sig ON pl.signature_id = sig.id
      LEFT JOIN
          users AS u ON pl.user_id = u.id
      LEFT JOIN
          disc_category AS d ON pl.disc_category = d.id
          LEFT JOIN
            disc_sub_category AS sc ON pl.disc_sub_category = sc.id

          WHERE pl.disc_category = $1
          GROUP BY
          pl.id, pl.user_id, pl.post_type, pl.receiver_type, pl.disc_category, sc.name, sc."index", pl.name, pl.address,
          pl.email, pl.contact_no, pl.subject_place, pl.post_date, pl.greetings, pl.introduction,
          pl.body, pl.form_of_appeal, pl.video, pl.signature_id, pl.paid_status, 
          lru.username,lru.image,
          u.image, lri.address, u.username,d.name, sig.image , d.french_name, sc.french_name
        ORDER BY pl.${sortField} ${sortOrder}
        LIMIT $2 OFFSET $3;
        `;

    const { rows, rowCount } = await pool.query(query, [
      category_id,
      limit,
      offset,
    ]);

    // Single URL for list cards — many UIs use `image` or wrongly prefix API base to `images[0]`
    const rowsWithCover = rows.map((row) => {
      const imgs = Array.isArray(row.images)
        ? row.images.filter((x) => x != null && String(x).trim() !== "")
        : [];
      const cover = imgs[0] || row.video || null;
      return {
        ...row,
        userimage: row.userimage ?? row.userImage,
        image: cover,
        images: imgs.length ? imgs : row.video ? [] : [],
      };
    });

    if (rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No letters found in this category",
      });
    }

    const {
      rows: [totalRows],
    } = await pool.query(
      `SELECT COUNT (*) FROM post_letters pl WHERE disc_category  = $1`,
      [category_id]
    );

    const totalLetters = totalRows.count;
    const totalPages = Math.ceil(totalLetters / limit);

    // grouping by sub category
    const groupedLetters = rowsWithCover.reduce((acc, curr) => {
      if (!acc[curr.sub_category_name]) {
        acc[curr.sub_category_name] = {
          sub_category_name: curr.sub_category_name,
          sub_category_french_name: curr.sub_category_french_name,
          sub_category_id: curr.disc_sub_category,
          sub_category_index: curr.sub_category_index,
          total_result: {
            totalLetters: 0,
            totalPages,
            currentPage: page,
            letters: [],
          },
        };
      }
      acc[curr.sub_category_name]?.total_result?.letters?.push(curr);

      acc[curr.sub_category_name].total_result.totalLetters++;

      return acc;
    }, {});

    let data = Object.values(groupedLetters);

    // Sort subcategories by the newest letter's created_at (DESC)
    data.sort((a, b) => {
      const aNewest = new Date(a.total_result.letters[0]?.post_date || a.total_result.letters[0]?.created_at || 0);
      const bNewest = new Date(b.total_result.letters[0]?.post_date || b.total_result.letters[0]?.created_at || 0);
      return bNewest - aNewest;
    });

    res.status(200).json({
      statusCode: 200,
      message: "Letters fetched successfully",
      data: data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const likeUnlikePostLetter = async (req, res) => {
  try {
    const { letter_id, user_id } = req.body;
    const checkLetterQuery = "SELECT * FROM post_letters WHERE id = $1";
    const checkLetterResult = await pool.query(checkLetterQuery, [letter_id]);

    if (checkLetterResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Letter not exist" });
    }
    const checkUserQuery =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkUserResult = await pool.query(checkUserQuery, [user_id]);

    if (checkUserResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }
    // Check if the user has already liked the letter
    const checkLikeQuery =
      "SELECT * FROM like_post_letter WHERE letter_id = $1 AND user_id = $2";
    const checkLikeResult = await pool.query(checkLikeQuery, [letter_id, user_id]);

    if (checkLikeResult.rowCount > 0) {
      const deleteQuery =
        "DELETE FROM like_post_letter WHERE user_id=$1 AND letter_id=$2 RETURNING *";
      const result = await pool.query(deleteQuery, [user_id, letter_id]);
      if (result.rowCount === 1) {
        return res.status(200).json({
          statusCode: 200,
          message: "Letter Unlike successfully",
          data: result.rows[0],
        });
      }
    }
    const insertQuery =
      "INSERT INTO like_post_letter (letter_id,user_id) VALUES($1,$2) RETURNING *";
    const result = await pool.query(insertQuery, [letter_id, user_id]);
    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "Letter like successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Operation failed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getAllLikesByLetter = async (req, res) => {
  try {
    const { id } = req.params;

    let likeQuery = `
      SELECT
        l.*,
        u.username AS username,
        u.image AS userImage,
        pl.name AS letter_name,
        pl.subject_place,
        pl.post_date
      FROM like_post_letter l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN post_letters pl ON l.letter_id = pl.id
      WHERE l.letter_id = $1 AND u.is_deleted=FALSE
      ORDER BY l.created_at DESC;
    `;

    const { rows } = await pool.query(likeQuery, [id]);
    res.status(200).json({
      statusCode: 200,
      totalLikes: rows.length,
      AllLikes: rows,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

// ─── COMMENT ─────────────────────────────────────────────────────────────────

export const sendCommentOnLetter = async (req, res) => {
  try {
    const { letter_id, user_id, comment } = req.body;
    if (!letter_id || !user_id || !comment) {
      return res.status(400).json({ statusCode: 400, message: "letter_id, user_id and comment are required" });
    }

    const checkLetter = await pool.query("SELECT id FROM post_letters WHERE id=$1", [letter_id]);
    if (checkLetter.rowCount === 0) {
      return res.status(404).json({ statusCode: 404, message: "Letter not found" });
    }

    const checkUser = await pool.query("SELECT id FROM users WHERE id=$1 AND is_deleted=FALSE", [user_id]);
    if (checkUser.rowCount === 0) {
      return res.status(404).json({ statusCode: 404, message: "User not found" });
    }

    const insert = await pool.query(
      "INSERT INTO comment_post_letter (letter_id, user_id, comment) VALUES ($1,$2,$3) RETURNING *",
      [letter_id, user_id, comment]
    );

    const full = await pool.query(
      `SELECT c.*, u.username, u.image AS userImage
       FROM comment_post_letter c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id=$1`,
      [insert.rows[0].id]
    );

    return res.status(201).json({ statusCode: 201, message: "Comment posted successfully", data: full.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const getAllCommentsByLetter = async (req, res) => {
  try {
    const { id } = req.params;

    const checkLetter = await pool.query("SELECT id FROM post_letters WHERE id=$1", [id]);
    if (checkLetter.rowCount === 0) {
      return res.status(404).json({ statusCode: 404, message: "Letter not found" });
    }

    const { rows } = await pool.query(
      `SELECT c.*, u.username, u.image AS userImage
       FROM comment_post_letter c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.letter_id=$1 AND u.is_deleted=FALSE
       ORDER BY c.created_at DESC`,
      [id]
    );

    return res.status(200).json({ statusCode: 200, totalComments: rows.length, AllComments: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error", error });
  }
};

// ─── REPORT ──────────────────────────────────────────────────────────────────

export const reportLetter = async (req, res) => {
  try {
    const { letter_id, user_id, reason } = req.body;
    if (!letter_id || !user_id) {
      return res.status(400).json({ statusCode: 400, message: "letter_id and user_id are required" });
    }

    const checkLetter = await pool.query("SELECT id FROM post_letters WHERE id=$1", [letter_id]);
    if (checkLetter.rowCount === 0) {
      return res.status(404).json({ statusCode: 404, message: "Letter not found" });
    }

    const checkUser = await pool.query("SELECT id FROM users WHERE id=$1 AND is_deleted=FALSE", [user_id]);
    if (checkUser.rowCount === 0) {
      return res.status(404).json({ statusCode: 404, message: "User not found" });
    }

    // Prevent duplicate reports from the same user
    const alreadyReported = await pool.query(
      "SELECT id FROM report_post_letter WHERE letter_id=$1 AND user_id=$2",
      [letter_id, user_id]
    );
    if (alreadyReported.rowCount > 0) {
      return res.status(400).json({ statusCode: 400, message: "You have already reported this letter" });
    }

    const result = await pool.query(
      "INSERT INTO report_post_letter (letter_id, user_id, reason) VALUES ($1,$2,$3) RETURNING *",
      [letter_id, user_id, reason || null]
    );

    return res.status(201).json({ statusCode: 201, message: "Letter reported successfully", data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
