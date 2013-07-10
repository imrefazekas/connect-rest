var Path = require('./path');

function Route( bus, path, prototypeObject, options, action, _){
	this.bus = bus;

	var self = this;

	this.action = action;
	this.maction = function(request, content, callback){
		var time = Date.now();
		action( request, content, function(err, response){
			self.bus.reportExecution( request.headers.originalUrl, self.routes, (Date.now()-time) );
			callback( err, response );
		} );
	};
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

	this.routes = _.map( this.paths, function(path){ return path.representation(); } );
}

Route.prototype.matches = function( req, pathname, context, version, _, semver, alterEnvironment, protectAPI){
	if( !_( pathname ).startsWith( context ) )
		return false;

	var rPathname = pathname.substring( context.length );

	var found = _.find( this.paths, function(path){ return path.matches( req, rPathname, version || '*', _, semver, alterEnvironment, protectAPI); } );

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
