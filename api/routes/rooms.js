import express from "express";
import requireLogin from "../middleware/requireLogin.js";
import Rooms from "../models/rooms.js";
import Users from "../models/user.js";
import { v2 as cloudinary } from "cloudinary";

// initialize router
const router = express.Router();

router.post("/newMessage", requireLogin, (req, res) => {
  const { message, timestamp, type } = req.body;
  Rooms.findByIdAndUpdate(
    req.body.roomID,
    {
      $push: {
        messages: {
          userId: req.user._id,
          userName: req.user.name,
          message,
          timestamp,
          type,
        },
      },
    },
    (err, doc) => {
      if (err) {
        console.log(err);
      } else {
        res.send("Message sent");
      }
    }
  );
});

router.post("/createRoom", requireLogin, (req, res) => {
  Rooms.create({ name: req.body.roomName }, (err, room) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      Users.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { rooms: room } },
        (err, doc) => {
          if (err) {
            return res.status(500).send(err);
          } else {
            res.send(room);
          }
        }
      );
    }
  });
});

router.post("/joinRoom", requireLogin, (req, res) => {
  const { roomID } = req.body;
  Rooms.findById(roomID)
    .populate({
      path: "messages",
      populate: {
        path: "user",
        select: "_id name email",
      },
    })
    .then((room) => {
      if (!room) {
        return res.status(400).send("Room not Found!!");
      }
      Users.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { rooms: room } },
        (err, doc) => {
          if (err) {
            return res.status(500).send(err);
          } else {
            res.send(room);
          }
        }
      );
    })
    .catch((err) => console.log(err));
});

router.get("/getUserData", requireLogin, (req, res) => {
  Users.findById(req.user._id)
    .populate({
      path: "rooms",
    })
    .then((data) => {
      const { _id, email, name, pic, rooms } = data;
      res.send({ _id, email, name, pic, rooms });
    })
    .catch((err) => res.status(500).send(err.message));
});

router.put("/profileImage", requireLogin, async (req, res) => {
  const { roomId } = req.body;
  Rooms.findByIdAndUpdate(roomId, { pic: req.body.url })
    .then(() => res.send("Profile picture updated successfully!!"))
    .catch((err) => console.log(err));
});

router.delete("/profileImage", requireLogin, async (req, res) => {
  const { roomId } = req.body;
  await Rooms.findByIdAndUpdate(roomId, { pic: "" });
  cloudinary.uploader
    .destroy(`whatsapp/rooms/${roomId}`, {
      api_key: process.env.CLOUDINARY_KEY,
      api_secret: process.env.CLOUDINARY_SECRET,
      cloud_name: "kashish",
    })
    .then(() => res.send("Profile picture updated successfully!!"))
    .catch((err) => console.log(err));
});

export default router;
