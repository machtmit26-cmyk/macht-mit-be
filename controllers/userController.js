const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).lean();

    const result = [];

    users.forEach((user, userIndex) => {
      const formattedPhone =
        `${user?.country?.dial || ""} ${user?.phone || ""}`.trim();
      // If user has no courses, still return one row (optional)
      if (!user.courses || user.courses.length === 0) {
        result.push({
          id: userIndex + 1,
          studentName: user.name,
          email: user.email,
          country: "",
          phone: "",
          courseName: "",
          courseFee: 0,
          amountPaid: 0,
          pendingFee: 0,
          paymentMethod: "",
          status: "",
        });
        return;
      }

      user.courses.forEach((course) => {
        result.push({
          id: result.length + 1,
          studentName: user.name,
          email: user.email,
          country: user?.country?.label,
          phone: formattedPhone,
          courseName: course.courseName,
          courseFee: course.coursePrice,
          amountPaid: course.amountPaid,
          pendingFee: course.balanceAmount,
          paymentMethod: course.paymentMode,
          status: course.paymentType === "partial" ? "Partial" : "Completed",
        });
      });
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
// @desc    Register a new user
// @route   POST /api/users/register
const registerUser = async (req, res) => {
  const { name, email, password, country, phone } = req.body;

  // ROBUST CHANGE: Basic Validation
  if (!name || !email || !password || !country || !phone) {
    return res.status(400).json({ message: "Please include all fields" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (Role defaults to 'student' per Schema)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      country,
      phone,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        country: user.country,
        phone: user.phone,
        role: user.role, // Send role, not isAdmin
        token: generateToken(user.id),
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Login user
// @route   POST /api/users/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        country: user.country.label,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const logoutUser = async (req, res) => {
  const email = req.body;
  console.log(email);

  try {
    res.status(200).json({ message: "User logged out successfully." });
  } catch (err) {}
};

// @desc    Assign a course to a user (Direct String)
// @route   PUT /api/users/assign-course
const assignCourse = async (req, res) => {
  const { email, course } = req.body;

  if (!email || !course || !course.courseName) {
    return res
      .status(400)
      .json({ message: "Please provide email and complete course details" });
  }

  try {
    // Prevent duplicate course assignment by courseName
    const user = await User.findOneAndUpdate(
      { email, "courses.courseName": { $ne: course.courseName } },
      { $push: { courses: course }, $set: { enrollmentStatus: "active" } },
      { new: true },
    ).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ message: "You’ve already purchased this course" });
    }

    res.status(200).json({
      message: "Course assigned successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.status(200).json({
      message: "User deleted successfully",
      userId: id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  logoutUser,
  assignCourse,
  deleteUser,
};
