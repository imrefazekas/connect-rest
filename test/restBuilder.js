var fs = require('fs');

function buildUpRestAPI( rest ){
	//rest.context( '/api' );

	rest.head('/peek', function( request ){
		console.log( 'Received:' + request.format() );
		return 'ok';
	});

	rest.get('/empty', function( request ){
		console.log( 'Received:' + request.format() );
		return '';
	});

	rest.proxy( 'get', '/proxyEmpty', 'http://localhost:8080/api/empty', { bypassHeader: true } );

	rest.get('/books/:title/:chapter', function( request ){
		console.log( 'Received:' + request.format() );
		return request.parameters;
	}, {options: true} );
	rest.post('/store/?id', function( request, content, callback ){
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) );
		return callback(null, { params: request.parameters, content: content} );
	});
	rest.get('/inquire/*book', function( request, content, callback ){
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) );
		return callback(null, 'ok');
	});
	rest.get( '/set/?rid/?facet', function( request, content, callback ){
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) );
		return callback(null, request.params, { minify: true } );
	});
	rest.get( { path: '/eset/?rid/?facet', version: '*', protector: function( req, res, pathname, path, callback ){ callback(); } }, function( request, content, callback ){
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) );
		return callback(null, request.params, { minify: true } );
	});
	rest.get( '/minify', function( request, content, callback ){
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) );
		return callback(null, '{ "key"     :    "value" }', { minify: true } );
	});
	rest.post( { path: '/make', version: '>=1.0.0' }, function( request, content, callback ){
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) );
		return callback(null, 'ok');
	});
	rest.post( [ '/act', '/do' ], function( request, content, callback ){
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) );
		return callback( null, 'ok' );
	});
	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], function( request, content, callback ){
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) );
		return callback(null, 'ok');
	}, {'title': 'Alice in Wonderland'} );

	rest.get( '/data/items', function( request, content, callback ){
		console.log( 'Received::' + request.format() + ' ' + JSON.stringify(content) );
		return callback(null, request.parameters, {statusCode:201} );
	}, { contentType:'application/json', validator: function(req, res){ return true; } } );

	rest.get( '/call/:system/?entity/?version/:subject', function( request, content, callback ){
		console.log( 'Received::' + JSON.stringify( request.parameters ) + ' ' + JSON.stringify(content) );
		return callback(null, request.parameters, {statusCode:201} );
	}, { contentType:'application/json' } );

	rest.get( { path: '/unprotected', unprotected: true }, function( request, content, callback ){
		console.log( 'Called unprotected zone...');
		return callback(null, 'Welcome guest...', {statusCode:200} );
	}, { contentType:'application/json' } );

	rest.post( '/upload', function( request, content, callback ){
		console.log( 'Upload called:' + request.format() + ' ' + JSON.stringify(content) );
		return callback(null, 'ok');
	} );

	rest.get( { path: '/workspace', context:'/pages', unprotected: true }, function( request, content, callback ){
		console.log( 'Calling under spec context');
		return callback(null, 'ok');
	} );

	rest.get('/handlers/function', function( request, content, callback ){
		console.log( 'Received:' + request.format() );
		return callback(null, function( cb ){ cb( null, 'ok' ); } );
	});
	rest.get('/handlers/buffer', function( request, content, callback ){
		console.log( 'Received:' + request.format() );
		return callback(null, new Buffer( 'ok', 'utf-8') );
	}, { contentType:'application/text' } );
	rest.get('/handlers/stream/:file', function( request, content, callback ){
		console.log( 'Received:' + request.format() );
		return callback(null, fs.createReadStream( './test/data/'+ request.params.file +'.text', { encoding : 'utf-8'} ), {statusCode:201} );
	});

	rest.get( '/convert/@format', function( request, content, callback ){
		console.log( 'Received:' + request.format() );
		return callback( null, 'ok' );
	}, { format:[ 'euro', 'usd', 'huf' ] } );

	rest.get( /^\/[tT]([a-zA-Z]){4}$/g, function( request, content, callback ){
		console.log( 'Received:' + request.format() );
		return callback( null, 'regular' );
	} );

	rest.get( { path : '/ships', unprotected: true }, function(req, content, callback){
		console.log("Looking for ships..." );
		callback( null, 'Done.' );
	});
	rest.get( { path : '/ships/id/:id', unprotected : true }, function(req, content, callback){
		console.log("Looking for ship ID " + req.params.id);
		callback( null, 'Done.' );
	});

	rest.get( { path : '/looper', unprotected : true }, function(req, content, callback){
		setTimeout( function(){
			callback( null, 'Done.' );
		}, 2000);
	}, { contentType:'text/html' } );

	rest.get( { path: '/', context:'', unprotected: true }, function( request, content, callback ){
		console.log( 'Received:' + request.format() );
		return callback( null, 'Done.' );
	}, { contentType:'text/html' } );
}

function getDispatcher(rest){
	return rest.dispatcher( 'GET', '/dispatcher/:subject', function(req, res, next){
		res.end( 'Dispatch call made:' + req.params.subject );
	} );
}

exports.buildUpRestAPI = buildUpRestAPI;
exports.getDispatcher = getDispatcher;
