const mongoose = require("mongoose");

//skema data dari database mongodb (dibutuhkan untuk melakukan crud dengan mongoose)
const PostsSchema = new mongoose.Schema(
  {
    runding_id: { type: mongoose.Schema.Types.ObjectId, ref: "RundingSchema" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: [String],
    author: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserSchema" }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "CommentSchema" }],
  },
  { collection: "posts", timestamps: true }
);

const Posts = mongoose.model("PostsSchema", PostsSchema);

module.exports = Posts;
