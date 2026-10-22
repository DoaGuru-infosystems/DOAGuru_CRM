const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { db } = require("../db");
dotenv.config();

const verifyAdminToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const query = 'SELECT * FROM company_staff WHERE staff_id = ?';
        const params = [decoded.id];

        return new Promise((resolve, reject) => {
            db.query(query, params, (err, result) => {
                if (err) {
                    console.error("Error executing query:", err);
                    reject(err);
                    return;
                }

                if (!result || result.length === 0) {
                    console.log("User not found in the database");
                    resolve(null);
                    return;
                }

                const user = result[0];
                resolve(user);
            });
        });
    } catch (error) {
        console.log("Error verifying token:", error);
        if (error.name === "TokenExpiredError") {
            return { error: "TokenExpiredError" };
        }
    }
};

module.exports = verifyAdminToken;
