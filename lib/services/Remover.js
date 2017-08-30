let _ = require('isa.js')
let semver = require('semver')

exports.removePath = function (key, path, version) {
	if ( !this.mapping[ key ] ) return

	let newRoutes = []
	this.mapping[ key ].forEach( function (route) {
		if ( !route.matches( null, path, version || '*', _, semver, false, false ) )
			newRoutes.push( route )
	} )
	this.mapping[ key ] = newRoutes
}

exports.unhead = function (path, version) {
	this.removePath( 'HEAD', path, version )
}
exports.unget = function (path, version) {
	this.removePath( 'GET', path, version )
}
exports.unpost = function (path, version) {
	this.removePath( 'POST', path, version )
}
exports.unput = function (path, version) {
	this.removePath( 'PUT', path, version )
}
exports.unpatch = function (path, version) {
	this.removePath( 'PATCH', path, version )
}
exports.unoptions = function (path, version) {
	this.removePath( 'OPTIONS', path, version )
}
exports.undel = function (path, version) {
	this.removePath( 'DELETE', path, version )
}
exports.unassign = function headRest (methods, path, version) {
	let self = this
	if ( Array.isArray(methods) ) {
		methods.forEach(function (method) {
			method = method.toLowerCase()
			method = (method === 'delete') ? 'del' : method
			if ( !self[ 'un' + method ] )
				throw new Error('Not known rest type', method)
			self[ 'un' + method ](path, version)
		})
	}
	else if ( methods === '*' )
		this.unassign( ['head', 'get', 'post', 'put', 'patch', 'options', 'delete'], path, version )
	else
		throw new Error('Not correct given methods', methods)
}
