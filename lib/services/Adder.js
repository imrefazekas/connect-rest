'use strict';

var _ = require('isa.js');
var Route = require('../util/Route');

function getActions( refs ){
	return refs.filter( function( ref ){
		return _.isFunction( ref );
	} );
}
function getOptions( refs ){
	return refs.length > 0 && !_.isFunction(refs[refs.length-1]) ? (refs[refs.length-1] || {}) : {};
}

exports.addPath = function(key, path, refs){
	var self = this;

	var actions = getActions( refs );
	var config = getOptions( refs );

	if( config.options ){
		self.options( this.copyPath( path, { unprotected: true } ), function( request, content, cb ){
			cb( null, 'OK', { headers: { Allow: key } } );
		} );
	}

	actions.forEach( function(action){
		self.mapping[ key ].push( new Route( self.config, path, config,
			function(request, content, callback){
				if(action.length === 3) {
					action(request, content, function(err, result, resOptions){
						callback(err, { contentType: config.contentType, result: result, resOptions: resOptions || {} } );
					});
				} else {
					var result = action(request, content);
					var err;
					callback( err, { contentType: config.contentType, result: result, resOptions: {} } );
				}
			}, _
		) );
	} );
};

exports.head = function headRest(path, ...refs){
	this.addPath("HEAD", path, refs );
};
exports.get = function getRest(path, ...refs){
	this.addPath("GET", path, refs );
};
exports.post = function postRest(path, ...refs){
	this.addPath("POST", path, refs );
};
exports.put = function putRest(path, ...refs){
	this.addPath("PUT", path, refs );
};
exports.patch = function patchRest(path, ...refs){
	this.addPath("PATCH", path, refs );
};
exports.options = function optionsRest(path, ...refs){
	this.addPath("OPTIONS", path, refs );
};
exports.del = function deleteRest(path, ...refs){
	this.addPath("DELETE", path, refs );
};
exports.assign = function headRest(methods, path, ...refs){
	var self = this;

	if( Array.isArray(methods) ){
		methods.forEach(function(method){
			method = method.toLowerCase();
			method = (method === 'delete') ? 'del' : method;
			if( !self[ method ] )
				throw new Error('Not known rest type', method);
			self[ method ](path, refs);
		});
	}
	else if( methods === '*' )
		self.assign( ['head', 'get', 'post', 'put', 'patch', 'options', 'delete'], path, refs );
	else
		throw new Error('Not correct given methods', methods);
};
