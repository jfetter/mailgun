"use strict";

var User = require("../models/user");

module.exports = function(req, res, next){
	if(!req.user.confirmedAcct){
		return res.status(401).send({err: "MUST CONFIRM ACCOUNT VIA EMAIL"})
	} else{
		next();
	}
};
