/*
server.put('/hello', send);
server.put('/hello', [send, send, send]);
server.get('/hello/:name', send);
server.get(/^\/([a-zA-Z0-9_\.~-]+)\/(.*)/, function(req, res, next) {
server.get({path: PATH, version: '1.1.3'}, sendV1);
*/
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


Path.prototype.matches = function( uri, version, _, semver ){
	console.log( uri + ' ' + version + ' ' );

	if( this.isRegex ){
		return this.path.test( uri );
	}
	else if( this.isString ){
		return this.path == '*' || (this.path.toUpperCase() == uri.toUpperCase());
	}
	else if( this.isObject ){
		return  (this.isSubReged ? this.path.path.test( uri ) : this.path.path == '*' || (this.path.path.toUpperCase()==uri.toUpperCase()) ) 
		&& 
		matchesVersion( semver, version, this.path.version );
	}
	return false;
}

module.exports = Path;
