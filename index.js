"use strict";

const http = require('http');
const App = require('fib-app');
const config = require("./conf/conf.json");
var app = new App(config.DBconnString);

app.db.use(require('./defs'));

var httpServer = new http.Server("", config.port, [(req) => {
		req.session = {};
	}, {
		'^/ping': (req) => {
			req.response.write("pong");
		},
		'/1.0/app': app,
		"*": (req) => {
			//404
		}
	},
	(req) => {}
]);
httpServer.crossDomain = true;
httpServer.run(() => {});