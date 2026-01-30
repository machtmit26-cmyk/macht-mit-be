const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  registerUser,
  loginUser,
  logoutUser,
  assignCourse,
  deleteUser,
} = require("../controllers/userController");

// Import the middleware
const { protect, admin } = require("../middleware/authMiddleware");

// Public Routes (Anyone can access)
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.put("/assigncourse", assignCourse);
router.delete("/:id", deleteUser);

// Protected Route (Must be logged in to see users)
// "protect" runs first. If it passes, "getAllUsers" runs.
router.get("/", protect, getAllUsers);

// Protected Admin Route (Must be logged in AND be an Admin)
// router.get("/", protect, admin, getAllUsers);

module.exports = router;
