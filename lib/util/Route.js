'use strict';

var _ = require('isa.js');
var async = require('async');

var Path = require('./Path');

function Route( globalConfig, path, config, action){
	var self = this;

	self.action = action;
	self.maction = function(request, content, callback){
		var time = Date.now();
		action( request, content, function(err, response){
			callback( err, response );
		} );
	};
	self.config = config || {};
	self.apikeys = self.config.apikeys;
	self.paths = [];

	if( !path || !action || !_.isFunction( action ) )
		throw new Error('You need to give proper parameters.');

	if( _.isArray( path ) ){
		self.paths = path.map( function(element){
			return new Path( globalConfig.context, element, self.config );
		} );
	} else{
		self.paths.push( new Path( globalConfig.context, path, self.config ) );
	}

	self.routes = self.paths.map( function(path){ return path.representation(); } );
}

Route.prototype.apiKeyRequired = function( ){
	for(var i=0;i<this.paths.length;i+=1)
		if( this.paths[i].apiKeyRequired() )
			return true;
	return false;
};

Route.prototype.callProtector = function( req, res, pathname, callback ){
	var tasks = this.paths.map( function( path ){
		return function( cb ){ return path.callProtector( req, res, pathname, cb ); };
	} );
	async.series( tasks, function(err, result){
		callback( err );
	} );
};

Route.prototype.matches = function( req, pathname, version, alterEnvironment, protectAPI){
	var found = this.paths.find( function(path){
		return path.matches( req, pathname, version || '*', alterEnvironment, protectAPI);
	} );
	return found;
};

Route.prototype.matchings = function( version ){
	var found = this.paths.filter(
			function( path ){ return path.matchings( version ); }
		).map(
			function(path){
				return path.path;
			}
		);

	return found;
};

module.exports = Route;
