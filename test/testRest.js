var rest = require('../lib/connect-rest');

var http = require('http');
var connect = require('connect');
var assert = require('assert');
var async = require('async');
var _ = require('underscore');

var restBuilder = require('./restBuilder');
var caller = require('./caller');

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
	//connectApp.use( connect.static('www') );

	connectApp.use( connect.query() );

	var SERVICE_METHOD_PATTERN = /^[a-zA-Z]([a-zA-Z]|\d|_)*$/g;

	var restDomain = createDomain();
	serverDomain.add(restDomain);
	var options = {
		apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
		discoverPath: 'discover',
		protoPath: 'proto',
		logger: 'connect-rest',
		logLevel: 'debug',
		context: '/api',
		domain: restDomain,
		monitoring: {
			populateInterval: 6000,
			console: false
			//,listener: function(data){ console.log( '%j', data); }
			/*, newrelic: {
				platformApiUri: 'https://platform-api.newrelic.com/platform/v1/metrics',
				licenseKey: 'XXX',
				pluginName: 'org.vii.connectrest.performancePlugin'
			}*/
		}
	};
	connectApp.use( rest.rester( options ) );

	var server = http.createServer( connectApp );

	server.listen( 8080 );

	restBuilder.buildUpRestAPI( rest, _ );

	async.parallel([
		// async.apply( caller.testCall1, http, _ ),
		// async.apply( caller.testCall2, http, _ ),
		// async.apply( caller.testCall3a, http, _ ),
		// async.apply( caller.testCall3b, http, _ ),
		// async.apply( caller.testCall4, http, _ ),
		// async.apply( caller.testCall5, http, _ ),
		// async.apply( caller.testCall6, http, _ ),
		// async.apply( caller.testCall7, http, _ ),
		//async.apply( caller.testCall8a, http, _ ),
		//async.apply( caller.testCall8b, http, _ ),
		//async.apply( caller.testCall8c, http, _ ),
		async.apply( caller.testCall9, function(err, result, status){ console.log(err, result, status); } ),
		async.apply( caller.testCall10a, function(err, result, status){ console.log(err, result, status); } ),
		async.apply( caller.testCall10b, function(err, result, status){ console.log(err, result, status); } ),
		async.apply( caller.testCall10c, function(err, result, status){ console.log(err, result, status); } ),
		async.apply( caller.testCall10d, function(err, result, status){ console.log(err, result, status); } )
	], function(err, results){
		console.log('Tests finished.');
			rest.shutdown();
			server.close();
		assert.ifError( err );
	});
});

