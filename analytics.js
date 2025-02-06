const { Pool } = require("pg");

const pool = new Pool({
  user: "user",
  host: "db",
  database: "actifai",
  password: "pass",
  port: 5432
});

/**
 * Retrieves sales analytics data grouped by a specified time period (Year, Month, or Day).
 * 
 * This function aggregates sales performance by user and group, based on the specified time period.
 * 
 * @param {Object} query - The query parameters for fetching analytics data.
 * @param {string} query.period - The time granularity ('Y' for year, 'M' for month, 'D' for day). Defaults to 'M'.
 * @param {string} query.startDate - The start date for filtering sales (format: 'YYYY-MM-DD').
 * @param {string} query.endDate - The end date for filtering sales (format: 'YYYY-MM-DD').
 * @param {number} [query.userId] - Optional user ID to filter sales by a specific user.
 * @param {number} [query.groupId] - Optional group ID to filter sales by a specific group.
 * 
 * @returns {Object[]} An array of objects containing aggregated sales data.
 * 
 * @example
 * const data = await getAnaliticsData({
 *   period: 'M',
 *   startDate: '2021-01-01',
 *   endDate: '2021-12-31',
 *   userId: 3
 * });
 * 
 * Output: [
 *  {
 *   "period": null,
 *    "user_id": 1,
 *    "user_name": "Alice",
 *    "group_id": 1,
 *    "group_name": "Northeast Sales Team",
 *    "total_sales": "22",
 *    "total_revenue": "714637",
 *    "avg_revenue": "32483.500000000000"
 *   }
 * ]
 */

const getAnaliticsData = async (query) => {
  // The CASE statement will use YY YYMM or YYMMDD masks depending on period
  const sql = `
        SELECT 
            CASE 
                WHEN $1 = 'Y' THEN EXTRACT(YEAR FROM s.date)
                WHEN $1 = 'M' THEN EXTRACT(YEAR FROM s.date) * 100 + EXTRACT(MONTH FROM s.date)
                WHEN $1 = 'D' THEN EXTRACT(YEAR FROM s.date) * 10000 + EXTRACT(MONTH FROM s.date) * 100 + EXTRACT(DAY FROM s.date)
            END AS period,
            u.id AS user_id,
            u.name AS user_name,
            g.id AS group_id,
            g.name AS group_name,
            COUNT(s.id) AS total_sales,
            SUM(s.amount) AS total_revenue,
            AVG(s.amount) AS avg_revenue
        FROM sales s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN user_groups ug ON u.id = ug.user_id
        LEFT JOIN groups g ON ug.group_id = g.id
        WHERE s.date BETWEEN $2 AND $3
        ${query.userId ? "AND u.id = $4" : ""} ${query.groupId ? "AND g.id = $5" : ""}
        GROUP BY period, u.id, u.name, g.id, g.name
        ORDER BY period ASC;
      `;

  // setup params array for PG
  const params = [query.period || "M", query.startDate, query.endDate];
  if (query.userId !== undefined) params.push(query.userId);
  if (query.groupId !== undefined) params.push(query.groupId);
  
  const { rows } = await pool.query(sql, params);
  return rows;
};

module.exports = {
    getAnaliticsData
}