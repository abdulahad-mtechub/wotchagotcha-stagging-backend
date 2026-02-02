import pool from "../db.config/index.js";

const buildILikeClause = (columns, patterns, startIndex = 1) => {
  const parts = [];
  const params = [];
  let idx = startIndex;
  for (const col of columns) {
    for (const p of patterns) {
      parts.push(`${col} ILIKE $${idx}`);
      params.push(p);
      idx++;
    }
  }
  return { clause: parts.length ? `(${parts.join(" OR ")})` : "(1=0)", params, nextIndex: idx };
};

export const globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || req.query.name || "").trim();
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return res.status(200).json({ statusCode: 200, totalResults: 0, results: {} });
    }

    const patterns = words.map((w) => `%${w}%`);

    // Only search category main tables and subcategory tables by `name`.
    const parentCategoryTables = [
      'app_category','item_category','disc_category','video_category','pic_category','NEWS_category',
      'cinematics_category','fan_star_category','tv_progmax_category','kid_vids_category','learning_hobbies_category',
      'sports_category','QAFI_category','GEBC_category'
    ];

    const subCategoryTables = [
      'app_sub_category','item_sub_category','disc_sub_category','video_sub_category','pic_sub_category','NEWS_sub_category',
      'cinematics_sub_category','fan_star_sub_category','tv_progmax_sub_category','kid_vids_sub_category','learning_hobbies_sub_category',
      'sport_sub_category','QAFI_sub_category','GEBC_sub_category'
    ];

    const allCategoryQueries = [];

    // Helper for special table name mappings
    const parentForSub = (subTable) => {
      if (subTable === 'sport_sub_category') return 'sports_category';
      return subTable.replace(/_sub_category$/i, '_category');
    };

    const subForParent = (parentTable) => {
      if (parentTable === 'sports_category') return 'sport_sub_category';
      return parentTable.replace(/_category$/i, '_sub_category');
    };

    for (const t of parentCategoryTables) {
      const cols = ['name'];
      const c = buildILikeClause(cols, patterns, 1);
      const subTable = subForParent(t);
      const qstr = `SELECT c.id, c.name, (SELECT COUNT(*) FROM ${subTable} st WHERE st.category_id = c.id)::int AS sub_count FROM ${t} c WHERE ${c.clause} ORDER BY c.name ASC LIMIT 10`;
      allCategoryQueries.push({ table: t, q: qstr, p: c.params });
    }

    for (const t of subCategoryTables) {
      const cols = ['name'];
      const c = buildILikeClause(cols, patterns, 1);
      const parentTable = parentForSub(t);
      const qstr = `SELECT s.id, s.name, s.category_id, (SELECT p.name FROM ${parentTable} p WHERE p.id = s.category_id) AS category_name, (SELECT COUNT(*) FROM ${t} st WHERE st.category_id = s.category_id)::int AS sub_count FROM ${t} s WHERE ${c.clause} ORDER BY s.name ASC LIMIT 10`;
      allCategoryQueries.push({ table: t, q: qstr, p: c.params });
    }

    const execs = allCategoryQueries.map((item) => pool.query(item.q, item.p));
    const resultsArr = await Promise.all(execs);

    const results = {};
    for (let i = 0; i < allCategoryQueries.length; i++) {
      const tbl = allCategoryQueries[i].table;
      results[tbl] = resultsArr[i].rows;
    }

    const totalResults = Object.values(results).reduce((s, a) => s + a.length, 0);

    return res.status(200).json({ statusCode: 200, totalResults, results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
};

export default { globalSearch };
