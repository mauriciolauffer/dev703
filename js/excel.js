/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, dot-notation: 0*/
"use strict";
var express = require("express");
var xssec = require("sap-xssec");
var passport = require("passport");
var xsHDBConn = require("sap-hdbext");
var xsenv = require("sap-xsenv");
var excel = require("node-xlsx");
var fs = require("fs");
var path = require("path");


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

	//Simple Database Select - In-line Callbacks
	app.route("/download")
		.get(function(req, res) {
			var client = req.db;
			var query = "SELECT TOP 10 " +
				" PURCHASEORDERID as \"PurchaseOrderItemId\", " +
				" PURCHASEORDERITEM as \"ItemPos\", " +
				" PRODUCT as \"ProductID\", " +
				" GROSSAMOUNT as \"Amount\" " +
				" FROM \"PO.Item\"  ";
			client.prepare(
				query,
				function(err, statement) {
					statement.exec([],
						function(err, rs) {
							if (err) {
								res.type("text/plain").status(500).send("ERROR: " + err);
							} else {
								var out = [];
								for (var i = 0; i < rs.length; i++) {
									out.push([rs[i]["PurchaseOrderItemId"], rs[i]["ItemPos"], rs[i]["ProductID"], rs[i]["Amount"]]);
								}
								var result = excel.build([{
									name: "Purchase Orders",
									data: out
								}]);
								res.header("Content-Disposition", "attachment; filename=Excel.xlsx");
								res.type("application/vnd.ms-excel").status(200).send(result);
							}
						});
				});
		});


	return app;
};