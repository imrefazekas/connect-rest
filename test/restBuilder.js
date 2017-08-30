let fs = require('fs')
let Proback = require('proback.js')

function buildUpRestAPI ( rest ) {
	// rest.context( '/api' )

	rest.head('/peek', async function ( request ) {
		console.log( 'Received:' + request.format() )
		return 'ok'
	})

	rest.get('/empty', async function ( request ) {
		console.log( 'Received:' + request.format() )
		return ''
	})

	rest.proxy( 'get', '/proxyEmpty', { url: 'http://localhost:8080/api/empty', method: 'get', bypassHeader: true } )

	rest.get('/books/:title/:chapter', async function ( request ) {
		console.log( 'Received:' + request.format() )
		return request.parameters
	}, { options: true, prototypeObject: { answer: 'parameters' } } )

	rest.post('/store/?id', async function ( request, content ) {
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) )
		return { params: request.parameters, content: content}
	})

	rest.get('/inquire/*book', async function ( request, content ) {
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) )
		return 'ok'
	})

	rest.get( '/set/?rid/?facet', async function ( request, content ) {
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) )
		return { result: request.params, options: { minify: true } }
	})

	rest.get( { path: '/eset/?rid/?facet', version: '*', protector: function ( req, res, pathname, path, callback ) { return Proback.quicker( 'ok', callback ) } }, async function ( request, content ) {
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) )
		return { result: request.params, options: { minify: true } }
	})

	rest.get( '/minify', async function ( request, content, callback ) {
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) )
		return { result: '{ "key"     :    "value" }', options: { minify: true } }
	})

	rest.post( { path: '/make', version: '>=1.0.0' }, async function ( request, content ) {
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) )
		return 'ok'
	})

	rest.get( { path: '/irritate', version: '>=1.0.0' }, async function ( request, content ) {
		throw new Error('Your call irritates me...')
	})

	rest.post( [ '/act', '/do' ], async function ( request, content, callback ) {
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) )
		return 'ok'
	})

	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], async function ( request, content ) {
		console.log( 'Received:' + request.format() + ' ' + JSON.stringify(content) )
		return 'ok'
	}, {'title': 'Alice in Wonderland'} )

	rest.get( '/data/items', async function ( request, content ) {
		console.log( 'Received::' + request.format() + ' ' + JSON.stringify(content) )
		return { result: request.parameters, options: {statusCode: 201} }
	}, { contentType: 'application/json', validator: function (req, res) { return true } } )

	rest.get( '/call/:system/?entity/?version/:subject', async function ( request, content ) {
		console.log( 'Received::' + JSON.stringify( request.parameters ) + ' ' + JSON.stringify(content) )
		return { result: request.parameters, options: {statusCode: 201} }
	}, { contentType: 'application/json' } )

	rest.get( { path: '/unprotected', unprotected: true }, async function ( request, content ) {
		console.log( 'Called unprotected zone...')
		return { result: 'Welcome guest...', options: {statusCode: 200} }
	}, { contentType: 'application/json' } )

	rest.post( '/upload', async function ( request, content ) {
		console.log( 'Upload called:' + request.format() + ' ' + JSON.stringify(content) )
		return 'ok'
	} )

	rest.get( { path: '/workspace', context: '/pages', unprotected: true }, async function ( request, content ) {
		console.log( 'Calling under spec context')
		return 'ok'
	} )

	rest.get('/handlers/function', async function ( request, content ) {
		console.log( 'Received:::' + request.format() )
		return async function ( ) { return 'ok' }
	})
	rest.get('/handlers/buffer', async function ( request, content ) {
		console.log( 'Received:' + request.format() )
		return new Buffer( 'ok', 'utf-8')
	}, { contentType: 'application/text' } )
	rest.get('/handlers/stream/:file', async function ( request, content ) {
		console.log( 'Received::' + request.format(), request.params )
		return { result: fs.createReadStream( './test/data/' + request.params.file + '.text', { encoding: 'utf-8'} ), options: {statusCode: 201} }
	})

	rest.get( '/convert/@format', async function ( request, content ) {
		console.log( 'Received:' + request.format() )
		return 'ok'
	}, { format: [ 'euro', 'usd', 'huf' ] } )

	rest.get( /^\/[tT]([a-zA-Z]){4}$/g, async function ( request, content ) {
		console.log( 'Received:' + request.format() )
		return 'regular'
	} )

	rest.get( { path: '/ships', unprotected: true }, async function (req, content) {
		console.log( 'Looking for ships...' )
		return 'Done.'
	})
	rest.get( { path: '/ships/id/:id', unprotected: true }, async function (req, content) {
		console.log('Looking for ship ID ' + req.params.id)
		return 'Done.'
	})

	rest.get( { path: '/looper', unprotected: true }, async function (req, content) {
		await Proback.timeout( 2000 )
		return 'Done.'
	}, { contentType: 'text/html' } )

	rest.get( { path: '/', context: '', unprotected: true }, async function ( request, content ) {
		return { result: 'Done, done.', options: { headers: { ETag: '10c24bc-4ab-457e1c1f' } } }
	}, { contentType: 'text/html' } )
}

function getDispatcher (rest) {
	return rest.dispatcher( 'GET', '/dispatcher/:subject', function (req, res, next) {
		res.end( 'Dispatch call made:' + req.params.subject )
	} )
}

exports.buildUpRestAPI = buildUpRestAPI
exports.getDispatcher = getDispatcher
