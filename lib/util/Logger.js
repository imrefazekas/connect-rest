'use strict'

let winston = require('winston')

function extend ( object, source, respect ) {
	if ( source && object )
		for ( let key of Object.keys(source) )
			if ( !respect || !object[ key ] )
				object[ key ] = source[ key ]
	return object
}

exports.createLogger = function ( name, extension, logger ) {
	logger = logger ? ( logger.file ? exports.createWinstonLogger( logger ) : logger ) : exports.createWinstonLogger( {} )
	logger[name + 'log'] = function ( err, message, obj, level ) {
		this.log( err ? 'error' : (level || 'debug'), err ? err.message : message, extend( obj || {}, extension ) )
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
