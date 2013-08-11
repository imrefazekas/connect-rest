var Path = require('./path');

exports.dispatch = function( method, path, url, _, semver, handler ){
	var path = new Path( path, _ );

	return function(req, res, next) {
		if( method !== req.method )
			return next();

		if(!req.query) req.query = {};

		var pathname = url.parse( req.url ).pathname;

		if( path.matches(
				req, pathname, '*', _, semver, true, false
		) )
			return handler(req, res, next);
		else
			return next();
	};
};
