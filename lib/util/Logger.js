let pino = require('pino')

let Assigner = require('assign.js')
let assigner = new Assigner()

let path = require('path')
let PROJECT_ROOT = path.join(__dirname, '..', '..')
function getStackInfo (level, err) {
	if (!err) return {}

	err = err.stack ? err : new Error( err )

	let stackIndex = level || 1
	let stacklist = err.stack.split('\n')
	// let stacklist = (new Error()).stack.split('\n').slice(3)

	let stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi
	let stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi

	let s = stacklist[stackIndex] || stacklist[0]
	let sp = stackReg.exec(s) || stackReg2.exec(s)

	if (sp && sp.length === 5) {
		return { callstack: {
			method: sp[1],
			relativePath: path.relative(PROJECT_ROOT, sp[2]),
			line: sp[3],
			pos: sp[4],
			file: path.basename(sp[2]),
			stack: stacklist.join('\n')
		} }
	}
}

// 'fatal' 'error' 'warn' 'info' 'debug' 'trace'
exports.createLogger = function ( name, extension, logger = {} ) {
	logger = logger.info ? logger : exports.createPinoLogger( name, logger )
	logger[name + 'log'] = function ( err, message, obj, level ) {
		if (err)
			this[ 'error' ]( assigner.assign( obj || { }, extension, getStackInfo( 1, err ) ), err.message || err.toString() )
		else
			this[ level || 'debug' ]( assigner.assign( obj || { }, extension ), message )
	}.bind( logger )

	return logger
}

exports.createPinoLogger = function ( name, options = {} ) {
	let logger = pino({
		name: name,
		safe: true,
		extreme: true,
		level: options.level || 'info',
		serializers: {
			req: pino.stdSerializers.req,
			res: pino.stdSerializers.res
		}
	})
	return logger
}
