const router = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const auth = require("../middleware/auth");
const { uploadLogo } = require("../middleware/uploadLogo");
const { storeImage } = require("../middleware/storeImage");
const { putStoreImage } = require("../middleware/putStoreImage");
const verifyUser = require("../middleware/verifyUser");
const verifyAdmin = require("../middleware/verifyAdmin");
const verifyPost = require("../middleware/verifyPost");
const verifyCommenter = require("../middleware/verifyCommenter");
const verifyCommentAuthor = require("../middleware/verifyCommentAuthor");
const commentLiked = require("../middleware/commentLiked");

const User = require("../model/user");
const Runding = require("../model/runding");
const Posts = require("../model/posts");
const Comment = require("../model/comment");
const Replies = require("../model/replies");

/*secret token untuk json web token, hasil token yang di encode dengan base64 akan
diberikan ke client yang melakukan login*/
const JWT_SECRET =
  "$2a$10$YJYHqw1XxugfTGHOWL.GSODjNJlLOfic8MWs5T8jbKxPDMDTvm5Ti";

//mendapatkan list user dari database runding_database
router.get("/user/userList", async (req, res) => {
  const token = req.header("auth-token");

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const username = user.username;

    const findUser = await User.findOne({ username }).lean();

    if (!(findUser.username == "admin")) {
      return res.json({ status: "error", error: "Access denied" });
    }

    User.find({}, function (err, users) {
      res.send(users);
    });
  } catch (error) {
    if (error.message === "jwt malformed" || "invalid token") {
      res.json({ status: "error", error: ";))" });
      console.log(token);
    } else {
      console.log(error);
      res.json({ status: "error", error: ";))" });
    }
  }
});

//mendapatkan contoh data, hanya dapat direquest dengan request yang berisi body json web token hasil login
router.get("/getExampleData", auth, async (req, res) => {
  try {
    res.json({
      status: "ok",
      data: { kelas: ["kelasdiskusi1", "kelasdiskusi2"] },
    });
  } catch (error) {
    res.json({ status: "error", error: error.response });
  }
});

//Login Route

router.post("/user/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username }).lean();

  if (!user) {
    return res.json({ status: "error", error: "Invalid username/password" });
  }

  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      JWT_SECRET
    );

    return res.json({ status: "ok", data: token });
  }

  res.json({ status: "error", error: "Invalid username/password" });
});

// Register User Route

router.post("/user/register", async (req, res) => {
  const { username, email, password: plainTextPassword } = req.body;
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  if (!username || typeof username !== "string") {
    return res.json({ status: "error", error: "Invalid username" });
  }

  if (!email || !re.test(email)) {
    return res.json({ status: "error", error: "Invalid email" });
  }

  if (!plainTextPassword || typeof plainTextPassword !== "string") {
    return res.json({ status: "error", error: "Invalid password" });
  }

  if (plainTextPassword.length < 5) {
    return res.json({
      status: "error",
      error: "Password too small. Should be atleast 6 characters",
    });
  }

  const password = await bcrypt.hash(plainTextPassword, 10);

  try {
    const response = await User.create({
      username,
      email,
      password,
    });
    console.log("User created successfully: ", response);
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ status: "error", error: "Username already in use" });
    }
    throw error;
  }

  res.json({ status: "ok", message: "user created" });
});

// Runding Route

router.get("/runding", auth, async (req, res) => {
  try {
    const dataRunding = await Runding.find({});
    res.json({ status: "ok", data: dataRunding });
  } catch (error) {
    res.json({ status: "error", error: error.response });
  }
});

router.get("/runding/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const dataRunding = await Runding.findOne({ _id: id });
    res.json({ status: "ok", message: "these are the group details", data: dataRunding });
  } catch (error) {
    res.json({ status: "error", error: error.response });
  }
});

