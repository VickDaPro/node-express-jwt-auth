const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code);

  let errors = { email: "", password: "" };

  // Incorrect email
  if (err.message === "Incorrect email") {
    errors.email = "That email is not registered";
  }

  // Incorrect password
  if (err.message === "Incorrect password") {
    errors.password = "Password is incorrect";
  }

  // Duplicate entry error code
  if (err.code === 11000) {
    errors.email = "That email is already registered";

    // Filter out empty error messages
    errors = Object.fromEntries(
      Object.entries(errors).filter(([key, value]) => value !== "")
    );
    return errors;
  }

  // Validation errors
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      console.log(properties);
      errors[properties.path] = properties.message;
    });
  }

  // Filter out empty error messages
  errors = Object.fromEntries(
    Object.entries(errors).filter(([key, value]) => value !== "")
  );

  return errors;
};

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

module.exports.signup_get = (req, res) => {
  res.render("signup");
};

module.exports.login_get = (req, res) => {
  res.render("login");
};

module.exports.signup_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.create({ email, password });
    const token = createToken(user._id);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
      secure: true,
    });
    res.status(201).json({ user: user._id });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(400).json({ errors });
  }
};

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
      secure: true,
    });
    res.status(200).json({ user: user._id });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(400).json({ errors });
  }
};

module.exports.logout_get = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/");
};
