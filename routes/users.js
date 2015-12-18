'use strict';

var express = require('express');
var router = express.Router();
var Mailgun = require("mailgun-js")
var crypto = require("crypto")

var api_key = process.env.MAILGUN_KEY;
var domain = process.env.MAILGUN_DOMAIN;
var from_who = "jillian.fetter@gmail.com"

var algorithm = "aes-256-gcm";
var iv = "60iP0h6vJoEa";
var password = '3zTvzr3p67VC61jmV54rIYu1545x4TlY'

var User = require('../models/user');



// USERS

// register a new user
router.post('/register', function(req, res) {
  User.register(req.body, function(err, savedUser){
   var id = savedUser._id;
   var email = savedUser.email;
      //We pass the api_key and domain to the wrapper, or it won't be able to identify + send emails
      var mailgun = new Mailgun({apiKey: api_key, domain: domain});
      var secret = savedUser._id + ":" + Date.now()
      function encrypt(secret){
        var cipher = crypto.createCipheriv(algorithm, password, iv)
        // console.log("CIPHHHHERRRRR", cipher)
        var encrypted = cipher.update(secret, "utf8", "hex")
        encrypted += cipher.final("hex");
        var tag = cipher.getAuthTag();
        console.log( "ENCRYPT AND TAG", encrypted, tag)
        return{
          content: encrypted,
          tag: tag
        };
      }

      var secret_code = JSON.stringify(encrypt(secret));


      var data = {
      //Specify email data
      from: from_who,
      //The email to contact
      to: email,
      //Subject and text data  
      subject: 'Hello from Mailgun',
      html: ' <a href="http://www.google.com"> Click here to add your email address to a mailing list </a>'
    }
      console.log("DATA", data)
      //Invokes the method to send emails given the above data with the helper library
      mailgun.messages().send(data, function (err, body) {
          //If there is an error, render the error page
          if (err) {
            console.log("MAILGUN got an error!!!!!!!!!! ", err);
          }
          //Else we can greet    and leave
          else {
              //Here "submitted.jade" is the view file for this landing page 
              //We pass the variable "email" from the url parameter in an object rendered by Jade
              //('submitted', { email : email });
              console.log("MAILGUN SUBMITTED BODDDDYYYY", body);
        }
      });
  });

res.status(err ? 400 : 200).send(err || savedUser);
});


router.post('/login', function(req, res) {
  User.authenticate(req.body, function(err, user){
    if(err || !user) {
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





