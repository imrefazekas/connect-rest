var httphelper = require('../../lib/http-helper');
var should = require('should');

function DummyLogger(){ }
DummyLogger.prototype.info = function() { console.log( arguments ); };
DummyLogger.prototype.debug = function() { console.log( arguments ); };
DummyLogger.prototype.error = function() { console.error( arguments ); };

var logger = new DummyLogger();


exports.group = {

	testHead: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/peek?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'HEAD', null, null, null, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);
				should.strictEqual(status.statusCode, 200);

				test.done( );
			}
		);
	},


	testEmpty: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/empty?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);

				test.done( );
			}
		);
	},

	testMandatoryParameterMapping: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/books/AliceInWonderland/1?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);

				result.should.have.property('title', 'AliceInWonderland');
				result.should.have.property('chapter', '1');

				test.done( );
			}
		);
	},

	testOptionalParameterMapping1: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/store?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'POST', null, null, {'message': 'ok'}, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);

				should.not.exist( result.params.id );

				test.done( );
			}
		);
	},

	testOptionalParameterMapping2: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/store/108?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'POST', null, null, {'message': 'ok'}, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);

				result.params.should.have.property('id', '108' );

				test.done( );
			}
		);
	},

	testVersioning: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/make?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'POST', {'accept-version':'1.1.0'}, null, {'message': 'ok'}, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);

				test.done( );
			}
		);
	},

	testOptionalParamers1: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/set?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);

				test.done( );
			}
		);
	},

	testOptionalParamers2: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/set/abraka/dabra?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);

				result.should.have.property('rid', 'abraka');
				result.should.have.property('facet', 'dabra');

				test.done( );
			}
		);
	},

	testParameterPassing: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/data/items?ids%5B%5D=8&ids%5B%5D=9&api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);
				should.strictEqual(status.statusCode, 201);

				result.ids.should.eql( ['8','9'] );

				test.done( );
			}
		);
	},

	testFullParamMapping: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/call/Skynet/Shira/1.0/request?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);

				should.strictEqual(status.statusCode, 201);

				result.should.have.property('system', 'Skynet');
				result.should.have.property('entity', 'Shira');
				result.should.have.property('version', '1.0');
				result.should.have.property('subject', 'request');

				test.done( );
			}
		);
	},

	testEntityAndVersionlessParamMapping: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/call/Skynet/request?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);

				should.strictEqual(status.statusCode, 201);

				result.should.have.property('system', 'Skynet');
				result.should.have.property('subject', 'request');

				test.done( );
			}
		);
	},

	testEmbeddedParamMapping: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/eset/abraka/dabra?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);

				result.should.have.property('rid', 'abraka');
				result.should.have.property('facet', 'dabra');

				test.done( );
			}
		);
	},

	testUnprotectedZoneCalling: function(test){
		httphelper.generalCall( 'http://localhost:8080/api/unprotected', 'GET', null, null, null, logger,
			function(err, result, status){
				should.not.exist(err); should.exist(result);

				should.strictEqual(status.statusCode, 200);
				should.strictEqual(result, 'Welcome guest...');

				test.done( );
			}
		);
	},

	testDispatcher: function(test){
		httphelper.generalCall( 'http://localhost:8080/dispatcher/call?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
			function(err, result, status){
				should.strictEqual(result, 'Dispatch call made:call');
				test.done( );
			}
		);
	}

};
