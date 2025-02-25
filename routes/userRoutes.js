const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const { signUp } = require("../controllers/userController");

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

module.exports = router;
