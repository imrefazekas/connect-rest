[connect-rest](https://github.com/imrefazekas/connect-rest) is a featureful very easy-to-use middleware for [connect](http://www.senchalabs.org/connect/) for building REST APIs. The library has a stunning feature list beyond basic rest functionality. 

Just a few examples: (far from incomplete): 
- execution branches: a single service can have multiple paths and a single incoming request can invoke multiple services
- versioning: rest services can be versioned via many ways
- regular expressions: path description can be given using regular expression
- parameter mappings: path matchings can be bound as parameters 
- service discovery: built-in rest service allowing one to discover what rest services are available in general or for a given version
- "reflective" publishing: by providing a single object, its methods will be published as rest services automatically by simple logic
- customizable HTTP-layer management: HTTP status code, mime-types, headers, minifying can be set at service and execution level
- async services: a rest service can call back asynchronously when the answer is made
- monitoring/measuring: every rest service execution can be enabled for measurement to be collected and populated internally or for external monitoring solutions

!Note: connect-rest's concept is - as for integration - to provide a connect plugin and - as for user aspect - to be a framework for your rest services carrying only about content and business logic, nothing else. However, in case of need for interoperability, the need might cause you to use only the path-related features alone. This can be done using [dispatchers](#dispatchers).

# Usage

The [connect-rest](https://github.com/imrefazekas/connect-rest) is a simple, yet powerful middleware for [connect](http://www.senchalabs.org/connect/), inspired by [restify](http://mcavage.github.com/node-restify/). 
The aim is to focus on the business logic, so [connect-rest](https://github.com/imrefazekas/connect-rest) is managing body payload and parameters as well in the background, your business logic function does not need to take care of any request or response object at all.

The payload of the body - if exists - with proper mime-type will be interpret as JSON object and will be parsed and passed to the service function you assign to.

If [bodyparser](http://www.senchalabs.org/connect/bodyParser.html) or [json](http://www.senchalabs.org/connect/json.html) or any similar connect middleware is being used creating the req.body attribute, its content will be respected and delegated to the service functions as it is.

# Installation

	$ npm install connect-rest

## Features:
- [Assign](#assign)
- [Path description](#path-description)
- [Rest functions](#rest-functions)
- [Status codes](#status-codes)
- [Response headers](#response-headers)
- [Minify response JSON](#minify-response-json)
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
- [Answering async rest requests](#answering-async-rest-requests)
- [Dispatchers](#dispatchers)
- [Monitoring](#monitoring)
- [File Upload](#file-upload)
- [Usage](#usage)
- [Changelog](#changelog)

## Assign
Assign your rest modules by one of the http request functions: head, get, post, put, delete. 

Example:

	function service( request, content, callback ){
		console.log( 'Received headers:' + JSON.stringify( request.headers ) );
		console.log( 'Received parameters:' + JSON.stringify( request.parameters ) );
		console.log( 'Received JSON object:' + JSON.stringify( content ) );
		callback(null, 'ok');
	}
	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], service );

After each assign function you might pass the followings: 
- a path descriptor and 
- a function to be called.

## Path description
[connect-rest](https://github.com/imrefazekas/connect-rest) supports many options to be used as path description.

Simple path: 
	
	'/peek'

Versioned path: 

	{ path: '/make', version: '>=1.0.0' }

Multiple path: 

	[ '/act', '/do' ]

Multiple versioned path: 

	[ { path: '/shake', version: '<2.0.0' }, { path: '/twist', version: '>=2.1.1' } ]

Mandatory variables: 

	{ path: '/make/:uid', version: '>=1.0.0' }


Optional path: 

	{ path: '/delete/?id', version: '>=1.0.0' }

	{ path: '/delete/?id/?date', version: '>=1.0.0' }

General path:

	{ path: '/rent/*bookTitle', version: '>=1.0.0' }

Complex path:

	[ { path: '/rent/?isbn/*bookTitle', version: '<2.0.0' }, { path: '/borrow/:uid/?isbn/?bookTitle', version: '>=2.1.1' } ]


[Back to Feature list](#features)

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

[Back to Feature list](#features)

## Response headers

To refine the headers in the response HTML, the way is the same as above: customize the third parameter of the callback function.

	rest.get( '/special', function( request, content, callback ){
		return callback( null, 'Content.', { headers: { ETag: "10c24bc-4ab-457e1c1f" } } );
	});

## Minify response JSON

You can make the response JSON object minified by passing a single boolean parameter to the callback's third optional parameter:

	rest.get( '/special', function( request, content, callback ){
		...
		return callback( null, '{ "key"     :    "value" }', { minify: true } );
	});

This will send 
	
	{"key":"value"}

to the client.

## Versioning:
As for versioning, the syntax is the same you use for [npm](https://npmjs.org)

	rest.get( { path: '/special', version: '1.0.0' }, functionN0);

## Unprotected REST service:
You can turn off the API_KEY protection for a given service:

	rest.get( { path: '/special', unprotected: true }, functionN0);

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

You can make rather complex mixtures of those options as well:

	'/borrow/:uid/?isbn/:bookTitle'

One can call this with uri: 

	'borrow/2/AliceInWonderland' or 'borrow/2/HG1232131/AliceInWonderland'

The logic how [connect-rest](https://github.com/imrefazekas/connect-rest) is managing parameter replacement is the following:

The parameters are processed in the path defintion order and any missing optional parameter will be filled with empty strings to keep the order of them keeping in sight all mandatory parameters put after the optional ones.

[Back to Feature list](#features)

## Context
[connect-rest](https://github.com/imrefazekas/connect-rest) also supports uri prefix if you want to put every REST function behind the same context:

	rest.context( '/api' ); // means that every rest calls need to be sent to '/api/X' path.

This value can be set through the option object as well:

	var options = {
		'context': '/api'
	};
	connectApp.use( rest.rester( options ) );

Default _context_ is the empty string.

## Discovery services
[connect-rest](https://github.com/imrefazekas/connect-rest) provides a built-in service: discover. Via a simple get request, it allows you - by specifying a version - to discover the plublished REST apis matching the given version. 

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

That parameter debriefs the client what structure the functionN expects to receive. 
To activate this feature, first you have to add a new attribute to the options object:

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

[Back to Feature list](#features)

## API_KEY management
The option passed to the [connect-rest](https://github.com/imrefazekas/connect-rest) might contain an array enumerating accepted api_keys:

	var options = {
    	'apiKeys': [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
    	'discoverPath': 'discover'
	};

If property 'apiKeys' is present, the associated array of strings will be used as the list of api keys demanded regarding every incoming calls.
So having such option, a call should look like this:

	'/api/books/AliceInWonderland/1?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'

otherwise error response will be sent with status code 401 claiming: 'API_KEY is required.'.

Note: you can create special REST services not requiring API_KEYS to serve jade templates or anything you would like to as follows:

	rest.get( { path: '/special', unprotected: true }, functionN0);


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
The [connect-rest](https://github.com/imrefazekas/connect-rest) will use level 'info' for entry and exit points of services and 'debug' for the milestones of all internal processes.

[Back to Feature list](#features)

## Reflective publishing
[connect-rest](https://github.com/imrefazekas/connect-rest) allows you to have an extremely easy and fast way to publish your services. 

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
[connect-rest](https://github.com/imrefazekas/connect-rest) adds support for domain-based error handling. To the options object you can pass a domain too:

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

By passing the restDomain object, [connect-rest](https://github.com/imrefazekas/connect-rest) will assign req and rest object to that domain and in any occurring error, it will be sent to the caller with HTTP status code 500.

[Back to Feature list](#features)

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

## Answering async rest requests

[connect-rest](https://github.com/imrefazekas/connect-rest) provides a way to serve async rest requests. It might be important - especially between fragmented server-side environment - to call rest services and accept the answer on a specific callback URL specified by the requestor.

The _client_ has to specify a request parameter _"callbackURL"_ possessing the callback URL where the answer has to be sent.
Having sent the request, [connect-rest](https://github.com/imrefazekas/connect-rest) will answer it right away with status code _200_ and message _Ok._ and having the result created, it will sent via _HTTP POST_ to the URL given in the HTTP parameters.

This process is performed behind the scenes, you do not have do anything special about it. If that parameter can be found in the HTTP request, the call will be threaten as async request.

[Back to Feature list](#features)


## Dispatchers

In some cases, you might face with a situation where other 3rd party connect library has to be used and the case might require for path-related logic to be used. [connect-rest](https://github.com/imrefazekas/connect-rest) is designed to be able to use as simple path processing helper library as well.

	connectApp.use( rest.dispatcher( 'GET', '/dispatcher/:subject', function(req, res, next){
		res.end( 'Dispatch call made:' + req.params['subject'] );
	} ) );

This simple code makes is pretty straightforward. In case of a _'GET'_ HTTP request coming to the url _'/dispatcher'_, the given function is executed. That function can be any third party connect lib you want to use.

[Back to Feature list](#features)


## Monitoring

[connect-rest](https://github.com/imrefazekas/connect-rest) allows you to monitor and measure the execution of the published rest services. Every service execution measure the execution time and reports to a bus transparently. The commulated data is populated regularly as configured.

	var options = {
		...,
		monitoring: {
			populateInterval: 6000,
			console: true,
			listener: function(data){ ... }
			, newrelic: {
				platformApiUri: 'https://platform-api.newrelic.com/platform/v1/metrics',
				licenseKey: 'XXX',
				pluginName: 'org.vii.connectrest.performancePlugin'
			}
		}
	};

By adding a monitoring to the options of the library, the monitoring can be activated. The population interval is defined via the _populateInterval_ property measured in millisecs.

The property _console_ - if present - will print the commulated execution times grouped/structured by paths and version to the console. 

The property _listener_ - if present - allows you to pass a function which the populated data will be sent to. This way you can define own function to process the collected measurements.

The property _newrelic_ - if present - activates the [newrelic](https://newrelic.com) services posting all metrics to the newrelic server. You have to give your license key to make it work properly. 

Note: [newrelic](https://newrelic.com) support is preliminary at this moment. Will be improved by time...


## File upload

The connect [bodyparser](http://www.senchalabs.org/connect/middleware-bodyParser.html) middleware manages content parsing for a given request. To manage the upload of files, your task is very simple:

	rest.post( '/upload', function( request, content, callback ){
		console.log( 'Upload called:' + JSON.stringify( request.files ) );
		return callback(null, 'ok');
	} );

The middleware manages the file storage and every stored file can be found in the _files_ attribute of _request_ object. For further configuration, please find the [bodyparser's page](http://www.senchalabs.org/connect/middleware-bodyParser.html).

[Back to Feature list](#features)


## Usage

	var connect = require('connect');
	var rest = require('connect-rest');
	
	var connectApp = connect();

	connectApp.use( connect.bodyParser({ uploadDir: './storage' }) );
	connectApp.use( connect.query() );

	var options = {
		apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
		discoverPath: 'discover',
		protoPath: 'proto',
		logger: 'connect-rest',
		logLevel: 'debug',
		context: '/api'
	};
	connectApp.use( rest.rester( options ) );

	rest.get('/books/:title/:chapter', functionN0 );

	rest.post( { path: '/make', version: '>=1.0.0' }, functionN1 );

	rest.post( [ '/act', '/do' ], functionN2 );
	
	rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], functionN3 );

[Back to Feature list](#features)

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

- 0.7.x: fixes...
- 0.6.x: fixes...
- 0.6.0: dispatchers added
- 0.5.0: minifying services added
- 0.0.48: An rest service can now be unprotected
- 0.0.43-47: Various fixes/improvements
- 0.0.42: Incomint request count monitoring added
- 0.0.41: listener for populated measurements can be set
- 0.0.40: monitoring services (bus) added
- 0.0.3X: minor fixes, refined documentation
- 0.0.28.29: a case when mandatory parameter follows optional(s) has been fixed
- 0.0.26-27: async request fix
- 0.0.23-25: small fix for content type management
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