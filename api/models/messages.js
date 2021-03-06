import mongoose from "mongoose";

const whatsappSchema = new mongoose.Schema({
  message: String,
  timestamp: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
});

export default mongoose.model("message", whatsappSchema);
