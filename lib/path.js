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
  	this.isObject = _.isObject( path );
}

Path.prototype.matches = function( uri, _ ){
	return true;
}

module.exports = Path;
