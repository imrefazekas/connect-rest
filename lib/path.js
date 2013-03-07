var PARAMETER_M_DELIMETER = ':';
var PARAMETER_G_DELIMETER = '*';
var PARAMETER_O_DELIMETER = '?';

function Path(path, _ ){
	this.path = path;

	this.isRegex = _.isRegExp( path );
	this.isString = _.isString( path );
	this.isObject = _.isObject( path ) && path.path && path.version && _.isString( path.path ) && _.isString( path.version );
	this.isSubReged = this.isObject && _.isRegExp( path.path );
}

function matchesVersion(semver, reqVersion, apiVersion ) {
	if ( !apiVersion || !reqVersion || apiVersion === '*' || reqVersion === '*')
		return true;

	return semver.satisfies( reqVersion, apiVersion );
}

Path.prototype.matches = function( req, pathname, version, _, semver, alterEnvironment ){
	if( this.isRegex ){
		return this.path.test( pathname );
	}
	else if( this.isString ){
		if (this.path == '*') 
			return true;

		var utokens = _.words( pathname, '/');
		var ptokens = _.words( this.path, '/');

		if( _( _.last( ptokens ) ).startsWith( PARAMETER_O_DELIMETER ) && utokens.length == ptokens.length-1 )
			utokens.push('');

		if( utokens.length > ptokens.length )
			return false;

		if( _( _.last( ptokens ) ).startsWith( PARAMETER_G_DELIMETER ) ){
			var newUToken = _.toSentence( _.rest(utokens, ptokens.length-1 ), '/', '/' );

			utokens = _.first(utokens, ptokens.length );
			utokens[ ptokens.length-1 ] = newUToken;
		}

		var parameterReplacements = {};
		for (var i=0;i<utokens.length;i++){
			if( _( ptokens[i] ).startsWith( PARAMETER_M_DELIMETER )  )
				parameterReplacements[ ptokens[i].substring( PARAMETER_M_DELIMETER.length ) ] = utokens[i];
			else if( _( ptokens[i] ).startsWith( PARAMETER_G_DELIMETER )  )
				parameterReplacements[ ptokens[i].substring( PARAMETER_G_DELIMETER.length ) ] = utokens[i];
			else if( _( ptokens[i] ).startsWith( PARAMETER_O_DELIMETER ) ){
				if( utokens[i].length>0  )
					parameterReplacements[ ptokens[i].substring( PARAMETER_O_DELIMETER.length ) ] = utokens[i];
			}
			else {
				if( ptokens[i].toUpperCase() != utokens[i].toUpperCase() )
					return false;
			}
		}
		if( alterEnvironment )
			_.each(parameterReplacements, function(value, key, list){
				req.query[ key ] = value;	
			});

		return true;
	}
	else if( this.isObject ){
		return  (this.isSubReged ? this.path.path.test( pathname ) : this.path.path == '*' || (this.path.path.toUpperCase()==pathname.toUpperCase()) ) 
				&& 
				matchesVersion( semver, version, this.path.version );
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
