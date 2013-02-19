/*
 * Copyright (c) 2013 Imre Fazekas. All rights reserved.
 *
 * A restful web service middleware for Connect.
 */
var VERSION = '0.0.5';

var util = require('util');
var url = require('url');
var async = require('async');
var semver = require('semver');
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

var Route = require('./route');

var LOAD_SIZE_LIMIT = 1e6;
var CONTEXT = '';
var ERROR_MESSAGE = '';

var mapping = {
	"HEAD": [],
	"GET": [],
	"POST": [],
	"PUT": [],
	"DELETE": []
};

var API_KEYS;
var logger;
var LOGGER_ENTITY = {
	'logger':'Rest',
	'context': CONTEXT
}

function debug( message, object ){
	if(logger)
		logger.debug( LOGGER_ENTITY, message, object );
}
function trace( message, object ){
	if(logger)
		logger.trace( LOGGER_ENTITY, message, object );
}

function addPath(key, path, action){
	mapping[ key ].push( new Route( path, 
		function(request, content, callback){
			callback( null, action(request, content) );
		}, _
	) );
}

function discover( request, content ){
	var version = request.parameters.version;

	var matchingMaps = {};
	_.each(mapping, function(value, key, list){
		matchingMaps[ key ] = [];

		_.each(value, function(element, index, list){
			_.each( element.matchings( version, _, semver ), function(match, matchIndex, matchList){
				matchingMaps[ key ].push( match );
			});
		});
	});

	return matchingMaps;
}

exports.head = function (path, functionRef){
	addPath("HEAD", path, functionRef);	
}
exports.get = function (path, functionRef){
	addPath("GET", path, functionRef);	
}
exports.post = function (path, functionRef){
	addPath("POST", path, functionRef);	
}
exports.put = function (path, functionRef){
	addPath("PUT", path, functionRef);	
}
exports.delete = function (path, functionRef){
	addPath("DELETE", path, functionRef);	
}

exports.context = function (context){
	LOGGER_ENTITY.context = CONTEXT = context;
}

exports.rester = function( options ) {
	if( options ){
		if( options.discoverPath )
			addPath('GET', options.discoverPath + '/:version', discover );	
		API_KEYS = options.apiKeys;
		logger = options.logger;
	}

	return function(req, res, next) {
		if(!req.query) req.query = {};

		if( API_KEYS && API_KEYS.indexOf(req.query.api_key)==-1 ){
			res.statusCode = 401;
			res.end( 'API_KEY is required.' );	
			return;
		}

		var pathname = url.parse( req.url ).pathname;
		var matching = _.map( _.filter( 
			mapping[ req.method ], function(route){ return route.matches( 
				req, pathname, CONTEXT, req.headers['accept-version'] || req.headers['x-api-version'] || '*', _, semver
			); }
			),
			function(route){ return route.action; }
		);

		if( matching.length == 0 )
			return next();

        var body = '';
        req.on('data', function(chunk) {
        	body += chunk;
        	if (body.length > LOAD_SIZE_LIMIT) {
        		request.connection.destroy();
        	}
      	});

      	req.on('end', function() { 
			var bodyObj = body.length > 0 ? JSON.parse( body ) : '';

      		var callChain =  _.map( matching, function(func){ return async.apply( func, {headers: req.headers, parameters: req.query}, bodyObj ); } );

      		async.series( callChain,
				function(err, results){
					if( err ){
						res.statusCode = 500;
            			res.end( 'Error occurred: ' + err );
					}
					else{
						res.writeHead(200, {'Content-Type': 'application/json'});
						var result = _.find(results, function(returnValue){ return returnValue; });
      					res.end( JSON.stringify( result ) );
					}
				}
			);
      	} );
 	}
}

exports.VERSION = VERSION;
exports.LOAD_SIZE_LIMIT = LOAD_SIZE_LIMIT;
exports.CONTEXT = CONTEXT;
exports.ERROR_MESSAGE = ERROR_MESSAGE;
exports.LOGGER_ENTITY = LOGGER_ENTITY;

