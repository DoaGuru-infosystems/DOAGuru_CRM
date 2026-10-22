const verifyAdminToken = require("./verifyAdminToken");

const authenticate = async (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
        return res
            .status(401)
            .json({ success: false, message: "Unauthorized - Missing Token" });
    }

    const token = authorizationHeader.slice(7);

    try {
        const user = await verifyAdminToken(token);

        if (user && user.error === "TokenExpiredError") {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized - Token Expired" });
        }

        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized - Invalid Token" });
        }

        const userStatus = (user.staff_status || "").toLowerCase();
        if (userStatus === "inactive") {
            return res.status(403).json({
                success: false,
                message: "Forbidden - Your account is inactive. Please contact administrator.",
            });
        }
        if (userStatus === "suspended") {
            return res.status(403).json({
                success: false,
                message: "Forbidden - Your account has been suspended. Please contact administrator.",
            });
        }

        req.user = user;
        console.log("Authenticated user:", user.staff_id, user.staff_role);
        next();
    } catch (err) {
        console.error("Authentication error:", err);
        return res.status(401).json({ success: false, message: "Unauthorized - Invalid Token" });
    }
};

module.exports = authenticate;
