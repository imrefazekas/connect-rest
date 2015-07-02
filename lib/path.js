var PARAMETER_M_DELIMETER = ':';
var PARAMETER_G_DELIMETER = '*';
var PARAMETER_O_DELIMETER = '?';
var PARAMETER_R_DELIMETER = '@';

function Path(context, path, options, _ ){
	this.path = path;

	this.options = options || {};

	this.isRegex = _.isRegExp( path );
	this.isString = _.isString( path );
	this.isObject = _.isObject( path ) && path.path;

	this.context = this.isObject && (path.context || path.context === '') ? path.context : context;

	if( this.isObject ){
		if( !_.isString( path.path ) )
			throw new Error('Path must be a proper string.');
		if( path.version && !_.isString( path.version ) )
			throw new Error('Version must be a proper string.');
	}
	this.isSubReged = this.isObject && _.isRegExp( path.path );
	this.protected = !this.isObject || !path.unprotected;
	this.protector = path.protector || this.options.protector;
}

function matchesVersion(semver, reqVersion, apiVersion ) {
	if ( !apiVersion || !reqVersion || apiVersion === '*' || reqVersion === '*')
		return true;

	return semver.satisfies( reqVersion, apiVersion );
}

Path.prototype.countFixedTokens = function( _, ptokens ){
	var count = 0;
	for (var i=0; i<ptokens.length; i+=1){
		if( !(_.str.startsWith( ptokens[i], PARAMETER_G_DELIMETER ) || _.str.startsWith( ptokens[i], PARAMETER_O_DELIMETER )) )
			count+=1;
	}
	return count;
};

Path.prototype.representation = function(){
	return this.isRegex || this.isString ? { path: this.path, version: '*' } : { path: this.path.path, version: this.path.version||'*' };
};

Path.prototype.innerMatches = function( _, pathname, path, parameterReplacements ){
	if (path === '*')
		return true;

	var utokens = _.str.words( pathname, '/' );
	var ptokens = _.str.words( path, '/' );

	if( ptokens.length !== utokens.length ){
		for (var i=1; i<=ptokens.length; i+=1)
			if( _.str.startsWith( ptokens[ ptokens.length-i ], PARAMETER_O_DELIMETER ) && utokens.length < ptokens.length ){
				utokens.splice( utokens.length-i + 1, 0, '' );
			}
	}

	var fixedTokens = this.countFixedTokens( _, ptokens );
	if( utokens.length < fixedTokens )
		return false;

	if( _.str.startsWith( _.last( ptokens ), PARAMETER_G_DELIMETER ) ){
		if( utokens.length < ptokens.length-1 ) return false;

		var newUToken = _.str.toSentence( _.rest(utokens, ptokens.length-1 ), '/', '/' );

		utokens = _.first(utokens, ptokens.length );
		utokens[ ptokens.length-1 ] = newUToken;
	}

	if( utokens.length > ptokens.length )
		return false;

	for (var t=0; t<utokens.length; t+=1){
		if( _.str.startsWith( ptokens[t], PARAMETER_M_DELIMETER )  )
			parameterReplacements[ ptokens[t].substring( PARAMETER_M_DELIMETER.length ) ] = utokens[t];
		else if( _.str.startsWith( ptokens[t], PARAMETER_O_DELIMETER ) ){
			if( utokens[t].length>0  )
				parameterReplacements[ ptokens[t].substring( PARAMETER_O_DELIMETER.length ) ] = utokens[t];
		}
		else if( _.str.startsWith( ptokens[t], PARAMETER_G_DELIMETER )  )
			parameterReplacements[ ptokens[t].substring( PARAMETER_G_DELIMETER.length ) ] = utokens[t];
		else if( _.str.startsWith( ptokens[t], PARAMETER_R_DELIMETER )  ){
			var pName = ptokens[t].substring( PARAMETER_R_DELIMETER.length );
			var array = this.options[ pName ];
			if( !array || !(_.contains(array, utokens[t])) )
				return false;
			parameterReplacements[ pName ] = utokens[t];
		}
		else {
			if( ptokens[t].toUpperCase() !== utokens[t].toUpperCase() )
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

Path.prototype.matches = function( req, pathname, version, _, semver, alterEnvironment, protectAPI ){
	if( !( _.str.startsWith( pathname, this.context ) ) )
		return false;
	var rPathname = pathname.substring( this.context.length );

	var parameterReplacements = {};

	if( this.isRegex ){
		return this.path.test( rPathname );
	}
	else if( this.isString ){
		if( !this.innerMatches( _, rPathname, this.path, parameterReplacements ) )
			return false;

		if( req && alterEnvironment )
			_.each(parameterReplacements, function(value, key, list){
				req.query[ key ] = value;
			});

		return true;
	}
	else if( this.isObject ){
		if( this.isSubReged )
			return this.path.path.test( rPathname );

		if( !matchesVersion( semver, version, this.path.version ) || !this.innerMatches( _, rPathname, this.path.path, parameterReplacements ) )
			return false;

		if( req && alterEnvironment )
			_.each(parameterReplacements, function(value, key, list){
				req.query[ key ] = value;
			});

		return true;
	}
	return false;
};

Path.prototype.matchings = function( version, _, semver ){
	if( this.isRegex || this.isString )
		return true;
	if( this.isObject )
		return matchesVersion( semver, version, this.path.version );

	return false;
};


module.exports = Path;
