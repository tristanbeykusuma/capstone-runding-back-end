const express = require("express");
const cookieSession = require("cookie-session");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cors = require('cors');

//routes
const Routes = require("./routes/route");

const User = require("./model/user");
const Runding = require("./model/runding");

const { GridFsStorage } = require("multer-gridfs-storage");

// Middleware untuk autentikasi sebelum akses kelas, klo blm login akan di redirect ke /user/login
const auth = require("./middleware/auth");

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors());

//membuat koneksi dengan database mongodb, lebih jelasnya yaitu database runding_database
mongoose
  .connect(
    `mongodb+srv://user12345:runding12345@clusterrunding.dlaz7k4.mongodb.net/runding_database?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Successfully connect to MongoDB.");
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });

//creating bucket ()
// let bucket;
// mongoose.connection.on("connected", () => {
//   var db = mongoose.connections[0].db;
//   bucket = new mongoose.mongo.GridFSBucket(db, {
//     bucketName: "images",
//   });
//   console.log(bucket);
// });

// app.get("/", (req, res) => {
//   res.json({ message: "Welcome to the application." });
// });

//route middleware
app.use('/', Routes);

//menjalankan server pada port 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
