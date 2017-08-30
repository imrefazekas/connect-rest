let _ = require('isa.js')
let semver = require('semver')

let PARAMETER_M_DELIMETER = ':'
let PARAMETER_G_DELIMETER = '*'
let PARAMETER_O_DELIMETER = '?'
let PARAMETER_R_DELIMETER = '@'

function Path (context, path, config ) {
	this.path = path

	this.config = config || {}

	this.isRegex = _.isRegExp( path )
	this.isString = _.isString( path )
	this.isObject = _.isObject( path ) && path.path
	this.isOpengate = this.isString && path === '*'
	this.context = this.isObject && (path.context || path.context === '') ? path.context : context

	if ( this.isObject ) {
		if ( !_.isString( path.path ) )
			throw new Error('Path must be a proper string.')
		if ( path.version && !_.isString( path.version ) )
			throw new Error('Version must be a proper string.')
	}
	this.isSubReged = this.isObject && _.isRegExp( path.path )
	this.protected = !this.isObject || !path.unprotected
	this.protector = path.protector || this.config.protector

	let restPath = this.isString ? path : path.path
	if ( restPath ) {
		let tokens = restPath.trim().split( '/' )
		this.cache = {
			tokens: tokens,
			fixedCount: this.countFixedTokens( tokens )
		}
	}
}

function matchesVersion ( reqVersion, apiVersion ) {
	if ( !apiVersion || !reqVersion || apiVersion === '*' || reqVersion === '*')
		return true
	return semver.satisfies( reqVersion, apiVersion )
}

Path.prototype.countFixedTokens = function ( ptokens ) {
	let count = 0
	for (let i = 0; i < ptokens.length; i += 1) {
		if ( !( ptokens[i].startsWith( PARAMETER_G_DELIMETER ) || ptokens[i].startsWith( PARAMETER_O_DELIMETER )) )
			count += 1
	}
	return count
}

Path.prototype.representation = function () {
	return this.isRegex || this.isString ? { path: this.path, version: '*' } : { path: this.path.path, version: this.path.version || '*' }
}

Path.prototype.innerMatches = function ( requestPath, parameterReplacements ) {
	let self = this

	if ( self.isOpengate )
		return true

	let requestTokens = requestPath.trim().split( '/' )
	let ptokens = self.cache.tokens

	if ( ptokens.length !== requestTokens.length ) {
		for (let i = 1; i <= ptokens.length; i += 1)
			if ( ptokens[ ptokens.length - i ].startsWith( PARAMETER_O_DELIMETER ) && requestTokens.length < ptokens.length ) {
				requestTokens.splice( requestTokens.length - i + 1, 0, '' )
			}
	}

	if ( requestTokens.length < self.cache.fixedCount )
		return false

	if ( ptokens[ptokens.length - 1].startsWith( PARAMETER_G_DELIMETER ) ) {
		if ( requestTokens.length < ptokens.length - 1 ) return false

		let newUToken = requestTokens.slice( ptokens.length - 1 ).join( '/' )

		requestTokens = requestTokens.slice( 0, ptokens.length )
		requestTokens[ ptokens.length - 1 ] = newUToken
	}

	if ( requestTokens.length > ptokens.length )
		return false

	for (let t = 0, idx = -1; t < requestTokens.length; t += 1) {
		if ( ptokens[t].startsWith( PARAMETER_M_DELIMETER ) )
			parameterReplacements[ ptokens[t].substring( PARAMETER_M_DELIMETER.length ) ] = requestTokens[t]
		else if (ptokens[t].startsWith( PARAMETER_O_DELIMETER ) ) {
			if ( requestTokens[t].length > 0 )
				parameterReplacements[ ptokens[t].substring( PARAMETER_O_DELIMETER.length ) ] = requestTokens[t]
		}
		else if ( ptokens[t].startsWith( PARAMETER_G_DELIMETER ) )
			parameterReplacements[ ptokens[t].substring( PARAMETER_G_DELIMETER.length ) ] = requestTokens[t]
		else if ( ptokens[t].startsWith( PARAMETER_R_DELIMETER ) ) {
			let pName = ptokens[t].substring( PARAMETER_R_DELIMETER.length )
			let array = this.config[ pName ]
			if ( !array || !(array.includes(requestTokens[t])) )
				return false
			parameterReplacements[ pName ] = requestTokens[t]
		}
		else {
			idx = (t === requestTokens.length - 1) ? requestTokens[t].lastIndexOf('?') : -1
			let rt = idx > -1 ? requestTokens[t].substring( 0, idx ) : requestTokens[t]
			if ( ptokens[t].toUpperCase() !== rt.toUpperCase() )
				return false
		}
	}

	return true
}

Path.prototype.apiKeyRequired = function ( ) {
	return this.protected
}
Path.prototype.callProtector = async function ( req, res, pathname ) {
	return req && this.protector ? this.protector( req, res, pathname, this ) : 'ok'
}

Path.prototype.matches = function ( req, pathname, version, alterEnvironment, protectAPI ) {
	if ( !( pathname.startsWith( this.context ) ) )
		return false
	let rPathname = pathname.substring( this.context.length )

	let parameterReplacements = {}

	if ( this.isRegex ) {
		return this.path.test( rPathname )
	}
	else if ( this.isString ) {
		if ( !this.innerMatches( rPathname, parameterReplacements ) )
			return false

		if ( req && alterEnvironment ) {
			for ( let key of Object.keys( parameterReplacements ) )
				req.query[ key ] = parameterReplacements[ key ]
		}

		return true
	}
	else if ( this.isObject ) {
		if ( this.isSubReged )
			return this.path.path.test( rPathname )

		if ( !matchesVersion( version, this.path.version ) || !this.innerMatches( rPathname, parameterReplacements ) )
			return false

		if ( req && alterEnvironment ) {
			for ( let key of Object.keys( parameterReplacements ) )
				req.query[ key ] = parameterReplacements[ key ]
		}

		return true
	}
	return false
}

Path.prototype.matchings = function ( version ) {
	if ( this.isRegex || this.isString )
		return true
	if ( this.isObject )
		return matchesVersion( version, this.path.version )

	return false
}


module.exports = Path
