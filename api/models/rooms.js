import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  messages: [Object],
});

export default mongoose.model("room", roomSchema);
