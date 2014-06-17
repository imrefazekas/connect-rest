/*
 * Copyright (c) 2013 Imre Fazekas. All rights reserved.
 *
 * A restful web service middleware for Connect.
 */
var VERSION = '0.7.6';

var connect = require('connect');
var url = require('url');
var async = require('async');
var semver = require('semver');
var http = require('http');
var https = require('https');
var _ = require('lodash');
_.str = require('underscore.string');

var Route = require('./route');
var Bus = require('./bus');
var httphelper = require('./http-helper');
var bus = new Bus( httphelper );
var util = require('./util');
var Dispatcher = require('./dispatcher');

var CONTEXT = '';

var SERVICE_METHOD_PATTERN = /^[a-zA-Z]([a-zA-Z]|\d|_)*$/g;

var mapping = {
	"HEAD": [],
	"GET": [],
	"POST": [],
	"PUT": [],
	"DELETE": []
};

var API_KEYS;


var winston = require('winston');
var logger;


function addPath(key, path, action, prototypeObject, options){
	options = options || {};
	mapping[ key ].push( new Route( bus, CONTEXT, path, prototypeObject, options,
		function(request, content, callback){
			if(action.length === 3) {
				action(request, content, function(err, result, resOptions){
					callback(err, { contentType: options.contentType || 'application/json', result : result, resOptions: resOptions || {} } );
				});
			} else {
				var result = action(request, content);
				var err;
				callback(err, { contentType: options.contentType || 'application/json', result : result, resOptions: { } } );
			}
		}, _
	) );
}

