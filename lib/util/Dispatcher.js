'use strict';

var _ = require('isa.js');
var semver = require('semver');

var Path = require('./Path');

exports.dispatch = function( method, _path, url, handler ){
	var path = new Path( '', _path, {} );

	return function(req, res, next) {
		if(method !== req.method && method !== "*") {
			return next();
		}

		//if(!req.query) req.query = {};
		if(!req.params) req.params = {};

		var pathname = url.parse( req.url ).pathname;

		if( path.matches(
				req, pathname, '*', true, false
		) ){
			for ( let key of Object.keys(req.query) )
				req.params[ key ] = req.query[ key ];
			return handler(req, res, next);
		}
		else
			return next();
	};
};
