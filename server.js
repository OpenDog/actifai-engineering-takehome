/**
 * Express Server for Call Center Analytics API
 * 
 * This server provides endpoints for retrieving sales analytics data.
 * API documentation is generated using Swagger (OpenAPI 3.0).
 * 
 * API Documentation:
 * - Interactive Swagger UI: http://localhost:3000/docs
 * - OpenAPI Spec (YAML/JSON): ./openapi.yaml
 * 
 * Endpoints:
 * - GET /health         → Health check endpoint
 * - GET /analytics      → Fetches sales analytics data by period (Y, M, D)
 * 
 * Dependencies:
 * - Express (Web framework)
 * - PostgreSQL (pg package for DB connection)
 * - Swagger-UI-Express (API documentation)
 */

"use strict";

const express = require("express");
const seeder = require("./seed");

const analytics = require("./analytics");

const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");

// Constants
const PORT = 3000;
const HOST = "0.0.0.0";

async function start() {
  // Seed the database
  await seeder.seedDatabase();

  // App
  const app = express();

  // API doc
  const swaggerDocument = yaml.load("./homework.yaml");
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Health check
  app.get("/health", (req, res) => {
    res.send("Hello Homework!");
  });

  // Write your endpoints here
  app.get("/analytics", async (req, res) => {
    try {
      // get the query parameters
      const query = {
        period: req.query.period,
        startDate: req.query.start_date,
        endDate: req.query.end_date,
        userId: req.query.user_id,
        groupId: req.query.group_id,
      };

      // basic sanity checks
      if (!query.startDate || !query.endDate) {
        return res.status(400).json({ error: "start date and end date are required parsmeters" });
      }
      if (![undefined, "Y", "M", "D"].includes(query.period)) {
        return res.status(400).json({ error: "Period should be 'Y', 'M', or 'D'" });
      }

      // get data
      const data = await analytics.getAnaliticsData(query);
      const jsonData = JSON.stringify(data);
      // console.log(jsonData);

      // send it (it is json already)
      res.setHeader("Content-Type", "application/json");
      res.send(jsonData);
    } catch (err) {
      res.status(500).json({ error: "Internal server error: " + err });
    }
  });

  app.listen(PORT, HOST);
  console.log(`Server is running on http://${HOST}:${PORT}`);
}

start();
