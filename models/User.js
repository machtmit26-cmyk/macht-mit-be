const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    courseName: { type: String, required: true },
    coursePrice: { type: Number, required: true },
    paymentType: { type: String, enum: ["full", "partial"], required: true },
    paymentMode: { type: String, required: true },
    physicalCopy: { type: Boolean, default: false },
    amountPaid: { type: Number, required: true },
    balanceAmount: { type: Number, required: true },
    transactionId: { type: String, default: "" },
    referenceNumber: { type: String, default: "" },
    gstNo: { type: String, default: "" },
    executiveName: { type: String, required: true },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    country: {
      type: Object,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    enrollmentStatus: {
      type: String,
      // Enums ensure only valid statuses are saved
      enum: ["active", "inactive", "suspended", "pending"],
      default: "pending",
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    // Now storing full course objects
    courses: {
      type: [CourseSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema, "users");
