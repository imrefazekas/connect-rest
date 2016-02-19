let rest = require('../../lib/connect-rest')

let http = require('http')
let connect = require('connect')

let connectApp = connect()
global.server = connectApp

connectApp.use( connect.query() )
let options = {
	discoverPath: 'discover',
	protoPath: 'proto',
	logger: 'connect-rest',
	logLevel: 'debug'
}
connectApp.use( rest.rester( options ) )

let server = http.createServer( connectApp )

server.listen( 8095 )

rest.post('/service', function ( request, content, callback ) {
	console.log( 'Service Received:', request )
	return callback(null, {result: 'Async call is done!'})
})
