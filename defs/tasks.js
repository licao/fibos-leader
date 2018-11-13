"use strict";

module.exports = (db) => {
	/**
	 * @api DBConfig Table Define
	 * @apiVersion 1.0.0
	 * @apiGroup Tasks
	 * @apiDescription Tasks Table字段解释 用户地址管理
	 *
	 * @apiParam {String} taskname 任务名称
	 * @apiParam {JSON} taskconfig 任务执行配置
	 */

	let Tasks = db.define('tasks', {
		taskname: {
			required: true,
			type: "text",
			size: 32
		},
		taskconfig: {
			required: true,
			type: "object",
			big: true
		},
		hex_id: {
			unique: true,
			type: "text",
			size: 128
		},
		lastblocknum: {
			type: "integer",
			size: 8,
			defaultValue: 0
		},
		repeatblocknum: {
			type: "integer",
			size: 8,
			defaultValue: 0
		}
	}, {
		hooks: {},
		methods: {},
		validations: {},
		functions: {
			getTask: (req, data) => {
				/**
				 * @api {POST} /1.0/app/tasks/getTask getTask
				 * @apiName getTask
				 * @apiVersion 1.0.0
				 * @apiGroup Tasks
				 * @apiDescription 获取任务
				 *
				 * @apiParam {string} hex_id 唯一id
				 *
				 * @apiParamExample {json} Request-Example:
				 *     {
				 *         hex_id: "122222222222",			
				 *     }
				 *
				 */

				let hex_id = data.hex_id

				if (!hex_id) return {
					error: {
						code: 4000421,
						message: "hex_id is null"
					}
				};

				let result = {};

				while (true) {
					let rs = db.driver.execQuerySync('select * from `tasks` where hex_id is null order by id limit 1;');

					if (!rs.length) return {
						error: {
							code: 4000422,
							message: "task is null"
						}
					}

					result.id = rs[0].id;
					result.taskconfig = JSON.parse(rs[0].taskconfig.toString());

					let r = db.driver.execQuerySync("UPDATE `tasks` set hex_id = ?, updatedAt = ? where id = ? and hex_id is null;", [hex_id, new Date(), result.id]);
					if (r.affected === 1) break;
				}

				console.notice("[get task]hex_id:%s taskconfig:%j", hex_id, result.taskconfig);

				return {
					success: result
				}
			},
			updateTask: (req, data) => {
				/**
				 * @api {POST} /1.0/app/tasks/getTask getTask
				 * @apiName getTask
				 * @apiVersion 1.0.0
				 * @apiGroup Tasks
				 * @apiDescription 获取任务
				 *
				 * @apiParam {string} hex_id 唯一id
				 *
				 * @apiParamExample {json} Request-Example:
				 *     {
				 *         hex_id: "122222222222",			
				 *     }
				 *
				 */

				let hex_id = data.hex_id;
				let lastblocknum = data.lastblocknum;

				if (!hex_id || !lastblocknum) return {
					error: {
						code: 4000421,
						message: "hex_id or lastblocknum is null"
					}
				};

				let rs = db.driver.execQuerySync("select * from  `tasks` where hex_id = ?;", [hex_id]);

				if (!rs.length) return {
					success: "task is not allowed"
				}

				let repeatblocknum = rs[0].repeatblocknum;

				if (repeatblocknum >= 5) return {
					success: "repeatblocknum is error"
				}

				if (lastblocknum != rs[0].lastblocknum) {
					repeatblocknum = 0;
				} else {
					repeatblocknum++;
				}

				let r = db.driver.execQuerySync("UPDATE `tasks` set lastblocknum = ?, repeatblocknum = ?, updatedAt = ? where hex_id = ?;", [lastblocknum, repeatblocknum, new Date(), hex_id]);

				console.notice("[update task]hex_id:%s lastblocknum:%s", hex_id, lastblocknum);

				return {
					success: r.affected === 1 ? "success" : "error"
				}
			}
		},
		ACL: function(session) {
			return {
				"*": {
					"getTask": true,
					"updateTask": true
				}
			}
		},
		OACL: function(session) {}
	});

	Tasks.work = () => {
		let updatedAt = new Date(new Date().getTime() - 6 * 60 * 1000);

		let rs = db.driver.execQuerySync('select * from `tasks` where hex_id is not null and updatedAt < ?;', [updatedAt]);

		console.log("work length:", rs.length);

		if (rs.length) {
			rs.forEach((o) => {
				let r = db.driver.execQuerySync('UPDATE `tasks` set hex_id = null, lastblocknum = 0, repeatblocknum = 0 where hex_id is not null and updatedAt < ? and id = ?;', [updatedAt, o.id]);

				if (r.affected === 1) console.warn("work affected id:%s", o.id);
			});
		}
	};

	return Tasks;
}