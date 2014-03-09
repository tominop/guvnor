var Daemon = require("./Daemon"),
	util = require("util"),
	Autowire = require("wantsit").Autowire,
	child_process = require("child_process"),
	path = require("path"),
	async = require("async")

var BossRPC = function() {
	Daemon.call(this);

	this._config = Autowire;
	this._processes = []; // Started child processes
}
util.inherits(BossRPC, Daemon);

BossRPC.prototype.afterPropertiesSet = function() {
	process.title = "boss";

	this._start(this._config.boss.socket, this._config.boss.infolog, this._config.boss.errorlog);
}

BossRPC.prototype._getApi = function() {
	return ["startProcess", "listProcesses"];
}

BossRPC.prototype.startProcess = function(script, options, callback) {
	var starter = child_process.fork(path.resolve(__dirname, "./ProcessWrapper"), {
		silent: false,
		detached: true,
		cwd: path.dirname(script),
		stdio: "ignore",
		env: {
			BOSS_SCRIPT: script,
			BOSS_OUTPUT_LOG: "/tmp/out",
			BOSS_ERROR_LOG: "/tmp/err"
		}
	});
	starter.on("message", function(event) {
		if(event.type == "process:ready") {
			this._processes.push(starter);
			callback();
		}
	}.bind(this));
}

BossRPC.prototype.listProcesses = function(callback) {
	async.parallel(this._processes.map(function(process) {
		return function(callback) {

			function onMessage(event) {
				if(event && event.type == "process:status") {
					process.removeListener("message", onMessage);
					callback(null, event.status);
				}
			}

			// Listen for a state update
			process.on("message", onMessage);

			// Ask the process to report it's state
			process.send({type: "boss:status"});
		};
	}), callback);
}

module.exports = BossRPC;