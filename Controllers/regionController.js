import pool from "../db.config/index.js";
import { getAllRows, getSingleRow } from "../queries/common.js";

export const getAllRegion = async (req, res) => {
  try {
   
    let regionQuery = `SELECT ARRAY_AGG(DISTINCT LOWER(region) ORDER BY LOWER(region)) AS all_region
    FROM public.item;
    `;

    

    const { rows } = await pool.query(regionQuery);
      res.status(200).json({
        statusCode: 200,
        totalRegion: rows.length,
        allRegion: rows[0].all_region,
      });
    
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal server error", error });
  }
};
