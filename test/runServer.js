let http = require('http')

let connect = require('connect'),
	cookieParser = require('cookie-parser'),
	cookieSession = require('cookie-session'),
	compression = require('compression'),
	timeout = require('connect-timeout'),
	serveStatic = require('serve-static'),
	bodyParser = require('body-parser')

let rest = require('../lib/connect-rest')
let restBuilder = require('./restBuilder')

let app = connect()
	.use( compression() )
	.use( timeout( 2000 ) )
	.use( cookieParser( 'secretPass' ) )
	.use( cookieSession( {
		name: 'demo.sid',
		secret: 'secretPass',
		cookie: { httpOnly: true }
	} ) )
	.use( bodyParser.urlencoded( { extended: true } ) )
	.use( bodyParser.json() )
	.use( serveStatic( './web') )

let options = {
	context: '/api',
	logger: { level: 'debug' },
	apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	discoverPath: 'discover',
	protoPath: 'proto',
	loose: { after: 1000 },
	domain: true
}
app.use( rest.rester( options ) )
app.use( restBuilder.getDispatcher( rest ) )

restBuilder.buildUpRestAPI( rest )

let port = process.env.PORT || 8080
let server = http.createServer(app)

server.listen( port, function () {
	console.log('Running on http://localhost:8080')
})
