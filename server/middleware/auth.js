const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect — verifies JWT and attaches req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Accept from Authorization header or cookie
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.vt_token) {
      token = req.cookies.vt_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User not found or deactivated" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};

/**
 * authorize(...roles) — role-based gate after protect
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(", ")}`,
      });
    }
    next();
  };
};

/**
 * socketAuth — used in Socket.io middleware
 * Expects token in socket.handshake.auth.token
 */
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) return next(new Error("User not found"));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
};

module.exports = { protect, authorize, socketAuth };
