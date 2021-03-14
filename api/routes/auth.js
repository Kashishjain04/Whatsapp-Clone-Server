import dotenv from "dotenv";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import requireLogin from "../middleware/requireLogin.js";

// initialize router
const router = express.Router();
dotenv.config();

router.post("/signup", (req, res) => {
  const { name, email, password, pic } = req.body;
  // email, password, name validation
  if (!name || !email || !password) {
    return res.status(422).json({
      error: "One or more fields are empty",
    });
  }
  User.findOne({ email: email })
    .then((user) => {
      // checking wether user already exists
      if (user) {
        return res.status(422).json({
          error: "User already exists",
        });
      }
      // creating user
      bcrypt.hash(password, 12).then((hashedPassword) => {
        User.create({ name, email, password: hashedPassword, pic })
          .then((user) => {
            // generating token
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
            const { _id, name, email, pic } = user;
            res.json({
              message: "Signed Up Successfully",
              token,
              user: { _id, name, email, pic },
            });
          })
          .catch((err) => {
            console.log(err);
          });
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post("/signin", (req, res) => {
  const { email, password } = req.body;
  // email, password validation
  if (!email || !password) {
    return res.status(422).json({
      error: "One or more fields are empty",
    });
  }
  // Finding user
  User.findOne({ email: email })
    .populate({
      path: "rooms",
      populate: {
        path: "messages",
        populate: {
          path: "user",
          select: "_id name email",
        },
      },
    })
    .then((user) => {
      // User not found
      if (!user) {
        return res.status(422).json({
          error: "Invalid Email / Password",
        });
      }
      // password validation
      bcrypt
        .compare(password, user.password)
        .then((matched) => {
          if (matched) {
            // generating token
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
            const { _id, name, email, pic, rooms } = user;
            res.json({
              message: "Signed In Successfully",
              token,
              user: { _id, name, email, pic, rooms },
            });
          } else {
            return res.status(422).json({
              error: "Invalid Email / Password",
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });
});

router.post("/googleLogin", (req, res) => {
  User.findOne({ googleId: req.body.googleId })
    .then((user) => {
      if (user) {
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        const { _id, name, email, pic, rooms } = user;
        res.json({
          message: "Signed In Successfully",
          token,
          user: { _id, name, email, pic, rooms },
        });
      } else {
        User.create(req.body)
          .then((user) => {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
            const { _id, name, email, pic } = user;
            res.json({
              message: "Signed In Successfully",
              token,
              user: { _id, name, email, pic },
            });
          })
          .catch((err) => {
            return res.status(422).json({
              error: err.message,
            });
          });
      }
    })
    .catch((err) => console.log(err));
});

export default router;
