import dotenv from "dotenv";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import requireLogin from "../middleware/requireLogin.js";
import { v2 as cloudinary } from "cloudinary";

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
              user: { _id, name, email, pic, rooms, isGoogle: false },
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
          user: { _id, name, email, pic, rooms, isGoogle: true },
        });
      } else {
        User.create(req.body)
          .then((user) => {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
            const { _id, name, email, pic, rooms } = user;
            res.json({
              message: "Signed In Successfully",
              token,
              user: { _id, name, email, rooms, pic, isGoogle: true },
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

router.put("/profileImage", requireLogin, async (req, res) => {
  const { user } = req;
  try {
    await User.findByIdAndUpdate(user._id, { pic: req.body.url });
    User.findById(user._id)
      .populate("rooms")
      .then((user) => res.send(user))
      .catch((err) => console.log(err));
  } catch (error) {
    console.log(error);
  }
});

router.delete("/profileImage", requireLogin, async (req, res) => {
  const { user } = req;
  try {
    await User.findByIdAndUpdate(user._id, { pic: "" });
    cloudinary.uploader.destroy(`whatsapp/${user.email}`, {
      api_key: process.env.CLOUDINARY_KEY,
      api_secret: process.env.CLOUDINARY_SECRET,
      cloud_name: "kashish",
    });
    User.findById(user._id)
      .populate("rooms")
      .then((user) => res.send(user))
      .catch((err) => console.log(err));
  } catch (error) {
    console.log(error);
  }
});

router.put("/profileName", requireLogin, async (req, res) => {
  const { user } = req;
  try {
    await User.findByIdAndUpdate(user._id, { name: req.body.name });
    User.findById(user._id)
      .populate("rooms")
      .then((user) => res.send(user))
      .catch((err) => console.log(err));
  } catch (error) {
    console.log(error);
  }
});

export default router;
