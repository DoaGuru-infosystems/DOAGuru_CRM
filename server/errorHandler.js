// const logger = require("./logger");

// module.exports = (err, req, res, next) => {

//   logger.error(`Error on ${req.method} ${req.originalUrl}: ${err.message}`, {
//     stack: err.stack,
//   });

//   const status = err.status || 500;
//   res.status(status).json({
//     success: false,
//     message: status === 500 ? "Internal server error" : err.message,
//   });
// };


const moment = require("moment-timezone");
const logger = require("./logger");

module.exports = (err, req, res, next) => {
    const timestamp = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    logger.error(
        `Error on ${req.method} ${req.originalUrl}: ${err.message} | user=${req.user ? req.user.id : "guest"} | time=${timestamp}`,
        { stack: err.stack }
    );

    const status = err.status || 500;
    res.status(status).json({
        success: false,
        message: status === 500 ? "Internal server error" : err.message,
    });
};
