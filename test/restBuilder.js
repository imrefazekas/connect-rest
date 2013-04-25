function buildUpRestAPI( rest, _ ){
	rest.context( '/api' );

	rest.head('/peek', function( request ){
		console.log( 'Received:' + JSON.stringify( request ) );
		return 'ok';
	});
	rest.get('/books/:title/:chapter', function( request ){
		console.log( 'Received:' + JSON.stringify( request ) );
		return 'ok';
	});
	rest.post('/store/?id', function( request, content, callback ){
		console.log( 'Received:' + JSON.stringify( request ) + ' ' + JSON.stringify(content) );
		return callback(null, 'ok');
	});
	rest.get('/inquire/*book', function( request, content, callback ){
		console.log( 'Received:' + JSON.stringify( request ) + ' ' + JSON.stringify(content) );
		return callback(null, 'ok');
	});
	rest.get( '/set/?rid/?facet', function( request, content, callback ){
		console.log( 'Received:' + JSON.stringify( request ) + ' ' + JSON.stringify(content) );
		return callback(null, 'ok');
	});
	rest.post( { path: '/make', version: '>=1.0.0' }, function( request, content, callback ){
		console.log( 'Received:' + JSON.stringify( request ) + ' ' + JSON.stringify(content) );
		return callback(null, 'ok');
	});
	rest.post( [ '/act', '/do' ], function( request, content, callback ){
		console.log( 'Received:' + JSON.stringify( request ) + ' ' + JSON.stringify(content) );
		return callback( null, 'ok' );
	});
	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], function( request, content, callback ){
		console.log( 'Received:' + JSON.stringify( request ) + ' ' + JSON.stringify(content) );
		return callback(null, 'ok');
	}, {'title': 'Alice in Wonderland'} );


	rest.get( '/data/items', function( request, content, callback ){
		console.log( 'Received::' + JSON.stringify( request ) + ' ' + JSON.stringify(content) );
		return callback(null, 'ok');
	}, { contentType:'text/plain', validator: function(req, res){ return true; } } );
}

exports.buildUpRestAPI = buildUpRestAPI;
