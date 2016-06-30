/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, quotes: 0, new-cap: 0*/
"use strict";
var express = require("express");
var xssec = require("sap-xssec");
var passport = require("passport");
var xsHDBConn = require("sap-hdbext");
var xsenv = require("sap-xsenv");
var async = require("async");

module.exports = function() {
	var app = express();
	passport.use("JWT", new xssec.JWTStrategy(xsenv.getServices({
		uaa: {
			tag: "xsuaa"
		}
	}).uaa));
	app.use(passport.initialize());

	app.use(
		passport.authenticate("JWT", {
			session: false
		}),
		xsHDBConn.middleware());

	//Hello Router
	app.route("/")
		.get(function(req, res) {
			res.send("ZIP Example");
		});

	//Simple Database Select - In-line Callbacks
	app.route("/example1")
		.get(function(req, res) {

			var zip = new require("node-zip")();
			zip.file("folder1/demo1.txt", "This is the new ZIP Processing in Node.js");
			zip.file("demo2.txt", "This is also the new ZIP Processing in Node.js");
			var data = zip.generate({
				base64: false,
				compression: "DEFLATE"
			});

			res.header("Content-Disposition", "attachment; filename=ZipExample.zip");
			res.type("application/zip").status(200).send(new Buffer(data, "binary"));

		});

	return app;
};