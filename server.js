import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import Pusher from "pusher";
import IMPORTED_ROUTES_DB from "./api/routes/route.js";
import IMPORTED_ROUTES_AUTH from "./api/routes/auth.js";
import passport from "passport";
import session from "express-session";
import rooms from "./api/models/rooms.js";

// initialize app
const app = express();
dotenv.config();
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: "auto" },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// pusher (to make db realtime)
const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "ap2",
  useTLS: true,
});

// middlewares
app.use(express.json()); // body parser
app.use(express.urlencoded({ extended: false })); // url parser
app.use(cors()); // enables http requests

// configure db
const db = mongoose.connection;
const CONNECTION_URL = process.env.CONNECTION_URL;
const PORT = process.env.PORT || 8080; // 8080 === development port
const DEPRECATED_FIX = {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

db.once("open", () => {
  console.log("✅ MongoDB connected");
  // const msgCollection = db.collection("messages");
  const roomCollection = db.collection("rooms");
  const changeStream = roomCollection.watch({ fullDocument: "updateLookup" });
  changeStream.on("change", (change) => {
    switch (change.operationType) {
      case "update":
        pusher
          .trigger("room", "updated", {
            key: change.documentKey._id,
            room: change.fullDocument,
          })
          .catch((err) => {
            console.log(err.message);
          });
        break;
      case "insert":
        pusher
          .trigger("room", "inserted", {
            room: change.fullDocument,
          })
          .catch((err) => {
            console.log(err.message);
          });
        break;

      default:
        console.log("Error Triggering Pusher");
        break;
    }
  });
});

// connect to db
mongoose
  .connect(CONNECTION_URL, DEPRECATED_FIX)
  .catch((error) => console.log("❌ MongoDB:", error)); // listen for errors on initial connection

db.on("error", (error) => console.log("❌ MongoDB:", error)); // listen for errors after the connection is established (errors during the session)
db.on("disconnected", () => console.log("❌ MongoDB disconnected"));

// routes
app.get("/", (req, res) => {
  rooms
    .find()
    .populate("messages")
    .then((data) => console.log(data));
  res.send("Hello World - Express.js");
});
app.use("/messages", IMPORTED_ROUTES_DB);
app.use("/auth", IMPORTED_ROUTES_AUTH);

app.listen(PORT, () => console.log(`✅ Server is listening on port: ${PORT}`));
