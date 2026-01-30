const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 1. Get token
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Get user from DB
      // ROBUST CHANGE: Handle case where user was deleted from DB but token is still valid
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res
          .status(401)
          .json({ message: "User not found / Account disabled" });
      }

      if (user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth Error:", error.message);
      // ROBUST CHANGE: specific error for expired tokens
      const message =
        error.name === "TokenExpiredError"
          ? "Session expired, please login again"
          : "Not authorized, token failed";

      return res.status(401).json({ message });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Middleware for Admin only
const admin = (req, res, next) => {
  // ROBUST CHANGE: Check role string & use 403 (Forbidden)
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Admins only" });
  }
};

module.exports = { protect, admin };
