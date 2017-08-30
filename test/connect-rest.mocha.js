const assert = require('assert')

let chai = require('chai'),
	should = chai.should()
let http = require('http')

let connect = require('connect')
let bodyParser = require('body-parser')

let Rest = require('../lib/rest-services')
let rester
let restBuilder = require('./restBuilder')

function DummyLogger () { }
DummyLogger.prototype.log = function () { console.log( arguments ) }
DummyLogger.prototype.info = function () { console.log( arguments ) }
DummyLogger.prototype.debug = function () { console.log( arguments ) }
DummyLogger.prototype.error = function () { console.error( arguments ) }
let logger = new DummyLogger()

let Httphelper = require('../lib/util/HttpHelper')
let httpHelper = new Httphelper( {
	logger: logger
}, {
	headers: {'x-api-key': '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}
} )

describe('connect-rest', function () {

	let server

	before(function (done) {
		let app = connect()
			.use( bodyParser.urlencoded( { extended: true } ) )
			.use( bodyParser.json() )

		let options = {
			context: '/api',
			logger: { level: 'trace' },
			apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
			discover: { path: '/discover', secure: false },
			proto: { path: '/proto', secure: false },
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
				'Access-Control-Allow-Headers': 'api-key, x-api-key, x-warper-jwt, Accept, Origin, Content-Type',
				'Access-Control-Expose-Headers': 'x-warper-jwt'
			}
		}
		rester = Rest.create( options )
		app.use( rester.processRequest() )
		app.use( restBuilder.getDispatcher( Rest ) )

		restBuilder.buildUpRestAPI( rester )

		let port = process.env.PORT || 8080
		server = http.createServer(app)

		server.listen( port, function () {
			console.log('Running on http://localhost:8080')

			done()
		})
	})

	describe('rest', function () {
		it('HEAD call is', async function () {
			try {
				let res = await httpHelper.head( 'http://localhost:8080/api/peek' )
				should.equal(res.status.statusCode, 200)
			} catch (err) { assert.fail( err ) }
		})
		it('GET for "empty" service call is', async function () {
			try {
				let res = await httpHelper.get( 'http://localhost:8080/api/empty' )
				should.exist( res.result)
				should.equal(res.status.statusCode, 200)
			} catch (err) { assert.fail( err ) }
		})
		it('GET for Proxied "empty" service call is', async function () {
			try {
				let res = await httpHelper.get( 'http://localhost:8080/api/proxyEmpty' )
				should.exist(res.result)
				should.equal(res.status.statusCode, 200)
			} catch (err) { assert.fail( err ) }
		})
		it('Service is throwing an error', async function () {
			try {
				let res = await httpHelper.get( 'http://localhost:8080/api/irritate' )
				should.exist(res.result)
				should.equal(res.status.statusCode, 500)
			} catch (err) { assert.fail( err ) }
		})
		it('OPTIONS call', async function () {
			try {
				let res = await httpHelper.options( 'http://localhost:8080/api/books/AliceInWonderland/1' )
				should.exist(res.result)
				should.equal(res.status.statusCode, 200)
			} catch (err) { assert.fail( err ) }
		})
		it('mandatory parameter mapping is', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/books/AliceInWonderland/1' )
				should.equal(result.status.statusCode, 200)
				should.exist(result.result)
				result.result.should.have.property('title', 'AliceInWonderland')
				result.result.should.have.property('chapter', '1')
			} catch (err) { assert.fail( err ) }
		})
		it('optional parameter mapping v1 is', async function () {
			try {
				let result = await httpHelper.post( 'http://localhost:8080/api/store', null, {'message': 'ok'} )
				should.exist(result.result)
				should.equal(result.status.statusCode, 200)
				should.not.exist( result.result.params.id )
			} catch (err) { assert.fail( err ) }
		})
		it('optional parameter mapping v2 is', async function () {
			try {
				let result = await httpHelper.post( 'http://localhost:8080/api/store/108', null, {'message': 'ok'} )
				should.exist(result.result)
				should.equal(result.status.statusCode, 200)
				result.result.params.should.have.property('id', '108' )
			} catch (err) { assert.fail( err ) }
		})
		it('versioning is', async function () {
			try {
				let result = await httpHelper.headers( {'accept-version': '1.1.0'} ).post( 'http://localhost:8080/api/make', null, {'message': 'ok'} )
				should.equal(result.status.statusCode, 200)
				should.exist(result.result)
			} catch (err) { assert.fail( err ) }
		})
		it('missing parameter mapping v1 is', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/set' )
				should.equal(result.status.statusCode, 200)
				should.exist(result.result)
			} catch (err) { assert.fail( err ) }
		})
		it('missing parameter mapping v2 is', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/set/abraka/dabra' )
				should.equal(result.status.statusCode, 200)
				should.exist(result.result)
				result.result.should.have.property('rid', 'abraka')
				result.result.should.have.property('facet', 'dabra')
			} catch (err) { assert.fail( err ) }
		})
		it('array-typed parameter mapping is ', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/data/items?ids%5B%5D=8&ids%5B%5D=9' )
				console.log( '>>>>', result )
				should.exist(result.result)
				should.equal(result.status.statusCode, 201)
				result.result['ids[]'].should.eql( ['8', '9'] )
			} catch (err) { assert.fail( err ) }
		})
		it('complete parameter mapping is', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/call/Skynet/Shira/1.0/request' )
				should.exist(result.result)
				should.equal(result.status.statusCode, 201)
				result.result.should.have.property('system', 'Skynet')
				result.result.should.have.property('entity', 'Shira')
				result.result.should.have.property('version', '1.0')
				result.result.should.have.property('subject', 'request')
			} catch (err) { assert.fail( err ) }
		})
		it('prototype services are', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/proto/GET/1.0.0/api/books/AliceInWonderland/1' )
				should.exist(result.result)
				result.result.should.have.property('answer', 'parameters')
			} catch (err) { assert.fail( err ) }
		})
		it('discover service are', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/discover/*' )
				should.exist(result.result)
				result.result.should.have.property('GET')
				result.result.should.have.property('POST')
				result.result.should.have.property('OPTIONS')
			} catch (err) { assert.fail( err ) }
		})
		it('versionless paremeter mapping is', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/call/Skynet/Shira/request' )
				should.exist(result.result)

				should.equal(result.status.statusCode, 201)

				result.result.should.have.property('system', 'Skynet')
				result.result.should.have.property('subject', 'request')
			} catch (err) { assert.fail( err ) }
		})
		it('lazy calling is', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/call/Skynet/request' )
				should.exist(result.result)

				should.equal(result.status.statusCode, 201)

				result.result.should.have.property('system', 'Skynet')
				result.result.should.have.property('subject', 'request')
			} catch (err) { assert.fail( err ) }
		})
		it('embedded parameter mapping is', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/eset/abraka/dabra' )
				should.exist(result.result)
				result.result.should.have.property('rid', 'abraka')
				result.result.should.have.property('facet', 'dabra')
			} catch (err) { assert.fail( err ) }
		})
		it('unprotected zone calling is', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/unprotected' )
				should.exist(result.result)
				should.equal(result.status.statusCode, 200)
				should.equal(result.result, 'Welcome guest...')
			} catch (err) { assert.fail( err ) }
		})
		it('dispatcher is', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/dispatcher/call' )
				should.equal(result.result, 'Dispatch call made:call')
			} catch (err) { assert.fail( err ) }
		})
		it('unprotected dynamic binding call is ', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/pages/workspace' )
				should.exist(result.result)
				should.equal(result.status.statusCode, 200)
				should.equal(result.result, 'ok')
			} catch (err) { assert.fail( err ) }
		})
		it('function result type is ', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/handlers/function' )
				should.exist(result.result)
				should.equal(result.status.statusCode, 200)
				should.equal(result.result, 'ok')
			} catch (err) { assert.fail( err ) }
		})
		it('buffer result type is ', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/handlers/buffer' )
				should.exist(result.result)
				should.equal(result.status.statusCode, 200)
				should.equal(result.result, 'ok')
			} catch (err) { assert.fail( err ) }
		})
		it('stream result type is ', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/handlers/stream/answer' )
				should.exist(result.result)

				should.equal(result.status.statusCode, 201)
				should.equal(result.result, 'ok')
			} catch (err) { assert.fail( err ) }
		})
		it('failing stream result type is ', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/handlers/stream/answerFail' )
				should.equal(result.status.statusCode, 500)
			} catch (err) { assert.fail( err ) }
		})
		it('Rang parameter mapping is ', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/convert/huf' )
				should.exist(result.result)
				should.equal(result.status.statusCode, 200)
				should.equal(result.result, 'ok')
			} catch (err) { assert.fail( err ) }
		})
		it('Over range parameter mapping is ', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/convert/gbp' )
				should.exist(result.result)
				should.equal(result.status.statusCode, 404)
			} catch (err) { assert.fail( err ) }
		})
		it('Regular path mapping is ', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/api/tAbba' )
				should.exist(result.result)
				should.equal(result.status.statusCode, 200)
				should.equal(result.result, 'regular')
			} catch (err) { assert.fail( err ) }
		})
		it('Index.html short path is ', async function () {
			try {
				let result = await httpHelper.get( 'http://localhost:8080/' )
				should.exist(result.result)
				should.equal(result.status.statusCode, 200)
			} catch (err) { assert.fail( err ) }
		})
	})

	after(function (done) {
		server.close( function () {
			console.log('Node stopped')
			done()
		} )
	})
})
