let http = require("http");
let coroutine = require('coroutine');
let uuid = require("uuid");
let fibos = require("fibos");

let hex_id = uuid.random().hex();
let r = http.post("http://127.0.0.1:8080/1.0/app/tasks/getTask", {
	json: {
		hex_id: hex_id
	}
}).json();

console.log("getTask:", r);


for (var i = 0; i < 10; i++) {
	let lastblocknum = 110;

	r = http.post("http://127.0.0.1:8080/1.0/app/tasks/updateTask", {
		json: {
			hex_id: hex_id,
			lastblocknum: lastblocknum
		}
	}).json();
	console.log("updateTask:", r);

	coroutine.sleep(1000);
}