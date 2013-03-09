/*
 * Copyright (c) 2013 Imre Fazekas. All rights reserved.
 *
 * A restful web service middleware for Connect.
 */
var VERSION = '0.0.11';

var connect = require('connect');
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

var SERVICE_METHOD_PATTERN = /^[a-zA-Z]([a-zA-Z]|\d|_)*$/g;

var mapping = {
	"HEAD": [],
	"GET": [],
	"POST": [],
	"PUT": [],
	"DELETE": []
};

var API_KEYS;
var logger;


function DummyLogger(){ }
DummyLogger.prototype.info = function() { };
DummyLogger.prototype.debug = function() { };


function addPath(key, path, action, prototypeObject){
	mapping[ key ].push( new Route( path, prototypeObject,
		function(request, content, callback){
			callback( null, action(request, content) );
		}, _
	) );
}

function protoPather( request, content ){
	var utokens = _.words( request.parameters.path, '/');
	var method = _.first( utokens );
	var version = utokens[1];
	var pathname =	'/' + _.toSentence( _.rest(utokens, 2 ), '/', '/' );

	var routes = _.filter( 
		mapping[ method ], function(route){ return route.matches( 
			null, pathname, CONTEXT, version, _, semver, false
		); }
	); 

	return routes.length > 0 ? _.first( _.map( routes, function(route){ return route.prototypeObject; } ) ) : 'No matching service';
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

function process(req, res, matching, bodyObj){
	logger.debug('Payload object: ', bodyObj );

	var callChain =  _.map( matching, function(func){ 
		return async.apply( func, {headers: req.headers, parameters: req.query, callback: function(result){
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.end( JSON.stringify( result ) );
		} }, bodyObj ); 
	} );

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
				if( result )
					res.end( JSON.stringify( result ) );
			}
		}
	);	
}

exports.head = function headRest(path, functionRef){
	addPath("HEAD", path, functionRef);	
};
exports.get = function getRest(path, functionRef){
	addPath("GET", path, functionRef);	
};
exports.post = function postRest(path, functionRef, prototypeObject){
	addPath("POST", path, functionRef, prototypeObject);	
};
exports.put = function putRest(path, functionRef, prototypeObject){
	addPath("PUT", path, functionRef, prototypeObject);	
};
exports.delete = function deleteRest(path, functionRef, prototypeObject){
	addPath("DELETE", path, functionRef, prototypeObject);	
};

exports.publish = function (services){
	_.each( _.values( services ), function(element, index, list){
		if( _.isFunction( element ) && SERVICE_METHOD_PATTERN.test( element.name ) ){
			if( element.length == 1 )
				getRest( '/' + element.name, element );
			if( element.length == 2 )
				postRest( '/' + element.name, element );
		}
	} );
};

exports.context = function (context){
	CONTEXT = context;
};

exports.rester = function( options ) {
	var domain;
	if( options ){
		if( options.discoverPath )
			addPath('GET', options.discoverPath + '/:version', discover );	
		if( options.protoPath )
			addPath('GET', options.protoPath + '/*path', protoPather );				
		API_KEYS = options.apiKeys;

		logger = new DummyLogger();
		if( options.logger )
			logger = _.isString( options.logger ) ? bunyan.createLogger({name: options.logger, src: true}) : options.logger;

		domain = options.domain;

		logger.info('connect-rest has been configured. ', options);
	}

	return function(req, res, next) {
		if( domain ){
			domain.add(req);
			domain.add(res);
			domain.on('error', function(err) {
				try {
					res.statusCode = 500;
					res.end(err.message + '\n');
					res.on('close', function() {
						domain.dispose();
					});
				} catch (er) {
					console.error('Error sending 500', er, req.url);
					domain.dispose();
				}
			});
		}

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
				req, pathname, CONTEXT, req.headers['accept-version'] || req.headers['x-api-version'] || '*', _, semver, true
			); }
		); 
		var matching = _.map( routes, function(route){ return route.action; } );

		if( matching.length === 0 ){
			logger.info('Request won\'t be handled by connect-rest.', req.url );

			return next();
		}

		logger.debug('Routes matching: ', routes );

		if( req.body ){
			process(req, res, matching, req.body);
		} else{
            var body = '';
            req.on('data', function(chunk) {
                body += chunk;
                if (body.length > LOAD_SIZE_LIMIT) {
                    req.connection.destroy();
                }
            });

            req.on('end', function() { 
				logger.debug('Body payload: ', body );

				var bodyObj = body.length ? (('application/json' == connect.utils.mime(req)) ? JSON.parse( body ) : body) : '';

				process(req, res, matching, bodyObj);
            } );
        }
    };
};

exports.VERSION = VERSION;
exports.LOAD_SIZE_LIMIT = LOAD_SIZE_LIMIT;
exports.CONTEXT = CONTEXT;
exports.ERROR_MESSAGE = ERROR_MESSAGE;
exports.SERVICE_METHOD_PATTERN = SERVICE_METHOD_PATTERN;
