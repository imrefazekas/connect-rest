let Route = require('../util/Route')

exports.addPath = function (key, path, action, config) {
	let self = this

	config = config || {}

	if ( config.options ) {
		self.options( this.copyPath( path, { unprotected: true } ), async function ( request, content ) {
			return [ 'OK', { headers: { Allow: key } } ]
		} )
	}

	self.mapping[ key ].push( new Route( self.config, path, config,
		async function (request, content) {
			let result = await action(request, content)
			let complex = result && result.result && result.options
			return { contentType: config.contentType, result: complex ? result.result : result, resOptions: complex ? result.options : {} }
		}
	) )
}

exports.head = function headRest (path, action, option) {
	this.addPath('HEAD', path, action, option )
}
exports.get = function getRest (path, action, option) {
	this.addPath('GET', path, action, option )
}
exports.post = function postRest (path, action, option) {
	this.addPath('POST', path, action, option )
}
exports.put = function putRest (path, action, option) {
	this.addPath('PUT', path, action, option )
}
exports.patch = function patchRest (path, action, option) {
	this.addPath('PATCH', path, action, option )
}
exports.options = function optionsRest (path, action, option) {
	this.addPath('OPTIONS', path, action, option )
}
exports.del = function deleteRest (path, action, option) {
	this.addPath('DELETE', path, action, option )
}
exports.assign = function headRest (methods, path, action, option) {
	let self = this

	if ( Array.isArray(methods) ) {
		methods.forEach(function (method) {
			method = method.toLowerCase()
			method = (method === 'delete') ? 'del' : method
			if ( !self[ method ] )
				throw new Error('Not known rest type', method)
			self[ method ](path, action, option)
		})
	}
	else if ( methods === '*' )
		self.assign( ['head', 'get', 'post', 'put', 'patch', 'options', 'delete'], path, action, option)
	else
		throw new Error('Not correct given methods', methods)
}
