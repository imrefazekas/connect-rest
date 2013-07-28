var http = require('http');
var https = require('https');
var _ = require('underscore');
var url = require('url');

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
exports.generalCall = function(serverURL, method, headers, err, result, logger, callback){
	var server = url.parse( serverURL );

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

	if(logger)
		logger.debug('Options to be used:', voptions);

	var lib =(server.protocol === 'https:' ? https : http);

	var data;
	var payload = err ? { errorMessage: err.message, errorCode: err.errorCode||err.code||err.statusCode||-1 } : result;
	if( payload ){
		data = JSON.stringify( payload );
		//voptions.headers['Content-Length'] = data.length;
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