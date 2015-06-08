var chai = require('chai'),
	should = chai.should(),
	expect = chai.expect;
var http = require('http');

var connect = require('connect');
var bodyParser = require('body-parser');

var rest = require('../lib/connect-rest');
var restBuilder = require('./restBuilder');
var httphelper = require('../lib/http-helper');

function DummyLogger(){ }
DummyLogger.prototype.info = function() { console.log( arguments ); };
DummyLogger.prototype.debug = function() { console.log( arguments ); };
DummyLogger.prototype.error = function() { console.error( arguments ); };
var logger = new DummyLogger();

describe("connect-rest", function () {

	var server;

	before(function(done){
		var app = connect()
			.use( bodyParser.urlencoded( { extended: true } ) )
			.use( bodyParser.json() )
			;

		var options = {
			context: '/api',
			logger:{ file: 'mochaTest.log', level: 'debug' },
			apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
			discoverPath: 'discover',
			protoPath: 'proto',
			domain: true,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
				'Access-Control-Allow-Headers': 'api-key, x-api-key, x-warper-jwt, Accept, Origin, Content-Type',
				'Access-Control-Expose-Headers': 'x-warper-jwt'
			}
		};
		app.use( rest.rester( options ) );
		app.use( restBuilder.getDispatcher( rest ) );

		restBuilder.buildUpRestAPI( rest );

		var port = process.env.PORT || 8080;
		server = http.createServer(app);

		server.listen( port, function() {
			console.log('Running on http://localhost:8080');

			done();
		});
	});
	// function(serverURL, method, headers, err, result, mimetype, logger, callback){
	describe("rest", function () {
		it('HEAD call is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/peek', 'HEAD', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist( err ); should.exist( result );
					should.equal(status.statusCode, 200);
					console.log( '>>>>>', status );
					done( );
				}
			);
		});

		it('GET for "empty" service call is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/empty', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err);
					should.exist(result);

					done( );
				}
			);
		});

		it('GET for Proxied "empty" service call is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/proxyEmpty', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err);
					should.exist(result);

					console.log( result );

					done( );
				}
			);
		});

		it('OPTIONS call', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/books/AliceInWonderland/1', 'OPTIONS', { }, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err);

					done( );
				}
			);
		});

		it('mandatory parameter mapping is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/books/AliceInWonderland/1', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err);
					should.exist(result);

					result.should.have.property('title', 'AliceInWonderland');
					result.should.have.property('chapter', '1');

					done( );
				}
			);
		});

		it('optional parameter mapping v1 is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/store', 'POST', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, {'message': 'ok'}, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err);
					should.exist(result);

					should.not.exist( result.params.id );

					done( );
				}
			);
		});

		it('optional parameter mapping v2 is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/store/108', 'POST', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, {'message': 'ok'}, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err);
					should.exist(result);

					result.params.should.have.property('id', '108' );

					done( );
				}
			);
		});

		it('versioning is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/make', 'POST', {'accept-version':'1.1.0'}, null, {'message': 'ok'}, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err);
					should.exist(result);

					done( );
				}
			);
		});

		it('missing parameter mapping v1 is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/set', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					done( );
				}
			);
		});

		it('missing parameter mapping v2 is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/set/abraka/dabra', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					result.should.have.property('rid', 'abraka');
					result.should.have.property('facet', 'dabra');

					done( );
				}
			);
		});

		it('array-typed parameter mapping is ', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/data/items?ids%5B%5D=8&ids%5B%5D=9', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);
					should.equal(status.statusCode, 201);

					console.log( '>>>>', result );
					result['ids[]'].should.eql( ['8','9'] );

					done( );
				}
			);
		});

		it('complete parameter mapping is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/call/Skynet/Shira/1.0/request', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 201);

					result.should.have.property('system', 'Skynet');
					result.should.have.property('entity', 'Shira');
					result.should.have.property('version', '1.0');
					result.should.have.property('subject', 'request');

					done( );
				}
			);
		});

		it('versionless paremeter mapping is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/call/Skynet/Shira/request', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 201);

					result.should.have.property('system', 'Skynet');
					result.should.have.property('subject', 'request');

					done( );
				}
			);
		});

		it('lazy calling is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/call/Skynet/request', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 201);

					result.should.have.property('system', 'Skynet');
					result.should.have.property('subject', 'request');

					done( );
				}
			);
		});

		it('embedded parameter mapping is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/eset/abraka/dabra', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					result.should.have.property('rid', 'abraka');
					result.should.have.property('facet', 'dabra');

					done( );
				}
			);
		});

		it('unprotected zone calling is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/unprotected', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 200);
					should.equal(result, 'Welcome guest...');

					done( );
				}
			);
		});

		it('dispatcher is', function(done){
			httphelper.generalCall( 'http://localhost:8080/dispatcher/call', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.equal(result, 'Dispatch call made:call');
					done( );
				}
			);
		});

		it('unprotected dynamic binding call is ', function(done){
			httphelper.generalCall( 'http://localhost:8080/pages/workspace', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 200);
					should.equal(result, 'ok');

					done( );
				}
			);
		});

		it('function result type is ', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/handlers/function', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 200);
					should.equal(result, 'ok');

					done( );
				}
			);
		});

		it('buffer result type is ', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/handlers/buffer', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 200);
					should.equal(result, 'ok');

					done( );
				}
			);
		});

		it('stream result type is ', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/handlers/stream/answer', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 201);
					should.equal(result, 'ok');

					done( );
				}
			);
		});

		it('failing stream result type is ', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/handlers/stream/answerFail', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.equal(status.statusCode, 500);

					done( );
				}
			);
		});

		it('Rang parameter mapping is ', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/convert/huf', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 200);
					should.equal(result, 'ok');

					done( );
				}
			);
		});

		it('Over range parameter mapping is ', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/convert/gbp', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 404);

					done( );
				}
			);
		});

		it('Regular path mapping is ', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/tAbba', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 200);
					should.equal(result, 'regular');

					done( );
				}
			);
		});

		it('Index.html short path is ', function(done){
			httphelper.generalCall( 'http://localhost:8080/', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 200);

					done( );
				}
			);
		});

	});

	after(function(done){
		server.close( function(){ console.log('Node stopped'); done(); } );
	});
});
