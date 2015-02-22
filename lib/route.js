var async = require('async');

var Path = require('./path');

function Route( bus, context, path, prototypeObject, options, action, _){
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
	this.apikeys = this.options.apikeys;
	this.paths = [];

	if( !path || !action || !_.isFunction( action ) )
		throw new Error('You need to give proper parameters.');

	if( _.isArray( path ) ){
		this.paths = _.map( path, function(element){
			return new Path( context, element, this.options, _ );
		} );
	} else{
		this.paths.push( new Path( context, path, this.options, _ ) );
	}

	this.routes = _.map( this.paths, function(path){ return path.representation(); } );
}

Route.prototype.apiKeyRequired = function( ){
	for(var i=0;i<this.paths.length;i+=1)
		if( this.paths[i].apiKeyRequired() )
			return true;
	return false;
};

Route.prototype.callProtector = function( _, req, res, pathname, callback ){
	var tasks = _.map( this.paths, function( path ){
		return function( cb ){ return path.callProtector( req, res, pathname, cb ); };
	} );
	async.series( tasks, function(err, result){
		callback( err );
	} );
};

Route.prototype.matches = function( req, pathname, version, _, semver, alterEnvironment, protectAPI){
	var found = _.find( this.paths, function(path){
		return path.matches( req, pathname, version || '*', _, semver, alterEnvironment, protectAPI);
	} );
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
