const bcrypt = require("bcryptjs");
const User = require("../database/models/userModel");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinaryConfig");
const JWT_SECRET = "ali";
const fs = require("fs");

async function signUp(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, username, password } = req.body;

  try {
    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email or username already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });
    await user.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function signIn(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password").exec();
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Sign in successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePic: user.profilePic,
        stats: user.stats,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateProfile(req, res) {
  const userId = req.user.userId;
  const { name, username, previousPassword, password } = req.body;
  // console.log(name, username, previousPassword, password, userId)

  try {
    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ error: "User not found" });
    // console.log(user)

    // Verify Previous Password
    if (
      previousPassword &&
      !(await bcrypt.compare(previousPassword, user.password))
    ) {
      return res.status(400).json({ error: "Previous password is incorrect" });
    }

    // Handle Profile Picture Upload to Cloudinary
    let profilePicUrl = user.profilePic;
    console.log(req.file)
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "profile_pictures",
        });
    
        profilePicUrl = result.secure_url;
    
        // Delete temporary file after upload
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res.status(500).json({ error: "Failed to upload image" });
      }
    }

    // Update fields
    user.name = name || user.name;
    user.username = username || user.username;
    if (password) user.password = await bcrypt.hash(password, 10);
    user.profilePic = profilePicUrl;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        name: user.name,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { signUp, signIn, updateProfile };
