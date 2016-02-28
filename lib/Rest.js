'use strict'

/*
{
	options: true,
	context: '/api',
	headers: [],
	discoverPath: '',
	protoPath: '',
	timeout: {
		amount: 0
		callback: fn
	},
	apiKeys: [],
	logger: {}
}
*/
let url = require('url')
let _ = require('isa.js')
let fs = require('fs')
let path = require('path')

let VERSION = JSON.parse( fs.readFileSync( path.join(__dirname, '..', 'package.json'), 'utf8' ) ).version

let Logger = require('./util/Logger')

function Rest ( config ) {
	this.config = {
		options: config.options,
		context: config.context ? config.context : (config.context === '' ? '' : '/api'),
		headers: config.headers || [],
		discoverPath: config.discoverPath,
		protoPath: config.heprotoPathaders,
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
		let apikeys = route.apikeys || self.config.apikeys
		return route.matches(
			req, pathname, version, true, (apikeys && apikeys.indexOf(apiKey ) === -1)
		) && (!route.config.validator || route.config.validator(req, res) )
	} )

	return { pathname: pathname, route: routeMatched }
}

function extend ( object, source, respect ) {
	if ( source && object )
		for ( let key of Object.keys(source) )
			if ( !respect || !object[ key ] )
				object[ key ] = source[ key ]
	return object
}

rest.copyPath = function ( path, extra ) {
	let self = this

	if ( _.isString(path) )
		return extend( { path: path }, extra || {} )
	else if ( _.isArray(path) ) {
		let res = []
		path.forEach( function ( p ) {
			res.push( self.copyPath( p, extra ) )
		} )
		return res
	}
	else if ( _.isObject(path) ) {
		return extend( { }, path, extra || {} )
	}
}

let prefix = './services/'

let extensions = [ 'Adder', 'Remover', 'Performer' ]
extensions.forEach( function ( element ) {
	rest = extend( rest, require( prefix + element ) )
} )

module.exports = Rest
