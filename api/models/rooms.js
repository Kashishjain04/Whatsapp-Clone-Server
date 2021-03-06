import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "message" }],
});

export default mongoose.model("room", roomSchema);
