'use strict';

var express = require('express');
var router = express.Router();
var Mailgun = require("mailgun-js")
var crypto = require("crypto")

var api_key = process.env.MAILGUN_KEY;
var domain = process.env.MAILGUN_DOMAIN;
var from_who = "jillian.fetter@gmail.com"

var algorithm = "aes-256-gcm";
// var iv = "60iP0h6vJoEa"; // deleted iv because it seems that we do not need it for text encryotion
var password = 'd6F3Efeq'

var User = require('../models/user');

// USERS

// register a new user
router.post('/register', function(req, res) {
  User.register(req.body, function(err, savedUser) {
    var id = savedUser._id;
    var email = savedUser.email;
    //We pass the api_key and domain to the wrapper, or it won't be able to identify + send emails
    var mailgun = new Mailgun({
      apiKey: api_key,
      domain: domain
    });
    var secret = (savedUser._id).toString()
      // + ":" + Date.now()

    console.log("secret before encrypt", secret)
    console.log("secret before encrypt", secret)

    function encrypt(secret) {
      var cipher = crypto.createCipher(algorithm, password)
      var crypted = cipher.update(secret, "utf8", "hex")
      crypted += cipher.final("hex");
      console.log("crypted", crypted)
      return crypted;
    }
    console.log("secret_code", secret_code)
    var secret_code = JSON.stringify(encrypt(secret));

    var data = {
      //Specify email data
      from: from_who,
      //The email to contact
      to: email,
      //Subject and text data  
      subject: 'Hello from Mailgun',
      html: ' <a href="http://localhost:3000/users/validate?"' + secret_code + '> Click here to add your email address to a mailing list </a>'
    }
    console.log("DATA", data)
      //Invokes the method to send emails given the above data with the helper library
    mailgun.messages().send(data, function(err, body) {
      //If there is an error, render the error page
      if (err) {
        console.log("MAILGUN got an error!!!!!!!!!! ", err);
      } else {
        console.log("MAILGUN SUBMITTED BODDDDYYYY", body);
      }
    });
    res.status(err ? 400 : 200).send(err || savedUser);
  });

});

//receive confirmation request from users by email link
// router.get('/validate/:secret_code', function(req, res) {
//   var secret_code =  req.params.secret_code
//   console.log("secret_code", secret_code)

//   function decrypt(secret_code){
//     var decipher = crypto.createDecipher(algorithm, password)
//     var dec = decipher.update(secret_code, 'hex', 'utf8')
//     dec += decipher.final('utf8');
//     return dec
//   }


//   res.render('login', {title: 'Login'});
// })


router.post('/login', function(req, res) {
  User.authenticate(req.body, function(err, user) {
    if (err || !user) {
      res.status(400).send(err);
    } else {
      var token = user.token();
      res.cookie('token', token);
      res.send(user);
    }
  });
});

router.post('/logout', function(req, res) {
  res.clearCookie('username');
  res.clearCookie('userId');
  res.clearCookie('token');
  res.send();
})

module.exports = router;