/*
 * Copyright (c) 2013 Imre Fazekas. All rights reserved.
 *
 * A restful web service middleware for Connect.
 */
var VERSION = '0.0.6';

var util = require('util');
var url = require('url');
var async = require('async');
var semver = require('semver');
var bunyan = require('bunyan');
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


function DummyLogger(){ };
DummyLogger.prototype.info = function() { };
DummyLogger.prototype.debug = function() { };


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
	CONTEXT = context;
}

exports.rester = function( options ) {
	if( options ){
		if( options.discoverPath )
			addPath('GET', options.discoverPath + '/:version', discover );	
		API_KEYS = options.apiKeys;

		logger = new DummyLogger();
		if( options.logger )
			logger = _.isString( options.logger ) ? bunyan.createLogger({name: options.logger, src: true}) : options.logger;

		logger.info('connect-rest has been configured. ', options);
	}

	return function(req, res, next) {
		if(!req.query) req.query = {};

		logger.info('Incoming request.', req.headers, req.query );

		if( API_KEYS && API_KEYS.indexOf(req.query.api_key)==-1 ){
			logger.info('Request without api key.', req.query );

			res.statusCode = 401;
			res.end( 'API_KEY is required.' );	
			return;
		}

		var pathname = url.parse( req.url ).pathname;

		logger.debug('Request received from: ', pathname );

		var routes = _.filter( 
			mapping[ req.method ], function(route){ return route.matches( 
				req, pathname, CONTEXT, req.headers['accept-version'] || req.headers['x-api-version'] || '*', _, semver
			); }
		); 
		var matching = _.map( routes, function(route){ return route.action; } );

		if( matching.length == 0 ){
			logger.info('Request won\'t be handled by connect-rest.', req.url );

			return next();
		}

		logger.debug('Routes matching: ', routes );

        var body = '';
        req.on('data', function(chunk) {
        	body += chunk;
        	if (body.length > LOAD_SIZE_LIMIT) {
        		request.connection.destroy();
        	}
      	});

      	req.on('end', function() { 
			logger.debug('Body payload: ', body );

			var bodyObj = body.length > 0 ? JSON.parse( body ) : '';

			logger.debug('Parsed JSON object: ', bodyObj );

      		var callChain =  _.map( matching, function(func){ return async.apply( func, {headers: req.headers, parameters: req.query}, bodyObj ); } );

			logger.debug('Calling service functions.' );

      		async.series( callChain,
				function(err, results){
					logger.info('Service(s) calling finished.', err, results );

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
