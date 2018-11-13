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
		status: {
			type: "text",
			size: 32
		},
		hex_id: {
			unique: true,
			type: "text",
			size: 32
		},
		lastblocknum: {
			type: "integer",
			size: 8
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

					let r = db.driver.execQuerySync("UPDATE `tasks` set status = 'running', hex_id = ?, updatedAt = ? where id = ? and hex_id is null;", [hex_id, new Date(), result.id]);
					if (r.affected === 1) break;
				}

				return {
					success: result
				}
			}
		},
		ACL: function(session) {
			return {
				"*": {
					"getTask": true
				}
			}
		},
		OACL: function(session) {}
	});

	return Tasks;
}