router.post(
  "/runding/create",
  auth,
  uploadLogo("logo_form"),
  storeImage,
  async (req, res) => {
    try {
      const { subject_form, deskripsi_form } = req.body;
      /*const url = req.protocol + "://" + req.get("host");*/
      const url = req.imageURL;
      const newRunding = await Runding.create({
        logo_grup: url,
        subject: subject_form,
        deskripsi: deskripsi_form,
        administrator: [req.userloggedIn.id],
      });

      const class_id = newRunding._id;

      await User.updateOne(
        { _id: req.userloggedIn.id },
        {
          $push: { adminkelas: class_id },
        }
      );

      const io = req.app.get('socketio');
      io.emit('new_group', `New Runding Created!!\n http://shiny-taiyaki-bddd2f.netlify.app/ruangdiskusi/${class_id}`);
      res.json({
        status: "ok",
        message: "new group created",
        data: newRunding,
      });
    } catch (error) {
      res.json({ status: "error", message: error });
    }
  }
);

router.put(
  "/runding/:id",
  auth,
  verifyUser,
  uploadLogo("logo_form"),
  putStoreImage,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { subject_form, deskripsi_form } = req.body;
      let url = undefined;
      if (req.imageURL) {
        url = req.imageURL;
      }

      await Runding.updateOne(
        { _id: mongoose.Types.ObjectId(id) },
        {
          logo_grup: url,
          subject: subject_form,
          deskripsi: deskripsi_form,
        }
      );
      res.json({ status: "ok", message: "group updated", member: true });
    } catch (error) {
      res.json({ status: "error", message: error });
    }
  }
);

router.delete("/runding/:id", auth, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // const getRunding = await Runding.findOne({
    //   _id: mongoose.Types.ObjectId(id),
    // });
    // const filenames = fs.readdirSync(path.join(__dirname, "../images"));
    // filenames.map((file) => {
    //   if (
    //     file ==
    //     getRunding.logo_grup.substring(
    //       getRunding.logo_grup.lastIndexOf("/") + 1
    //     )
    //   ) {
    //     fs.unlinkSync(path.join(__dirname, "../images/", file));
    //   }
    // });
    const deleted = await Runding.deleteOne({ _id: id });
    if(!deleted.deletedCount) {
      res.json({ status: "ok", message: "no group found" });
      return;
    }
    res.json({ status: "ok", message: "group deleted" });
  } catch (error) {
    res.json({ status: "error", message: error });
  }
});

// Posts/Questions Route

router.get("/runding/posts/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const dataRundingPost = await Posts.find({ runding_id: id });
    res.json({ status: "ok", data: dataRundingPost });
  } catch (error) {
    res.json({ status: "error", error: error.response });
  }
});

router.post("/runding/posts/create/:id", auth, verifyUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { title_form, description_form, tags_form } = req.body;
    const newPost = await Posts.create({
      runding_id: mongoose.Types.ObjectId(id),
      title: title_form,
      description: description_form,
      tags: tags_form,
      author: [req.userloggedIn.id],
    });

    res.json({ status: "ok", message: "new question/post created", data: newPost });
  } catch (error) {
    res.json({ status: "error", message: error });
  }
});

router.put("/posts/:postid", auth, verifyPost, async (req, res) => {
  try {
    const { postid } = req.params;
    const { title_form, description_form, tags_form } = req.body;
    const newPost = await Posts.updateOne(
      {
        _id: mongoose.Types.ObjectId(postid),
      },
      {
        title: title_form,
        description: description_form,
        tags: tags_form,
      }
    );

    res.json({ status: "ok", message: "post updated", member: true, data: newPost });
  } catch (error) {
    res.json({ status: "error", message: error });
  }
});

router.delete("/posts/:postid", auth, verifyPost, async (req, res) => {
  try {
    const { postid } = req.params;
    await Posts.deleteOne({
      _id: mongoose.Types.ObjectId(postid),
    });

    res.json({ status: "ok", message: "question deleted", member: true });
  } catch (error) {
    res.json({ status: "error", message: error });
  }
});

// Comments Route

router.get("/posts/comments/:postid", auth, async (req, res) => {
  try {
    const { postid } = req.params;
    const dataRundingComments = await Comment.find({ post_id: postid });
    res.json({ status: "ok", data: dataRundingComments });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error });
  }
});

