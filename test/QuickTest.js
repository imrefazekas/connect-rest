var should = require("chai").should();
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

var app = connect()
	.use( bodyParser.urlencoded( { extended: true } ) )
	.use( bodyParser.json() )
	;

var options = {
	context: '/api',
	logger:{ file: 'mochaTest.log', level: 'debug' },
	apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	discoverPath: 'discover',
	protoPath: 'proto'
};
app.use( rest.rester( options ) );
app.use( restBuilder.getDispatcher( rest ) );

restBuilder.buildUpRestAPI( rest );

var port = process.env.PORT || 8080;
var server = http.createServer(app);

server.listen( port, function() {
	console.log('Running on http://localhost:8080');
});


function doCall(){
	httphelper.generalCall( 'http://localhost:8080/', 'GET', {'x-api-key':'849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'}, null, null, 'application/json', logger, function(err, result, status){
		should.not.exist(err); should.exist(result);

		should.equal(status.statusCode, 200);
	} );
}

function runTests(){
	for(var i=0;i<40;i+=1){
		doCall()
	}
}

setTimeout( runTests, 1000 );

setTimeout( function(){
	server.close( function(){ console.log('Node stopped'); } );
}, 10000 );
