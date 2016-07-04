/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0*/
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
			var output = "<H1>HDBEXT Examples</H1></br>" +
				"/example1 - Simple Database Select - In-Line Callbacks</br>" +
				"/example2 - Simple Database Select - Async Waterfall</br>" +
				"/example3 - Call Stored Procedure</br>";
			res.type("text/html").status(200).send(output);
		});

	//Simple Database Select - In-line Callbacks
	app.route("/example1")
		.get(function(req, res) {
			var client = req.db;
			client.prepare(
				"select SESSION_USER from \"DUMMY\" ",
				function(err, statement) {
					statement.exec([],
						function(err, results) {
							if (err) {
								res.type("text/plain").status(500).send("ERROR: " + err);
							} else {
								var result = JSON.stringify({
									Objects: results
								});
								res.type("application/json").status(200).send(result);
							}
						});
				});
		});

	//Simple Database Select - Async Waterfall
	app.route("/example2")
		.get(function(req, res) {
			var client = req.db;
			async.waterfall([

				function prepare(callback) {
					client.prepare("select SESSION_USER from \"DUMMY\" ",
						function(err, statement) {
							callback(null, err, statement);
						});
				},

				function execute(err, statement, callback) {
					statement.exec([], function(execErr, results) {
						callback(null, execErr, results);
					});
				},
				function response(err, results, callback) {
					if (err) {
						res.type("text/plain").status(500).send("ERROR: " + err);
					} else {
						var result = JSON.stringify({
							Objects: results
						});
						res.type("application/json").status(200).send(result);
					}
					callback();
				}
			]);
		});

	//Simple Database Call Stored Procedure
	app.route("/example3")
		.get(function(req, res) {
			var client = req.db;
			//(Schema, Procedure, callback)
			client.loadProcedure(null,"get_po_header_data", function(err, sp) {
				//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
				sp.exec({},function(err, parameters, results) {
					if (err) {
						res.type("text/plain").status(500).send("ERROR: " + err);
					}
					var result = JSON.stringify({
						EX_TOP_3_EMP_PO_COMBINED_CNT: results
					});
					res.type("application/json").status(200).send(result);
				});
			});
		});

	return app;
};