// # Google OAuth routes

const express = require("express");
const passport = require("passport");
const router = express.Router();
const pool = require("../config/db");
const { hashPassword } = require("../utils/hash-utils");

const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.PRODUCTION_FRONTEND_URL
    : process.env.FRONTEND_URL;

// ✅ Google Login & Register Route,
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// ✅ Google OAuth Callback
// after user logs in, redirect back to the backend.
router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: `${FRONTEND_URL}`,
    failureRedirect: `${FRONTEND_URL}`,
  })
);

// ✅ Manual register Route
router.post("/register", async (req, res, next) => {
  const { name, email, password } = req.body;

  const checkExistingUser_q = "SELECT * FROM users WHERE email=?";
  const insertNewUser_q =
    "INSERT INTO users (name, email, salt, hashed_password) VALUES (?, ?, ?, ?)";
  const newUserInfo_q = "SELECT id, name, email FROM users WHERE id=?";

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [existingUser] = await pool.execute(checkExistingUser_q, [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const { salt, hashedPassword } = hashPassword(password);

    const [result] = await pool.execute(insertNewUser_q, [
      name,
      email,
      salt,
      hashedPassword,
    ]);

    const [newUser] = await pool.execute(newUserInfo_q, [result.insertId]);

    const loggedInUser = {
      id: newUser[0].id,
      name: newUser[0].name,
      email: newUser[0].email
    };

    req.login(loggedInUser, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(201).json({ user: loggedInUser });
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ fetch logged-in user data
router.get("/user", (req, res) => {
  console.log("Checking session:", req.session);
  console.log("📍req.user:", req.user);

  if (!req.user) {
    return res.status(401).json({ user: null });
  }

  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email } });
});

// ✅ Manual Login Route
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (authErr, user, info) => {
    if (authErr) {
      return next(authErr);
    }

    if (!user) {
      console.log("Login failed:", info);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const loggedInUser = {id: user.id, name: user.name, email: user.email};

    req.login(loggedInUser, (err) => {
      if (err) {
        return next(err);
      }
      return res.json({ user: loggedInUser });
    });
  })(req, res, next);
});

// ✅ Logout Route
router.get("/logout", (req, res) => {
  if (req.user && req.user.google_id) {
    console.log("🔹 Logging out Google OAuth user");
  } else {
    console.log("🔹 Logging out local user");
  }

  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });

      res.clearCookie("connect.sid"); // ✅ Clears session
      res.json({ message: "Successfully logged out!" });
    });
  });
});

module.exports = router;