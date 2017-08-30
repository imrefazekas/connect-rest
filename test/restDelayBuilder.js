function buildUpRestAPI ( rest ) {
	// rest.context( '/api' )

	rest.head('/peek', async function ( request ) {
		console.log( 'Received:' + JSON.stringify( request ) )
		return 'ok'
	})
	rest.get('/empty', async function ( request ) {
		console.log( 'Received:' + JSON.stringify( request ) )
		return ''
	})
	rest.get('/books/:title/:chapter', async function ( request ) {
		console.log( 'Received:' + JSON.stringify( request ) )
		return request.parameters
	})
	rest.post('/store/?id', function ( request, content ) { let delay = Math.round( Math.random() * 100 + 50 )
		console.log( 'Received:' + JSON.stringify( request ) + ' ' + JSON.stringify(content) )
		setTimeout(function () {
			callback(null, request.parameters)
		}, delay)
	})
	rest.get('/inquire/*book', function ( request, content ) { let delay = Math.round( Math.random() * 100 + 50 )
		console.log( 'Received:' + JSON.stringify( request ) + ' ' + JSON.stringify(content) )
		setTimeout(function () {
			callback(null, 'ok')
		}, delay)
	})
	rest.get( '/set/?rid/?facet', function ( request, content ) { let delay = Math.round( Math.random() * 100 + 50 )
		console.log( 'Received:' + JSON.stringify( request ) + ' ' + JSON.stringify(content) )
		setTimeout(function () {
			callback(null, request.parameters )
		}, delay)
	})
	rest.post( { path: '/make', version: '>=1.0.0' }, function ( request, content ) { let delay = Math.round( Math.random() * 100 + 50 )
		console.log( 'Received:' + JSON.stringify( request ) + ' ' + JSON.stringify(content) )
		setTimeout(function () {
			callback(null, 'ok')
		}, delay)
	})
	rest.post( [ '/act', '/do' ], function ( request, content ) { let delay = Math.round( Math.random() * 100 + 50 )
		console.log( 'Received:' + JSON.stringify( request ) + ' ' + JSON.stringify(content) )
		setTimeout(function () {
			callback( null, 'ok' )
		}, delay)
	})
	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], function ( request, content, callback ) { let delay = Math.round( Math.random() * 100 + 50 )
		console.log( 'Received:' + JSON.stringify( request ) + ' ' + JSON.stringify(content) )
		setTimeout(function () {
			callback(null, 'ok')
		}, delay)
	}, {'title': 'Alice in Wonderland'} )

	rest.get( '/data/items', function ( request, content ) { let delay = Math.round( Math.random() * 100 + 50 )
		console.log( 'Received::' + JSON.stringify( request ) + ' ' + JSON.stringify(content) )
		setTimeout(function () {
			callback(null, request.parameters, {statusCode: 201} )
		}, delay)
	}, { contentType: 'application/json', validator: function (req, res) { return true } } )

	rest.get( '/call/:system/?entity/?version/:subject', function ( request, content ) { let delay = Math.round( Math.random() * 100 + 50 )
		console.log( 'Received::' + JSON.stringify( request.parameters ) + ' ' + JSON.stringify(content) )
		setTimeout(function () {
			callback(null, request.parameters, {statusCode: 201} )
		}, delay)
	}, { contentType: 'application/json' } )

}

exports.buildUpRestAPI = buildUpRestAPI
