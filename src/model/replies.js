const mongoose = require("mongoose");

//skema data dari database mongodb (dibutuhkan untuk melakukan crud dengan mongoose)
const RepliesSchema = new mongoose.Schema(
  {
    comment_id: { type: mongoose.Schema.Types.ObjectId, ref: "CommentSchema" },
    content: { type: String, required: true },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: "UserSchema", },
    author_id: [{type: mongoose.Schema.Types.ObjectId, ref: "UserSchema"}],
    author_username: [{type: String}],
  },
  { collection: "replies", timestamps: true }
);

const Replies = mongoose.model("RepliesSchema", RepliesSchema);

module.exports = Replies;
