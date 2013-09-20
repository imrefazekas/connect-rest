var PARAMETER_M_DELIMETER = ':';
var PARAMETER_G_DELIMETER = '*';
var PARAMETER_O_DELIMETER = '?';

function Path(path, _ ){
	this.path = path;

	this.isRegex = _.isRegExp( path );
	this.isString = _.isString( path );
	this.isObject = _.isObject( path ) && path.path;
	if( this.isObject ){
		if( !_.isString( path.path ) )
			throw new Error('Path must be a proper string.');
		if( path.version && !_.isString( path.version ) )
			throw new Error('Version must be a proper string.');
	}
	this.isSubReged = this.isObject && _.isRegExp( path.path );
	this.protected = !this.isObject || !path.unprotected;
}

function matchesVersion(semver, reqVersion, apiVersion ) {
	if ( !apiVersion || !reqVersion || apiVersion === '*' || reqVersion === '*')
		return true;

	return semver.satisfies( reqVersion, apiVersion );
}

Path.prototype.representation = function(){
	return this.isRegex || this.isString ? { path: this.path, version:'*' } : { path: this.path.path, version: this.path.version||'*' };
};

Path.prototype.innerMatches = function( _, pathname, path, parameterReplacements ){
	if (path == '*')
		return true;

	var utokens = _.words( pathname, '/');
	var ptokens = _.words( path, '/');

	for (var i=0;i<ptokens.length;i++)
		if( _( ptokens[i] ).startsWith( PARAMETER_O_DELIMETER ) && utokens.length < ptokens.length ){
			utokens.splice( i, 0, '' );
		}

	if( _( _.last( ptokens ) ).startsWith( PARAMETER_G_DELIMETER ) ){
		var newUToken = _.toSentence( _.rest(utokens, ptokens.length-1 ), '/', '/' );

		utokens = _.first(utokens, ptokens.length );
		utokens[ ptokens.length-1 ] = newUToken;
	}

	if( utokens.length > ptokens.length )
		return false;

	for (var t=0; t<utokens.length; t++){
		if( _( ptokens[t] ).startsWith( PARAMETER_M_DELIMETER )  )
			parameterReplacements[ ptokens[t].substring( PARAMETER_M_DELIMETER.length ) ] = utokens[t];
		else if( _( ptokens[t] ).startsWith( PARAMETER_G_DELIMETER )  )
			parameterReplacements[ ptokens[t].substring( PARAMETER_G_DELIMETER.length ) ] = utokens[t];
		else if( _( ptokens[t] ).startsWith( PARAMETER_O_DELIMETER ) ){
			if( utokens[t].length>0  )
				parameterReplacements[ ptokens[t].substring( PARAMETER_O_DELIMETER.length ) ] = utokens[t];
		}
		else {
			if( ptokens[t].toUpperCase() != utokens[t].toUpperCase() )
				return false;
		}
	}

	return true;
};

Path.prototype.matches = function( req, pathname, version, _, semver, alterEnvironment, protectAPI ){
	var parameterReplacements = {};

	if( protectAPI && this.protected )
		return false;
	if( this.isRegex ){
		return this.path.test( pathname );
	}
	else if( this.isString ){
		if( !this.innerMatches( _, pathname, this.path, parameterReplacements ) )
			return false;

		if( alterEnvironment )
			_.each(parameterReplacements, function(value, key, list){
				req.query[ key ] = value;
			});

		return true;
	}
	else if( this.isObject ){
		if( this.isSubReged )
			return this.path.path.test( pathname );

		if( !matchesVersion( semver, version, this.path.version ) || !this.innerMatches( _, pathname, this.path.path, parameterReplacements ) )
			return false;

		if( alterEnvironment )
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
