/*
server.put('/hello', send);
server.put('/hello', [send, send, send]);
server.get('/hello/:name', send);
server.get(/^\/([a-zA-Z0-9_\.~-]+)\/(.*)/, function(req, res, next) {
server.get({path: PATH, version: '1.1.3'}, sendV1);
*/

var PARAMETER_DELIMETER = ':';

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
};


Path.prototype.matches = function( req, uri, version, _, semver ){
	if( this.isRegex ){
		return this.path.test( uri );
	}
	else if( this.isString ){
		if (this.path == '*') 
			return true;

		var utokens = _.words( uri, "/");
		var ptokens = _.words( this.path, "/");

		if( utokens.length != ptokens.length )
			return false;

		var parameterReplacements = {};
		for (i=0;i<utokens.length;i++)
			if( _( ptokens[i] ).startsWith( PARAMETER_DELIMETER )  )
				parameterReplacements[ ptokens[i].substring( PARAMETER_DELIMETER.length ) ] = utokens[i];
			else
				if( ptokens[i].toUpperCase() != utokens[i].toUpperCase() )
					return false;
		
		_.each(parameterReplacements, function(value, key, list){
			req.query[ key ] = value;	
		});

		return true;
	}
	else if( this.isObject ){
		return  (this.isSubReged ? this.path.path.test( uri ) : this.path.path == '*' || (this.path.path.toUpperCase()==uri.toUpperCase()) ) 
		&& 
		matchesVersion( semver, version, this.path.version );
	}
	return false;
}

Path.prototype.matchings = function( version, _, semver ){
	if( this.isRegex || this.isString )
		return true;
	if( this.isObject )
		return matchesVersion( semver, version, this.path.version );

	return false;
}


module.exports = Path;
