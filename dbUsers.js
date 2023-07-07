import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  userid: String,
  username: String,
  image: String,
});

export default mongoose.model("users", userSchema);
