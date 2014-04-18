var rest = require('../lib/connect-rest');

var http = require('http');
var connect = require('connect');
var assert = require('assert');
var async = require('async');
var _ = require('underscore');

var restBuilder = require('./restBuilder');
var caller = require('./nodeunit/caller');

var createDomain = require('domain').create;

var serverDomain = createDomain();
serverDomain.run(function() {
	var connectApp = connect();
	global.server = connectApp;

	connectApp.use( function(req, res, next){
		serverDomain.add(req);
		serverDomain.add(res);
		serverDomain.on('error', function(er) {
			console.error('Error', er, req.url);
			try {
				res.writeHead(500);
				res.end('Error occurred, sorry.');
				res.on('close', function() {
					serverDomain.dispose();
				});
			} catch (err) {
				console.error('Error sending 500', err, req.url);
				serverDomain.dispose();
			}
		});
		next();
	} );

	connectApp.use( connect.static('./test/www') );

	connectApp.use( connect.limit('10.0mb') );
	connectApp.use( connect.bodyParser({ uploadDir: './test/data' }) );
	connectApp.use( connect.query() );

	var SERVICE_METHOD_PATTERN = /^[a-zA-Z]([a-zA-Z]|\d|_)*$/g;

	var restDomain = createDomain();
	serverDomain.add(restDomain);
	var options = {
		apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
		discoverPath: 'discover',
		protoPath: 'proto',
		logger: { name: 'connect-rest', level: 'debug' },
		context: '/api',
		domain: restDomain,
		monitoring: {
			populateInterval: 6000,
			console: false,
			listener: function(data){ console.log( '%j', data); }
		}
	};
	connectApp.use( rest.rester( options ) );

	var server = http.createServer( connectApp );

	server.listen( 8080 );

	restBuilder.buildUpRestAPI( rest, _ );

	connectApp.use( restBuilder.getDispatcher( rest ) );

	_.each( caller.group, function(value, key, list){
		console.log('Executing: ', key);
		value( { done: function(){ console.log('Done.', arguments); } } );
	} );
});
