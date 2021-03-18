import express from "express";
import { v2 as cloudinary } from "cloudinary";
import requireLogin from "../middleware/requireLogin.js";

const router = express.Router();

router.post("/cloudinarySignature", requireLogin, (req, res) => {
  const apiSecret = process.env.CLOUDINARY_SECRET;
  try {
    const signature = cloudinary.utils.api_sign_request(
      req.body.params_to_sign,
      apiSecret
    );
    res.json({ signature, timestamp: req.body.params_to_sign.timestamp });
  } catch (error) {
    console.log(error);
  }
});

export default router;
