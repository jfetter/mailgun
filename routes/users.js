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

      function encrypt(text) {
        var cipher = crypto.createCipher(algorithm, password)
        console.log("cipher", cipher)
        var crypted = cipher.update(text, "utf8", "hex")
        console.log("crypted1", crypted)
        crypted += cipher.final("hex");
        console.log("crypted2", crypted)
        return crypted;
      }
      console.log("secret", secret)
      var secret_code = (encrypt(secret));

      var data = {
      //Specify email data
      from: from_who,
      //The email to contact
      to: email,
      //Subject and text data  
      subject: 'Hello from Mailgun',
      html: ' <a href="http://localhost:3000/users/validate/' + secret_code + '"> Click here to add your email address to a mailing list </a>'
    }
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

// receive confirmation request from users by email link
router.get('/validate/:secret', function(req, res) {
  var secret =  req.params.secret

  function decrypt(text){
    var decipher = crypto.createDecipher(algorithm, password)
    var dec = decipher.update(text, 'hex', 'utf8')
    console.log("inside text!!", text);
    console.log("dec", dec)
    return dec;
  }
  var idFromParam = decrypt(secret);
  console.log("idFromParam", idFromParam)

  User.findById(idFromParam, function(err, user){
    var now = Date.now();
    console.log("user.createdAt", user)
    if (now - user.createdAt <= 1000 * 60 * 60 * 24) {
      console.log("timestamp valid!", (now - user.createdAt))
      res.render('login', {title: 'Login'});
      //change verified status

    }
    else { 
      //delete user info
      res.send("Looks like we lost you!  Please register again")
    }
  })

})


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