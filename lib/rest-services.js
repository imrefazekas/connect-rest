'use strict';

var url = require('url');

var ES7Fixer = require('./ES7Fixer');

var Rest = require('./Rest');
var Dispatcher = require('./util/Dispatcher');

var httphelper = require('./util/HTTP-Helper');

exports.create = function( options ){
	return new Rest( options );
};

exports.httphelper = function(){
	return httphelper;
};

function redirect( url ){
	var status = 302;

	if (arguments.length === 2) {
		status = url;
		url = arguments[1];
	}

	this.statusCode = status;
	this.setHeader('Location', url);
	this.setHeader('Content-Length', '0');
	this.end();
}

exports.dispatcher = function( method, path, handler, addRedirect ){
	return Dispatcher.dispatch( method, path, url, !addRedirect? handler : function(req, res, next){
		if( !res.redirect )
			res.redirect = redirect;
		handler(req, res, next);
	} );
};
