/*eslint no-console: 0, no-unused-vars: 0*/
"use strict";
var express = require("express");
var app = express(); 
var WebSocketServer = require("ws").Server;
var asyncLib = require("./async/async.js");
var dbAsync = require("./async/databaseAsync.js");
var dbAsync2 = require("./async/databaseAsync2.js");
var fileSync = require("./async/fileSync.js");
var fileAsync = require("./async/fileAsync.js");
var httpClient = require("./async/httpClient.js");

module.exports = function(server){


	app.use(function(req, res){
    	res.send({ msg: "hello" });
	});
	var wss = new WebSocketServer({ 
		server: server, 
		path: "/node/excAsync"
	});

	wss.broadcast = function (data) {
		var message = JSON.stringify({text: data});
    	for (var i in this.clients)
        	this.clients[i].send(message);
    	console.log("sent: %s", message);
	};

	wss.on("connection", function (ws) {
    	console.log("Connected");	
		
		ws.on("message", function (message) {
        	console.log("received: %s", message);
        	var data = JSON.parse(message);
        	switch(data.action){
        		case "async":
        			asyncLib.asyncDemo(wss);
        			break;
        		case "fileSync":
        	    	fileSync.fileDemo(wss);
        	    	break;
        		case "fileAsync":
        	    	fileAsync.fileDemo(wss);
        	    	break;  
        		case "httpClient":
        	    	httpClient.callService(wss);
        	    	break;    
        		case "dbAsync":
        	    	dbAsync.dbCall(wss);
        	    	break;  
        		case "dbAsync2":
        	    	dbAsync2.dbCall(wss);
        	    	break;         	           	        	          	    
        		default:
					wss.broadcast("Error: Undefined Action: "+ data.action);
					break;
        }
    });    	
    	ws.send(JSON.stringify({
        	text: "Connected to Exercise 3"
    	}));	
	});
	
	return app;
};
