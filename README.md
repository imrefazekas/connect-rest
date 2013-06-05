[connect-rest](https://github.com/imrefazekas/connect-rest) is a middleware for [connect](http://www.senchalabs.org/connect/) for building REST APIs providing service discovery and path-based parameter mapping and "reflective" publishing and node domains as well.

# Usage

The connect-rest is a simple, yet powerful middleware for [connect](http://www.senchalabs.org/connect/), inspired by [restify](http://mcavage.github.com/node-restify/). 
The aim is to focus on the business logic, so connect-rest is managing body payload and parameters as well in the background, your business logic function does not need to take care of any request or response object at all.

The payload of the body - if exists - with proper mime-type will be interpret as JSON object and will be parsed and passed to the service function you assign to.

If [bodyparser](http://www.senchalabs.org/connect/bodyParser.html) or [json](http://www.senchalabs.org/connect/json.html) or any similar connect middleware is being used creating the req.body attribute, its content will be respected and delegated to the service functions as it is.

Features:
- [Assign](#assign)
- [Path description](#path-description)
- [Rest functions](#rest-functions)
- [Status codes](#status-codes)
- [Response headers](#response-headers)
- [Versioning](#versioning)
- [Special assigns](#special-assigns)
- [Named parameters](#named-parameters)
- [Optinal parameter](#optinal-parameter)
- [General matcher](#general-matcher)
- [Context](#context)
- [Discover services](#discover-services)
- [Prototype services](#prototype-services)
- [API_KEY management](#api_key-management)
- [Logging](#logging)
- [Reflective publishing](#reflective-publishing)
- [Domain support](#domain-support)
- [Customization: Validation and Response mime-types](#customization)

## Assign
Assign your rest modules by one of the http request functions: head, get, post, put, delete. 

Example:

	function service( request, content, callback ){
		console.log( 'Received headers:' + JSON.stringify( request.headers ) );
		console.log( 'Received parameters:' + JSON.stringify( request.parameters ) );
		console.log( 'Received JSON object:' + JSON.stringify( content ) );
		return 'ok';
	}
	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], service );

After each assign function you might pass the followings: 
- a path descriptor and 
- a function to be called.

## Path description
connect-rest supports many options to be used as path description.

Simple path: 
	
	'/peek'

Versioned path: 

	{ path: '/make', version: '>=1.0.0' }

Multiple path: 

	[ '/act', '/do' ]

Multiple versioned path: 

	[ { path: '/shake', version: '<2.0.0' }, { path: '/twist', version: '>=2.1.1' } ]

## Rest functions

Every handler function receives
- a 'request' object containing "headers" and "parameters" values and a "callback" function if the result is composed by asnyc operations 
- an optional 'content' object which is the JSON-parsed object extracted from the http body's payload.
- an optional callback function. This is the 'node standard' way to manage callbacks if needed.

If callback is used as third parameter, needs to be called and pass the error or result object. Otherwise the return value of rest functions will be sent back to the client as a json string.
Please, see examples below...

## Status codes

IF one defines a rest function possessing 3 parameters, the third is an object aimed to contain to refine the HTTP response sent back to the client. As for status code, all you need to do is this:

Error case:

	rest.get( '/invalidPath', function( request, content, callback ){
		var error = new Error('invalid path');
		error.statusCode = 404;
		return callback( error );
	});

Special case when no error occurred, yet the http request's status has to be set:

	rest.get( '/special', function( request, content, callback ){
		return callback( null, 'Processing...', { statusCode: 202 } );
	});

## Response headers

To refine the headers in the response HTML, the way is the same as above: customize the third parameter of the callback function.

	rest.get( '/special', function( request, content, callback ){
		return callback( null, 'Content.', { headers: { ETag: "10c24bc-4ab-457e1c1f" } } );
	});

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

	rest.post('/store/?id', functionN );

This definition allows you to define one optional parameter at the end of the path. It might be called using

	'/store'

or using

	'/store/108'

paths. Both HTTP calls will be directed to the same functionN service.
In latter case, the '108' will be set as a parameter in the request object with the value of '108'.

## General matcher

	rest.get('/inquire/*book', functionM );

This definition gives you the possibility to define a general matcher allowing to have been called with anything after the string

	'/inquire'

so can be called using

	'/inquire/alice/in/wonderland'

or using

	'/inquire/oz/the/great/wizard'

paths. This results to have the parameter 'book' with value 

	'alice/in/wonderland' or 'oz/the/great/wizard' 

respectively. 

## Context
connect-rest also supports uri prefix if you want to put every REST function behind the same context:

	rest.context( '/api' ); // means that every rest calls need to be sent to '/api/X' path.

## Discovery services
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

## Prototype services
The assign-methods allows you to pass a third parameter, an object which can be considered as a prototype of the expected parameter of the service when a client wants to make a call.

	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], functionN, {'title': 'Alice in Wonderland'} );

That parameter debriefs the client what structure the functionN expects to receive. To activate this feature, first you have to add a new attribute to the options object:

	var options = {
	    'apiKeys': [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	    'discoverPath': 'discover',
	    'protoPath': 'proto',
	    'logger': 'connect-rest'
	};

This 'protoPath' means that sending a request to the server on path:

	'/api/proto/POST/2.3.0/api/twist?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'

will retrieve the object 
	
	{'title': 'Alice in Wonderland'}

because the service

	on path '/api/twist' and method 'POST' with version '2.3.0'

can be called and there is an assigned prototype object to it.
Giving access method, version and path is mandatory for this feature.


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

## Logging
In the option object passed to the constructor, there is an optional parameter 'logger', which enables the logging functionality:

	var options = {
    	'apiKeys': [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
    	'discoverPath': 'discover',
    	'logger': 'connect-rest'
	};

or

	var options = {
	    'apiKeys': [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	    'discoverPath': 'discover',
	    'logger': loggerInstance
	};

You can set:
- a string, which will be interpret as the name of the logger seen in the logs, or 
- passing a bunyan instance to be used.

In the absence of 'logger' property, no logs will be made.
The connect-rest will use level 'info' for entry and exit points of services and 'debug' for the milestones of all internal processes.

## Reflective publishing
connect-rest allows you to have an extremely easy and fast way to publish your services. 

You can define your own services like this in a file (services.js in this example):

	function health( request ){
		return 'ok';
	};
	function record( request, content ){
		return 'saved';
	}
	exports.health = health;
	exports.record = record;

and publish them this way:

	var services = require('./services');
	...
	rest.publish( services );

This will discover all functions assigned to the exports having a name which conforms the following regular expression:
	
	/^[a-zA-Z]([a-zA-Z]|\d|_)*$/g

The logic is simple. If the function has 
- 1 parameter: it will be a 'get' method
- 2 parameters: it will be a 'post' method

and the path will be its name. So, by executing one single statement you will automatically have the following services:

	/health on Get 
	/record on Post

If you have 100 services defined, then 100 rest api you will have automatically. Nice.

## Domain support
connect-rest adds support for domain-based error handling. To the options object you can pass a domain too:

	var createDomain = require('domain').create;
	...
	var superDomain = createDomain();
	...
	var restDomain = createDomain();
	superDomain.add( restDomain );
	var options = {
		apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
		discoverPath: 'discover',
		protoPath: 'proto',
		logger: 'connect-rest',
		domain: restDomain 
	};

By passing the restDomain object, connect-rest will assign req and rest object to that domain and in any occurring error, it will be sent to the caller with HTTP status code 500.

## Customization

When assigning routes with rest API you can pass an object too. This object looks like this:

	{ 
		contentType: ''
		validator: ...
	}

The contentType defines what the given REST service will retrieve. If not given, 'application/json' will be used.

The validator is a function, which can be used to determine if the REST function can be called in a given circumstances or should be ignored. This could mean authorization or ip address validation or other security concern.

	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], function( request, content ){
		return JSON.stringify(content);
	}, null, { contentType:'application/xml', validator: function(req, res){ return _.contains(req.user.roles, "superuser"); } } );


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

- more detailed examples

## Changelog

- 0.0.23: small fix for content type management
- 0.0.22: response header customization added 
- 0.0.21: 
	- async rest calling allowed by passing a http parameter: callbackURL
	- and some logging fixes
- 0.0.20: callback/next function passed to the services methods can receive third parameter: statusCode setting the http status of the response
- 0.0.19: assign function introduced for bulk http-method assignments for a given rest function
- 0.0.18: fixes
- 0.0.16: 
	- better optional parameter handling allowing to use optional parameter chain like: /set/?depoartment/?room
	- rewritten assing services. instead of passing a single validator, one has to pass on optional object: { contentType: '', validator: ...} which allows one to define validator and answer return content mime-type as well.
- 0.0.15 : Great changes from Joel Grenon, thank you! Standard callbacks introduced, better optional parameter handling and respecting error status code if exists
- 0.0.14 : Adding grunt project files
- 0.0.13 : Validator function can be also passed
- 0.0.12 : Domain (introduced in Node 0.8.0) support added
- 0.0.11 : First request parameter now has a callback for async rest calls
- 0.0.10 : Prototyping added
- 0.0.9 : General path matcher added, optional now marked with '?'
- 0.0.8 : Other body parsing middlewares are respected
- 0.0.6 : logging added
- 0.0.5 : optional parameter added
- 0.0.4 : API_KEY management added
- 0.0.3 : discovery managemenet added
- 0.0.2 : named parameters added
- 0.0.1 : initial release