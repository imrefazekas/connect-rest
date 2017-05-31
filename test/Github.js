const fs = require('fs')
const path = require('path')
const http = require('http')
const connect = require('connect')
const bodyParser = require('body-parser')
const Rest = require('../lib/rest-services')

const PORT = process.env.PORT || 8000

// initial configuration of connect-rest. all-of-them are optional.
// default context is /api, all services are off by default
const rest = Rest.create({
	context: '/api',
	logger: { level: 'debug' },
	// apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	discover: { path: 'discover', secure: false }
	// proto: { path: 'proto', secure: true }
})
const app = connect()
	.use(bodyParser.urlencoded({ extended: true }))
	.use(bodyParser.json())
	.use(rest.processRequest())

// defines a few sample rest services
const debug = (request, content, callback)=>{ 
	console.log( 'Received headers:' + JSON.stringify( request.headers ))
	console.log( 'Received parameters:' + JSON.stringify( request.parameters ) )
	console.log( 'Received JSON object:' + JSON.stringify( content ) )
	callback(null, 'ok')
}
rest.get('/books/:title/:chapter', debug)
rest.post( { path: '/make', version: '>=1.0.0' }, debug)
rest.post( [ '/act', '/do' ], debug)
rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], debug)

http.createServer(app).listen(PORT, function () {
	console.log('Running on http://localhost:'+PORT)
})
