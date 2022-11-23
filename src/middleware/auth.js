const jwt = require("jsonwebtoken");
const User = require("../model/user");

/*secret token untuk json web token, hasil token yang di encode dengan base64 akan
diberikan ke client yang melakukan login*/
const JWT_SECRET =
  "$2a$10$YJYHqw1XxugfTGHOWL.GSODjNJlLOfic8MWs5T8jbKxPDMDTvm5Ti";

module.exports = async (req, res, next) => {
  const { token } = req.body;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const username = user.username;

    const findUser = await User.findOne({ username }).lean();

    if (!findUser) {
      return res.json({ status: "error", error: "Invalid username/password" });
    } else {
      req.userloggedIn = { id: findUser._id };
      next();
    }
  } catch (error) {
    if (error.message === "jwt malformed" || "invalid token") {
      res.json({ status: "error", error: ";))" });
      console.log(token);
    } else {
      console.log(error);
      res.json({ status: "error", error: ";))" });
    }
  }
};