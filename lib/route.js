var Path = require('./path');

function Route(path, prototypeObject, options, action, _){
	this.action = action;
	this.prototypeObject = prototypeObject;
	this.options = options || {};
	this.paths = [];

	if( !path || !action || !_.isFunction( action ) )
		throw new Error('You need to give proper parameters.');

	if( _.isArray( path ) ){
		this.paths = _.map( path, function(element){ return new Path( element, _ ); } );
	} else{
		this.paths.push( new Path( path, _ ) );
	}
}

Route.prototype.matches = function( req, pathname, context, version, _, semver, alterEnvironment){
	if( !_( pathname ).startsWith( context ) )
		return false;

	var rPathname = pathname.substring( context.length );

	var found = _.find( this.paths, function(path){ return path.matches( req, rPathname, version || '*', _, semver, alterEnvironment); } );

	return found;
};

Route.prototype.matchings = function( version, _, semver ){
	var found = _.map(
		_.filter( this.paths, function( path ){ return path.matchings( version, _, semver); } ), function(path){
			return path.path;
		}
	);

	return found;
};

module.exports = Route;
