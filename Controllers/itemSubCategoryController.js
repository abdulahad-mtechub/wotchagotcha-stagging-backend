import pool from "../db.config/index.js";

export const createItemSubCategory = async (req, res) => {
  const { name, category_id } = req.body;

  if (!name || !category_id) {
    return res.status(400).json({
      statusCode: 400,
      message: "Missing required fields",
    });
  }

  try {
    const { rows, rowCount } = await pool.query(
      `INSERT INTO item_sub_category (name, category_id) VALUES ($1, $2) RETURNING *`,
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

export const deleteItemSubCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      `DELETE FROM item_sub_category WHERE id = $1 RETURNING *`,
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

export const updateItemSubCategory = async (req, res) => {
  const { id } = req.params;

  const { name, category_id } = req.body;

  try {
    let query = `UPDATE item_sub_category SET `;
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

export const getItemSubCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT sc.*, json_build_object('name', c.name, 'category_french_name', c.french_name) AS parent_category FROM item_sub_category sc INNER JOIN item_category c ON sc.category_id = c.id WHERE sc.id = $1 LIMIT 1`,
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

export const getItemSubCategories = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 1000;
  const sortField = req.query.sortField || "id";
  const sortOrder = req.query.sortOrder || "DESC";
  const offset = (page - 1) * limit;
  const { search, category_id, main_category_id } = req.query;

  // map allowed client sort keys to safe, fully-qualified columns
  const sortKey = req.query.sortField || "id";
  const allowedSortFields = {
    id: 'sc.id',
    name: 'sc.name',
    index: 'sc."index"',
    sub_category_index: 'sc."index"',
    created_at: 'sc.created_at',
    updated_at: 'sc.updated_at',
    category_name: 'c.name'
  };
  const orderField = allowedSortFields[sortKey] || 'sc.id';
  try {
    let queryParams = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push(`sc.name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }

    // If main_category_id is provided, filter by it (overrides category_id)
    if (main_category_id) {
      whereClauses.push(`sc.category_id = $${queryParams.length + 1}`);
      queryParams.push(main_category_id);
    } else if (category_id) {
      whereClauses.push(`sc.category_id = $${queryParams.length + 1}`);
      queryParams.push(category_id);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // ensure subcategory named 'All others' appears last in the list
    const query = `SELECT sc.*, sc."index" AS sub_category_index, json_build_object('name', c.name, 'category_french_name', c.french_name) AS parent_category 
           FROM item_sub_category sc 
           LEFT JOIN item_category c ON sc.category_id = c.id 
           ${whereClause} 
           ORDER BY (CASE WHEN TRIM(LOWER(sc.name)) = 'all others' THEN 1 ELSE 0 END) ASC, ${orderField} ${sortOrder} 
           LIMIT $${queryParams.length + 1} 
           OFFSET $${queryParams.length + 2}`;

    queryParams.push(limit, offset);

    // debug: log final query and params to inspect ORDER BY
    console.error('DEBUG itemSubCategory query:', query);
    console.error('DEBUG itemSubCategory params:', queryParams);

    const { rows, rowCount } = await pool.query(query, queryParams);

    if (rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Sub Categories Not Found",
      });
    }
    const countQuery = `SELECT COUNT(*) FROM item_sub_category sc ${whereClause}`;

    const totalRows = await pool.query(countQuery, queryParams.slice(0, -2));

    const totalSubCategories = totalRows.rows[0].count;
    const totalPages = Math.ceil(totalSubCategories / limit);

    // optionally include items for each subcategory when requested
    const includeItems = req.query.include_items === '1' || req.query.include_items === 'true';
    // filters: region, country_code/country, location (state/province), price range, condition
    const regionFilter = req.query.region || null;
    const countryFilter = req.query.country_code
      ? req.query.country_code.toUpperCase().substring(0, 2)
      : req.query.country || null;
    const locationFilter = req.query.location || null;
    const minPriceFilter = req.query.min_price ? Number(req.query.min_price) : null;
    const maxPriceFilter = req.query.max_price ? Number(req.query.max_price) : null;
    const conditionFilter = req.query.condition || null;
    const itemLimit = parseInt(req.query.item_limit, 10) || 10;
    if (includeItems) {
      // fetch items for each subcategory with images
      for (const r of rows) {
        try {
          // Build items query dynamically so filters only apply when provided
          const itemParams = [r.category_id, r.id];
          const itemWhere = ["i.item_category = $1", "i.sub_category = $2", "i.status != 'blocked'"];
          let idx = itemParams.length;

          if (regionFilter) {
            idx += 1;
            itemParams.push(regionFilter);
            itemWhere.push(`LOWER(i.region) = LOWER($${idx})`);
          }

          // country_code takes precedence if provided
          if (req.query.country_code) {
            idx += 1;
            itemParams.push(countryFilter); // already uppercased in outer scope
            itemWhere.push(`i.country_code = $${idx}`);
          } else if (req.query.country) {
            idx += 1;
            itemParams.push(`%${countryFilter}%`);
            itemWhere.push(`i.country ILIKE $${idx}`);
          }

          if (locationFilter) {
            idx += 1;
            itemParams.push(`%${locationFilter}%`);
            itemWhere.push(`i.location ILIKE $${idx}`);
          }

          if (minPriceFilter !== null && !Number.isNaN(minPriceFilter)) {
            idx += 1;
            itemParams.push(minPriceFilter);
            itemWhere.push(`(NULLIF(REGEXP_REPLACE(i.price::text, '[^0-9.]', '', 'g'), '')::numeric >= $${idx})`);
          }

          if (maxPriceFilter !== null && !Number.isNaN(maxPriceFilter)) {
            idx += 1;
            itemParams.push(maxPriceFilter);
            itemWhere.push(`(NULLIF(REGEXP_REPLACE(i.price::text, '[^0-9.]', '', 'g'), '')::numeric <= $${idx})`);
          }

          if (conditionFilter) {
            idx += 1;
            itemParams.push(conditionFilter);
            itemWhere.push(`i.condition = $${idx}`);
          }

          // final param is LIMIT
          idx += 1;
          itemParams.push(itemLimit);

          const itemsQ = `
            SELECT 
              i.id,
              i.user_id,
              u.username AS username,
              u.image AS userImage,
              u.is_premium AS premium,
              i.item_category,
              i.title,
              i.description,
              i.price,
              i.condition,
              i.location,
              i.region,
              i.country_code,
              i.country,
              i.paid_status,
              i.shared_post_id,
              i.created_at,
              COALESCE(
                ARRAY_AGG(
                  JSONB_BUILD_OBJECT('id', ii.id, 'image', ii.image)
                  ORDER BY ii.id
                ) FILTER (WHERE ii.id IS NOT NULL),
                ARRAY[]::jsonb[]
              ) AS images,
              CASE WHEN i.shared_post_id IS NOT NULL THEN
                JSONB_BUILD_OBJECT(
                  'id', orig.id,
                  'title', orig.title,
                  'description', orig.description,
                  'price', orig.price,
                  'condition', orig.condition,
                  'location', orig.location,
                  'username', orig_u.username,
                  'user_image', orig_u.image,
                  'created_at', orig.created_at,
                  'country', orig.country,
                  'country_code', orig.country_code,
                  'images', COALESCE(orig_images.images, ARRAY[]::jsonb[])
                )
              ELSE NULL END AS original_post
            FROM item i
            LEFT JOIN item_images ii ON i.id = ii.item_id
            LEFT JOIN users u ON i.user_id = u.id
            LEFT JOIN item orig ON i.shared_post_id = orig.id
            LEFT JOIN users orig_u ON orig.user_id = orig_u.id
            LEFT JOIN LATERAL (
              SELECT ARRAY_AGG(JSONB_BUILD_OBJECT('id', img.id, 'image', img.image) ORDER BY img.id) AS images
              FROM item_images img
              WHERE img.item_id = orig.id
            ) orig_images ON TRUE
            WHERE ${itemWhere.join(' AND ')}
            GROUP BY i.id, i.user_id, u.username, u.image, u.is_premium, i.item_category, i.title, i.description, i.price, i.condition, i.location, i.region, i.paid_status, i.shared_post_id, i.created_at, orig.id, orig_u.id, orig_images.images
            ORDER BY i.created_at DESC
            LIMIT $${idx}
          `;

          const itemsRes = await pool.query(itemsQ, itemParams);
          r.items = itemsRes.rows;
          r.items_count = itemsRes.rowCount;
        } catch (err) {
          console.error('Error fetching items:', err);
          r.items = [];
          r.items_count = 0;
        }
      }
    }

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
