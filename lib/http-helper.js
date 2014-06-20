var http = require('http');
var https = require('https');
var _ = require('lodash');
var url = require('url');
var querystring = require('querystring');

exports.opt = {
	hostname: 'localhost',
	port: 80,
	path: '',
	method: 'POST',
	headers: {
		'accept-version': '1.0.0',
		'Content-Type': 'application/json'
	}
};

exports.call = function( options ){
	exports.generalCall( options.serverURL, options.method || 'GET', options.headers, options.err, options.result, options.mimetype , options.logger, options.callback );
};

exports.generalCall = function(serverURL, method, headers, err, result, mimetype, logger, callback){
	var server = _.isString( serverURL ) ? url.parse( serverURL ) : serverURL;

	if(logger)
		logger.debug('Async server data:', server);

	var voptions = JSON.parse(JSON.stringify( exports.opt ));
	voptions.hostname = server.hostname;
	voptions.port = server.port;
	voptions.path = server.path;
	if(method)
		voptions.method = method;

	if( headers ){
		for (var name in headers)
			if (headers.hasOwnProperty(name))
				voptions.headers[ name ] = headers[ name ];
	}

	mimetype = mimetype || 'application/json';
	voptions.headers['Content-Type'] =  mimetype;

	if(logger)
		logger.debug('Options to be used:', voptions);

	var lib =(server.protocol === 'https:' ? https : http);

	var data;
	var payload = err ? { errorMessage: err.message, errorCode: err.errorCode||err.code||err.statusCode||-1 } : result;
	if( payload ){
		data = (mimetype === 'application/json') ? JSON.stringify( payload ) : querystring.stringify( payload );
		voptions.headers['Content-Length'] = Buffer.byteLength( data );
		if(logger)
			logger.debug('Payload to be sent:', data);
	}

	var responseStatus;
	var req = lib.request( voptions, function(res) {
		var body = '';
		res.on('data', function (chunk) {
			body += chunk;
		});
		res.on('end', function ( ) {
			responseStatus = { statusCode: res.statusCode, headers: res.headers };
			callback(null, (body && res.headers['content-type'] && res.headers['content-type'] === 'application/json') ? JSON.parse(body) : body, responseStatus );
		});
	});
	req.on('error', function(er) {
		callback(er, 'Failed.', responseStatus);
	});
	if( data )
		req.write( data );

	req.end();
};
