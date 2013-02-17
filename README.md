[connect-rest](https://github.com/imrefazekas/connect-rest) is a small middleware for [connect](http://www.senchalabs.org/connect/) for building REST APIs.

# Usage

The connect-rest is a simple, yet powerful middleware for [connect](http://www.senchalabs.org/connect/), inheriting ideas from [restify](http://mcavage.github.com/node-restify/). 
The aim is to focus on the business logic, so connect-rest is managing body payload and parameters as well in the background, your business logic function does not need to take care of any request or response object at all.

## Assign
Assign your rest modules by one of the http request functions: head, get, post, put, delete. Example:
	rest.head('/peek', function( request ){
		console.log( 'Received:' + JSON.stringify('ok') );
		return 'ok';
	});

After each assign function you might pass wth followings:
- path description
	connect-rest supports many options to be used as path description.
	- Simple path: '/peek'
	- Versioned path: { path: '/make', version: '>=1.0.0' }
	- Multiple path: [ '/act', '/do' ]
	- Miltiple versioned path: [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ]
- rest function to be called.
	Every handler function receives
	- a 'request' object containing headers and parameters values and 
	- an optional 'content' object which is a JSON-parsed http body payload. 
	
	Please, see examples below...
	The return value of rest functions will be sent back to the client as a json string.

## Versioning:
As for versioning, the syntax is the same you use for [npm](https://npmjs.org)

## Context: 
connect-rest also supports uri prefix if you want to put every REST function behind the same context:
	rest.context( '/api' ); // means that ever rest calls need to be sent to '/api/X' path

## Server - extracted from the tests

	var connect = require('connect');
	var rest = require('connect-rest');
	
	var connectApp = connect();

	connectApp.use( connect.query() );
	connectApp.use( rest.rester() );

	rest.get('/books', function( request ){
		console.log( 'Received:' + JSON.stringify('ok') );
		return 'ok';
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

- Parameter mappigns like /:name
