const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { request } = require("http");
const { response } = require("express");
// const { response } = require("express");

const app = express();
// app.use(
//     cors({
//         origin: "*",
//     })
// );

app.use(cors());

app.use(express.json());
const dbPath = path.join(__dirname, "userDetails.db");

let db = null;

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        app.listen(4000, () => {
            console.log("Server Running at http://localhost:4000/");
        });
    } catch (e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
};
initializeDBAndServer();

//Create User API
app.post("/register", async (request, response) => {
    const { email, fullName, username, password } = request.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const selectUserQuery = `
        SELECT 
            *
        FROM
            users
        WHERE
            username = '${username}';
    `;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
        const createUserQuery = `
        INSERT INTO
            users (email,fullName,username,password)
        VALUES
            (     
            '${email}',
            '${fullName}' ,          
            '${username}',
            '${hashedPassword}'
            );`;
        await db.run(createUserQuery);
        response.send("User created Successfully");
    } else {
        response.status(400);
        response.send("Username already exists");
    }
});

//User Login API
app.post("/login", async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `
        SELECT 
            *
        FROM
            users
        WHERE
            username = '${username}';
    `;

    const dbUser = await db.get(selectUserQuery);
    console.log(dbUser);

    if (dbUser === undefined) {
        response.status(400);
        response.send("User doesn't exist");
    } else {

        //compare password, hashed password
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
        if (isPasswordMatched) {
            response.send("Login successfully");
        } else {
            response.status(400);
            response.send("Invalid Password");
        }
    }
});

app.delete("/delete", async (request, response) => {
    const { username } = request.body
    const userDeleteQuery = `
        DELETE FROM users WHERE username = '${username}';
    `;
    const dbUser = await db.run(userDeleteQuery);

    if (dbUser !== undefined) {
        response.send("User Deleted Successfully!")
    } else {
        response.status(400);
        response.send("No user");
    }
})

app.get("/users", async (request,response) => {
    // const { username } = request.body
    const userDeleteQuery = `
        SELECT * FROM users ;
    `;
    const dbUsers = await db.all(userDeleteQuery);

    if (dbUsers !== undefined) {
        // response.send("User Detected Successfully!")
        response.send(dbUsers)
    } else {
        response.status(400);
        response.send("No user");
    }
})


// const sqlite3 = require('sqlite3').verbose();

// let db = new sqlite3.Database('./userDetails.db');

// db.run('CREATE TABLE users(email VARCHAR(250),fullName VARCHAR(250), username VARCHAR(250), password VARCHAR(250))');

// db.close();
