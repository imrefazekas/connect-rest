let rest = require('../../lib/connect-rest')
let Httphelper = require('../../lib/HttpHelper')
let httphelper = new Httphelper()

let http = require('http')
let querystring = require('querystring')

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

server.listen( 8090 )

rest.post('/callback/?id', function ( request, content, callback ) {
	console.log( 'Received:', request )
	return callback(null, 'ok')
})

setTimeout( function () {
	let callbackURL = 'http://localhost:8090/callback/5'
	let result = querystring.stringify({callbackURL: callbackURL})

	let serverURL = 'http://localhost:8095/service?' + result
	console.log('Service URL', serverURL)
	httphelper.generalCall( serverURL, 'POST', null, null, {Message: 'Hello'}, 'application/json', null, function (er, response) {
		if (er)
			console.error( er )
		else
			console.log('Response:', response)
	} )
}, 2000 )
