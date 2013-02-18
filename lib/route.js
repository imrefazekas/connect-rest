var Path = require('./path');

function Route(path, action, _){
  	this.action = action;
  	this.paths = [];

  	if( !path || !action || !_.isFunction( action ) )
  		throw new Error('You need to give proper parameters.');

  	if( _.isArray( path ) ){
      this.paths = _.map( path, function(element){ return new Path( element, _ ); } );
  	} else{
  		this.paths.push( new Path( path, _ ) );
  	}
}

Route.prototype.matches = function( req, uri, context, version, _, semver){
	if( !_( uri ).startsWith( context ) )
		return false;

	var rUri = uri.substring( context.length );
	var found = _.find( this.paths, function(path){ return path.matches( req, rUri, version || '*', _, semver); } );

	return found;
}

module.exports = Route;
