let http = require('http')
let https = require('https')
let _ = require('isa.js')
let url = require('url')
let querystring = require('querystring')

let Assigner = require('assign.js')
let assigner = new Assigner()

function getQuery ( query ) {
	return query ? '?' + querystring.stringify( query ) : ''
}

let OPTS = {
	hostname: 'localhost',
	port: 80,
	path: '',
	method: 'POST',
	mimetype: 'application/json',
	headers: {
		'accept-version': '1.0.0',
		'Content-Type': 'application/json'
	}
}
function HttpHelper ( options = {}, defaultOPTS = {} ) {
	if ( defaultOPTS.headers )
		for ( let key of Object.keys( defaultOPTS.headers ) )
			OPTS.headers[key] = defaultOPTS.headers[key]
	this.reset( options )
}

let httpHelper = HttpHelper.prototype

httpHelper.logger = function ( logger ) {
	this._options.logger = logger
	return this
}
httpHelper.reset = function ( options = {} ) {
	this._options = options
	this.opt = assigner.assign( {}, OPTS )
	return this
}

httpHelper.url = function ( url = {} ) {
	this._options.url = url
	return this
}
httpHelper.pickPayload = function (err, result) {
	return err ? { errorMessage: err.message, errorCode: err.errorCode || err.code || err.statusCode || -1 } : result
}
httpHelper.payload = function (payload) {
	this._options.payload = payload
	return this
}
httpHelper.headers = function ( headers = {} ) {
	for ( let key of Object.keys( headers ) )
		this.opt.headers[key] = headers[key]
	return this
}
httpHelper.mimetype = function ( mimetype = {} ) {
	this.opt.mimetype = mimetype
	return this
}

httpHelper.options = async function (serverURL, query) {
	return this.generalCall( serverURL + getQuery(query), 'OPTIONS' )
}
httpHelper.head = async function (serverURL, query) {
	return this.generalCall( serverURL + getQuery(query), 'HEAD' )
}
httpHelper.get = async function (serverURL, query, payload) {
	return this.payload(payload).generalCall( serverURL + getQuery(query), 'GET' )
}
httpHelper.post = async function (serverURL, query, payload) {
	return this.payload(payload).generalCall( serverURL + getQuery(query), 'POST' )
}
httpHelper.put = async function (serverURL, query, payload) {
	return this.payload(payload).generalCall( serverURL + getQuery(query), 'PUT' )
}
httpHelper.patch = async function (serverURL, query, payload) {
	return this.payload(payload).generalCall( serverURL + getQuery(query), 'PATCH' )
}
httpHelper.del = async function (serverURL, query, payload) {
	return this.payload(payload).generalCall( serverURL + getQuery(query), 'DELETE' )
}

httpHelper.callOn = function ( options = {} ) {
	return this.headers(options.headers).mimetype(options.mimetype).payload(options.err, options.result).generalCall( options.serverURL, options.method || 'GET' )
}

httpHelper.generalCall = async function (serverURL, method) {
	let self = this

	return new Promise( (resolve, reject) => {
		let server = _.isString( serverURL ) ? url.parse( serverURL ) : serverURL

		if (self._options.logger)
			self._options.logger.debug('Async server data:', server)

		let voptions = JSON.parse(JSON.stringify( self.opt ))
		voptions.hostname = server.hostname
		voptions.port = server.port
		voptions.path = server.path
		if (method)
			voptions.method = method

		voptions.headers['Content-Type'] = self.opt.mimetype

		if (self._options.logger)
			self._options.logger.debug('Options to be used:', voptions)

		let lib = (server.protocol === 'https:' ? https : http)

		let data
		if ( self._options.payload ) {
			data = (self.opt.mimetype === 'application/json') ? JSON.stringify( self._options.payload ) : querystring.stringify( self._options.payload )
			voptions.headers['Content-Length'] = Buffer.byteLength( data )
			if (self._options.logger)
				self._options.logger.debug('Payload to be sent:', data)
		}

		let responseStatus
		let req = lib.request( voptions, function (res) {
			let body = ''
			res.on('data', function (chunk) {
				body += chunk
			})
			res.on('end', function ( ) {
				responseStatus = { statusCode: res.statusCode, headers: res.headers }
				self.reset()
				resolve( { result: (body && (self._options.forceJSON || (res.headers['content-type'] && res.headers['content-type'] === 'application/json') ) ) ? JSON.parse(body) : body, status: responseStatus } )
			})
		})
		req.on('error', function (er) {
			self.reset()
			reject( er, responseStatus )
		})
		if ( data )
			req.write( data )

		req.end()
	} )

}

module.exports = HttpHelper
