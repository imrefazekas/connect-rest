/*
 * Copyright (c) 2013 Imre Fazekas. All rights reserved.
 *
 * A restful web service middleware for Connect.
 */
var VERSION = '0.0.31';

var connect = require('connect');
var url = require('url');
var async = require('async');
var semver = require('semver');
var bunyan = require('bunyan');
var http = require('http');
var https = require('https');
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

var Route = require('./route');
var httphelper = require('./http-helper');

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
DummyLogger.prototype.info = function() { console.log( arguments ); };
DummyLogger.prototype.debug = function() { console.log( arguments ); };
DummyLogger.prototype.error = function() { console.error( arguments ); };


function addPath(key, path, action, prototypeObject, options){
	mapping[ key ].push( new Route( path, prototypeObject, options,
		function(request, content, callback){
			if(action.length == 3) {
				action(request, content, function(err, result, resOptions){
					callback(err, { contentType: options.contentType || 'application/json', result : result, resOptions: resOptions || {} } );
				});
			} else {
				callback(null, { contentType: options.contentType || 'application/json', result : action(request, content), resOptions: { } } );
			}
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

/*
var getClientAddress = function (req) {
    return (req.headers['x-forwarded-for'] || '').split(',')[0] 
        || req.connection.remoteAddress;
};
*/

function process(req, res, matching, bodyObj){
	logger.debug('Payload object: ', bodyObj );

	var asyncCall = req.query.callbackURL;

	var callChain =  _.map( matching, function(func){
		var headers = req.headers; headers.httpVersion=req.httpVersion; headers.method=req.method; headers.originalUrl=req.originalUrl;
		return async.apply( func, {headers: headers, parameters: req.query}, bodyObj );
	} );

	logger.debug('Calling service functions.' );

	req.headers.clientAddress = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;

	async.series( callChain,
		function(err, results){
			logger.info('Service(s) calling finished.', err, results );

			var result;
			if( err )
				logger.error( err );
			else
				result = _.find(results, function(returnValue){ return returnValue && returnValue.result; }) || { result: '', resOptions:{ statusCode: 204 } };

			if( asyncCall ){
				httphelper.generalCall( http, https, url, _, asyncCall, 'POST', err, result, logger, function(er, response){
					if(er)
						logger.error( er );
					else
						logger.info('Response:', response);
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

					res.end( (result.contentType == 'application/json') ? JSON.stringify( result.result ) : result.result );
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
	addPath("HEAD", path, functionRef, null, options || {} );
};
exports.get = function getRest(path, functionRef, options){
	addPath("GET", path, functionRef, null, options || {} );
};
exports.post = function postRest(path, functionRef, prototypeObject, options){
	addPath("POST", path, functionRef, prototypeObject, options || {} );
};
exports.put = function putRest(path, functionRef, prototypeObject, options){
	addPath("PUT", path, functionRef, prototypeObject, options || {} );
};
exports.delete = function deleteRest(path, functionRef, prototypeObject, options){
	addPath("DELETE", path, functionRef, prototypeObject, options || {} );
};
exports.assign = function headRest(methods, path, functionRef, prototypeObject, options){
	if( _.isString(methods) && methods == '*' ){
		exports.rest( ['head','get','post','put','delete'], path, functionRef, prototypeObject, options );
	} else if( _.isArray(methods) ){
		_.each( methods, function(element, index, list){
			if( element == 'head' )
				addPath("HEAD", path, functionRef, null, options || {} );
			else if( element == 'get' )
				addPath("GET", path, functionRef, null, options || {} );
			else if( element == 'post' )
				addPath("POST", path, functionRef, prototypeObject, options || {} );
			else if( element == 'put' )
				addPath("PUT", path, functionRef, prototypeObject, options || {} );
			else if( element == 'delete' )
				addPath("DELETE", path, functionRef, prototypeObject, options || {} );
			else logger.error('Not known rest type:', element);
		} );
	}
	else
		logger.error('Not correct given methods', methods);
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
	console.log( context );
};

exports.rester = function( options ) {
	var domain;
	logger = new DummyLogger();
	if( options ){
		exports.context( options.context ? options.context : (options.context === '' ? '' : '/api') );

		if( options.discoverPath )
			addPath('GET', options.discoverPath + '/:version', discover );
		if( options.protoPath )
			addPath('GET', options.protoPath + '/*path', protoPather );
		API_KEYS = options.apiKeys;

		if( options.logger )
			logger = _.isString( options.logger ) ? bunyan.createLogger({name: options.logger, src: true, level: options.logLevel || 'info'}) : options.logger;

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
					logger.error('Error sending 500', er, req.url);
					domain.dispose();
				}
			});
		}

		if(!req.query) req.query = {};

		logger.info('Incoming request.', req.headers, req.query, req.httpVersion, req.method, req.originalUrl );

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
			) && (!route.options.validator || route.options.validator(req, res) ); }
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
