/*eslint no-console: 0, no-unused-vars: 0*/
"use strict";

var xsjs = require("sap-xsjs");
var xsenv = require("sap-xsenv");
var passport = require("passport");
var xssec = require("sap-xssec");
var xsHDBConn = require("sap-hdbext");
var port = process.env.PORT || 3000;
var server = require("http").createServer();
var express = require("express");

var exerciseAsync = require("./exerciseAsync");
var textBundle = require("./textBundle");
var chatServer = require("./chatServer");
var excel = require("./excel");
var xml = require("./xml");
var zip = require("./zip");
var cds = require("./cds");

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

try {
	app.use("/node", require("./myNode"));
	app.use("/node/excAsync", exerciseAsync(server));
	app.use("/node/textBundle", textBundle());
	app.use("/node/chat", chatServer(server));
	app.use("/node/excel", excel());
	app.use("/node/xml", xml());
	app.use("/node/zip", zip());
	app.use("/node/cds", cds());
} catch (err) {
	console.error(err);
}

var options = xsjs.extend({
	//	anonymous : true, // remove to authenticate calls
	redirectUrl: "/index.xsjs"
});

//configure HANA
try {
	options = xsjs.extend(options, xsenv.getServices({
		hana: {
			tag: "hana"
		}
	}));
} catch (err) {
	console.error(err);
}

try {
	options = xsjs.extend(options, xsenv.getServices({
		secureStore: {
			tag: "hana"
		}
	}));
} catch (err) {
	console.error(err);
}

//Add SQLCC
try {
	options.hana.sqlcc = {
		"com.dev703.sqlcc_config": "CROSS_SCHEMA_SFLIGHT"
	};
} catch (err) {
	console.error(err);
}

// configure UAA
try {
	options = xsjs.extend(options, xsenv.getServices({
		uaa: {
			tag: "xsuaa"
		}
	}));
} catch (err) {
	console.error(err);
}

// start server
var xsjsApp = xsjs(options);
app.use(xsjsApp);

server.on("request", app);
server.listen(port, function() {
	console.log("HTTP Server: " + server.address().port);
});