import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";
import { handle_delete_photos_from_folder } from "../utils/handleDeletePhoto.js";
export const createBlog = async (req, res) => {
    try {
      const { title, description } = req.body;
      if (req.file) {
        let imagePath = `/blogImages/${req.file.filename}`;
        const createQuery =
          "INSERT INTO blogs (title,description,image) VALUES($1,$2,$3) RETURNING *";
        const result = await pool.query(createQuery, [
            title,
          description,
          imagePath,
        ]);
        if (result.rowCount === 1) {
          return res
            .status(201)
            .json({ statusCode: 201, message: "Blog created successfully",data:result.rows[0]  });
        }
        res.status(400).json({ statusCode: 400, message: "Not created" });
      } else {
        res.status(400).json({ statusCode: 400, message: "image not uploaded" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
  };

  export const deleteBlog = async (req, res) => {
    const { id } = req.params;
    try {
      const condition={
          column:"id",
          value:id
      }
       const oldImage=await getSingleRow("blogs",condition)
       if(oldImage.length===0){
       return res.status(404).json({statusCode:404,message:"Blog not found "})
       }
      const oldImageSplit = oldImage[0].image.replace(
        "/blogImages/",
        ""
      );
      const delQuery = "DELETE FROM blogs WHERE id=$1";
      const result = await pool.query(delQuery, [id]);
      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ statusCode: 404, message: "Blog not deleted" });
      }
      handle_delete_photos_from_folder([oldImageSplit], "blogImages");
      res
        .status(200)
        .json({ statusCode: 200, message: "Blog deleted successfully",deletedBlog:oldImage[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ statusCode: 500, message: "Internal server error" });
    }
  };

  export const getSpecificBlog = async (req, res) => {
    try {
      const { id } = req.params;
      const condition={
          column:"id",
          value:id
      }
      const result=await getSingleRow("blogs",condition)
      if (result.length>0) {
        return res
          .status(200)
          .json({ statusCode: 200, Blog: result[0] });
      } else {
        res.status(404).json({ statusCode: 404, message: "No blog found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
export const getAllBlogs = async (req, res) => {
  try {
    let page = parseInt(req.query.page || 1); // Get the page number from the query parameters
    const perPage = parseInt(req.query.limit || 5);
    const offset = (page - 1) * perPage;
    let blogQuery = `SELECT * FROM blogs ORDER BY created_at DESC`;

    if (req.query.page === undefined && req.query.limit === undefined) {
      console.log("00000");
      // If no query parameters for pagination are provided, fetch all categories without pagination
      blogQuery = `SELECT * FROM blogs ORDER BY created_at DESC`;
    } else {
      blogQuery += ` LIMIT $1 OFFSET $2;`;
    }
    let queryParameters = [];

    if (req.query.page !== undefined || req.query.limit !== undefined) {
      queryParameters = [perPage, offset];
    }

    const { rows } = await pool.query(blogQuery, queryParameters);

    if (req.query.page === undefined && req.query.limit === undefined) {
      // If no pagination is applied, don't calculate totalCategories and totalPages
      res.status(200).json({
        statusCode: 200,
        totalBlogs: rows.length,
        AllBlogs: rows,
      });
    } else {
      // Calculate the total number of categories (without pagination)
      const totalBlogsQuery = `SELECT COUNT(*) AS total FROM public.blogs`;
      const totalBlogsResult = await pool.query(totalBlogsQuery);
      const totalBlogs = totalBlogsResult.rows[0].total;
      const totalPages = Math.ceil(totalBlogs / perPage);

      res.status(200).json({
        statusCode: 200,
        totalBlogs,
        totalPages,
        AllBlogs: rows,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};

export const updateBlog = async (req, res) => {
    try {
      const { id,title, description } = req.body;
      const condition={
          column:"id",
          value:id
      }
      const oldImage=await getSingleRow("blogs",condition)
      if(!oldImage){
          return res.status(404).json({statusCode:404,message:"Blog not found "})
      }
      let updateData = {
        title,
        description,
        image: oldImage[0].image,
      };
      if (req.file && req.file.filename) {
        updateData.image = `/blogImages/${req.file.filename}`;
        const imageSplit = oldImage[0].image.replace(
          "/blogImages/",
          ""
        );
        handle_delete_photos_from_folder([imageSplit], "blogImages");
      }
  
      const updateType =
        `UPDATE blogs SET title=$1,description=$2,image=$3,"updated_at"=NOW() WHERE id=$4 RETURNING *`;
      const result = await pool.query(updateType, [
        updateData.title,
        updateData.description,
        updateData.image,
        id,
      ]);
      if (result.rowCount === 1) {
        return res
          .status(200)
          .json({ statusCode: 200, updateBlog: result.rows[0] });
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
export const deleteAllBlog = async (req, res) => {
  try {
    // Perform a query to delete all users from the database
    const query = "DELETE FROM blogs RETURNING *";
    const { rows } = await pool.query(query);

    if (rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No blog found to delete",
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: "All blogs deleted successfully",
      deletedBlogs: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};
export const searchBlogs = async (req, res) => {
  try {
    const { name } = req.query;

    // Split the search query into individual words
    const searchWords = name.split(/\s+/).filter(Boolean);

    if (searchWords.length === 0) {
      return res.status(200).json({ statusCode: 200, Suppliers: [] });
    }

    // Create an array of conditions for each search word
    const conditions = searchWords.map((word) => {
      return `(title ILIKE '%${word}%')`;
    });

    const userQuery = `SELECT
    *
    FROM
    blogs
   
    WHERE ${conditions.join(" OR ")}
    ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(userQuery);
    return res
      .status(200)
      .json({ statusCode: 200, totalResults: rows.length, Blogs: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
