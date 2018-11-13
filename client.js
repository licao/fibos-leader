let process = require('process');
let http = require("http");
let uuid = require("uuid");
let fibos = require("fibos");
let fs = require("fs");

let rootPath = "/blockData/";
let dataPath;
while (true) {
	let name = console.readLine("name:");

	dataPath = rootPath + name;

	if (!fs.exists(dataPath)) {

		fs.mkdir(dataPath);

		process.run("tar", ["-zxvSf", rootPath + "data.tar.gz", "-C", dataPath]);

		dataPath = dataPath + "/data/";

		break;
	}
	console.warn("dataPath:%s exist!", dataPath);
}

let lastblocknum = 0;
let hex_id = name + "_" + uuid.random().hex();
let r = http.post("http://task.fibos.io:8080/1.0/app/tasks/getTask", {
	json: {
		hex_id: hex_id
	}
}).json();

console.error("name:%s, dataPath:%s, hex_id:%s, stop_block_num:%s", name, dataPath, hex_id, r.taskconfig.stop_block_num);

fibos.config_dir = dataPath;
fibos.data_dir = dataPath;

fibos.load("net", {
	"p2p-peer-address": [
		"seed.fibos.rocks:10100",
		"ln-p2p.fibos.io:9870",
		"ca-p2p.fibos.io:9870",
		"sl-p2p.fibos.io:9870",
	],
	"max-clients": 100
});

fibos.load("producer", {
	'max-transaction-time': 3000
});

let timer = setInterval(function() {
	if (!lastblocknum) return;

	try {
		let r = http.post("http://task.fibos.io:8080/1.0/app/tasks/updateTask", {
			json: {
				hex_id: hex_id,
				lastblocknum: lastblocknum
			}
		}).json();
		console.log("r:", r);

		if (r !== "success") {
			timer.clear();
			fibos.stop();
		}
	} catch (e) {
		console.error(e.stack);
	}


}, 5000);

fibos.load("chain", {
	"contracts-console": true,
	'chain-state-db-size-mb': 8 * 1024,
});
fibos.load("chain_api");

fibos.load("emitter");
fibos.on("action", function(act) {
	lastblocknum = act.block_num.toString();
	console.log(lastblocknum);
});



fibos.fix_state('dicefobetone', r.taskconfig.stop_block_num);
fibos.start();