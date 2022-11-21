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

- Register New User :
URL: "http://localhost:8080/user/register"
Method: POST
Headers : Content-Type: application/json
Body : {"username" : string, "password" : string}
Response :
{ status: 'ok', message: 'user created' }

- Login :
URL: "http://localhost:8080/user/login"
Method: POST
Headers : Content-Type: application/json
Body : {"username" : string, "password" : string}
Response : 
{ status: 'ok', data: token (string type)}

* Token ini merupakan string yang dapat disimpan dalam local storage

- Get Class Data Example :
URL: "http://localhost:8080/getExampleData"
Method: POST
Headers : Content-Type: application/json
Body : {"token" : token (string type)}
Response : 
{   "status": "ok",
    "data": {
        "kelas": [
            "kelasdiskusi1",
            "kelasdiskusi2"
        ]
    }
 }
 
 - Get All Users :
URL: "http://localhost:8080/user/userList"
Method: GET
Response : 
{   "_id": database id ,
    "username": username,
    "password": password,
    "__v": document version
 }
 
