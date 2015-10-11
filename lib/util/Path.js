'use strict';

var _ = require('isa.js');
var semver = require('semver');

var PARAMETER_M_DELIMETER = ':';
var PARAMETER_G_DELIMETER = '*';
var PARAMETER_O_DELIMETER = '?';
var PARAMETER_R_DELIMETER = '@';

function Path(context, path, config ){
	this.path = path;

	this.config = config || {};

	this.isRegex = _.isRegExp( path );
	this.isString = _.isString( path );
	this.isObject = _.isObject( path ) && path.path;
	this.isOpengate = this.isString && path === '*';
	this.context = this.isObject && (path.context || path.context === '') ? path.context : context;

	if( this.isObject ){
		if( !_.isString( path.path ) )
			throw new Error('Path must be a proper string.');
		if( path.version && !_.isString( path.version ) )
			throw new Error('Version must be a proper string.');
	}
	this.isSubReged = this.isObject && _.isRegExp( path.path );
	this.protected = !this.isObject || !path.unprotected;
	this.protector = path.protector || this.config.protector;

	var restPath = this.isString ? path : path.path;
	if( restPath ){
		var tokens = restPath.trim().split( '/' );
		this.cache = {
			tokens: tokens,
			fixedCount: this.countFixedTokens( tokens )
		};
	}
}

function matchesVersion( reqVersion, apiVersion ) {
	if ( !apiVersion || !reqVersion || apiVersion === '*' || reqVersion === '*')
		return true;

	return semver.satisfies( reqVersion, apiVersion );
}

Path.prototype.countFixedTokens = function( ptokens ){
	var count = 0;
	for (var i=0; i<ptokens.length; i+=1){
		if( !( ptokens[i].startsWith( PARAMETER_G_DELIMETER ) || ptokens[i].startsWith( PARAMETER_O_DELIMETER )) )
			count+=1;
	}
	return count;
};

Path.prototype.representation = function(){
	return this.isRegex || this.isString ? { path: this.path, version: '*' } : { path: this.path.path, version: this.path.version||'*' };
};

Path.prototype.innerMatches = function( requestPath, parameterReplacements ){
	var self = this;

	if ( self.isOpengate )
		return true;

	var requestTokens = requestPath.trim().split( '/' );
	var ptokens = self.cache.tokens;

	if( ptokens.length !== requestTokens.length ){
		for (var i=1; i<=ptokens.length; i+=1)
			if( ptokens[ ptokens.length-i ].startsWith( PARAMETER_O_DELIMETER ) && requestTokens.length < ptokens.length ){
				requestTokens.splice( requestTokens.length-i + 1, 0, '' );
			}
	}

	if( requestTokens.length < self.cache.fixedCount )
		return false;

	if( ptokens[ptokens.length-1].startsWith( PARAMETER_G_DELIMETER ) ){
		if( requestTokens.length < ptokens.length-1 ) return false;

		var newUToken = requestTokens.slice( ptokens.length-1 ).join( '/' );

		requestTokens = requestTokens.slice( 0, ptokens.length );
		requestTokens[ ptokens.length-1 ] = newUToken;
	}

	if( requestTokens.length > ptokens.length )
		return false;

	for (var t=0; t<requestTokens.length; t+=1){
		if( ptokens[t].startsWith( PARAMETER_M_DELIMETER )  )
			parameterReplacements[ ptokens[t].substring( PARAMETER_M_DELIMETER.length ) ] = requestTokens[t];
		else if(ptokens[t].startsWith( PARAMETER_O_DELIMETER ) ){
			if( requestTokens[t].length>0  )
				parameterReplacements[ ptokens[t].substring( PARAMETER_O_DELIMETER.length ) ] = requestTokens[t];
		}
		else if( ptokens[t].startsWith( PARAMETER_G_DELIMETER )  )
			parameterReplacements[ ptokens[t].substring( PARAMETER_G_DELIMETER.length ) ] = requestTokens[t];
		else if( ptokens[t].startsWith( PARAMETER_R_DELIMETER )  ){
			var pName = ptokens[t].substring( PARAMETER_R_DELIMETER.length );
			var array = this.config[ pName ];
			if( !array || !(array.includes(requestTokens[t])) )
				return false;
			parameterReplacements[ pName ] = requestTokens[t];
		}
		else {
			if( ptokens[t].toUpperCase() !== requestTokens[t].toUpperCase() )
				return false;
		}
	}

	return true;
};

Path.prototype.apiKeyRequired = function( ){
	return this.protected;
};
Path.prototype.callProtector = function( req, res, pathname, callback ){
	if( req && this.protector )
		return this.protector( req, res, pathname, this, callback );
	else return callback( null, 'ok' );
};

Path.prototype.matches = function( req, pathname, version, alterEnvironment, protectAPI ){
	if( !( pathname.startsWith( this.context ) ) )
		return false;
	var rPathname = pathname.substring( this.context.length );

	var parameterReplacements = {};

	if( this.isRegex ){
		return this.path.test( rPathname );
	}
	else if( this.isString ){
		if( !this.innerMatches( rPathname, parameterReplacements ) )
			return false;

		if( req && alterEnvironment ){
			for ( let key of Object.keys( parameterReplacements ) )
				req.query[ key ] = parameterReplacements[ key ];
		}

		return true;
	}
	else if( this.isObject ){
		if( this.isSubReged )
			return this.path.path.test( rPathname );

		if( !matchesVersion( version, this.path.version ) || !this.innerMatches( rPathname, parameterReplacements ) )
			return false;

		if( req && alterEnvironment ){
			for ( let key of Object.keys( parameterReplacements ) )
				req.query[ key ] = parameterReplacements[ key ];
		}

		return true;
	}
	return false;
};

Path.prototype.matchings = function( version ){
	if( this.isRegex || this.isString )
		return true;
	if( this.isObject )
		return matchesVersion( version, this.path.version );

	return false;
};


module.exports = Path;