router.post("/posts/comments/create/:postid", auth, verifyCommenter, async (req, res) => {
  try {
    const { postid } = req.params;
    const { content_form } = req.body;
    const postComment = await Posts.findOne({ _id: postid }).lean();
    const rundingId = postComment.runding_id.toString();
    const newComment = await Comment.create({
      post_id: mongoose.Types.ObjectId(postid),
      runding_id: mongoose.Types.ObjectId(rundingId),
      content: content_form,
      author_id: [req.userloggedIn.id],
      author_username: [req.userloggedIn.username],
    });

    await Posts.updateOne(
      { _id: mongoose.Types.ObjectId(postid) },
      {
        $push: { replies: newComment._id },
      }
    );

    res.json({ status: "ok", message: newComment });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error });
  }
});

router.post("/comments/like/:commentid", auth, commentLiked, async (req, res) => {
  try {
    const { commentid } = req.params;
    const commentLike = await Comment.findOne({ _id: commentid });
    if (!commentLike) return res.status(400).send("Comment doesn't exists");
    await Comment.updateOne(
      { _id: mongoose.Types.ObjectId(commentid) },
      {
        $push: { likes: req.userloggedIn.id },
      }
    );

    res.json({ status: "ok", message: "Comment liked" });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error });
  }
});

router.delete("/comments/:commentid", auth, verifyCommentAuthor, async (req, res) => {
  try {
    const { commentid } = req.params;
    await Comment.deleteOne({ _id: mongoose.Types.ObjectId(commentid) });

    res.json({ status: "ok", message: "Comment Deleted" });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error });
  }
});

router.put("/comments/:commentid", auth, verifyCommentAuthor, async (req, res) => {
  try {
    const { commentid } = req.params;
    const { content_form } = req.body;

    await Comment.updateOne(
      { _id: mongoose.Types.ObjectId(commentid) },
      { content: content_form }
    );

    res.json({ status: "ok", message: "Comment Edited" });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error });
  }
});

// Replies Route

router.get("/comments/reply/:commentid", auth, async (req, res) => {
  try {
    const { commentid } = req.params;
    const replies = await Replies.find({ comment_id: commentid });
    if (!replies) {
      return res.status(404).send("Comment doesn't exists");
    }

    res.json({ status: "ok", data: replies });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error });
  }
});

router.post("/comments/reply/:commentid", auth, async (req, res) => {
  try {
    const { commentid } = req.params;
    const { content_form } = req.body;

    const newReplies = await Replies.create({
      comment_id: mongoose.Types.ObjectId(commentid),
      content: content_form,
      author_id: [req.userloggedIn.id],
      author_username: [req.userloggedIn.username],
    });

    res.json({ status: "ok", message: newReplies });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error });
  }
});

router.put("/comments/reply/edit/:replyId", auth, async (req, res) => {
  try {
    const { replyId } = req.params;
    const { content_form } = req.body;

    await Replies.updateOne(
      { _id: mongoose.Types.ObjectId(replyId) },
      { content: content_form }
    );

    res.json({ status: "ok", message: "Reply Edited" });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error });
  }
});

router.put("/comments/reply/like/:replyId", auth, async (req, res) => {
  try {
    const { replyId } = req.params;
    const replyLike = await Replies.findOne({ _id: replyId });
    if (!replyLike) return res.status(400).send("reply doesn't exists");
    await Replies.updateOne(
      { _id: mongoose.Types.ObjectId(replyId) },
      {
        $push: { likes: req.userloggedIn.id },
      }
    );

    res.json({ status: "ok", message: "Comment liked" });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error });
  }
});

router.delete("/comments/reply/delete/:replyId", auth, async (req, res) => {
  try {
    const { replyId } = req.params;
    await Replies.deleteOne({ _id: mongoose.Types.ObjectId(replyId) })

    res.json({ status: "ok", message: "Reply Deleted" });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error });
  }
});

module.exports = router;
