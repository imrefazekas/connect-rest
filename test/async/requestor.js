var rest = require('../../lib/connect-rest');
var httphelper = require('../../lib/http-helper');

var http = require('http');
var querystring = require("querystring");

var connect = require('connect');
var assert = require('assert');
var async = require('async');

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

server.listen( 8090 );

rest.post('/callback/?id', function( request, content, callback ){
	console.log( 'Received:', request );
	return callback(null, 'ok');
});

setTimeout( function(){
	var callbackURL = 'http://localhost:8090/callback/5';
	var result = querystring.stringify({callbackURL: callbackURL});

	var serverURL = 'http://localhost:8095/service?' + result;
	console.log('Service URL', serverURL);
	httphelper.generalCall( serverURL, 'POST', null, null, {Message:'Hello'}, 'application/json', null, function(er, response){
		if(er)
			console.error( er );
		else
			console.log('Response:', response);
	} );
}, 2000 );