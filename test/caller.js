var httphelper = require('../lib/http-helper');

function DummyLogger(){ }
DummyLogger.prototype.info = function() { console.log( arguments ); };
DummyLogger.prototype.debug = function() { console.log( arguments ); };
DummyLogger.prototype.error = function() { console.error( arguments ); };

var logger = new DummyLogger();

// serverURL, method, headers, err, result, logger, callback
function testCall1(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/peek?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'HEAD', null, null, null, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}

function testCall2(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/books/AliceInWonderland/1?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}

function testCall3a(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/store?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'POST', null, null, {'message': 'ok'}, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}
function testCall3b(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/store/108?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'POST', null, null, {'message': 'ok'}, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}

function testCall4(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/make?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'POST', {'accept-version':'1.1'}, null, {'message': 'ok'}, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}

function testCall5(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/do?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'POST', null, null, {'message': 'ok'}, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}

function testCall6(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/twist?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'POST', null, null, {'message': 'ok'}, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}

function testCall7(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/inquire/alice/in/wonderland?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}

function testCall8a(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/set?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}
function testCall8b(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/set/abraka?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}
function testCall8c(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/set/abraka/dabra?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}

function testCall9(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/data/items?ids%5B%5D=8&ids%5B%5D=9&api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}

function testCall10a(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/Skynet/Shira/1.0/request?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}
function testCall10b(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/Skynet/Shira/request?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}
function testCall10c(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/Skynet/1.0/request?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}
function testCall10d(handler, callback){
	httphelper.generalCall( 'http://localhost:8080/api/Skynet/request?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9', 'GET', null, null, null, logger,
		function(err, result, status){ handler(err, result, status); callback( err, result ); }
	);
}

exports.testCall1 = testCall1;
exports.testCall2 = testCall2;
exports.testCall3a = testCall3a;
exports.testCall3b = testCall3b;
exports.testCall4 = testCall4;
exports.testCall5 = testCall5;
exports.testCall6 = testCall6;
exports.testCall7 = testCall7;

exports.testCall8a = testCall8a;
exports.testCall8b = testCall8b;
exports.testCall8c = testCall8c;
exports.testCall9 = testCall9;

exports.testCall10a = testCall10a;
exports.testCall10b = testCall10b;
exports.testCall10c = testCall10c;
exports.testCall10d = testCall10d;
