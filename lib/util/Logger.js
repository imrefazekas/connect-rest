'use strict'

let winston = require('winston')

let Assigner = require('assign.js')
let assigner = new Assigner()

let path = require('path')
let PROJECT_ROOT = path.join(__dirname, '..', '..')
function getStackInfo (level, err) {
	if (!err) return {}

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


exports.createLogger = function ( name, extension, logger ) {
	logger = logger ? ( logger.file ? exports.createWinstonLogger( logger ) : logger ) : exports.createWinstonLogger( {} )
	logger[name + 'log'] = function ( err, message, obj, level ) {
		this.log( err ? 'error' : (level || 'debug'), err ? (err.message || err.toString()) : message, assigner.assign( obj || { }, extension, getStackInfo( 1, err ) ) )
	}.bind( logger )

	return logger
}

exports.createWinstonLogger = function ( options ) {
	options = options || {}
	if ( options.exceptionFile )
		winston.handleExceptions(new winston.transports.File({ filename: options.exceptionFile }))
	let transports = [
		new (winston.transports.Console)({ level: 'error', colorize: 'true' }),
		new (winston.transports.File)( {
			filename: options.file || 'server.log',
			level: options.level || 'info',
			maxsize: options.maxSize || 1000000,
			maxFiles: options.maxFiles || 1
		} )
	]
	return new (winston.Logger)({ transports: transports })
}