function protoPather( request, content ){
	var utokens = _.str.words( request.parameters.path, '/' );
	var method = _.first( utokens );
	var version = utokens[1];
	var pathname =	'/' + _.str.toSentence( _.rest(utokens, 2 ), '/', '/' );

	var routes = _.filter(
		mapping[ method ], function(route){ return route.matches(
			null, pathname, version, _, semver, false
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

/*
var getClientAddress = function (req) {
	return (req.headers['x-forwarded-for'] || '').split(',')[0]
		|| req.connection.remoteAddress;
};
*/
function processRequest(req, res, matching, bodyObj){
	logger.debug('Payload object: ', bodyObj );

	var asyncCall = req.query.callbackURL;

	var callChain =  _.map( matching, function(func){
		req.headers.httpVersion=req.httpVersion; req.headers.method=req.method; req.headers.originalUrl=req.originalUrl;
		req.parameters = req.params = req.query;
		req.format = function(){
			return JSON.stringify( { headers: this.headers, parameters: this.parameters, session: this.session, files: this.files } );
		}.bind( req );
		return async.apply( func, req, bodyObj );
	} );

	logger.debug('Calling service functions.' );

	req.headers.clientAddress = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;

	async.series( callChain,
		function(err, results){
			logger.info( 'Service(s) calling finished.', err, results );

			var result;
			if( err )
				logger.error( err );
			else
				result = _.find(results, function(returnValue){ return returnValue && returnValue.result; }) || { result: '', resOptions:{ statusCode: 204 } };

			if( asyncCall ){
				httphelper.generalCall( asyncCall, 'POST', null, err, result, 'application/json', logger, function(err, result, status){
					if(err)
						logger.error( err );
					else
						logger.info('Response:', result, status);
				} );
			} else{
				if( err ){
					res.statusCode = err.statusCode || 500;
					res.end( 'Error occurred: ' + err );
				}
				else{
					var headers = result.resOptions.headers || { };
					if( !headers['Content-Type'] )
						headers['Content-Type'] = result.contentType || 'application/json';
					res.writeHead( result.resOptions.statusCode || 200, headers );

					res.end( (result.contentType === 'application/json') ? util.stringify( result.result, result.resOptions.minify, _ ) : result.result );
				}
			}
		}
	);

	if( asyncCall ){
		res.statusCode = 200;
		res.end( JSON.stringify( { answer: 'OK.'} ) );
	}
}

exports.head = function headRest(path, functionRef, options){
	addPath("HEAD", path, functionRef, null, options );
};
exports.get = function getRest(path, functionRef, options){
	addPath("GET", path, functionRef, null, options );
};
exports.post = function postRest(path, functionRef, prototypeObject, options){
	addPath("POST", path, functionRef, prototypeObject, options );
};
exports.put = function putRest(path, functionRef, prototypeObject, options){
	addPath("PUT", path, functionRef, prototypeObject, options );
};
exports.del = function deleteRest(path, functionRef, prototypeObject, options){
	addPath("DELETE", path, functionRef, prototypeObject, options );
};
exports.assign = function headRest(methods, path, functionRef, prototypeObject, options){
	if( _.isString(methods) && methods === '*' ){
		exports.assign( ['head','get','post','put','delete'], path, functionRef, prototypeObject, options );
	} else if( _.isArray(methods) ){
		_.each( methods, function(element, index, list){
			if( element === 'head' )
				addPath("HEAD", path, functionRef, null, options );
			else if( element === 'get' )
				addPath("GET", path, functionRef, null, options );
			else if( element === 'post' )
				addPath("POST", path, functionRef, prototypeObject, options );
			else if( element === 'put' )
				addPath("PUT", path, functionRef, prototypeObject, options );
			else if( element === 'delete' )
				addPath("DELETE", path, functionRef, prototypeObject, options );
			else logger.error('Not known rest type:', element);
		} );
	}
	else
		logger.error('Not correct given methods', methods);
};

exports.publish = function (services){
	_.each( _.values( services ), function(element, index, list){
		if( _.isFunction( element ) && SERVICE_METHOD_PATTERN.test( element.name ) ){
			if( element.length === 1 )
				exports.get( '/' + element.name, element );
			if( element.length === 2 )
				exports.post( '/' + element.name, element );
		}
	} );
};

exports.checkCall = function( req, res ){
	if(!req.query) req.query = {};
	var pathname = url.parse( req.url ).pathname;

    var apiKey = req.headers['api-key'] || req.headers['x-api-key'] || req.query.api_key;

	var routes = _.filter(
		mapping[ req.method ], function(route){ return route.matches(
			req, pathname, req.headers['accept-version'] || req.headers['x-api-version'] || '*', _, semver, false, (API_KEYS && API_KEYS.indexOf( apiKey ) === -1)
		) && (!route.options.validator || route.options.validator(req, res) ); }
	);

	return routes.length > 0;
};

exports.context = function (context){
	CONTEXT = context;
};

exports.httphelper = httphelper;

exports.error = function(code, msg){
  var err = new Error(msg || http.STATUS_CODES[code]);
  err.status = code;
  return err;
};

exports.shutdown = function(){
	bus.shutdown();
	logger.info('Halting connect-rest.');
};

exports.rester = function( options ) {
	var domain;

	logger = winston;

	if( options ){
		exports.context( options.context ? options.context : (options.context === '' ? '' : '/api') );

		if( options.discoverPath )
			addPath('GET', options.discoverPath + '/:version', discover );
		if( options.protoPath )
			addPath('GET', options.protoPath + '/*path', protoPather );
		API_KEYS = options.apiKeys;

		if( options.logger )
			logger = options.logger.info ? options.logger : exports.setupLogger( options.logger, logger );

		domain = options.domain;

		bus.initBus( options.monitoring, logger );

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
					logger.error('Error sending 500', er, req.url);
					domain.dispose();
				}
			});
		}

		if(!req.query) req.query = {};

		logger.info('Incoming request.', req.headers, req.query, req.httpVersion, req.method, req.originalUrl );

		var pathname = url.parse( req.url ).pathname;

		logger.debug('Request received from: ', pathname );

		var apiKey = req.headers['api-key'] || req.headers['x-api-key'] || req.query.api_key;

		var routes = _.filter(
			mapping[ req.method ], function(route){ return route.matches(
				req, pathname, req.headers['accept-version'] || req.headers['x-api-version'] || '*', _, semver, true, (API_KEYS && API_KEYS.indexOf(apiKey )=== -1)
			) && (!route.options.validator || route.options.validator(req, res) ); }
		);

		logger.debug('Routes matching: ', routes );

		var matching = _.map( routes, function(route){ return route.maction; } );

		if( matching.length === 0 ){
			if( API_KEYS && API_KEYS.indexOf(req.query.api_key) === -1 ){
				logger.info('Request without api key.', req.query );

				res.statusCode = 401;
				res.end( 'API_KEY is required.' );
				return;
			}
			else {
				logger.info('Request won\'t be handled by connect-rest.', req.url );

				return next();
			}
		}

		processRequest(req, res, matching, req.body);
	};
};



exports.createWinstonLogger = function( options ){
	return new (winston.Logger)({
		transports: [
			new (winston.transports.Console)({ level: 'error' }),
			new (winston.transports.File)({
				filename: options.file || 'server.log',
				level: options.level || 'info'
			})
		]
	});
};

exports.setupLogger = function(options, _logger){
	return options ? exports.createWinstonLogger( options ) : (_logger ? _logger : winston);
};

exports.dispatcher = function( method, path, handler ){
	return Dispatcher.dispatch( method, path, url, _, semver, handler );
};

exports.VERSION = VERSION;
exports.CONTEXT = CONTEXT;
exports.SERVICE_METHOD_PATTERN = SERVICE_METHOD_PATTERN;
