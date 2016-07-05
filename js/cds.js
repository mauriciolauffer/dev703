/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, quotes: 0, no-use-before-define: 0*/
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

	var cds = require("sap-cds");
	var client = null;
	var oEmployee = null;
	cds.$importEntities([{
		$entity: "dev703::MD.Employees"
	}], function(error, entities) {
		oEmployee = entities["dev703::MD.Employees"];
	});

	//Hello Router
	app.route("/")
		.get(function(req, res) {
			var output = "<H1>Node-CDS Examples</H1></br>" +
				"<a href=\"" + app.path() + "/example1\">/example1</a> - Unmanaged Query</br>" +
				"<a href=\"" + app.path() + "/example2\">/example2</a> - Managed Find</br>" +
				"<a href=\"" + app.path() + "/example3\">/example3</a> - Managed Get</br>" +
				"<a href=\"" + app.path() + "/example4\">/example4</a> - Managed Update/Save</br>" +
				require("./exampleTOC").fill();
			res.type("text/html").status(200).send(output);
		});

	//Unmanaged Query
	app.route("/example1")
		.get(function(req, res) {
			oEmployee.$query().$project({
				LOGINNAME: true
			}).$execute({}, function(error, results) {
				res.type("application/json").status(200).send(JSON.stringify(results));
			});
		});

	//Managed Find 
	app.route("/example2")
		.get(function(req, res) {

			cds.$getTransaction(req.db, function(error, tx) {
				client = tx;
				client.$find(oEmployee, {
						LOGINNAME: {
							$ne: "SPRINGS"
						}
					},
					function(error, instances) {
						res.type("application/json").status(200).send(JSON.stringify(instances));
						client.$close();
					});
			});

		});

	//Managed Get 
	app.route("/example3")
		.get(function(req, res) {

			cds.$getTransaction(req.db, function(error, tx) {
				client = tx;
				client.$get(oEmployee, {
						EMPLOYEEID: "1"
					},
					function(error, instance) {
						res.type("application/json").status(200).send(JSON.stringify(instance));
						client.$close();
					});
			});

		});

	//Managed Get and Update
	app.route("/example4")
		.get(function(req, res) {

			cds.$getTransaction(req.db, function(error, tx) {
				client = tx;
				client.$get(oEmployee, {
						EMPLOYEEID: "1"
					},
					function(error, instance) {
						instance.VALIDITY.STARTDATE = new Date();
						client.$save(instance, function(error, savedInstance) {
							res.type("application/json").status(200).send(JSON.stringify(savedInstance));
							client.$close();
						});
					});
			});

		});

	return app;
};