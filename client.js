let http = require("http");
let uuid = require("uuid");
let fibos = require("fibos");

let env = process.argv[2];

let host;
if (env === "dev") {
	host = "http://127.0.0.1:8080";
} else {
	host = "http://54.255.134.172:8080";
}

console.log("env:%s host:%s", env, host);

function getTask() {
	let hex_id = uuid.random().hex();

	let r = http.post(host + "/1.0/app/tasks/getTask", {
		json: {
			hex_id: hex_id
		}
	}).json();

	r.hex_id = hex_id;

	return r;
}

function updateTask(hex_id, lastblocknum) {
	let r = http.post(host + "/1.0/app/tasks/updateTask", {
		json: {
			hex_id: hex_id,
			lastblocknum: lastblocknum
		}
	}).json();

	console.log("r:", r);

	return r;
}


let task = getTask();

console.error(task);

updateTask(task.hex_id, 110);

process.exit();

let port = task.taskconfig.port;
let hex_id = task.hex_id;
let stop_block_num = task.taskconfig.stop_block_num;

console.error("port:%s hex_id:%s stop_block_num:%s", port, hex_id, stop_block_num);

fibos.load("http", {
	"http-server-address": "0.0.0.0:" + port,
	"access-control-allow-origin": "*",
	"http-validate-host": false,
	"verbose-http-errors": true //打开报错
});


fibos.load("net", {
	"p2p-peer-address": ["127.0.0.1:9870"],
	"max-clients": 100
});

fibos.load("producer", {
	'max-transaction-time': 3000
});


fibos.load("chain", {
	"contracts-console": true,
	'chain-state-db-size-mb': 8 * 1024,
});
fibos.load("chain_api");

fibos.fix_state('dicefobetone', stop_block_num);

fibos.start();