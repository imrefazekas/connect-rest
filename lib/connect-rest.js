/*
 * Copyright (c) 2015 Imre Fazekas. All rights reserved.
 *
 * A restful web service middleware for Connect.
 */
var ES6Fixer = require('./ES6Fixer');

var url = require('url');
var querystring = require('querystring');
var semver = require('semver');
var http = require('http');
var _ = require('lodash');
_.str = require('underscore.string');

var domain = require('domain');

var Route = require('./route');
var Bus = require('./bus');
var httphelper = require('./http-helper');
var bus = new Bus( httphelper );
var util = require('./util');
var Dispatcher = require('./dispatcher');

var defaultPurifyConfig = { arrayMaxSize: 100, maxLevel: 3 };
function purify( obj, config, level, path ) {
	config = config || defaultPurifyConfig;
	if(!obj) return obj;
	if( _.isDate(obj) || _.isBoolean(obj) || _.isNumber(obj) || _.isString(obj) || _.isRegExp(obj)  )
		return obj;
	if( _.isFunction(obj) )
		return 'fn(){}';
	if( _.isArray(obj) ){
		var arr = [];
		obj.forEach( function( element ){
			if( path.contains( element ) ) return;
			path.push( element );
			arr.push( arr.length > config.arrayMaxSize ? '...' : purify( element, config, level+1, path ) );
		} );
		return arr;
	}
	if( _.isObject(obj) ){
		var res = {};
		for(var key in obj)
			if( key && obj[key] ){
				if( path.contains( obj[key] ) ) continue;
				path.push( obj[key] );
				res[key] = level > config.maxLevel ? '...' : purify( obj[key], config, level+1, path );
			}
		return res;
	}
	return '...';
}

var CONTEXT = '';

var SERVICE_METHOD_PATTERN = /^[a-zA-Z]([a-zA-Z\d_-])*$/;

var mapping = {
	"HEAD": [],
	"GET": [],
	"POST": [],
	"PUT": [],
	"PATCH": [],
	"OPTIONS": [],
	"DELETE": []
};

var API_KEYS;

var looseAfter = -1;
var closerFn;

var Logger = require('./logger');
var VERSION = exports.VERSION = '1.9.5';
var logger;

var toString = Object.prototype.toString;
var ReadableStream = require('stream').Readable;

var attributesRespected = [ 'user', 'files' ];

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

function removePath(key, path, version){
	if( !mapping[ key ] ) return;

	var newRoutes = [];
	_.each( mapping[ key ], function(route){
		if( !route.matches( null, path, version || '*', _, semver, false, false ) )
			newRoutes.push( route );
	});
	mapping[ key ] = newRoutes;
}

function copyPath( path, extra){
	if( _.isString(path) )
		return _.assign( { path: path }, extra || {} );
	else if( _.isArray(path) ){
		var res = [];
		path.forEach( function( p ){
			res.push( copyPath( p, extra ) );
		} );
		return res;
	}
	else if( _.isObject(path) ){
		return _.assign( { }, path, extra || {} );
	}
}

