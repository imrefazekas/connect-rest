'use strict'

let http = require('http')
let https = require('https')
let _ = require('isa.js')
let url = require('url')
let querystring = require('querystring')

function getQuery ( query ) {
	return query ? '?' + querystring.stringify( query ) : ''
}

function HttpHelper ( opts ) {
	this.options = opts || {}

	this.opt = {
		hostname: 'localhost',
		port: 80,
		path: '',
		method: 'POST',
		headers: {
			'accept-version': '1.0.0',
			'Content-Type': 'application/json'
		}
	}
}

let httpHelper = HttpHelper.prototype

httpHelper.get = function (serverURL, query, payload, callback) {
	this.generalCall( serverURL + getQuery(query), 'GET', this.options.headers, null, payload, null, this.options.logger, callback )
}
httpHelper.post = function (serverURL, query, payload, callback) {
	this.generalCall( serverURL + getQuery(query), 'POST', this.options.headers, null, payload, null, this.options.logger, callback )
}
httpHelper.put = function (serverURL, query, payload, callback) {
	this.generalCall( serverURL + getQuery(query), 'PUT', this.options.headers, null, payload, null, this.options.logger, callback )
}
httpHelper.patch = function (serverURL, query, payload, callback) {
	this.generalCall( serverURL + getQuery(query), 'PATCH', this.options.headers, null, payload, null, this.options.logger, callback )
}
httpHelper.del = function (serverURL, query, payload, callback) {
	this.generalCall( serverURL + getQuery(query), 'DELETE', this.options.headers, null, payload, null, this.options.logger, callback )
}

httpHelper.callOn = function ( options ) {
	exports.generalCall( options.serverURL, options.method || 'GET', options.headers, options.err, options.result, options.mimetype, options.logger, options.callback )
}

httpHelper.generalCall = function (serverURL, method, headers, err, result, mimetype, logger, callback) {
	let self = this

	let server = _.isString( serverURL ) ? url.parse( serverURL ) : serverURL

	if (logger)
		logger.debug('Async server data:', server)

	let voptions = JSON.parse(JSON.stringify( this.opt ))
	voptions.hostname = server.hostname
	voptions.port = server.port
	voptions.path = server.path
	if (method)
		voptions.method = method

	if ( headers ) {
		for (let name in headers)
			if (headers.hasOwnProperty(name))
				voptions.headers[ name ] = headers[ name ]
	}

	mimetype = mimetype || 'application/json'
	voptions.headers['Content-Type'] = mimetype

	if (logger)
		logger.debug('Options to be used:', voptions)

	let lib = (server.protocol === 'https:' ? https : http)

	let data
	let payload = err ? { errorMessage: err.message, errorCode: err.errorCode || err.code || err.statusCode || -1 } : result
	if ( payload ) {
		data = (mimetype === 'application/json') ? JSON.stringify( payload ) : querystring.stringify( payload )
		voptions.headers['Content-Length'] = Buffer.byteLength( data )
		if (logger)
			logger.debug('Payload to be sent:', data)
	}

	let responseStatus
	let req = lib.request( voptions, function (res) {
		let body = ''
		res.on('data', function (chunk) {
			body += chunk
		})
		res.on('end', function ( ) {
			responseStatus = { statusCode: res.statusCode, headers: res.headers }
			callback(null, (body && (self.options.forceJSON || (res.headers['content-type'] && res.headers['content-type'] === 'application/json') ) ) ? JSON.parse(body) : body, responseStatus )
		})
	})
	req.on('error', function (er) {
		callback(er, 'Failed.', responseStatus)
	})
	if ( data )
		req.write( data )

	req.end()
}


module.exports = HttpHelper
