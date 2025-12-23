import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";
export const createNews = async (req, res) => {
  try {
    const { description, category, sub_category, user_id, image } = req.body;

    // Check if the category exists
    const categoryCheckQuery = "SELECT * FROM public.NEWS_category WHERE id=$1";
    const categoryCheckResult = await pool.query(categoryCheckQuery, [
      category,
    ]);

    if (categoryCheckResult.rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Category does not exist",
      });
    }

    // Check if the sub-category exists
    const subCategoryCheckQuery =
      "SELECT * FROM public.NEWS_sub_category WHERE id=$1 AND category_id=$2";
    const subCategoryCheckResult = await pool.query(subCategoryCheckQuery, [
      sub_category,
      category,
    ]);

    if (subCategoryCheckResult.rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message:
          "Sub-category does not exist or does not belong to the category",
      });
    }

    // Check if the user exists
    const userCheckQuery =
      "SELECT * FROM users WHERE id=$1 AND is_deleted=FALSE";
    const userCheckResult = await pool.query(userCheckQuery, [user_id]);

    if (userCheckResult.rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "User does not exist",
      });
    }

    const createQuery =
      "INSERT INTO NEWS (description, category, sub_category, image, user_id) VALUES($1, $2, $3, $4, $5) RETURNING *";
    const result = await pool.query(createQuery, [
      description,
      category,
      sub_category,
      image,
      user_id,
    ]);

    if (result.rowCount === 1) {
      const query = `SELECT
        v.id AS NEWS_id,
        v.description,
        v.category,
        v.sub_category,
        v.image,
        v.created_at AS news_created_at,
        v.user_id,
        u.username AS username,
        u.image AS userImage
      FROM NEWS v
      JOIN users u ON v.user_id = u.id
      WHERE v.id = $1
      GROUP BY v.id, u.username, u.image;
     `;
      const data = await pool.query(query, [result.rows[0].id]);
      return res.status(201).json({
        statusCode: 201,
        message: "NEWS posted successfully",
        data: data.rows[0],
      });
    }

    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    if (error.constraint === "news_category_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "Category does not exist" });
    } else if (error.constraint === "news_sub_category_fkey") {
      res
        .status(400)
        .json({ statusCode: 400, message: "Sub-category does not exist" });
    } else if (error.constraint === "news_user_id_fkey") {
      res.status(400).json({ statusCode: 400, message: "User does not exist" });
    }
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const deleteNews = async (req, res) => {
  const { id } = req.params;
  try {
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("NEWS", condition);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "NEWS not found " });
    }
    const oldImageSplit = oldImage[0].image.replace("/newsImages/", "");
    const delQuery = "DELETE FROM NEWS WHERE id=$1";
    const result = await pool.query(delQuery, [id]);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "NEWS not deleted" });
    }
    handle_delete_photos_from_folder([oldImageSplit], "newsImages");
    res.status(200).json({
      statusCode: 200,
      message: "NEWS deleted successfully",
      deletedNews: oldImage[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const updateNews = async (req, res) => {
  try {
    const { id, description, category, sub_category, image } = req.body;
    const condition = {
      column: "id",
      value: id,
    };
    const oldImage = await getSingleRow("NEWS", condition);
    console.log(oldImage);
    if (oldImage.length === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "NEWS not found" });
    }

    // Check if the category exists
    const categoryCheckQuery = "SELECT * FROM public.NEWS_category WHERE id=$1";
    const categoryCheckResult = await pool.query(categoryCheckQuery, [
      category,
    ]);

    if (categoryCheckResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Category not exist" });
    }

    // Check if the sub-category exists
    const subCategoryCheckQuery =
      "SELECT * FROM public.NEWS_sub_category WHERE id=$1 AND category_id=$2";
    const subCategoryCheckResult = await pool.query(subCategoryCheckQuery, [
      sub_category,
      category,
    ]);

    if (subCategoryCheckResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Category not exist" });
    }

    let updateData = {
      image: oldImage[0].image,
    };
    if (image) {
      updateData.image = image;
      const imageSplit = oldImage[0].image.replace("/fileUpload/", "");
      handle_delete_photos_from_folder([imageSplit], "fileUpload");
    }

    const updateType = `UPDATE NEWS SET description=$1, category=$2, sub_category=$3, image=$4, "updated_at"=NOW() WHERE id=$5 RETURNING *`;
    const result = await pool.query(updateType, [
      description,
      category,
      sub_category,
      updateData.image,
      id,
    ]);
    if (result.rowCount === 1) {
      const query = `SELECT
      v.id AS NEWS_id,
      v.description,
      v.category,
      v.sub_category,
      v.image,
      v.created_at AS news_created_at,
      v.user_id,
      u.username AS username,
      u.image AS userImage
    FROM NEWS v
    JOIN users u ON v.user_id = u.id
    WHERE v.id = $1
    GROUP BY v.id, u.username, u.image;
   `;
      const data = await pool.query(query, [id]);
      return res.status(200).json({
        statusCode: 200,
        message: "NEWS updated successfully",
        updateNews: data.rows[0],
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

export const deleteAllNews = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM NEWS RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No news found to delete",
      });
    }
    const imageFilenames = rows.map((news) =>
      news.image.replace("/newsImages/", "")
    );
    handle_delete_photos_from_folder(imageFilenames, "newsImages");
    res.status(200).json({
      statusCode: 200,
      message: "All News deleted successfully",
      deletedNews: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const sendComment = async (req, res) => {
  try {
    const { NEWS_id, user_id, comment } = req.body;
    const checkQuery = "SELECT * FROM NEWS WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [NEWS_id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "News not exist" });
    }
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }

    const createQuery =
      "INSERT INTO NEWS_comment (NEWS_id,user_id,comment) VALUES($1,$2,$3) RETURNING *";
    const result = await pool.query(createQuery, [NEWS_id, user_id, comment]);
    if (result.rowCount === 1) {
      let commentQuery = `SELECT 
      v.NEWS_id AS news_id,
      v.id AS commentId,
            v.comment AS comment,
            u.id AS userId,
            u.username AS username,
            u.image AS userImage
            FROM NEWS_comment v
            LEFT JOIN users u ON v.user_id = u.id
            WHERE v.id=$1
            ORDER BY v.created_at DESC;
            `;
      const { rows } = await pool.query(commentQuery, [result.rows[0].id]);
      return res.status(201).json({
        statusCode: 201,
        message: "Comment posted successfully",
        data: rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllCommentsByNews = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = "SELECT * FROM NEWS WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "News does not exist" });
    }

    let commentQuery = `
      SELECT
        v.id AS commentId,
        v.comment AS comment,
        v.created_at AS commentCreatedAt,
        u.id AS userId,
        u.username AS username,
        u.image AS userImage,
        n.id AS news_id,
        n.description,
        n.category AS category_id,
        n.sub_category AS sub_category_id,
        n.image AS news_image,
        n.created_at AS news_created_at,
        c.name AS category_name,
        sc.name AS sub_category_name
      FROM NEWS_comment v
      JOIN NEWS n ON v.NEWS_id = n.id
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN NEWS_category c ON n.category = c.id
      LEFT JOIN NEWS_sub_category sc ON n.sub_category = sc.id
      WHERE v.NEWS_id = $1 AND u.is_deleted=FALSE
      ORDER BY v.created_at DESC;
    `;

    const { rows } = await pool.query(commentQuery, [id]);
    res.status(200).json({
      statusCode: 200,
      totalComments: rows.length,
      AllComments: rows,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const likeUnlikeNews = async (req, res) => {
  try {
    const { NEWS_id, user_id } = req.body;
    const checkQafiQuery = "SELECT * FROM NEWS WHERE id = $1";
    const checkQafiResult = await pool.query(checkQafiQuery, [NEWS_id]);

    if (checkQafiResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "News not exist" });
    }
    const checkQuery1 =
      "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult1 = await pool.query(checkQuery1, [user_id]);

    if (checkResult1.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "user not exist" });
    }
    // Check if the user has already liked the video
    const checkQuery =
      "SELECT * FROM like_NEWS WHERE NEWS_id = $1 AND user_id = $2";
    const checkResult = await pool.query(checkQuery, [NEWS_id, user_id]);

    if (checkResult.rowCount > 0) {
      const createQuery =
        "DELETE FROM like_NEWS WHERE user_id=$1 AND NEWS_id=$2 RETURNING *";
      const result = await pool.query(createQuery, [user_id, NEWS_id]);
      if (result.rowCount === 1) {
        return res.status(200).json({
          statusCode: 201,
          message: "News Unlike successfully",
          data: result.rows[0],
        });
      }
    }
    const createQuery =
      "INSERT INTO like_NEWS (NEWS_id,user_id) VALUES($1,$2) RETURNING *";
    const result = await pool.query(createQuery, [NEWS_id, user_id]);
    if (result.rowCount === 1) {
      return res.status(201).json({
        statusCode: 201,
        message: "NEWS like successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "Not uploaded" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const UnlikePicTour = async (req, res) => {
  try {
    const { like_id } = req.body;
    const createQuery = "DELETE FROM like_pic WHERE id=$1 RETURNING *";
    const result = await pool.query(createQuery, [like_id]);
    if (result.rowCount === 1) {
      return res.status(200).json({
        statusCode: 201,
        message: "Pic tour Unlike successfully",
        data: result.rows[0],
      });
    }
    res.status(400).json({ statusCode: 400, message: "User like not exist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const getAllLikesByNews = async (req, res) => {
  try {
    const { id } = req.params;

    let likeQuery = `
      SELECT
        l.*,
        u.username AS username,
        u.image AS userImage,
        n.description,
        n.category AS category_id,
        n.sub_category AS sub_category_id,
        n.image AS news_image,
        n.created_at AS news_created_at,
        c.name AS category_name,
        sc.name AS sub_category_name
      FROM like_NEWS l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN NEWS n ON l.NEWS_id = n.id
      LEFT JOIN NEWS_category c ON n.category = c.id
      LEFT JOIN NEWS_sub_category sc ON n.sub_category = sc.id
      WHERE l.NEWS_id = $1 AND u.is_deleted=FALSE
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

export const getSpecificNews = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT
    v.id AS News_id,
    v.description,
    v.disc_category,
    v.image,
    v.created_at AS tour_created_at,
    v.user_id,
    u.username AS username,
    u.image AS userImage,
    (
        SELECT COALESCE(json_agg(
            json_build_object(
                'comment_id', c.id,
                'comment', c.comment,
                'user_id', c.user_id,
                'username', cu.username,
                'userimage', cu.image,
                'comment_created_at', c.created_at
            )
        ), '[]'::json)
        FROM NEWS_comment c
        JOIN users cu ON c.user_id = cu.id
        WHERE c.NEWS_id = v.id
    ) AS comments,
    (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', lv.id,
                'user_id', lv.user_id,
                'news_id', v.id,
                'created_at', lu.created_at,
                'updated_at', lu.updated_at
            )
        ), '[]'::json)
        FROM like_NEWS lv
        JOIN users lu ON lv.user_id = lu.id
        WHERE lv.NEWS_id = v.id
    ) AS likes
FROM NEWS v
JOIN users u ON v.user_id = u.id
WHERE v.id = $1 AND u.is_deleted=FALSE
GROUP BY v.id, u.username, u.image;

 
 `;

    const { rows } = await pool.query(query, [id]);
    if (rows.length > 0) {
      return res.status(200).json({ statusCode: 200, News: rows[0] });
    } else {
      res.status(404).json({ statusCode: 404, message: "No news found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllNews = async (req, res) => {
  try {
    let page = parseInt(req.query.page); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit);
    const offset = (page - 1) * perPage;

    let getQuery = `SELECT
      v.id AS NEWS_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.created_at AS news_created_at,
      v.user_id,
      u.username AS username,
      u.image AS userImage,
      c.name AS category_name,
      sc.name AS sub_category_name,
      c.french_name AS category_french_name,
      sc.french_name AS sub_category_french_name
    FROM NEWS v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN NEWS_category c ON v.category = c.id
    LEFT JOIN NEWS_sub_category sc ON v.sub_category = sc.id
    WHERE u.is_deleted=FALSE
    ORDER BY v.created_at DESC`;

    if (req.query.page !== undefined && req.query.limit !== undefined) {
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
        totalNEWS: rows.length,
        AllNEWS: rows,
      });
    } else {
      // Calculate the total number of NEWS (without pagination)
      const countQuery = `SELECT COUNT(*) FROM NEWS JOIN users u ON NEWS.user_id = u.id WHERE u.is_deleted = FALSE;`;

      const totalNEWSResult = await pool.query(countQuery);
      const totalNEWS = totalNEWSResult.rows[0].count;
      const totalPages = Math.ceil(totalNEWS / perPage);

      res.status(200).json({
        statusCode: 200,
        totalNEWS,
        totalPages,
        AllNEWS: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
export const getAllNewsByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const checkQuery = "SELECT * FROM users WHERE id = $1 AND is_deleted=FALSE";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "User does not exist" });
    }

    const page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 10); // Number of results per page
    const offset = (page - 1) * perPage;

    const countQuery = `SELECT COUNT(*) FROM NEWS WHERE user_id=$1;`;
    const countResult = await pool.query(countQuery, [id]);
    const totalNews = parseInt(countResult.rows[0].count);

    const totalPages = Math.ceil(totalNews / perPage);

    const query = `SELECT
      v.id AS NEWS_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.created_at AS news_created_at,
      v.user_id,
      u.username AS username,
      u.image AS userImage,
      c.name AS category_name,
      sc.name AS sub_category_name,
      c.french_name AS category_french_name,
      sc.french_name AS sub_category_french_name
    FROM NEWS v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN NEWS_category c ON v.category = c.id
    LEFT JOIN NEWS_sub_category sc ON v.sub_category = sc.id
    WHERE v.user_id = $1 AND u.is_deleted=FALSE
    ORDER BY v.created_at DESC
    LIMIT $2 OFFSET $3;`;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    return res
      .status(200)
      .json({ statusCode: 200, totalPages, totalNews, News: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllNewsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5); // Number of results per page
    const offset = (page - 1) * perPage;

    // Count total news in the given category
    const countQuery = `SELECT COUNT(*) FROM NEWS WHERE category=$1;`;
    const countResult = await pool.query(countQuery, [id]);
    const totalNews = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalNews / perPage);

    // Get news in the given category with pagination
    const query = `SELECT
      v.id AS news_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.created_at AS created_at,
      v.user_id,
      u.username AS username,
      u.image AS user_image,
      c.name AS category_name,
      sc.name AS sub_category_name,
      c.french_name AS category_french_name,
      sc.french_name AS sub_category_french_name,
      (SELECT COUNT(*) FROM NEWS_comment WHERE NEWS_comment.NEWS_id = v.id) AS comment_count,
      (SELECT COUNT(*) FROM like_NEWS WHERE like_NEWS.NEWS_id = v.id) AS total_likes
    FROM NEWS v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN NEWS_category c ON v.category = c.id
    LEFT JOIN NEWS_sub_category sc ON v.sub_category = sc.id
    WHERE v.category = $1 AND u.is_deleted=FALSE
    ORDER BY v.created_at DESC
    LIMIT $2 OFFSET $3;`;

    const { rows } = await pool.query(query, [id, perPage, offset]);

    // Group news by sub_category
    const groupedNews = rows.reduce((acc, news) => {
      const subCategoryId = news.sub_category_id;
      if (!acc[subCategoryId]) {
        acc[subCategoryId] = {
          sub_category_name: news.sub_category_name,
          sub_category_french_name: news.sub_category_french_name,
          sub_category_id: subCategoryId,
          news_result: {
            totalNews: 0,
            totalPages,
            currentPage: page,
            News: [],
          },
        };
      }

      acc[subCategoryId].news_result.News.push({
        news_id: news.news_id,
        name: news.category_name,
        description: news.description,
        image: news.image,
        user_id: news.user_id,
        username: news.username,
        user_image: news.user_image,
        created_at: news.created_at,
        comment_count: news.comment_count,
        total_likes: news.total_likes,
      });

      acc[subCategoryId].news_result.totalNews++;

      return acc;
    }, {});

    // Convert grouped news into an array format
    const responseData = Object.values(groupedNews);

    return res.status(200).json({
      statusCode: 200,
      message: "Subcategories with news retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getTopNewsWithMostComments = async (req, res) => {
  try {
    const query = `
      SELECT
        n.id AS news_id,
        n.description,
        n.image,
        nc.name AS category_name,
        nsc.name AS sub_category_name,
        n.user_id,
        u.username,
        u.image AS user_image,
        n.created_at,
        COUNT(DISTINCT c.id) AS comment_count,
        COUNT(DISTINCT l.id) AS total_likes
      FROM NEWS n
      JOIN users u ON n.user_id = u.id
      LEFT JOIN NEWS_category nc ON n.category = nc.id
      LEFT JOIN NEWS_sub_category nsc ON n.sub_category = nsc.id
      LEFT JOIN NEWS_comment c ON n.id = c.NEWS_id
      LEFT JOIN like_NEWS l ON n.id = l.NEWS_id
      GROUP BY n.id, nc.name, nsc.name, u.username, u.image
      ORDER BY comment_count DESC
      LIMIT 1;
    `;

    const result = await pool.query(query);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "No news found" });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Top news with the most comments retrieved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export const searchNews = async (req, res) => {
  try {
    const { name } = req.query;

    // Split the search query into individual words
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, News: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(v.description ILIKE '%${word}%')`;
    });

    const query = `SELECT
      v.id AS NEWS_id,
      v.description,
      v.category AS category_id,
      v.sub_category AS sub_category_id,
      v.image,
      v.created_at AS news_created_at,
      v.user_id,
      u.username AS username,
      u.image AS userImage,
      c.name AS category_name,
      sc.name AS sub_category_name
    FROM NEWS v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN NEWS_category c ON v.category = c.id
    LEFT JOIN NEWS_sub_category sc ON v.sub_category = sc.id
    WHERE (${conditions.join(" OR ")}) AND u.is_deleted=FALSE
    ORDER BY v.created_at DESC`;

    const { rows } = await pool.query(query);

    return res
      .status(200)
      .json({ statusCode: 200, totalNews: rows.length, News: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