function addPath(key, path, action, prototypeObject, options){
	options = options || {};

	if( options.options ){
		exports.options( copyPath( path, { unprotected: true } ), function( request, content, cb ){
			cb( null, 'OK', { headers: { Allow: key } } );
		} );
	}

	mapping[ key ].push( new Route( bus, CONTEXT, path, prototypeObject, options,
		function(request, content, callback){
			if(action.length === 3) {
				action(request, content, function(err, result, resOptions){
					callback(err, { contentType: options.contentType, result: result, resOptions: resOptions || {} } );
				});
			} else {
				var result = action(request, content);
				var err;
				callback( err, { contentType: options.contentType, result: result, resOptions: {} } );
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

function setHeaders( res, statusCode, headers ){
	for( var key in headers )
		res.setHeader( key, headers[key] );
	res.statusCode = statusCode;
	//res.writeHead( statusCode, headers );
}

function returnResult( err, result, res ){
	var headers = _.assign( {}, exports.globalHeaders );
	if( err ){
		headers = _.assign( headers, { 'Content-Type': 'text/plain' } );
		setHeaders( res, err.statusCode || 500, headers );
		//res.writeHead( err.statusCode || 500, { 'Content-Type': 'text/plain' } );
		res.end( 'Error occurred: ' + err );
	} else {
		if( !result.contentType )
			result.contentType = 'application/json';
		headers = _.assign( headers, result.resOptions.headers || { } );
		if( !headers['Content-Type'] )
			headers['Content-Type'] = result.contentType || 'application/json';
		setHeaders( res, result.resOptions.statusCode || 200, headers );
		//res.writeHead( result.resOptions.statusCode || 200, headers );

		res.end( (result.contentType === 'application/json') ? util.stringify( result.result, result.resOptions.minify, _ ) : result.result );
	}
}

function processRequest(req, res, action, bodyObj){
	logger.restlog( null, 'Process request', { body: bodyObj }, 'verbose' );

	var asyncCall = req.query.callbackURL;

	req.headers.httpVersion=req.httpVersion; req.headers.method=req.method; req.headers.originalUrl=req.originalUrl;
	req.parameters = req.params = req.query;
	req.format = function(){
		var obj = { headers: this.headers, parameters: this.parameters };
		attributesRespected.forEach( function(attribute){
			obj[ attribute ] = this[ attribute ];
		} );
		return JSON.stringify( obj );
	}.bind( req );
	req.headers.clientAddress = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;

	var requestTime = Date.now();
	action( req, bodyObj, function(err, result){
		logger.restlog( err, 'Result', purify( { result: result }, null, 0, []), 'verbose' );

		if( looseAfter>0 && (Date.now() - requestTime)>looseAfter ){
			logger.restlog( new Error('Request timed out'), 'Request timed out', req.headers, 'error' );
			if( closerFn ) closerFn( req, res );
			return;
		}

		result = result || { result: '', resOptions: { statusCode: 204 } };

		if( asyncCall ){
			httphelper.generalCall( asyncCall, 'POST', null, err, result, result.contentType || 'application/json', logger, function(err, result, status){
				logger.restlog( err, 'Async response sent.', purify( { result: result, status: status }, null, 0, []), 'verbose' );
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
						setHeaders( res, result.resOptions.statusCode || 200, headers );
						//res.writeHead( result.resOptions.statusCode || 200, headers );
					});
					result.result.on('error', function( error ){
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
	} );

	if( asyncCall ){
		res.statusCode = 200;
		res.end( JSON.stringify( { answer: 'OK.'} ) );
	}
}

exports.unhead = function(path, version){
	removePath( "HEAD", path, version );
};
exports.unget = function(path, version){
	removePath( "GET", path, version );
};
exports.unpost = function(path, version){
	removePath( "POST", path, version );
};
exports.unput = function(path, version){
	removePath( "PUT", path, version );
};
exports.unpatch = function(path, version){
	removePath( "PATCH", path, version );
};
exports.unoptions = function(path, version){
	removePath( "OPTIONS", path, version );
};
exports.undel = function(path, version){
	removePath( "DELETE", path, version );
};
exports.unassign = function headRest(methods, path, version){
	if( _.isString(methods) && methods === '*' ){
		exports.unassign( ['head', 'get', 'post', 'put', 'patch', 'options', 'delete'], path, version );
	} else if( _.isArray(methods) ){
		_.each( methods, function(element, index, list){
			var method = element.toLowerCase();
			method = (method === 'delete') ? 'del' : method;
			if( !exports[ 'un'+ method ] )
				throw new Error('Not known rest type', element);
			exports[ 'un'+ method ](path, version);
		} );
	}
	else
		throw new Error('Not correct given methods', methods);
};

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
exports.patch = function patchRest(path, functionRef, prototypeObject, options){
	addPath("PATCH", path, functionRef, prototypeObject, options );
};
exports.options = function optionsRest(path, functionRef, prototypeObject, options){
	addPath("OPTIONS", path, functionRef, prototypeObject, options );
};
exports.del = function deleteRest(path, functionRef, prototypeObject, options){
	addPath("DELETE", path, functionRef, prototypeObject, options );
};
exports.assign = function headRest(methods, path, functionRef, prototypeObject, options){
	if( _.isString(methods) && methods === '*' ){
		exports.assign( ['head', 'get', 'post', 'put', 'patch', 'options', 'delete'], path, functionRef, prototypeObject, options );
	} else if( _.isArray(methods) ){
		_.each( methods, function(element, index, list){
			var method = element.toLowerCase();
			method = (method === 'delete') ? 'del' : method;
			if( !exports[ method ] )
				throw new Error('Not known rest type', element);
			exports[ method ](path, functionRef, prototypeObject, options);
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
			remotePath + ( options.ignoreQuery ? '' : querystring.stringify( request.query ) ),
			method, headers, null, content, null, null, function(err, body, meta){
				callback( err, body );
			}
		);
	}, null, options);
};

exports.publish = function (services){
	_.each( services, function(element, name, list){
		if( _.isFunction( element ) && SERVICE_METHOD_PATTERN.test( name ) ){
			if( element.length === 1 )
				exports.get( '/' + name, element );
			if( element.length === 2 )
				exports.post( '/' + name, element );
		}
	} );
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

function getRouterMatching( req, res ){
	if (!req.query)
		req.query = url.parse( req.url, true ).query || {};

	var pathname = url.parse( req.url ).pathname;

	var apiKey = req.headers['api-key'] || req.headers['x-api-key'] || req.query.api_key;
	var version = req.headers['accept-version'] || req.headers['x-api-version'] || '*';

	var routeMatched = mapping[ req.method ].find( function(route){
		var apikeys = route.apikeys || API_KEYS;
		return route.matches(
			req, pathname, version, _, semver, true, (apikeys && apikeys.indexOf(apiKey )=== -1)
		) && (!route.options.validator || route.options.validator(req, res) );
	} );

	return { pathname: pathname, route: routeMatched };
}

exports.checkCall = function( req, res ){
	var router = getRouterMatching( req, res );

	return !!router.route;
};

function perform( req, res, next ){
	var router = getRouterMatching( req, res );
	var routeMatched = router.route;

	logger.restlog( null, 'Incoming request.', { headers: req.headers, query: req.query, httpVersion: req.httpVersion, method: req.method, originalUrl: req.originalUrl, pathname: router.pathname }, 'verbose' );

	if( routeMatched ){
		logger.restlog( null, 'Route matched.', { route: routeMatched }, 'verbose' );

		if( routeMatched.apiKeyRequired() ){
			var apiKey = req.headers['api-key'] || req.headers['x-api-key'] || req.query.api_key;
			var apikeys = routeMatched.apikeys || API_KEYS;
			if( apikeys && apikeys.indexOf(apiKey ) === -1 ){
				logger.restlog( null, 'Request without api key.', { pathname: router.pathname }, 'verbose' );

				res.statusCode = 401;
				res.end( 'API_KEY is required.' );
				return;
			}
		}
		routeMatched.callProtector( _, req, res, router.pathname, function(err){
			if( !err ){
				processRequest(req, res, routeMatched.maction, req.body);
			} else {
				logger.restlog( null, 'Request is blocked by the API\'s protector.', { pathname: router.pathname }, 'verbose' );
				res.statusCode = 401;
				res.end( err.message );
			}
		} );
	} else{
		logger.restlog( null, 'Request won\'t be handled by connect-rest.', { pathname: router.pathname }, 'verbose' );
		next();
	}
}


exports.rester = function( options ) {
	options = options || {};
	exports.globalHeaders = options.headers || { };
	exports.context( options.context ? options.context : (options.context === '' ? '' : '/api') );

	defaultPurifyConfig = options.purifyConfig || defaultPurifyConfig;
	attributesRespected = options.attributesRespected || attributesRespected;

	if( options.discoverPath )
		addPath('GET', options.discoverPath + '/:version', discover );
	if( options.protoPath )
		addPath('GET', options.protoPath + '/*path', protoPather );
	API_KEYS = options.apiKeys;

	if( options.loose ){
		looseAfter = options.loose.after;
		closerFn = options.loose.closerFn;
	}

	logger = Logger.createLogger( 'rest', {'connect-rest': VERSION}, options.logger );

	var domainOpts = options.domain;

	bus.initBus( options.monitoring, logger.restlog );

	logger.restlog( null, 'connect-rest has been configured.', purify( { options: options }, null, 0, []), 'verbose' );

	return function(req, res, next) {
		if( domainOpts ){
			var reqDomain = domain.create();

			reqDomain.on('error', function (err) {
				if( domainOpts.closeWorker )
					domainOpts.closeWorker( err, req, res );

				if( domainOpts.closeRequest )
					domainOpts.closeRequest( err, req, res );
				else{
					res.statusCode = 500;
					res.setHeader('content-type', 'text/plain');
					res.end('There was a problem!\n');
				}
			});

			reqDomain.add(req);
			reqDomain.add(res);
			reqDomain.run(function() {
				perform( req, res, next );
			});
		}
		else
			perform( req, res, next );
	};
};

function redirect( url ){
	var status = 302;

	if (arguments.length === 2) {
		status = url;
		url = arguments[1];
	}

	this.statusCode = status;
	this.setHeader('Location', url);
	this.setHeader('Content-Length', '0');
	this.end();
}
exports.dispatcher = function( method, path, handler, addRedirect ){
	return Dispatcher.dispatch( method, path, url, _, semver, !addRedirect? handler : function(req, res, next){
		if( !res.redirect )
			res.redirect = redirect;
		handler(req, res, next);
	} );
};

exports.CONTEXT = CONTEXT;
exports.SERVICE_METHOD_PATTERN = SERVICE_METHOD_PATTERN;
