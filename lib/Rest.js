let url = require('url')
let _ = require('isa.js')
let fs = require('fs')
let path = require('path')

let Assigner = require('assign.js')
let assigner = new Assigner()

let VERSION = JSON.parse( fs.readFileSync( path.join(__dirname, '..', 'package.json'), 'utf8' ) ).version

let Logger = require('./util/Logger')

function protoPather ( mapping ) {
	return async function ( request, content ) {
		let utokens = request.parameters.path.split( '/' )
		let method = utokens[0]
		let version = utokens[1]
		let pathname =	'/' + utokens.slice( 2 ).join( '/' )
		// console.log( '....', utokens )
		let routes = mapping[ method ].filter( function (route) { return route.matches(
			null, pathname, version, false
		) } )

		return routes.length > 0 ? routes.map( function (route) { return route.config.prototypeObject } )[0] : 'No matching service'
	}
}

function discover ( mapping ) {
	return async function (request, content) {
		let version = request.parameters.version
		let matchingMaps = {}
		for (let key in mapping) {
			let value = mapping[key]
			matchingMaps[ key ] = []
			value.forEach( function (element) {
				element.matchings( version ).forEach( function (match) {
					matchingMaps[ key ].push( match )
				})
			} )
		}
		return matchingMaps
	}
}

function Rest ( config ) {
	this.config = {
		options: config.options,
		context: config.context ? config.context : (config.context === '' ? '' : '/api'),
		headers: config.headers || { },
		discover: config.discover,
		proto: config.proto,
		timeout: config.timeout,
		apiKeys: config.apiKeys,
		logger: config.logger,
		attributesRespected: config.attributesRespected || [ 'user', 'files' ]
	}
	this.logger = Logger.createLogger( 'rest', {'connect-rest': VERSION}, config.logger )
	this.mapping = {
		'HEAD': [],
		'GET': [],
		'POST': [],
		'PUT': [],
		'PATCH': [],
		'OPTIONS': [],
		'DELETE': []
	}

	if ( this.config.discover && this.config.discover.path ) {
		this.logger.restlog( null, 'dicover service activated on path: ' + this.config.discover.path + '/:version', null, 'info' )
		this.addPath('GET', { path: this.config.discover.path + '/:version', unprotected: !this.config.discover.secure }, discover(this.mapping) )
	}
	if ( this.config.proto && this.config.proto.path ) {
		this.logger.restlog( null, 'proto service activated on path: ' + this.config.proto.path + '/*path', null, 'info' )
		this.addPath('GET', { path: this.config.proto.path + '/*path', unprotected: !this.config.discover.secure }, protoPather(this.mapping) )
	}
}

let rest = Rest.prototype

rest.getRouterMatching = function ( req, res ) {
	let self = this

	if (!req.query)
		req.query = url.parse( req.url, true ).query || {}

	let pathname = url.parse( req.url ).pathname

	let apiKey = req.headers['api-key'] || req.headers['x-api-key'] || req.query.api_key
	let version = req.headers['accept-version'] || req.headers['x-api-version'] || '*'

	let routeMatched = self.mapping[ req.method ].find( function (route) {
		let apiKeys = route.apiKeys || self.config.apiKeys
		return route.matches(
			req, pathname, version, true, (apiKeys && apiKeys.indexOf(apiKey ) === -1)
		) && (!route.config.validator || route.config.validator(req, res) )
	} )

	return { pathname: pathname, route: routeMatched }
}

rest.copyPath = function ( path, extra ) {
	let self = this

	if ( _.isString(path) )
		return assigner.assign( { path: path }, extra || {} )
	else if ( _.isArray(path) ) {
		let res = []
		path.forEach( function ( p ) {
			res.push( self.copyPath( p, extra ) )
		} )
		return res
	}
	else if ( _.isObject(path) ) {
		return assigner.assign( { }, path, extra || {} )
	}
}

rest = require('./util/Extender').extend( rest, path.join( __dirname, 'services' ) )

module.exports = Rest
