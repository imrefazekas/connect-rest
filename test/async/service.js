var rest = require('../../lib/connect-rest');
var httphelper = require('../../lib/http-helper');

var http = require('http');
var connect = require('connect');
var assert = require('assert');
var async = require('async');
var _ = require('underscore');

var connectApp = connect();
global.server = connectApp;

connectApp.use( connect.query() );
var options = {
	discoverPath: 'discover',
	protoPath: 'proto',
	logger: 'connect-rest',
	logLevel: 'debug'
};
connectApp.use( rest.rester( options ) );

var server = http.createServer( connectApp );

server.listen( 8095 );

rest.post('/service', function( request, content, callback ){
	console.log( 'Service Received:', request );
	return callback(null, {result:'Async call is done!'});
});