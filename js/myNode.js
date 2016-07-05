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
				"<a href=\"" + app.path() + "/example1\">/example1</a> - Simple Database Select - In-Line Callbacks</br>" +
				"<a href=\"" + app.path() + "/example2\">/example2</a> - Simple Database Select - Async Waterfall</br>" +
				"<a href=\"" + app.path() + "/example3\">/example3</a> - Call Stored Procedure</br>" +
				"<a href=\"" + app.path() + "/example4/1\">/example4</a> - Call Stored Procedure with Input = Partner Role 1 </br>" +
				"<a href=\"" + app.path() + "/example4/2\">/example4</a> - Call Stored Procedure with Input = Partner Role 2 </br>" +
				"<a href=\"" + app.path() + "/example5\">/example5</a> - Call Two Stored Procedures in Parallel Because We Can!</br>" +				
				require("./exampleTOC").fill();
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
			client.loadProcedure(null, "get_po_header_data", function(err, sp) {
				//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
				sp.exec({}, function(err, parameters, results) {
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

	//Database Call Stored Procedure With Inputs
	app.route("/example4/:partnerRole?")
		.get(function(req, res) {
			var client = req.db;
			var partnerRole = req.params.partnerRole;
			var inputParams = "";
			if (typeof partnerRole === "undefined" || partnerRole === null) {
				inputParams = {};
			} else {
				inputParams = {
					IM_PARTNERROLE: partnerRole
				};
			}
			//(Schema, Procedure, callback)
			client.loadProcedure(null, "get_bp_addresses_by_role", function(err, sp) {
				//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
				sp.exec(inputParams, function(err, parameters, results) {
					if (err) {
						res.type("text/plain").status(500).send("ERROR: " + err);
					}
					var result = JSON.stringify({
						EX_BP_ADDRESSES: results
					});
					res.type("application/json").status(200).send(result);
				});
			});
		});

	//Call 2 Database Stored Procedures in Parallel
	app.route("/example5/")
		.get(function(req, res) {
			var client = req.db;
			var inputParams = {
				IM_PARTNERROLE: "1"
			};
			var result = {};
			async.parallel([

				function(cb) {
					client.loadProcedure(null, "get_po_header_data", function(err, sp) {
						//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
						sp.exec(inputParams, function(err, parameters, results) {
							result.EX_TOP_3_EMP_PO_COMBINED_CNT = results;
							cb();
						});
					});

				},
				function(cb) {
					//(Schema, Procedure, callback)            		
					client.loadProcedure(null, "get_bp_addresses_by_role", function(err, sp) {
						//(Input Parameters, callback(errors, Output Scalar Parameters, [Output Table Parameters])
						sp.exec(inputParams, function(err, parameters, results) {
							result.EX_BP_ADDRESSES = results;
							cb();
						});
					});
				}
			], function(err) {
				if (err) {
					res.type("text/plain").status(500).send("ERROR: " + err);
				} else {
					res.type("application/json").status(200).send(JSON.stringify(result));
				}

			});

		});

	return app;
};