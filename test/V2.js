let http = require('http')
let connect = require('connect')
let bodyParser = require('body-parser')

let Rest = require('../lib/rest-services')
let Httphelper = require('../lib/util/HttpHelper')
let httphelper = new Httphelper()
let restBuilder = require('./restBuilder')

let chai = require('chai'),
	should = chai.should()

function DummyLogger () { }
DummyLogger.prototype.info = function () { console.log( arguments ) }
DummyLogger.prototype.debug = function () { console.log( arguments ) }
DummyLogger.prototype.error = function () { console.error( arguments ) }
let logger = new DummyLogger()

let options = {
	context: '/api',
	logger: { level: 'debug' },
	apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	discoverPath: 'discover',
	protoPath: 'proto',
	headers: {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
		'Access-Control-Allow-Headers': 'api-key, x-api-key, x-warper-jwt, Accept, Origin, Content-Type',
		'Access-Control-Expose-Headers': 'x-warper-jwt'
	}
}
let rester = Rest.create( options )

rester.get('/empty', function ( request ) {
	console.log( 'Received:' + request.format() )
	return 'Helloka!'
})

let app = connect()
	.use( bodyParser.urlencoded( { extended: true } ) )
	.use( bodyParser.json() )


app.use( rester.processRequest() )
app.use( restBuilder.getDispatcher( Rest ) )

restBuilder.buildUpRestAPI( rester )

let port = process.env.PORT || 8080
let server = http.createServer(app)

server.listen( port, function () {
	console.log('Running on http://localhost:8080')

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/peek', 'HEAD', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist( err )
				should.exist( result )
				should.equal(status.statusCode, 200)
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/empty', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/proxyEmpty', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/books/AliceInWonderland/1', 'OPTIONS', { }, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/books/AliceInWonderland/1', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				result.should.have.property('title', 'AliceInWonderland')
				result.should.have.property('chapter', '1')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/store', 'POST', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, {'message': 'ok'}, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.not.exist( result.params.id )
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/store/108', 'POST', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, {'message': 'ok'}, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				result.params.should.have.property('id', '108' )
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/make', 'POST', {'accept-version': '1.1.0'}, null, {'message': 'ok'}, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/set', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/set/abraka/dabra', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				result.should.have.property('rid', 'abraka')
				result.should.have.property('facet', 'dabra')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/data/items?ids%5B%5D=8&ids%5B%5D=9', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)
				should.equal(status.statusCode, 201)

				console.log( '>>>>', result )
				result['ids[]'].should.eql( ['8', '9'] )
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/call/Skynet/Shira/1.0/request', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.equal(status.statusCode, 201)

				result.should.have.property('system', 'Skynet')
				result.should.have.property('entity', 'Shira')
				result.should.have.property('version', '1.0')
				result.should.have.property('subject', 'request')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/call/Skynet/Shira/request', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.equal(status.statusCode, 201)

				result.should.have.property('system', 'Skynet')
				result.should.have.property('subject', 'request')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/call/Skynet/request', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.equal(status.statusCode, 201)

				result.should.have.property('system', 'Skynet')
				result.should.have.property('subject', 'request')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/eset/abraka/dabra', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				result.should.have.property('rid', 'abraka')
				result.should.have.property('facet', 'dabra')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/unprotected', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.equal(status.statusCode, 200)
				should.equal(result, 'Welcome guest...')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/dispatcher/call', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.equal(result, 'Dispatch call made:call')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/pages/workspace', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.equal(status.statusCode, 200)
				should.equal(result, 'ok')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/handlers/function', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.equal(status.statusCode, 200)
				should.equal(result, 'ok')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/handlers/buffer', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.equal(status.statusCode, 200)
				should.equal(result, 'ok')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/handlers/stream/answer', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.equal(status.statusCode, 201)
				should.equal(result, 'ok')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/handlers/stream/answerFail', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.equal(status.statusCode, 500)
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/convert/huf', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.equal(status.statusCode, 200)
				should.equal(result, 'ok')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/convert/gbp', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.equal(status.statusCode, 404)
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/api/tAbba', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.equal(status.statusCode, 200)
				should.equal(result, 'regular')
			}
		)
	}, 500)

	setTimeout(function () {
		httphelper.generalCall( 'http://localhost:8080/', 'GET', {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
			function (err, result, status) {
				console.log( err, result, status )
				should.not.exist(err)
				should.exist(result)

				should.equal(status.statusCode, 200)
			}
		)
	}, 500)

} )
