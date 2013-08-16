var querystring = require('qs');

function parseTextualContent(_, options, req){
	var params = querystring.parse( req.body );
	if(options.mapParams !== false) {
		if( !req.params ) req.params = {};
		var keys = Object.keys( params );
		_.each( params, function(value, key, list){
			req.params[key] = value;
		} );
	}
	req._body = req.body;
	req.body = params;
}
function parseTextualContent(_, options, req, res, next){
	if( req.body ){
		next();
	} else {
		var contentType = req.contentType();

		var body = '';
		req.on('data', function(chunk) {
			body += chunk;
			if (body.length > options.sizeLimit) {
				next( new Error( 'PayloadTooLargeError:' + body.length ) );
			}
		});

		req.on('end', function() {
			var bodyObj = body.length ? ((contentType === 'application/json') ? JSON.parse( body ) : body) : '';

			if( contentType === 'application/x-www-form-urlencoded' )
				parseTextualContent(_, options, req );

			req.body = bodyObj;

			next();
		} );
	}
}

exports.parseBody = function( _, options ) {
	return function(req, res, next){
		var contentType = req.contentType();

		if (req.method === 'HEAD') {
			next(); return;
		}
		if (req.contentLength() === 0 && !req.isChunked()) {
			next(); return;
		}
		var parser;
		switch (contentType) {
			case 'application/json':
			case 'application/x-www-form-urlencoded':
			case 'text/tsv':
			case 'text/tab-separated-values':
			case 'text/csv':
				parser = parseTextualContent;
				break;
			case 'multipart/form-data':
				break;
			default:
				break;
		}

		if (parser) {
			parser(_, options, req, res, next);
		} else if (options.rejectUnknown) {
			next( new Error( 'UnsupportedMediaTypeError:' + contentType ) );
		} else {
			next();
		}
	};
};