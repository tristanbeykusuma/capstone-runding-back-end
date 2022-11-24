const router = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const auth = require("../middleware/auth");

const User = require("../model/user");
const Runding = require("../model/runding");

//mendapatkan list user dari database runding_database
router.get("/user/userList", async (req, res) => {
  const token = req.header('auth-token');

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const username = user.username;

    const findUser = await User.findOne({ username }).lean();

    if (!(findUser.username=='admin')) {
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
router.post("/getExampleData",auth, async (req, res) => {

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
  const re =  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

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

router.post("/runding/create", auth, async (req, res) => {
  try {
    const { logo_form, subject_form, deskripsi_form } = req.body;
    let class_id;
    await Runding.create({
      logo_grup: logo_form,
      subject: subject_form,
      deskripsi: deskripsi_form,
      administrator: [req.userloggedIn.id],
    }).then(kelas => class_id=kelas._id);

    await User.updateOne(
      { _id: req.userloggedIn.id },
      {
        $push: { kelas: class_id }
      }
    );

    res.json({ status: "ok", message: "new group created" });
  } catch (error) {
    res.json({ status: "error", message: error });
  }
});

router.put("/runding/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { logo_form, subject_form, deskripsi_form } = req.body;
    await Runding.updateOne(
      { _id: mongoose.Types.ObjectId(id) },
      {
        logo_grup: logo_form,
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
    await Runding.deleteOne({ _id: id });
    res.json({ status: "ok", message: "new group delete" });
  } catch (error) {
    res.json({ status: "error", message: error });
  }
});

module.exports = router;