var Path = require('./path');

exports.dispatch = function( method, _path, url, _, semver, handler ){
	var path = new Path( '', _path, _ );

	return function(req, res, next) {
		if(method !== req.method && method !== "*") {
			return next();
		}

		if(!req.query) req.query = {};
		if(!req.params) req.params = {};

		var pathname = url.parse( req.url ).pathname;

		if( path.matches(
				req, pathname, '*', _, semver, true, false
		) ){
			_.each(req.query, function(value, key, list){
				req.params[ key ] = value;
			});
			return handler(req, res, next);
		}
		else
			return next();
	};
};
