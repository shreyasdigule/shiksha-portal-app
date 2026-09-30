const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const userPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  studentId: user.studentId,
  department: user.department,
  semester: user.semester,
  employeeId: user.employeeId,
  subjects: user.subjects,
});

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, department, semester, employeeId, subjects } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password, and role are required" });
    }
    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({ message: "role must be 'student' or 'teacher'" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const user = await User.create({
      name,
      email,
      password,
      role,
      studentId: role === "student" ? studentId : undefined,
      department: role === "student" ? department : undefined,
      semester: role === "student" ? semester : undefined,
      employeeId: role === "teacher" ? employeeId : undefined,
      subjects: role === "teacher" ? subjects : undefined,
    });

    res.status(201).json({ token: signToken(user._id), user: userPayload(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ token: signToken(user._id), user: userPayload(user) });
  } catch (err) {
    next(err);
  }
};

exports.getMe = (req, res) => {
  res.json(userPayload(req.user));
};
