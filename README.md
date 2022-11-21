# Capstone RUNDING Back-End

Repository ini berisikan source code dari backend aplikasi RUNDING yang dibangun menggunakan Framework Express.Js.

## Instructions Install
First clone this repository.
```bash
$ git clone https://github.com/tristanbeykusuma/capstone-runding-back-end.git
```

Install dependencies. Make sure you already have [`nodejs`](https://nodejs.org/en/) & [`npm`](https://www.npmjs.com/) installed in your system.
```bash
$ npm install # or yarn
```

Start the server
```bash
$ node src/server.js
```

## Kontrak API/Route

- Register New User : <br />
URL: "http://localhost:8080/user/register" <br />
Method: POST <br />
Headers : Content-Type: application/json <br />
Body : {"username" : string, "password" : string} <br />
Response : <br />
{ status: 'ok', message: 'user created' }

- Login : <br />
URL: "http://localhost:8080/user/login" <br />
Method: POST <br />
Headers : Content-Type: application/json <br />
Body : {"username" : string, "password" : string} <br />
Response : <br />
{ status: 'ok', data: token (string type)} 

* Token ini merupakan string yang dapat disimpan dalam local storage <br />

- Get Class Data Example : <br />
URL: "http://localhost:8080/getExampleData" <br />
Method: POST <br />
Headers : Content-Type: application/json <br />
Body : {"token" : token (string type)} <br />
Response : <br />
{   "status": "ok",
    "data": {
        "kelas": [
            "kelasdiskusi1",
            "kelasdiskusi2"
        ]
    }
 }
