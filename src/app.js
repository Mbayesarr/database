const bcrypt = require("bcrypt");
const saltRounds = 10;
//hi boi
const express = require("express");
const { API_URL } = require("./config/api");
const { DB } = require("./config/mysql");
const { User } = require("./models/user");
const { MAILGUN } = require("./config/mail");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const app = express();

app.listen("9002", (req, resp) => {
  console.log("Server is runing on port 9002...");
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
    "aymanC87",
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

          let endpoint = `http://localhost:9002/api/verify-email/${newUser.email}/code/${newUser.token}`;

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
          bcrypt
            .hash(newUser.password, saltRounds)
            .then((hash) => {
              newUser.password = hash;
              //insert newUser to the database , replace the question mark with the value of newUser
              DB.query(` INSERT INTO Email SET ? `, newUser, (err, resQQ) => {
                //error de cnx avec la base de donnee
                if (err) throw err;
                else {
                  resp.send("Please Check your Email !!");
                }
              });
              console.log(`Hash: ${hash}`);
              // Store hash in your password DB.
            })
            .catch((err) => console.error(err.message));
        }
      }
    }
  );
});

app.get("/api/verify-email/:email/code/:token", (req, resp) => {
  let Email = req.params.email;
  let Token = req.params.token;
  DB.query(
    `SELECT expirationdate FROM Email WHERE Email='${Email}' AND Token='${Token}'`,
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

app.get("/api/resend-email/:email/code/:token", (req, resp) => {
  let email = req.params.email;
  let Token = req.params.token;
  DB.query(
    `SELECT Email from Email WHERE Email='${email}' and Token='${Token}'`,
    (err, resQ) => {
      if (err) throw err;
      else {
        if (resQ.length === 0) {
          resp.send("Token or email are unvalid");
          console.log("Token or email are unvalid");
        } else {
          DB.query(
            `UPDATE Email SET expirationdate = ${new Date(
              Date.now() + 24 * 60 * 60 * 1000
            )} WHERE email='${email}'`,
            (err, resQ) => {
              if (err) throw err;
              else {
                console.log(resQ);
                resp.send("expiration date has been updated 😄 !!");
              }
            }
          );

          //create Api
          let endpoint = `http://localhost:9002/api/resend-email/${email}/code/${Token}`;
          //send email
          let transporter = nodemailer.createTransport({
            host: "smtp.mailgun.org",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: MAILGUN.user, // generated ethereal user
              pass: MAILGUN.password, // generated ethereal password
            },
          });
          // message
          let message = {
            from: '"Fred Foo 👻" <aumanelgad65@gmail.com>', // sender address
            to: email, // list of receivers
            subject: "Hello ✔", // Subject line
            html: ` <h1>thanks for your registration</h1>
                      <a href="${endpoint}">verify</a>
                      the link will be expired after 24h`, // html body
            tls: {
              rejectUnauthorized: false,
            },
          };
          //send email
          transporter.sendMail(message, (err, info) => {
            if (err) throw err;
            else {
              resp.send(`<h1>it worked</h1>`);
            }
          });
        }
      }
    }
  );
});

app.get("/api/forget-password/:email", (req, resp) => {
  let email = req.params.email;
  DB.query(`SELECT Email from Email WHERE Email='${email}'`, (err, resQ) => {
    if (err) throw err;
    else {
      if (resQ.length === 0) {
        resp.send("email is invalid");
        console.log("email is invalid");
      } else {
        DB.query(
          `SELECT isverified FROM Email WHERE Email='${email}'`,
          (err, resQ) => {
            if (err) throw err;
            else {
              console.log(resQ);

              if (resQ[0].isverified === 0) {
                resp.send("plz verify your email");
              } else {
                let token = randomstring.generate();
                // let expirationdate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                DB.query(
                  `UPDATE Email SET token='${token}', expirationdate=DATE_ADD(NOW(),INTERVAL 1 DAY ) WHERE Email='${email}' `,
                  (err, resQ) => {
                    if (err) throw err;
                    else {
                      console.log(resQ);
                      resp.send("check ur email");
                    }
                  }
                );

                //create api url

                let endpoint = `http://localhost:9002/api/reset-pass/${email}/code/${token}`;
                let transporter = nodemailer.createTransport({
                  host: "smtp.mailgun.org",
                  port: 587,
                  secure: false, // true for 465, false for other ports
                  auth: {
                    user: MAILGUN.Username, // generated ethereal user
                    pass: MAILGUN.password, // generated ethereal password
                  },
                });
                // message
                let message = {
                  from: "aymanelgad95@gmail.com", // sender address
                  to: email, // list of receivers
                  subject: "Hello ✔", // Subject line
                  html: ` <h1>thanks for your registration</h1>
                            <a href="${endpoint}">verify</a>
                            the link will be expired after 24h"`, // html body
                  tls: {
                    rejectUnauthorized: false,
                  },
                };
                //send email
                transporter.sendMail(message, (err, info) => {
                  if (err) throw err;
                  else {
                    resp.send(`<h1>it worked</h1>`);
                  }
                });
              }
            }
          }
        );
      }
    }
  });
});

app.get("/api/reset-pass/:email/code/:token", (req, resp) => {
  let email = req.params.email;
  let token = req.params.token;
  DB.query(
    `SELECT Email from Email WHERE Email='${email}' AND Token='${token}'`,
    (err, resQ) => {
      if (err) throw err;
      else {
        if (resQ.length === 0) {
          resp.send("invalid email or token");
        } else {
          DB.query(
            ` UPDATE Email
        SET token='', password='Aymanc78';
        WHERE Email ='${email}';`,
            (err, resQ) => {
              if (err) throw err;
              else {
                console.log(resQ);
                resp.send("pass changed !!");
              }
            }
          );
        }
      }
    }
  );
});

app.get("/api/login/:email/code/:pass", (req, resp) => {
  let email = req.params.email;
  let pass = req.params.pass;
  DB.query(
    `SELECT PASSWORD from Email WHERE Email='${email}' AND PASSWORD='${pass}'`,
    (err, resQ) => {
      if (err) throw err;
      else {
        if (resQ.length === 0) {
          resp.send("invalid email or pass");
        } else {
          resp.send("SIGNED IN");
        }
      }
    }
  );
});
