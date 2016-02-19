'use strict'

let querystring = require('querystring')

let util = require('../util/Converter')
let _ = require('isa.js')

let httphelper = require('../util/HTTP-Helper')

let ReadableStream = require('stream').Readable
function isBuffer (obj) {
	return Buffer.isBuffer(obj)
}
function isReadableStream (obj) {
	return obj instanceof ReadableStream
}

function extend ( object, source, respect ) {
	if ( source && object )
		for ( let key of Object.keys(source) )
			if ( !respect || !object[ key ] )
				object[ key ] = source[ key ]
	return object
}

let defaultPurifyConfig = { arrayMaxSize: 100, maxLevel: 3 }
function purify ( obj, config, level, path ) {
	config = config || defaultPurifyConfig
	if (!obj) return obj
	if ( _.isDate(obj) || _.isBoolean(obj) || _.isNumber(obj) || _.isString(obj) || _.isRegExp(obj) )
		return obj
	if ( _.isFunction(obj) )
		return 'fn(){}'
	if ( _.isArray(obj) ) {
		let arr = []
		obj.forEach( function ( element ) {
			if ( path.includes( element ) ) return
			path.push( element )
			arr.push( arr.length > config.arrayMaxSize ? '...' : purify( element, config, level + 1, path ) )
		} )
		return arr
	}
	if ( _.isObject(obj) ) {
		let res = {}
		for (let key in obj)
			if ( key && obj[key] ) {
				if ( path.includes( obj[key] ) ) continue
				path.push( obj[key] )
				res[key] = level > config.maxLevel ? '...' : purify( obj[key], config, level + 1, path )
			}
		return res
	}
	return '...'
}

function setHeaders ( res, statusCode, headers ) {
	for ( let key in headers )
		res.setHeader( key, headers[key] )
	res.statusCode = statusCode
	// res.writeHead( statusCode, headers )
}

function returnResult ( err, result, res ) {
	let headers = extend( {}, exports.globalHeaders )
	if ( err ) {
		headers = extend( headers, { 'Content-Type': 'text/plain' } )
		setHeaders( res, err.statusCode || 500, headers )
		// res.writeHead( err.statusCode || 500, { 'Content-Type': 'text/plain' } )
		res.end( 'Error occurred: ' + err )
	} else {
		if ( !result.contentType )
			result.contentType = 'application/json'
		headers = extend( headers, result.resOptions.headers || { } )
		if ( !headers['Content-Type'] )
			headers['Content-Type'] = result.contentType || 'application/json'
		setHeaders( res, result.resOptions.statusCode || 200, headers )
		// res.writeHead( result.resOptions.statusCode || 200, headers )

		res.end( (result.contentType === 'application/json') ? util.stringify( result.result, result.resOptions.minify, _ ) : result.result )
	}
}

