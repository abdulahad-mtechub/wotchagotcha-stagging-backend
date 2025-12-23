import pool from "../db.config/index.js";

export const createDiscSubCategory = async (req, res) => {
  const { name, category_id } = req.body;

  if (!name || !category_id) {
    return res.status(400).json({
      statusCode: 400,
      message: "Missing required fields",
    });
  }

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO disc_sub_category (name , category_id ) VALUES ($1 , $2 ) RETURNING *`,
      [name, category_id]
    );

    if (rowCount === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Subcategory not Added due to an error",
      });
    }

    return res.status(201).json({
      statusCode: 201,
      message: "Subcategory Added Successfully",
      data: rows[0],
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Error creating subcategory" });
  }
};

export const deleteDiscSubCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM disc_sub_category WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Subcategory not found",
      });
    }
    return res.status(200).json({
      statusCode: 200,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Error deleting subcategory" });
  }
};

export const updateDiscSubCategory = async (req, res) => {
  const { id } = req.params;

  const { name, category_id } = req.body;

  try {
    let query = `UPDATE disc_sub_category SET `;
    let index = 2;
    let values = [id];

    if (name) {
      query += `name = $${index}, `;
      values.push(name);
      index++;
    }

    if (category_id) {
      query += `category_id = $${index} `;
      values.push(category_id);
      index++;
    }

    query = query.replace(/,\s*$/, "");

    query += ` WHERE id = $1 RETURNING *`;

    const { rows, rowCount } = await pool.query(query, values);

    if (rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Subcategory not found",
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Subcategory updated successfully",
      data: rows[0],
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Error updating subcategory" });
  }
};

export const getDiscSubCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT sc.*, json_build_object('name', c.name , 'category_french_name', c.french_name) AS parent_category FROM disc_sub_category sc INNER JOIN disc_category c ON sc.category_id = c.id WHERE sc.id = $1 LIMIT 1`,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Sub Category Not Found",
      });
    }

    return res.json({
      statusCode: 200,
      message: "Sub Category Retrieved",
      data: rows[0],
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Error retrieving subcategory" });
  }
};

export const getDiscSubCategories = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 1000;
  const sortField = req.query.sortField || "id";
  const sortOrder = req.query.sortOrder || "DESC";
  const offset = (page - 1) * limit;
  const { search, category_id } = req.query;
  try {
    let queryParams = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push(`sc.name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    if (category_id) {
      whereClauses.push(`sc.category_id = $${queryParams.length + 1}`);
      queryParams.push(category_id);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `SELECT sc.*, json_build_object('name', c.name , 'category_french_name', c.french_name)AS parent_category 
                 FROM disc_sub_category sc 
                 LEFT JOIN disc_category c ON sc.category_id = c.id 
                 ${whereClause} 
                 ORDER BY ${sortField} ${sortOrder} 
                 LIMIT $${queryParams.length + 1} 
                 OFFSET $${queryParams.length + 2}`;

    queryParams.push(limit, offset);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Sub Categories Not Found",
      });
    }

    const countQuery = `SELECT COUNT(*) FROM disc_sub_category sc ${whereClause}`;

    const totalRows = await pool.query(countQuery, queryParams.slice(0, -2));

    const totalSubCategories = totalRows.rows[0].count;
    const totalPages = Math.ceil(totalSubCategories / limit);

    return res.json({
      statusCode: 200,
      message: "Sub Categories Retrieved",
      data: rows,
      pagination: {
        totalSubCategories,
        totalPages,
        currentPage: page,
      },
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Error retrieving subcategory" });
  }
};
