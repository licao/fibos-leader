"use strict";

const http = require('http');
const fs = require("fs");
const App = require('fib-app');
const config = require("./conf/conf.json");
var app = new App(config.DBconnString);

let setLogs = (logPath) => {
	if (!fs.exists(logPath)) fs.mkdir(logPath);

	console.add([{
		type: "console",
		levels: [console.FATAL, console.ALERT, console.CRIT, console.ERROR, console.WARN, console.NOTICE, console.INFO],
	}, {
		type: "file",
		levels: [console.FATAL, console.ALERT, console.CRIT, console.ERROR],
		path: logPath + "error.log",
		split: "hour",
		count: 128
	}, {
		type: "file",
		levels: [console.WARN],
		path: logPath + "warn.log",
		split: "hour",
		count: 128
	}, {
		type: "file",
		levels: [console.INFO],
		path: logPath + "access.log",
		split: "hour",
		count: 128
	}]);
}

setLogs("./task_logs");

app.db.use(require('./defs'));

setInterval(() => {
	app.db(db => {
		db.models.tasks.work();
	});
}, 60 * 1000);

var httpServer = new http.Server("", config.port, [(req) => {
		req.session = {};
	}, {
		'^/ping': (req) => {
			req.response.write("pong");
		},
		'/1.0/app': app,
		'/check': (req) => {
			req.response.addHeader('Content-Type', 'application/json');

			let runned = 0;
			let unrunned = 0;
			let live = [];
			let dead = [];

			let result = app.db(db => {
				db.models.tasks.findSync({}).forEach(function(o) {
					if (!o.hex_id) {
						unrunned++;
					} else {
						runned++;

						live.push({
							hex_id: o.hex_id,
							lastblocknum: o.lastblocknum,
							stop_block_num: o.taskconfig.stop_block_num,
							updatedAt: o.updatedAt
						});
					}
				});
			});

			req.response.write(JSON.stringify({
				unrunned: unrunned,
				runned: runned,
				live: live
			}));
		},
		"*": (req) => {
			//404
		}
	},
	(req) => {}
]);
httpServer.crossDomain = true;
httpServer.run(() => {});