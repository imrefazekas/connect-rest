var Assigner = require('assign.js')
var assigner = (new Assigner()).recursive(true)
var fs = require('fs')
var path = require('path')

function getFiles (srcpath, extension) {
	return fs.readdirSync(srcpath).filter(function (file) {
		return file.endsWith(extension)
	})
}

module.exports = {
	getExtensions: function ( path ) {
		return getFiles( path, '.js' )
	},
	extend: function ( protoType, extPath ) {
		var extensions = this.getExtensions( extPath )
		extensions.forEach( function ( extension ) {
			var newServices = require( path.join( extPath, extension ) )
			protoType = assigner.assign( protoType, newServices )
		} )
		return protoType
	}
}
