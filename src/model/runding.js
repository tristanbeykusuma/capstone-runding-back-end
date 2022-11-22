const mongoose = require("mongoose");

//skema data dari database mongodb (dibutuhkan untuk melakukan crud dengan mongoose)
const RundingSchema = new mongoose.Schema(
  {
    logo_grup: { type: String, required: true },
    subject: { type: String, required: true },
    deskripsi: { type: String, required: true },
    peserta: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserSchema" }],
  },
  { collection: "rundings" }
);

const Runding = mongoose.model("RundingSchema", RundingSchema);

module.exports = Runding;
