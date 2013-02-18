[connect-rest](https://github.com/imrefazekas/connect-rest) is a small middleware for [connect](http://www.senchalabs.org/connect/) for building REST APIs.

# Usage

The connect-rest is a simple, yet powerful middleware for [connect](http://www.senchalabs.org/connect/), inspired by [restify](http://mcavage.github.com/node-restify/). 
The aim is to focus on the business logic, so connect-rest is managing body payload and parameters as well in the background, your business logic function does not need to take care of any request or response object at all.

## Assign
Assign your rest modules by one of the http request functions: head, get, post, put, delete. 

Example:

	function service( request, payload ){
		console.log( 'Received headers:' + JSON.stringify( request.headers ) );
		console.log( 'Received parameters:' + JSON.stringify( request.parameters ) );
		console.log( 'Received payload:' + JSON.stringify( payload ) );
		return 'ok';
	}
	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], service );

After each assign function you might pass wth followings:

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

- rest function to be called.
	Every handler function receives
	- a 'request' object containing headers and parameters values and 
	- an optional 'content' object which is a JSON-parsed http body payload. 
	
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


## Context
connect-rest also supports uri prefix if you want to put every REST function behind the same context:

	rest.context( '/api' ); // means that ever rest calls need to be sent to '/api/X' path.

## Discover services
connect-rest provides a built-in service: discover. Via a simple get request, it allows you - by specifying a version - to discover the plublished REST apis matching the given version. 

	var options = {
	    'discoverPath': 'discover'
	};
	connectApp.use( rest.rester( options ) );

This will enable this service on the path 'discover/:version'. Sending a get request to - lets say - this path 

	http://localhost:8080/api/discover/3.0.0

would retrieve all services which can be called using version 3.0.0 (non-versioned and matching versioned services). The returned JSON is the following:

	{"HEAD":["/peek"],"GET":["discover/:version","/books/:title/:chapter"],"POST":["/store",{"path":"/make","version":">=1.0.0"},"/act","/do",{"path":"/shake","version":">=2.0.0"},{"path":"/twist","version":">=2.1.1"}],"PUT":[],"DELETE":[]}


## Server - extracted from the tests

	var connect = require('connect');
	var rest = require('connect-rest');
	
	var connectApp = connect();

	connectApp.use( connect.query() );

	var options = {
	    'discoverPath': 'discover'
	};
	connectApp.use( rest.rester( options ) );

	rest.get('/books/:title', functionN0 );

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
- api_key management

## Changelog

- 0.0.3 : discovery managemenet added
- 0.0.2 : named parameters added
- 0.0.1 : initial release