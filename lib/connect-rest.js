/*
 * Copyright (c) 2013 Imre Fazekas. All rights reserved.
 *
 * A restful web service middleware for Connect.
 */

var connect = require('connect');
var qs = require('qs');
var parseurl = require('parseurl');
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
	"PATCH": [],
	"DELETE": []
};

var API_KEYS;

var Logger = require('./logger');
var VERSION = exports.VERSION = '1.4.2';
var logger;

var toString = Object.prototype.toString;
var ReadableStream = require('stream').Readable;
function isFunction(obj) {
	return toString.call(obj) === '[object Function]';
}
function isString(obj) {
	return toString.call(obj) === '[object String]';
}
function isBuffer(obj) {
	return Buffer.isBuffer(obj);
}
function isReadableStream(obj) {
	return obj instanceof ReadableStream;
}
function isObject(obj) {
	return toString.call(obj) === '[object Object]';
}

function addPath(key, path, action, prototypeObject, options){
	options = options || {};
	mapping[ key ].push( new Route( bus, CONTEXT, path, prototypeObject, options,
		function(request, content, callback){
			if(action.length === 3) {
				action(request, content, function(err, result, resOptions){
					callback(err, { contentType: options.contentType, result : result, resOptions: resOptions || {} } );
				});
			} else {
				var result = action(request, content);
				var err;
				callback( err, { contentType: options.contentType, result : result, resOptions: {} } );
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

function returnResult( err, result, res ){
	if( err ){
		res.writeHead( err.statusCode || 500, { 'Content-Type': 'text/plain' } );
		res.end( 'Error occurred: ' + err );
	} else {
		if( !result.contentType )
			result.contentType = 'application/json';
		var headers = result.resOptions.headers || { };
		if( !headers['Content-Type'] )
			headers['Content-Type'] = result.contentType || 'application/json';
		res.writeHead( result.resOptions.statusCode || 200, headers );

		res.end( (result.contentType === 'application/json') ? util.stringify( result.result, result.resOptions.minify, _ ) : result.result );
	}
}

function processRequest(req, res, matching, bodyObj){
	logger.restlog( null, 'Process request', { body: bodyObj }, 'verbose' );

	var asyncCall = req.query.callbackURL;

	var callChain =  _.map( matching, function(func){
		req.headers.httpVersion=req.httpVersion; req.headers.method=req.method; req.headers.originalUrl=req.originalUrl;
		req.parameters = req.params = req.query;
		req.format = function(){
			return JSON.stringify( { headers: this.headers, parameters: this.parameters, session: this.session, files: this.files } );
		}.bind( req );
		return async.apply( func, req, bodyObj );
	} );

	req.headers.clientAddress = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;

	async.series( callChain,
		function(err, results){
			logger.restlog( err, 'Results', { results: results }, 'verbose' );

			var result;
			if( !err )
				result = _.find(results, function(returnValue){ return returnValue && returnValue.result; }) || { result: '', resOptions:{ statusCode: 204 } };

			if( asyncCall ){
				httphelper.generalCall( asyncCall, 'POST', null, err, result, result.contentType || 'application/json', logger, function(err, result, status){
					logger.restlog( err, 'Async response sent.', { result: result, status: status }, 'verbose' );
				} );
			} else{
				if( err ){
					returnResult( err, null, res );
				}
				else{
					if( isBuffer( result.result ) ){
						result.result = ( result.contentType === 'application/json') ? JSON.stringify( result.result ) : result.result.toString( result.resOptions.encoding || 'utf8' );
					}
					if( isReadableStream( result.result ) ){
						result.result.on('open', function () {
							var headers = result.resOptions.headers || { };
							if( !headers['Content-Type'] && result.contentType ){
								headers['Content-Type'] = result.contentType;
							}
							res.writeHead( result.resOptions.statusCode || 200, headers );
						});
						result.result.on('error',function( error ){
							returnResult( error, null, res );
						});
						result.result.pipe( res );
					}
					else if( isString( result.result ) || Array.isArray( result.result ) || isObject( result.result ) ){
						returnResult( null, result, res );
					}
					else if( isFunction( result.result ) ){
						result.result( function(err_, res_){
							result.result = res_;
							returnResult( err_, result, res );
						} );
					}
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
exports.patch = function putRest(path, functionRef, prototypeObject, options){
	addPath("PATCH", path, functionRef, prototypeObject, options );
};
exports.del = function deleteRest(path, functionRef, prototypeObject, options){
	addPath("DELETE", path, functionRef, prototypeObject, options );
};
exports.assign = function headRest(methods, path, functionRef, prototypeObject, options){
	if( _.isString(methods) && methods === '*' ){
		exports.assign( ['head','get','post','put','patch','delete'], path, functionRef, prototypeObject, options );
	} else if( _.isArray(methods) ){
		_.each( methods, function(element, index, list){
			var method = element.toLowerCase();
			if( method === 'head' )
				addPath("HEAD", path, functionRef, null, options );
			else if( method === 'get' )
				addPath("GET", path, functionRef, null, options );
			else if( method === 'post' )
				addPath("POST", path, functionRef, prototypeObject, options );
			else if( method === 'put' )
				addPath("PUT", path, functionRef, prototypeObject, options );
			else if( method === 'patch' )
				addPath("PATCH", path, functionRef, prototypeObject, options );
			else if( method === 'delete' )
				addPath("DELETE", path, functionRef, prototypeObject, options );
			else
				throw new Error('Not known rest type:', element);
		} );
	}
	else
		throw new Error('Not correct given methods', methods);
};
exports.proxy = function proxyRest( method, path, remotePath, options ){
	options = options || {};
	exports.assign( [ method ], path, function( request, content, callback ){
		var headers = options.remoteHeaders || {};
		if( options.bypassHeader )
			headers = _.extend( headers, request.headers );
		httphelper.generalCall(
			remotePath + ( options.ignoreQuery ? '' : qs.stringify( request.query ) ),
			method, headers, null, content, null, null, function(err, body, meta){
				callback( err, body );
			}
		);
	}, null, options);
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

exports.apiKeys = function( keys ){
	if( keys )
		API_KEYS = keys;

	return API_KEYS;
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
	logger.restlog( null, 'Halting connect-rest.', { }, 'verbose' );
};

exports.rester = function( options ) {
	var domain;

	options = options || {};

	exports.context( options.context ? options.context : (options.context === '' ? '' : '/api') );

	if( options.discoverPath )
		addPath('GET', options.discoverPath + '/:version', discover );
	if( options.protoPath )
		addPath('GET', options.protoPath + '/*path', protoPather );
	API_KEYS = options.apiKeys;

	logger = Logger.createLogger( 'rest', {'connect-rest': VERSION}, options.logger );

	domain = options.domain;

	bus.initBus( options.monitoring, logger.restlog );

	logger.restlog( null, 'connect-rest has been configured.', { options: options }, 'verbose' );

	return function restMaker(req, res, next) {
		if (!req.query)
			req.query = req.url.indexOf('?') ? qs.parse( parseurl(req).query ) : {};

		var pathname = url.parse( req.url ).pathname;

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
					logger.restlog( er, '', { pathname: pathname } );
					domain.dispose();
				}
			});
		}

		logger.restlog( null, 'Incoming request.', { headers: req.headers, query: req.query, httpVersion: req.httpVersion, method: req.method, originalUrl: req.originalUrl, pathname: pathname }, 'verbose' );

		var apiKey = req.headers['api-key'] || req.headers['x-api-key'] || req.query.api_key;

		var routes = _.filter(
			mapping[ req.method ], function(route){ return route.matches(
				req, pathname, req.headers['accept-version'] || req.headers['x-api-version'] || '*', _, semver, true, (API_KEYS && API_KEYS.indexOf(apiKey )=== -1)
			) && (!route.options.validator || route.options.validator(req, res) ); }
		);

		logger.restlog( null, 'Routes matching.', { routes: routes }, 'verbose' );

		var matching = _.map( routes, function(route){ return route.maction; } );

		if( matching.length === 0 ){
			if( API_KEYS && API_KEYS.indexOf( apiKey ) === -1 ){
				logger.restlog( null, 'Request without api key.', { pathname: pathname }, 'verbose' );

				res.statusCode = 401;
				res.end( 'API_KEY is required.' );
				return;
			}
			else {
				logger.restlog( null, 'Request won\'t be handled by connect-rest.', { pathname: pathname }, 'verbose' );

				return next();
			}
		}

		processRequest(req, res, matching, req.body);
	};
};

exports.dispatcher = function( method, path, handler ){
	return Dispatcher.dispatch( method, path, url, _, semver, handler );
};

exports.CONTEXT = CONTEXT;
exports.SERVICE_METHOD_PATTERN = SERVICE_METHOD_PATTERN;
