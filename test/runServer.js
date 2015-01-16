var http = require('http');

var connect = require('connect'),
	cookieParser = require('cookie-parser'),
	cookieSession = require('cookie-session'),
	compression = require('compression'),
	timeout = require('connect-timeout'),
	serveStatic = require('serve-static'),
	bodyParser = require('body-parser');

var rest = require('../lib/connect-rest');
var restBuilder = require('./restBuilder');
var httphelper = require('../lib/http-helper');

var app = connect()
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
	;

var options = {
	context: '/api',
	logger:{ file: 'mochaTest.log', level: 'debug' },
	apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	discoverPath: 'discover',
	protoPath: 'proto',
	loose: { after: 1000 },
	domain: true
};
app.use( rest.rester( options ) );
app.use( restBuilder.getDispatcher( rest ) );

restBuilder.buildUpRestAPI( rest );

var port = process.env.PORT || 8080;
var server = http.createServer(app);

server.listen( port, function() {
	console.log('Running on http://localhost:8080');
});
