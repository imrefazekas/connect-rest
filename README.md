[connect-rest](https://github.com/imrefazekas/connect-rest) is a middleware for [connect](http://www.senchalabs.org/connect/) for building REST APIs providing service discovery and path-based parameter mapping as well.

# Usage

The connect-rest is a simple, yet powerful middleware for [connect](http://www.senchalabs.org/connect/), inspired by [restify](http://mcavage.github.com/node-restify/). 
The aim is to focus on the business logic, so connect-rest is managing body payload and parameters as well in the background, your business logic function does not need to take care of any request or response object at all.
The payload of the body - if exists - will be interpret as JSON object and will be parsed and passed to the service function you assign to.

## Assign
Assign your rest modules by one of the http request functions: head, get, post, put, delete. 

Example:

	function service( request, payloadObject ){
		console.log( 'Received headers:' + JSON.stringify( request.headers ) );
		console.log( 'Received parameters:' + JSON.stringify( request.parameters ) );
		console.log( 'Received JSON object:' + JSON.stringify( payloadObject ) );
		return 'ok';
	}
	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], service );

After each assign function you might pass the followings: path descriptor and a function to be called.

### Path description
	connect-rest supports many options to be used as path description.

Simple path: 
	
	'/peek'

Versioned path: 

	{ path: '/make', version: '>=1.0.0' }

Multiple path: 

	[ '/act', '/do' ]

Multiple versioned path: 

	[ { path: '/shake', version: '<2.0.0' }, { path: '/twist', version: '>=2.1.1' } ]

### Rest function.
	Every handler function receives
	- a 'request' object containing headers and parameters values and 
	- an optional 'payload' object which is the JSON-parsed object extracted from the http body's payload. 
	
	The return value of rest functions will be sent back to the client as a json string.
	Please, see examples below...

## Versioning:
As for versioning, the syntax is the same you use for [npm](https://npmjs.org)

## Special assigns:
You can use the character '*' for both path and version too to make generic bindings:

	{ path: '*', version: '*' }

Be aware, that this path will be matched to all paths within the defined context.

## Named parameters

	rest.get('/books/:title', functionN0 );

or

	rest.get('/books/:title/:chapter', functionN0 );

You can define parametrised paths for services to accept REST variables from the caller.
In this case, whatever string is after the 'books', will be interpret as variable(s) and passed to the service function via the request object.

So sending a get request to the uri '/api/books/AliceInWonderland/1', will result the following request object:

	{"headers": ...,"parameters":{"title":"AliceInWonderland", "chapter": "1"}}

## Optinal parameter

	rest.post('/store/[id]', functionN );

This definition allows you to define one optional parameter at the end of the path. It might be called using

	'/store'

or using

	'/store/108'

paths. Both HTTP calls will be directed to the same functionN service.
In latter case, the '108' will be set as a parameter in the request object with the value of '108'.

## Context
connect-rest also supports uri prefix if you want to put every REST function behind the same context:

	rest.context( '/api' ); // means that every rest calls need to be sent to '/api/X' path.

## Discover services
connect-rest provides a built-in service: discover. Via a simple get request, it allows you - by specifying a version - to discover the plublished REST apis matching the given version. 

	var options = {
	    'discoverPath': 'discover'
	};
	connectApp.use( rest.rester( options ) );

This will enable this service - considering the context descrived above - on the path '/api/discover/:version'. Sending a get request to - lets say - this path 

	http://localhost:8080/api/discover/3.0.0

would retrieve all services which can be called using version 3.0.0 (non-versioned and matching versioned services). The returned JSON is the following:

	{
		"HEAD":["/peek"],
		"GET":["discover/:version","/books/:title/:chapter"],
		"POST":["/store",{"path":"/make","version":">=1.0.0"},"/act","/do",{"path":"/shake","version":">=2.0.0"},{"path":"/twist","version":">=2.1.1"}],
		"PUT":[],
		"DELETE":[]
	}

## API_KEY management
The option passed to the connect-rest might contain an array enumerating accepted api_keys:

	var options = {
    	'apiKeys': [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
    	'discoverPath': 'discover'
	};

If property 'apiKeys' is present, the associated array of strings will be used as the list of api keys demanded regarding every incoming calls.
So having such option, a call should look like this:

	'/api/books/AliceInWonderland/1?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'

otherwise error response will be sent with status code 401 claiming: 'API_KEY is required.'.


## Server - extracted from the tests

	var connect = require('connect');
	var rest = require('connect-rest');
	
	var connectApp = connect();

	connectApp.use( connect.query() );

	var options = {
    	'apiKeys': [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
    	'discoverPath': 'discover'
	};
	connectApp.use( rest.rester( options ) );

	rest.get('/books/:title/:chapter', functionN0 );

	rest.post( { path: '/make', version: '>=1.0.0' }, functionN1 );

	rest.post( [ '/act', '/do' ], functionN2 );
	
	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], functionN3 );

# Installation

    $ npm install connect-rest

## License

(The MIT License)

Copyright (c) 2013 Imre Fazekas

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Bugs

See <https://github.com/imrefazekas/connect-rest/issues>.

## ToDo

- logging services should be added properly

## Changelog

- 0.0.5 : optional parameter added
- 0.0.4 : API_KEY management added
- 0.0.3 : discovery managemenet added
- 0.0.2 : named parameters added
- 0.0.1 : initial release