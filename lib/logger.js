var winston = require('winston');
var _ = require('lodash');

exports.createLogger = function( name, extension, logger ){
	logger = logger ? ( logger.file ? exports.createWinstonLogger( logger ) : logger ) : exports.createWinstonLogger( {} );
	logger[name+'log'] = function( err, message, obj, level ){
		this.log( err ? 'error' : (level || 'debug'), err ? err.message : message, _.extend( obj || {}, extension ) );
	}.bind( logger );
	return logger;
};

exports.createWinstonLogger = function( options ){
	options = options || {};
	if( options.exceptionFile )
		winston.handleExceptions(new winston.transports.File({ filename: options.exceptionFile }));
	var transports = [
		new (winston.transports.Console)({ level: 'error', colorize: 'true' }),
		new (winston.transports.File)( {
			filename: options.file || 'server.log',
			level: options.level || 'info',
			maxsize: options.maxSize || 1000000,
			maxFiles: options.maxFiles || 1
		} )
	];
	return new (winston.Logger)({ transports: transports });
};
