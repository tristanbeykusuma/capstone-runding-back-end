const jwt = require("jsonwebtoken");
const User = require("../model/user");

/*secret token untuk json web token, hasil token yang di encode dengan base64 akan
diberikan ke client yang melakukan login*/
const JWT_SECRET =
  "$2a$10$YJYHqw1XxugfTGHOWL.GSODjNJlLOfic8MWs5T8jbKxPDMDTvm5Ti";

module.exports = async (req, res, next) => {
  const token = req.header('auth-token');
  const { id: runding_id } = req.params;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const _id = user.id;

    const findUser = await User.findOne({ _id }).lean();
    const adminKelas = findUser.adminkelas?.toString() || '' ;
    const pesertaKelas = findUser.pesertakelas?.toString() || '' ;
    const newAdmin = adminKelas.split(",");
    const newPeserta = pesertaKelas.split(",");

    const foundAdmin = newAdmin.find((str) => str === runding_id)
    const foundPeserta = newPeserta.find((str) => str === runding_id)

    if (foundAdmin || foundPeserta) {
      next();
    } else {
      return res.json({ status: "error", mesage: "you are not a member of this group, please join first", member: false, data: {} });
    }
  } catch (error) {
    console.log(error);
    if (error.message === "jwt malformed" || "invalid token") {
      res.status(400)
      res.json({ status: "error", error: ";))" });
    } else {
      res.json({ status: "error", error: ";))" });
    }
  }
};
