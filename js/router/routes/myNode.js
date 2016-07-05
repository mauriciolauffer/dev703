/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
var express = require("express");
var async = require("async");

module.exports = function() {
	var app = express.Router();
	
	//Hello Router
	app.get("/", function(req, res) {
		var output = "<H1>HDBEXT Examples</H1></br>" +
			"<a href=\"" + req.baseUrl + "/example1\">/example1</a> - Simple Database Select - In-Line Callbacks</br>" +
			"<a href=\"" + req.baseUrl + "/example2\">/example2</a> - Simple Database Select - Async Waterfall</br>" +
			"<a href=\"" + req.baseUrl + "/example3\">/example3</a> - Call Stored Procedure</br>" +
			"<a href=\"" + req.baseUrl + "/example4/1\">/example4</a> - Call Stored Procedure with Input = Partner Role 1 </br>" +
			"<a href=\"" + req.baseUrl + "/example4/2\">/example4</a> - Call Stored Procedure with Input = Partner Role 2 </br>" +
			"<a href=\"" + req.baseUrl + "/example5\">/example5</a> - Call Two Stored Procedures in Parallel Because We Can!</br>" +
			require(global.__base + "utils/exampleTOC").fill();
		res.type("text/html").status(200).send(output);
	});

	//Simple Database Select - In-line Callbacks
	app.get("/example1", function(req, res) {
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
	app.get("/example2", function(req, res) {
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
	app.get("/example3", function(req, res) {
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
	app.get("/example4/:partnerRole?", function(req, res) {
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
	app.get("/example5/", function(req, res) {
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