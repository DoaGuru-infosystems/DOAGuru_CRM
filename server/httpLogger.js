const morgan = require("morgan");
const moment = require("moment-timezone");
const logger = require("./logger");

// Custom token for timezone timestamp
morgan.token("tzdate", () => {
    return moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
});

// Custom token for user details (if available)
morgan.token("user", (req) => {

    return req.user ? `${req.user.staff_id || req.user.staff_email}` : `guest ${req.user}`;
});

const stream = { write: (msg) => logger.info(msg.trim()) };

const httpLogger = morgan(
    ":method :url :status :response-time ms - :tzdate - user=:user",
    { stream }
);

module.exports = httpLogger;
