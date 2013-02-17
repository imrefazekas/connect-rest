function buildUpRestAPI(rest){
	rest.context( '/api' );

	rest.head('/peek', function( request ){
		console.log( 'Received:' + JSON.stringify('ok') );
		return 'ok';
	});
	rest.get('/books', function( request ){
		console.log( 'Received:' + JSON.stringify('ok') );
		return 'ok';
	});
	rest.post('/store', function( request, content ){
		console.log( 'Received:' + JSON.stringify(content) );
		return JSON.stringify(content);
	});
	rest.post( { path: '/make', version: '>=1.0.0' }, function( request, content ){
		console.log( 'Received:' + JSON.stringify(content) );
		return JSON.stringify(content);
	});
	rest.post( [ '/act', '/do' ], function( request, content ){
		console.log( 'Received:' + JSON.stringify(content) );
		return JSON.stringify(content);
	});
	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], function( request, content ){
		console.log( 'Received:' + JSON.stringify(content) );
		return JSON.stringify(content);
	});
}

exports.buildUpRestAPI = buildUpRestAPI;
