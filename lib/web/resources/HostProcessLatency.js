var Autowire = require('wantsit').Autowire

HostProcessLatency = function() {
  this._hostList = Autowire
}

HostProcessLatency.prototype.retrieveOne = function(request, reply) {
  var host = this._hostList.getHostByName(request.params.hostId)

  if(!host) {
    return reply('No host found for name ' + request.params.hostId).code(404)
  }

  var proc = host.findProcessById(request.params.processId)

  if(!proc) {
    return reply('No process found for id ' + request.params.processId).code(404)
  }

  reply(proc.usage.latency)
}

module.exports = HostProcessLatency