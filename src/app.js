const express = require("express");
const { API_URL } = require("./config/api");
const { DB } = require("./config/mysql");
const { User } = require("./models/user");
const { MAILGUN } = require("./config/mail");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const app = express();

app.listen("9007", (req, resp) => {
  console.log("Server is runing on port 9007...");
});

app.get(`${API_URL.user}/all`, (httpReq, httpResp) => {
  DB.query(`SELECT * FROM Email`, (err, resQ) => {
    if (err) throw err;
    else {
      console.log(resQ);
      httpResp.send("Users Fetched...");
    }
  });
});

app.get(`${API_URL.user}/:userId/todos/all`, (req, resp) => {
  let userId = req.params.userId;

  DB.query(`SELECT id FROM USERS WHERE id=${userId}`, (err, resQ) => {
    if (err) throw err;
    else {
      if (resQ.length === 0) {
        resp.send("<h1 style='color:red'>user not found</h1>");
      } else {
        let query = `
                        SELECT * FROM TODOS
                        WHERE userId=${userId}
                    `;
        DB.query(query, (err, resQ) => {
          if (err) throw err;
          else {
            console.log(resQ);
            resp.send("We have " + resQ.length + " todo,happy coding ^_^ !!");
          }
        });
      }
    }
  });
});

app.get("/api/auth/register", (req, resp) => {
  //fetch data
  let newUser = new User(
    "aymanelgad65@gmail.com",
    "Aymanc54",
    "Aymanc54",
    "Aymanc54",
    "https://www.google.cogfjhgbjnjbjnk"
  );
  // data validation
  let passwordPattern = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,12}$/;
  if (!passwordPattern.test(newUser.password)) {
    resp.send(
      "<h1 style='color:red'>Password Should be at least 8 characters & maximum 12 and contains at least one number one uppercase and lowercase😅 !!</h1>"
    );
    return;
  }

  //username
  let usernamePattern = /^.{4,30}$/;
  if (!usernamePattern.test(newUser.email)) {
    resp.send(
      "<h1 style='color:red'>Username Should be at least 4 characters & maximum 30 😅 !!</h1>"
    );
    return;
  }
  //firstname
  let firstnamePattern = /^.{4,12}$/;
  if (!firstnamePattern.test(newUser.firstname)) {
    resp.send(
      "<h1 style='color:red'>FirstName Should be at least 4 characters & maximum 12 😅 !!</h1>"
    );
    return;
  }
  //lastname
  let lastnamePattern = /^.{4,12}$/;
  if (!lastnamePattern.test(newUser.lastname)) {
    resp.send(
      "<h1 style='color:red'>LastName Should be at least 4 characters & maximum 12 😅 !!</h1>"
    );
    return;
  }
  //check if the username exists
  DB.query(
    `
        SELECT email FROM Email
        where email =  '${newUser.email}'
`,
    (err, resQ) => {
      if (err) throw err;
      else {
        console.log(resQ);
        //yes
        if (resQ.length > 0) {
          resp.send("username already exist");
        } else {
          //no

          //generate token
          newUser.token = randomstring.generate();
          //assign isverified to false
          newUser.isverified = false;
          //set the expiration date
          newUser.expirationdate = new Date(Date.now() + 24 * 60 * 60 * 1000);

          //create api url

          let endpoint = `http://localhost:9007/api/verify-email/${newUser.email}/code/${newUser.token}`;

          // send the email
          let transporter = nodemailer.createTransport({
            host: "smtp.mailgun.org",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: MAILGUN.Username, // generated ethereal user
              pass: MAILGUN.password, // generated ethereal password
            },
            tls: {
              rejectUnauthorized: false,
            },
          });
          let message = {
            from: "aymanelgad65@gmail.com", // sender address
            to: newUser.email, // list of receivers
            subject: "Hello bro ✔", // Subject line
            html: `
                  <p>thanks for vising us user</p>
                  <a href="${endpoint}">click here</a>
                  <p>You have 24 hours before the link expires</p>
          `, // html body
          };
          transporter.sendMail(message, (err, info) => {
            if (err) console.log(err);
            else {
              console.log(info);
            }
          });
          //insert newUser to the database , replace the question mark with the value of newUser
          DB.query(` INSERT INTO Email SET ? `, newUser, (err, resQQ) => {
            //error de cnx avec la base de donnee
            if (err) throw err;
            else {
              resp.send("Please Check your Email !!");
            }
          });
        }
      }
    }
  );
});

app.get("/api/verify-email/:email/code/:token", (req, resp) => {
  let Email = req.params.email;
  let Token = req.params.token;
  DB.query(
    `SELECT  expirationdate FROM Email WHERE Email='${Email}' AND Token='${Token}'`,
    (err, resQ) => {
      if (resQ.length === 0) {
        resp.send("token or email are invalid");
        console.log("token or email are invalid");
      } else {
        if (Date.now() < resp[0]) {
          resp.send("token has been expired");
        } else {
          DB.query(
            `UPDATE Email SET isverified=true, Token='' WHERE Email='${Email}'`
          );
          resp.send("<h1>You account has been verified</h1>");
        }
      }
    }
  );
  console.log(req.params);
});
