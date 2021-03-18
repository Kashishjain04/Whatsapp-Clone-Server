import express from "express";
import requireLogin from "../middleware/requireLogin.js";
import Rooms from "../models/rooms.js";
import Users from "../models/user.js";

// initialize router
const router = express.Router();

router.post("/newMessage", requireLogin, (req, res) => {
  const { message, timestamp } = req.body;
  Rooms.findByIdAndUpdate(
    req.body.roomID,
    {
      $push: {
        messages: {
          userId: req.user._id,
          userName: req.user.name,
          message,
          timestamp,
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
            res.send("Room created Successfully!!");
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
            res.send("Room Joined Successfully!!");
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

export default router;