exports.process = function (req, res, action, bodyObj) {
	let self = this

	self.logger.restlog( null, 'Process request', { body: bodyObj }, 'verbose' )

	let asyncCall = req.query.callbackURL

	req.headers.httpVersion = req.httpVersion
	req.headers.method = req.method
	req.headers.originalUrl = req.originalUrl
	req.parameters = req.params = req.query
	req.format = function () {
		let obj = { headers: self.headers, parameters: self.parameters }
		self.config.attributesRespected.forEach( function (attribute) {
			obj[ attribute ] = self[ attribute ]
		} )
		return JSON.stringify( obj )
	} // .bind( req )
	req.headers.clientAddress = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress

	let requestTime = Date.now()
	action( req, bodyObj, function (err, result) {
		self.logger.restlog( err, 'Result', purify( { result: result }, null, 0, []), 'verbose' )

		if ( self.config.timeout && (Date.now() - requestTime) > self.config.timeout.amount ) {
			self.logger.restlog( new Error('Request timed out'), 'Request timed out', req.headers, 'error' )
			if ( self.config.timeout.callback ) self.config.timeout.callback( req, res )
			return
		}

		result = result || { result: '', resOptions: { statusCode: 204 } }

		if ( asyncCall ) {
			httphelper.generalCall( asyncCall, 'POST', null, err, result, result.contentType || 'application/json', self.logger, function (err, result, status) {
				self.logger.restlog( err, 'Async response sent.', purify( { result: result, status: status }, null, 0, []), 'verbose' )
			} )
		} else {
			if ( err ) {
				returnResult( err, null, res )
			}
			else {
				if ( isBuffer( result.result ) ) {
					result.result = ( result.contentType === 'application/json') ? JSON.stringify( result.result ) : result.result.toString( result.resOptions.encoding || 'utf8' )
				}
				if ( isReadableStream( result.result ) ) {
					result.result.on('open', function () {
						let headers = result.resOptions.headers || { }
						if ( !headers['Content-Type'] && result.contentType ) {
							headers['Content-Type'] = result.contentType
						}
						setHeaders( res, result.resOptions.statusCode || 200, headers )
						// res.writeHead( result.resOptions.statusCode || 200, headers )
					})
					result.result.on('error', function ( error ) {
						returnResult( error, null, res )
					})
					result.result.pipe( res )
				}
				else if ( _.isFunction( result.result ) ) {
					result.result( function (err_, res_) {
						result.result = res_
						returnResult( err_, result, res )
					} )
				}
				else if ( _.isString( result.result ) || Array.isArray( result.result ) || _.isObject( result.result ) ) {
					returnResult( null, result, res )
				}
			}
		}
	} )

	if ( asyncCall ) {
		res.statusCode = 200
		res.end( JSON.stringify( { answer: 'OK.'} ) )
	}
}

exports.perform = function ( req, res, next ) {
	let self = this

	let router = self.getRouterMatching( req, res )

	let routeMatched = router.route

	self.logger.restlog( null, 'Incoming request.', { headers: req.headers, query: req.query, httpVersion: req.httpVersion, method: req.method, originalUrl: req.originalUrl, pathname: router.pathname }, 'verbose' )

	if ( routeMatched ) {
		self.logger.restlog( null, 'Route matched.', { route: routeMatched }, 'verbose' )

		if ( routeMatched.apiKeyRequired() ) {
			let apiKey = req.headers['api-key'] || req.headers['x-api-key'] || req.query.api_key
			let apikeys = routeMatched.apikeys || self.config.apikeys
			if ( apikeys && apikeys.indexOf(apiKey ) === -1 ) {
				self.logger.restlog( null, 'Request without api key.', { pathname: router.pathname }, 'verbose' )

				res.statusCode = 401
				res.end( 'API_KEY is required.' )
				return
			}
		}
		routeMatched.callProtector( req, res, router.pathname, function (err) {
			if ( !err ) {
				self.process(req, res, routeMatched.maction, req.body)
			} else {
				self.logger.restlog( null, 'Request is blocked by the API\'s protector.', { pathname: router.pathname }, 'verbose' )
				res.statusCode = 401
				res.end( err.message )
			}
		} )
	} else {
		self.logger.restlog( null, 'Request won\'t be handled by connect-rest.', { pathname: router.pathname }, 'verbose' )
		next()
	}
}

exports.processRequest = function ( ) {
	return this.perform.bind( this )
}

exports.proxy = function proxyRest ( method, path, remotePath, options ) {
	let self = this

	options = options || {}
	console.log( method )
	self.assign( [ method ], path, function ( request, content, callback ) {
		let headers = options.remoteHeaders || {}
		if ( options.bypassHeader )
			headers = extend( headers, request.headers )
		httphelper.generalCall(
			remotePath + ( options.ignoreQuery ? '' : querystring.stringify( request.query ) ),
			method, headers, null, content, null, null, function (err, body, meta) {
				callback( err, body )
			}
		)
	}, null, options)
}
