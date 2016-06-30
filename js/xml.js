/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, quotes: 0*/
"use strict";
var express = require("express");
var xssec = require("sap-xssec");
var passport = require("passport");
var xsHDBConn = require("sap-hdbext");
var xsenv = require("sap-xsenv");
var async = require("async");
var XmlDocument = require("xmldoc").XmlDocument;

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
			res.send("XML Example");
		});

	//Simple Database Select - In-line Callbacks
	app.route("/example1")
		.get(function(req, res) {
			var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
				'<!-- this is a note -->\n' +
				'<note noteName="NoteName">' +
				'<to>To</to>' +
				'<from>From</from>' +
				'<heading>Note heading</heading>' +
				'<body>Note body</body>' +
				'</note>';
			var body = "";
			var note = new XmlDocument(xml);
			note.eachChild(function(item) {
				body += item.val + '</br>';
			});
			res.type("text/html").status(200).send(body);

		});

	return app;
};