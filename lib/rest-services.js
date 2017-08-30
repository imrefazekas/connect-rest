let url = require('url')

let Rest = require('./Rest')
let Dispatcher = require('./util/Dispatcher')

let Httphelper = require('./util/HttpHelper')

exports.create = function ( options ) {
	return new Rest( options )
}

exports.httphelper = function ( options, defaultOPTS ) {
	return new Httphelper( options, defaultOPTS )
}

function redirect ( url ) {
	let status = 302

	if (arguments.length === 2) {
		status = url
		url = arguments[1]
	}

	this.statusCode = status
	this.setHeader('Location', url)
	this.setHeader('Content-Length', '0')
	this.end()
}

exports.dispatcher = function ( method, path, handler, addRedirect ) {
	return Dispatcher.dispatch( method, path, url, !addRedirect ? handler : function (req, res, next) {
		if ( !res.redirect )
			res.redirect = redirect
		handler(req, res, next)
	} )
}
