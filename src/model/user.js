const mongoose = require('mongoose');

//skema data dari database mongodb (dibutuhkan untuk melakukan crud dengan mongoose)
const UserSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true }
	},
	{ collection: 'users' }
)

const User = mongoose.model('UserSchema', UserSchema)

module.exports = User;