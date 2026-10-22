const mysql = require("mysql");
const dotenv = require("dotenv");

dotenv.config();

const db = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  connectionLimit: 10,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to db1:", err);
  } else {
    console.log("Connected to db1!");
    connection.release();
  }
});

// Optional: Handle errors on idle connections
db.on("error", (err) => {
  console.error("Database error:", err);
});

module.exports = { db };
