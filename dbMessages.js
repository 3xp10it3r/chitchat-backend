import mongoose from "mongoose";

const chitchatSchema = mongoose.Schema({
  message: String,
  name: String,
  to: String,
  timestamp: String,
  received: Boolean,
});

export default mongoose.model("messagecontents", chitchatSchema);
