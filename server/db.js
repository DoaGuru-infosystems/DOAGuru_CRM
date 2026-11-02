const mysql = require("mysql");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env"), override: true });

const db = mysql.createPool({
  host: process.env.HOST || "localhost",
  user: process.env.DB_USER || process.env.USER || "root",
  password: process.env.PASSWORD || "",
  database: process.env.DATABASE || "doaguru_crm",
  connectionLimit: 10,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to db1:", err);
  } else {
    console.log("Connected to db1!");
    connection.release();

    // Auto-migrate leadSource from ENUM to VARCHAR(255) to prevent truncation errors
    db.query(
      "ALTER TABLE `leads` MODIFY `leadSource` VARCHAR(255) NOT NULL DEFAULT 'others'",
      (alterErr) => {
        if (!alterErr) {
          console.log("Successfully ensured `leadSource` is VARCHAR(255)");
        }
      }
    );
  }
});

// Optional: Handle errors on idle connections
db.on("error", (err) => {
  console.error("Database error:", err);
});

module.exports = { db };
