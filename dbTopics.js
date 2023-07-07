import mongoose from "mongoose";

const topicSchema = mongoose.Schema({
  topicName: String,
  userid: String,
});

export default mongoose.model("topics", topicSchema);
