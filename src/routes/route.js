const router = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const auth = require("../middleware/auth");

const User = require("../model/user");
const Runding = require("../model/runding");
const Posts = require("../model/posts");
const Comment = require("../model/comment");
const { uploadLogo } = require("../middleware/uploadLogo");

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

//melakukan login, jika berhasil mengirim repsonse json web token reusable
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

//melakukan register user baru dan menambahkannya pada database runding_database
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
    res.json({ status: "ok", data: dataRunding });
  } catch (error) {
    res.json({ status: "error", error: error.response });
  }
});

router.post(
  "/runding/create",
  auth,
  uploadLogo("logo_form"),
  async (req, res) => {
    try {
      const { subject_form, deskripsi_form } = req.body;
      const url = req.protocol + "://" + req.get("host");
      let class_id;
      await Runding.create({
        logo_grup: url + "/images/" + req.file.filename,
        subject: subject_form,
        deskripsi: deskripsi_form,
        administrator: [req.userloggedIn.id],
      }).then((kelas) => (class_id = kelas._id));

      await User.updateOne(
        { _id: req.userloggedIn.id },
        {
          $push: { kelas: class_id },
        }
      );

      res.json({ status: "ok", message: "new group created" });
    } catch (error) {
      res.json({ status: "error", message: error });
    }
  }
);

router.put("/runding/:id", auth, uploadLogo("logo_form"), async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_form, deskripsi_form } = req.body;
    const url = req.protocol + "://" + req.get("host");
    const getRunding = await Runding.findOne({
      _id: mongoose.Types.ObjectId(id),
    });
    const filenames = fs.readdirSync(path.join(__dirname, "../images"));
    filenames.map((file) => {
      if (
        file ==
        getRunding.logo_grup.substring(
          getRunding.logo_grup.lastIndexOf("/") + 1
        )
      ) {
        fs.unlinkSync(path.join(__dirname, "../images/", file));
      }
    });

    await Runding.updateOne(
      { _id: mongoose.Types.ObjectId(id) },
      {
        logo_grup: url + "/images/" + req.file.filename,
        subject: subject_form,
        deskripsi: deskripsi_form,
      }
    );
    res.json({ status: "ok", message: "new group updated" });
  } catch (error) {
    res.json({ status: "error", message: error });
  }
});

router.delete("/runding/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const getRunding = await Runding.findOne({
      _id: mongoose.Types.ObjectId(id),
    });
    const filenames = fs.readdirSync(path.join(__dirname, "../images"));
    filenames.map((file) => {
      if (
        file ==
        getRunding.logo_grup.substring(
          getRunding.logo_grup.lastIndexOf("/") + 1
        )
      ) {
        fs.unlinkSync(path.join(__dirname, "../images/", file));
      }
    });
    await Runding.deleteOne({ _id: id });
    res.json({ status: "ok", message: "new group delete" });
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

router.post("/posts/create/:id", auth, async (req, res) => {
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

    res.json({ status: "ok", message: "new question created", data: newPost });
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

router.post("/comments/create/:postid", auth, async (req, res) => {
  try {
    const { postid } = req.params;
    const { content_form } = req.body;
    const newComment = await Comment.create({
      post_id: mongoose.Types.ObjectId(postid),
      content: content_form,
      author_id: [req.userloggedIn.id],
      author_username: [req.userloggedIn.username],
    });

    res.json({ status: "ok", message: newComment });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", message: error });
  }
});

router.put("/comments/like/:commentid", auth, async (req, res) => {
  try {
    const { commentid } = req.params;
    const commentLike = await Comment.findOne({ _id: commentid });
    if (!commentLike) return res.status(400).send("reply doesn't exists");
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

module.exports = router;
