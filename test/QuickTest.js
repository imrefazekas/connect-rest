let should = require('chai').should()
let http = require('http')

let connect = require('connect')
let bodyParser = require('body-parser')

let rest = require('../lib/connect-rest')
let restBuilder = require('./restBuilder')
let Httphelper = require('../lib/HttpHelper')
let httphelper = new Httphelper()

function DummyLogger () { }
DummyLogger.prototype.info = function () { console.log( arguments ) }
DummyLogger.prototype.debug = function () { console.log( arguments ) }
DummyLogger.prototype.error = function () { console.error( arguments ) }
let logger = new DummyLogger()

let app = connect()
	.use( bodyParser.urlencoded( { extended: true } ) )
	.use( bodyParser.json() )


let options = {
	context: '/api',
	logger: { level: 'debug' },
	apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	discoverPath: 'discover',
	protoPath: 'proto'
}
app.use( rest.rester( options ) )
app.use( restBuilder.getDispatcher( rest ) )

restBuilder.buildUpRestAPI( rest )

let port = process.env.PORT || 8080
let server = http.createServer(app)

server.listen( port, function () {
	console.log('Running on http://localhost:8080')
})


function doCall () {
	httphelper.generalCall( 'http://localhost:8080/', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger, function (err, result, status) {
		should.not.exist(err)
		should.exist(result)

		should.equal(status.statusCode, 200)
	} )
}

function runTests () {
	for (let i = 0; i < 40; i += 1) {
		doCall()
	}
}

setTimeout( runTests, 1000 )

setTimeout( function () {
	server.close( function () { console.log('Node stopped') } )
}, 10000 )
