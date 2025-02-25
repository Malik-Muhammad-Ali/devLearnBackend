const express = require("express");
const { body } = require("express-validator");
const { signUp, signIn, updateProfile } = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../config/multerConfig");
const router = express.Router();

router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email format"),
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  signUp
);

router.post(
  "/signin",
  [
    body("email").isEmail().withMessage("Invalid email format"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  signIn
);

router.put(
  "/update-profile",
  authMiddleware,
  upload.single("profilePic"),
  updateProfile
);

module.exports = router;
