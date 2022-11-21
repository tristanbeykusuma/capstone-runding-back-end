const express = require("express");
const cookieSession = require("cookie-session");
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./model/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = '$2a$10$YJYHqw1XxugfTGHOWL.GSODjNJlLOfic8MWs5T8jbKxPDMDTvm5Ti';

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "bezkoder-session",
    secret: "COOKIE_SECRET", // should use as secret environment variable
    httpOnly: true
  })
);

mongoose.connect(`mongodb+srv://user12345:runding12345@clusterrunding.dlaz7k4.mongodb.net/runding_database?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });


app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});

app.get("/user/userList", async (req, res) => {
  User.find({}, function(err, users) {
    var userMap = {};

    users.forEach(function(user) {
      userMap = user;
    });

    res.send(userMap);  
  });
});

app.post('/getExampleData', async (req, res) => {
	const { token } = req.body

	try {
		const user = jwt.verify(token, JWT_SECRET);
		const username = user.username;

    const findUser = await User.findOne({ username }).lean()

	  if (!findUser) {
		  return res.json({ status: 'error', error: 'Invalid username/password' })
	  }

		res.json({ status: 'ok', data: {kelas: ['kelasdiskusi1','kelasdiskusi2']} });
	} catch (error) {
    if (error.message === 'jwt malformed' || 'invalid token') {
		  res.json({ status: 'error', error: ';))' });
     } else {
      console.log(error);
		  res.json({ status: 'error', error: ';))' });
     }
	}
})

app.post('/user/login', async (req, res) => {
	const { username, password } = req.body
	const user = await User.findOne({ username }).lean()

	if (!user) {
		return res.json({ status: 'error', error: 'Invalid username/password' })
	}

	if (await bcrypt.compare(password, user.password)) {
		const token = jwt.sign(
			{
				id: user._id,
				username: user.username
			},
			JWT_SECRET
		)

		return res.json({ status: 'ok', data: token })
	}

	res.json({ status: 'error', error: 'Invalid username/password' })
})

app.post('/user/register', async (req, res) => {
	const { username, password: plainTextPassword } = req.body

	if (!username || typeof username !== 'string') {
		return res.json({ status: 'error', error: 'Invalid username' })
	}

	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.json({ status: 'error', error: 'Invalid password' })
	}

	if (plainTextPassword.length < 5) {
		return res.json({
			status: 'error',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}

	const password = await bcrypt.hash(plainTextPassword, 10)

	try {
		const response = await User.create({
			username,
			password
		})
		console.log('User created successfully: ', response)
	} catch (error) {
		if (error.code === 11000) {
			return res.json({ status: 'error', error: 'Username already in use' })
		}
		throw error
	}

	res.json({ status: 'ok', message: 'user created' })
})

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
