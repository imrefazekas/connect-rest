var should = require("chai").should();

var connect = require('connect');
var http = require('http');
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
		var app = connect().use( connect.query() )
			.use( connect.urlencoded() )
			.use( connect.json() );

		var options = {
			context: '/api',
			logger:{ file: 'test.log', level: 'debug' },
			apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
			discoverPath: 'discover',
			protoPath: 'proto'
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

	describe("rest", function () {
		it('HEAD call is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/peek?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'HEAD', null, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist( err ); should.exist( result );
					should.equal(status.statusCode, 200);

					done( );
				}
			);
		});

		it('GET for "empty" service call is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/empty?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err);
					should.exist(result);

					done( );
				}
			);
		});

		it('mandatory parameter mapping is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/books/AliceInWonderland/1?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, 'application/json', logger,
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
			httphelper.generalCall( 'http://localhost:8080/api/store?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'POST', null, null, {'message': 'ok'}, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err);
					should.exist(result);

					should.not.exist( result.params.id );

					done( );
				}
			);
		});

		it('optional parameter mapping v2 is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/store/108?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'POST', null, null, {'message': 'ok'}, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err);
					should.exist(result);

					result.params.should.have.property('id', '108' );

					done( );
				}
			);
		});

		it('versioning is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/make?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'POST', {'accept-version':'1.1.0'}, null, {'message': 'ok'}, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err);
					should.exist(result);

					done( );
				}
			);
		});

		it('missing parameter mapping v1 is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/set?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					done( );
				}
			);
		});

		it('missing parameter mapping v2 is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/set/abraka/dabra?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					result.should.have.property('rid', 'abraka');
					result.should.have.property('facet', 'dabra');

					done( );
				}
			);
		});

		it('array-typed parameter mapping is ', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/data/items?ids%5B%5D=8&ids%5B%5D=9&api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);
					should.equal(status.statusCode, 201);

					result.ids.should.eql( ['8','9'] );

					done( );
				}
			);
		});

		it('complete parameter mapping is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/call/Skynet/Shira/1.0/request?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, 'application/json', logger,
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
			httphelper.generalCall( 'http://localhost:8080/api/call/Skynet/Shira/request?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, 'application/json', logger,
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
			httphelper.generalCall( 'http://localhost:8080/api/call/Skynet/request?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, 'application/json', logger,
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
			httphelper.generalCall( 'http://localhost:8080/api/eset/abraka/dabra?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					result.should.have.property('rid', 'abraka');
					result.should.have.property('facet', 'dabra');

					done( );
				}
			);
		});

		it('unprotected zone calling is', function(done){
			httphelper.generalCall( 'http://localhost:8080/api/unprotected', 'GET', null, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 200);
					should.equal(result, 'Welcome guest...');

					done( );
				}
			);
		});

		it('dispatcher is', function(done){
			httphelper.generalCall( 'http://localhost:8080/dispatcher/call?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, 'application/json', logger,
				function(err, result, status){
					should.equal(result, 'Dispatch call made:call');
					done( );
				}
			);
		});

		it('unprotected dynamic binding call is ', function(done){
			httphelper.generalCall( 'http://localhost:8080/pages/workspace', 'GET', null, null, null, 'application/json', logger,
				function(err, result, status){
					should.not.exist(err); should.exist(result);

					should.equal(status.statusCode, 200);
					should.equal(result, 'ok');

					done( );
				}
			);
		});
	});

	after(function(done){
		server.close( function(){ console.log('Node stopped'); done(); } );
	});
});
