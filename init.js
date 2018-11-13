const App = require('fib-app');
const config = require("./conf/conf.json");
var app = new App(config.DBconnString);

app.db.use(require('./defs'));

let checkids = require("./check.json");

app.db(db => {
	let rs = db.models.tasks.findSync({});

	if (rs.length) {
		console.error("exist:", rs.length);
		process.exit();
	}

	checkids.forEach((stop_block_num, index) => {
		console.log(index);
		db.models.tasks.createSync({
			taskname: "dicefobetone",
			taskconfig: {
				port: 8801 + index,
				stop_block_num: stop_block_num
			}
		});
	});
});

process.exit();