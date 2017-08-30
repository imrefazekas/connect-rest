CONNECT-REST - Exceptionally featureful Restful web services middleware for connect / node.js

[![Join the chat at https://gitter.im/imrefazekas/connect-rest](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/imrefazekas/connect-rest?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![npm version](https://badge.fury.io/js/connect-rest.svg)](http://badge.fury.io/js/connect-rest)
 [![Code Climate](https://codeclimate.com/github/imrefazekas/connect-rest/badges/gpa.svg)](https://codeclimate.com/github/imrefazekas/connect-rest)

__! Note !__ From version 3.0.0, [connect-rest](https://github.com/imrefazekas/connect-rest) requires NodeJS 8.0.0 or higher and async/await based! For node <8.0.0 please use older version of the lib.

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

========

[connect-rest](https://github.com/imrefazekas/connect-rest) is a featureful very easy-to-use middleware for [connect](http://www.senchalabs.org/connect/) for building REST APIs. The library has a stunning feature list beyond basic rest functionality.

Just a few examples: (far from incomplete):
- __execution branches__: a single service can have multiple paths and handlers
- __versioning__: rest services can be versioned via many ways
- __regular expressions__: path description can be given using regular expression
- __parameter mappings__: path matchings can be bound as parameters
- __proxy services__: proxying incoming requests to a remote point passing parameters, headers as you request
- __service discovery__: built-in rest service allowing one to discover what rest services are available in general or for a given version
- __"reflective" publishing__: by providing a single object, its methods will be published as rest services automatically by simple logic
- __dynamic API protection__ by Protectors
- __Multiple contexts__ for flexible orchestrating
- __customizable HTTP-layer management__: HTTP status code, mime-types, headers, minifying can be set at service and execution level
- __async services__: a rest service can call back asynchronously when the answer is made
- __multiple return format__: handlers may return with strings, objects, streams and buffers, connect-rest will manage them adequately.


__!Note__: connect-rest's concept is to provide a feature-full high-level connect middleware for your rest services carrying __only about content and business logic__, nothing else. However, in case of need for interoperability, the need might cause you to use only the path-related features alone. This can be done using [dispatchers](#dispatchers).

# Usage

The [connect-rest](https://github.com/imrefazekas/connect-rest) is a simple, yet powerful middleware for [connect](http://www.senchalabs.org/connect/), inspired by [restify](http://mcavage.github.com/node-restify/).
The aim is to give a really feature-rich tool allowing you to focus on the business logic only.


# Installation

	$ npm install connect-rest

## Features:
- [Quick setup](#quick-setup)
- [Assign](#assign)
- [Path description](#path-description)
- [Versioning](#versioning)
- [Rest functions](#rest-functions)
- [Proxy rest services](#proxy-rest-services)
- [Customize HTTP response](#customize-http-response)
- [Customize answers of REST functions](#customize-answers-of-rest-functions)
- [API_KEY management](#api_key-management)
- [Unprotected rest service](#unprotected-rest-service)
- [Protector](#protector)
- [Context](#context)
- [Orchestrating the contexts](#orchestrating-the-contexts)
- [Discover services](#discover-services)
- [Prototype services](#prototype-services)
- [Remove services](#remove-services)
- [Logging](#logging)
- [Reflective publishing](#reflective-publishing)
- [Domain support](#domain-support)
- [Answering async rest requests](#answering-async-rest-requests)
- [Dispatchers](#dispatchers)
- [More examples](#more-examples)
- [License](#license)
- [Changelog](#changelog)


## Quick setup
```javascript
// requires connect and connect-rest middleware
var connect = require('connect'),
bodyParser = require('body-parser')

var Rest = require('connect-rest')

// sets up connect and adds other middlewares to parse query, parameters, content and session
// use the ones you need
var connectApp = connect()
	.use( bodyParser.urlencoded( { extended: true } ) )
	.use( bodyParser.json() )

// initial configuration of connect-rest. all-of-them are optional.
// default context is /api, all services are off by default
var options = {
	context: '/api',
	logger:{ file: 'mochaTest.log', level: 'debug' },
	apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	// discover: { path: 'discover', secure: true },
	// proto: { path: 'proto', secure: true }
}
var rest = Rest.create( options )

// adds connect-rest middleware to connect
connectApp.use( rest.processRequest() )

// defines a few sample rest services
rest.get('/books/:title/:chapter', asyncFunctionN0 )

rest.post( { path: '/make', version: '>=1.0.0' }, asyncFunctionN1 )

rest.post( [ '/act', '/do' ], asyncFunctionN2 )

rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], asyncFunctionN3 )
```

__All service functions must be async!__

[Back to Feature list](#features)

## Assign

#### direct binding
You can assign your rest modules by specifying the needed _http_ request functions: __head, get, post, put, delete__.

Example:
```javascript
async function service( request, content ){
	console.log( 'Received headers:' + JSON.stringify( request.headers ) )
	console.log( 'Received parameters:' + JSON.stringify( request.parameters ) )
	console.log( 'Received JSON object:' + JSON.stringify( content ) )
	return 'ok'
}
rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], service )
```

#### assign function
Other way to assign is to use the __assign function__ directly.

Example:
```javascript
async function service( request, content ){
	...
}
// bind the service funciont to all http request types
rest.assign( '*', [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], service )
...
// bind the service funciont to only the given http request types
rest.assign( ['head','get','post'], [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], service )
```

#### Reflective assignement

See chapter for details: [Reflective publishing](#reflective-publishing)


#### parameters

After each assign function you might need to pass the followings:
- a [path description](#path-description)
- a function to be called.

## Path description
[connect-rest](https://github.com/imrefazekas/connect-rest) supports many options to be used as path description.

Of course simple paths can be defined as follows:
```javascript
rest.get('/user/profile', asyncFunctionN0 )
```

But I guess you are interested in more complex solutions. Please, fing them below:

### Regular expression
```javascript
rest.get( /^\/[tT]([a-zA-Z]){4}$/g, asyncFunctionN0 )
```

This will match to URIs of _'/api/tAbba'_ but won't to _'/api/t1abcd8'_.

### Named parameters
```javascript
rest.get('/books/:title', asyncFunctionN0 )
```
or
```javascript
rest.get('/books/:title/:chapter', asyncFunctionN0 )
```
You can define parametrized paths for services to accept REST variables from the caller.
In this case, whatever string is after the 'books', will be interpret as variable(s) and passed to the service function via the request object.

So sending a get request to the uri '/api/books/AliceInWonderland/1', will result the following request object:
```javascript
{"headers": ...,"parameters":{"title":"AliceInWonderland", "chapter": "1"}}
```

### Optional parameter
```javascript
rest.post('/store/?id', asyncFunctionN )
```

This definition allows you to define one optional parameter at the end of the path. It might be called using
```javascript
'/store'
```
or using
```javascript
'/store/108'
```
paths. Both HTTP calls will be directed to the same functionN service.
In latter case, the '108' will be set as a parameter in the request object with the value of '108'.

### General matcher
```javascript
rest.get('/inquire/*book', asyncFunctionM )
```
This definition gives you the possibility to define a general matcher allowing to have been called with anything after the string
```javascript
'/inquire'
```
so can be called using
```javascript
'/inquire/alice/in/wonderland'
```
or using
```javascript
'/inquire/oz/the/great/wizard'
```
paths. This results to have the parameter 'book' with value
```javascript
'alice/in/wonderland' or 'oz/the/great/wizard'
```
respectively.

You can make rather complex mixtures of those options as well:
```javascript
'/borrow/:uid/?isbn/:bookTitle'
```
One can call this with uri:
```javascript
'borrow/2/AliceInWonderland' or 'borrow/2/HG1232131/AliceInWonderland'
```
The character '*' can be used for both path and version too to make generic bindings:
```javascript
{ path: '*', version: '*' }
```
Be aware, that this path will be matched to all paths within the defined context.


### Range matcher
```javascript
rest.get( '/convert/@format', function( request, content ){
	return 'ok'
}, { format:[ 'euro', 'usd', 'huf' ] } )
```
This definition creates a rest service answering to GET requests if the format part of the URI is contained by the array in the option object. The character _'@'_ tells the [connect-rest](https://github.com/imrefazekas/connect-rest) to match the parameter _'format'_ to the array called by the same name.

By calling this service with the following URI _'/api/convert/usd'_ will be executed, but calling with _'/api/convert/gbp'_ no rest will be called and 404 will be returned.


### Special assigns:
You can use the all options above at once.
```javascript
[ { path: '/rent/:country/?isbn/*bookTitle', version: '<2.0.0' }, { path: '/borrow/:uid/?isbn/?bookTitle', version: '>=2.1.1' } ]
```

Just define what you really need. :)


### Parameter processing

The logic how [connect-rest](https://github.com/imrefazekas/connect-rest) is managing parameter replacement is the following:

The parameters are processed in the path definition order and any missing optional parameter will be filled with empty strings to keep the order of them keeping in sight all mandatory parameters put after the optional ones.


## Versioning
As for versioning, the syntax is [semantic versioning](http://semver.org), the same you use for [npm](https://npmjs.org)
```javascript
rest.get( { path: '/special', version: '1.0.0' }, asyncFunctionN0)
```
So you can use different version specificaiton depending on your need:
```
version: '1.0.0 - 2.9999.9999'
version: '2.0.1'
version: '2.x'
version: '~1'
version: '>=1.0.2 <2.1.2'
```
Only the requests defining the right version number will match the defined paths.

[connect-rest](https://github.com/imrefazekas/connect-rest) ignores all unmatching calls which might fail by the badly given path or version.

[Back to Feature list](#features)


## Rest functions

A rest function is an async JS function you can define easily.

Every handler function receives
- a 'request' object containing "headers", "parameters", "files", "session" properties
- an optional 'content' object which is the object extracted from the http body's payload.

```javascript
rest.get( { path: '/personal/:uid', version: '1.0.0' }, async function( request, content ){
	return { name: 'John Doe' }
})
```

The result object can be the followings:

- String
- Buffer
- Stream
- Function
- { result: String | Buffer | Stream | Function, options: object }

Buffers are converted to Strings or JSONs depending on the mime-types. (see the [Customize HTTP response](#customize-http-response) )
```javascript
rest.get('/handlers/buffer', async function( request, content ){
	return new Buffer( 'ok', 'utf-8')
})
```
Streams are read to a buffer and returned as strings.
```javascript
rest.get('/handlers/stream', async function( request, content ){
	return fs.createReadStream( './test/data/answer.text', { encoding : 'utf-8'} ) )
})
```
Functions must be async, execution must define the String to be sent back.
```javascript
rest.get('/handlers/function', async function( request, content ){
	return async function( ){ return 'ok' }
})
```

If the return object has a 'result' and an 'options' attribute, the result attribute will be considered as return value and options is meant to control HTTP status code or data conversion. See below for details...

[Back to Feature list](#features)


## Proxy Rest Services

One can define proxying REST services easily using [connect-rest](https://github.com/imrefazekas/connect-rest) as follows:

```javascript
rest.proxy( 'get', '/proxyEmpty', { url: 'http://just-another-site.com:8080/api/empty', method: 'get' } )
```

This will create a REST service on path _'[context]/proxyEmpty'_ answering _'GET'_ calls and proxying all calls to a remote point: _'http://just-another-site.com:8080/api/empty'_.

By default all request parameters will be also sent without any modification. You can prevent this if you set the attribute _'ignoreQuery'_ in the last parameter as follows:

```javascript
rest.proxy( 'get', '/proxyEmpty', { url: 'http://just-another-site.com:8080/api/empty', ignoreQuery: true } )
```

Considering the wide range of REST calls might look like, it could be useful to bypass all headers to the remote site as the following code shows:

```javascript
rest.proxy( 'get', '/proxyEmpty', { url: 'http://just-another-site.com:8080/api/empty', bypassHeader: true } )
```

This will send further all API_KEYS and other header set for a request sent to this service.

Of course the need to use different headers might appear when proxying a request to a remote/foreign point, so you can define your own headers as well:

```javascript
rest.proxy( 'get', '/proxyEmpty', { url: 'http://just-another-site.com:8080/api/empty', remoteHeaders: { /* key-pairs here */ } } )
```

[Back to Feature list](#features)


## Customize HTTP response

Connect-rest allows you to pass a composed object as return value to control HTTP response like status code.


### Status codes


As for status code, all you need to do is this:

Error case:

```javascript
rest.get( '/invalidPath', async function( request, content ){
	let error = new Error('invalid path')
	error.statusCode = 404;
	throw error
});
```

Special case when no error occurred, yet the http request's status has to be set:

```javascript
rest.get( '/special', async function( request, content ){
	return { result: 'Processing...', options: { statusCode: 202 } }
})
```

[Back to Feature list](#features)

### Response headers

To refine the headers in the response HTML, the way is the same as above: customize the 'options' object of the return value.

```javascript
rest.get( '/special', function( request, content ){
	return { result: 'Content.', options: { headers: { ETag: "10c24bc-4ab-457e1c1f" } } }
})
```

### Minify response JSON

You can make the response JSON object minified by passing a single boolean parameter to the 'options' object:

```javascript
rest.get( '/special', function( request, content ){
	...
	return { result: '{ "key"     :    "value" }', options: { minify: true } }
})
```

This will send
```javascript
{"key":"value"}
```

to the client.


## Customize answers of REST functions

When assigning routes with rest API you can pass an object too. This object looks like this:
```javascript
{
	contentType: ''
	validator: ...
}
```

The contentType defines what the given REST service will retrieve. If not given, 'application/json' will be used.

The validator is a function, which can be used to determine if the REST function can be called in a given circumstances or should be ignored. This could mean authorization or ip address validation or other security concern.

```javascript
rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], function( request, content ){
	return JSON.stringify(content);
}, null, { contentType:'application/xml', validator: function(req, res){ return _.contains(req.user.roles, "superuser"); } } );
```

[Back to Feature list](#features)


## API_KEY management

The option passed to the [connect-rest](https://github.com/imrefazekas/connect-rest) might contain an array enumerating accepted api_keys:

```javascript
var options = {
	'apiKeys': [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ]
	...
}
```

If property 'apiKeys' is present, the associated array of strings will be used as the list of api keys demanded regarding every incoming calls.
So having such option, a call should look like this:

```javascript
'/api/books/AliceInWonderland/1?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'
```

otherwise error response will be sent with status code 401 claiming: 'API_KEY is required.'.

You can restrict access on service-level. When you call

```javascript
rest.get( { path: '/shake', version: '>=2.0.0' }, async function( request, content ){
	return 'OK'
}, { apiKeys:['1234-1234-1234-1234'] } )
```

That will require to use the API_KEY _'1234-1234-1234-1234'_ when call that REST service.
This will help you refine your access control on service basis.


## Unprotected REST service
When you are using API_KEYs, you still might want to have 'exceptions'.
Functions which can be served out of the border os API_KEY restriction.
You can turn off that protection for a given service like this:

```javascript
rest.get( { path: '/special', unprotected: true }, asyncFunctionN0)
```

## Protector
Protector is a function which can be passed when creating a rest services and decides if a given call is allowed or should be blocked and ignored.
So the protector function called in every rest call when the given path is evaluated and matched and boolean return value of the function tells to the [connect-rest](https://github.com/imrefazekas/connect-rest) to allow the rest function's execution to take place or blocked by some security reason.

```javascript
rest.get( { path: '/special', protector: async function( req, res, pathname, path ){ return 'ok' } }, asyncFunctionN0);
```

A protector function receives all parameters to able to respond the query the case requires it. For example an A&A protector should manage the necessary measurements and might drop the request.
Remember: it is designed to be async, trowing exception in the async function will notify the [connect-rest](https://github.com/imrefazekas/connect-rest) to not handle the request.
You can have such functions to define session-based dynamic protection or differentiate between widely available rest calls and restricted business-sensitive feature.

[Back to Feature list](#features)


## Context
[connect-rest](https://github.com/imrefazekas/connect-rest) uses context uri prefix by default to create a speparated 'namespace' for the rest functions.
You can define it dynamically:

```javascript
rest.context( '/api' ) // means that every rest calls need to be sent to '/api/X' path.
```

or through the option object as well when you add the middleware to the connect object:

```javascript
var options = {
	'context': '/api'
}
var rest = Rest.create( options )
connectApp.use( rest.processRequest() )
```

Default _context_ is the '/api' string.

## Orchestrating the contexts

The [connect-rest](https://github.com/imrefazekas/connect-rest) also allows you to  specify the context at REST function level. This helps if you want to orchestrate your functions using multiple contexts.
Let me show you:

```javascript
rest.get( { path: '/workspace', context: '/pages' }, asyncFunctionN0)
```

This REST function can be called by sending a _GET_ request to the address of

```
/pages/workspace
```

This way you can easily manage dynamic templates not being forced to be in the same context as API calls.

__You can orchestrate the contexts of your architecture as it pleases you.__


## Discovery services
[connect-rest](https://github.com/imrefazekas/connect-rest) provides a built-in service: discover. Via a simple get request, it allows you - by specifying a version - to discover the plublished REST apis matching the given version.

```javascript
var options = {
	'discover: { path': 'discover', secure: true }
}
var rest = Rest.create( options )
connectApp.use( rest.processRequest() )
```

This will enable this service - considering the context described above - on the path '/api/discover/:version'. Sending a get request to - let's say - this path

```
http://localhost:8080/api/discover/3.0.0
```

would retrieve all services which can be called using version 3.0.0 (non-versioned and matching versioned services). The returned JSON is the following:

```javascript
{
	"HEAD":["/peek"],
	"GET":["discover/:version","/books/:title/:chapter"],
	"POST":["/store",{"path":"/make","version":">=1.0.0"},"/act","/do",{"path":"/shake","version":">=2.0.0"},{"path":"/twist","version":">=2.1.1"}],
	"PUT":[],
	"DELETE":[]
}
```

The option secure tells connect-rest if security should be active for this service.

## Prototype services
The assign-methods allows you to set an extra object in the third parameter. An object which can be considered as a prototype of the expected parameter of the service when a client wants to make a call.

```javascript
rest.post( [ { path: '/shake', version: '>=2.0.0' }, { path: '/twist', version: '>=2.1.1' } ], asyncFunctionN, { prototypeObject: {'title': 'Alice in Wonderland'} } )
```

That parameter debriefs the client what structure the functionN expects to receive.
To activate this feature, first you have to add a new attribute to the options object:

```javascript
var options = {
	'apiKeys': [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	'proto: { path': 'proto', secure: true },
	'logger': 'connect-rest'
}
```

This 'proto' object tells connect-rest that the given path is accepting requests to retrieve prototypes:

```javascript
'/api/proto/POST/2.3.0/api/twist?api_key=849b7648-14b8-4154-9ef2-8d1dc4c2b7e9'
```

will retrieve the object

```javascript
{'title': 'Alice in Wonderland'}
```

because the service

	on path '/api/twist' and method 'POST' with version '2.3.0'

can be called and there is an assigned prototype object to it.
Giving access method, version and path is mandatory for this feature.

The option secure tells connect-rest if security should be active for this service.


[Back to Feature list](#features)


## Remove services
One can remove a published service by calling the following function:

```javascript
rest.unpost( '/shake' )
```

That code removes all REST services which would be fired by calling with the URI _'/shake'_.
The same path matching logic is used to determine if a given REST function should be removed.

Every publishing method available in [connect-rest](https://github.com/imrefazekas/connect-rest) has a removing-pair function:

	unpost, undel, unget ... unassign

There is a second parameter if you want to specify the version of the services you would like to remove:

```javascript
rest.unpost( '/shake', 1.0.0 )
```

... unlinking the service answering to the given URI with the given version.

[Back to Feature list](#features)


## Logging
In the option object passed to the constructor, there is an optional parameter 'logger', which enables the logging functionality:

```javascript
var options = {
	'apiKeys': [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	'discoverPath': 'discover',
	'logger': 'connect-rest'
}
```

or

```javascript
var options = {
	'apiKeys': [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	'discoverPath': 'discover',
	'logger': loggerInstance
}
```

You can set:
- a string, which will be interpret as the name of the logger seen in the logs, or
- passing a logger instance to be used.

By default, connect-rest is using [pino](https://github.com/pinojs/pino) as logging library. Here is [why...](https://github.com/pinojs/pino#benchmarks). Keep the compatibility to pino if you are passing own logging solution.

In the absence of 'logger' property, no logs will be made.
The [connect-rest](https://github.com/imrefazekas/connect-rest) will use level 'info' for entry and exit points of services and 'debug' for the milestones of all internal processes.

[Back to Feature list](#features)


## Reflective publishing
[connect-rest](https://github.com/imrefazekas/connect-rest) allows you to have an extremely easy and fast way to publish your services.

You can define your own services like this in a file (services.js in this example):

```javascript
function health( request ){
	return 'ok'
}
function record( request, content ){
	return 'saved'
}
exports.health = health;
exports.record = record;
```
and publish them this way:

```javascript
var services = require('./services')
...
rest.publish( services )
```

This will discover all functions assigned to the exports having a name which conforms the following regular expression:

```javascript
/^[a-zA-Z]([a-zA-Z]|\d|_)*$/g
```

The logic is simple. If the function has
- 1 parameter: it will be a 'get' method
- 2 parameters: it will be a 'post' method

and the path will be its name. So, by executing one single statement you will automatically have the following services:

	/health on Get
	/record on Post

If you have 100 services defined, then 100 rest api you will have automatically. Nice.

## Domain support
[connect-rest](https://github.com/imrefazekas/connect-rest) adds support for domain-based error handling. To the options object you can pass a boolean value requesting the lib to create domain as  [NodeJS docs defines](http://nodejs.org/api/domain.html#domain_domain):

```javascript
var options = {
	apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	discoverPath: 'discover',
	protoPath: 'proto',
	logger: 'connect-rest',
	domain: true
}
```

or you can have a more sophisticated version by passing a complete object as follows:


```javascript
var options = {
	apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
	discoverPath: 'discover',
	protoPath: 'proto',
	logger: 'connect-rest',
	domain: {
		closeWorker: function(req, res){... },
		closeRequest: function(req, res){... }
	}
}
```

Where the function __closeWorker__ is an optional function which is called when error occurred and supposed to close the current worker instance if app is running in a node cluster.

The function __closeRequest__ is an optional function which is called to close the request object on error if you want to perform custom response message. By default [connect-rest](https://github.com/imrefazekas/connect-rest) sets the error code 500 and returns a simple error message 'There was a problem!'.


[Back to Feature list](#features)


## Answering async rest requests

[connect-rest](https://github.com/imrefazekas/connect-rest) provides a way to serve async rest requests. It might be important - especially between fragmented server-side environment - to call rest services and accept the answer on a specific callback URL specified by the requestor.

The _client_ has to specify a request parameter _"callbackURL"_ possessing the callback URL where the answer has to be sent.
Having sent the request, [connect-rest](https://github.com/imrefazekas/connect-rest) will answer it right away with status code _200_ and message _Ok._ and having the result created, it will sent via _HTTP POST_ to the URL given in the HTTP parameters.

This process is performed behind the scenes, you do not have do anything special about it. If that parameter can be found in the HTTP request, the call will be threaten as async request.

[Back to Feature list](#features)


## Dispatchers

In some cases, you might face with a situation where other 3rd party connect library has to be used and the case might require for path-related logic to be used. [connect-rest](https://github.com/imrefazekas/connect-rest) is designed to be able to use as simple path processing helper library as well.

```javascript
connectApp.use( Rest.dispatcher( 'GET', '/dispatcher/:subject', function(req, res, next){
	res.end( 'Dispatch call made:' + req.params['subject'] )
} ) )
```
This simple code makes is pretty straightforward. In case of a _'GET'_ HTTP request coming to the url _'/dispatcher'_, the given function is executed. That function can be any third party connect lib you want to use.

[Back to Feature list](#features)



## More examples

I have collected a few examples from some implementations submited by users of [connect-rest](https://github.com/imrefazekas/connect-rest).

Might help to have a more complete picture about what you can reach and realize with this library. In case of any wanted scenario, please open a ticket and I will happily comply with it.

Example, how to __restrict rest api calls__ to only those who logged in already, meaning to have some session info

```javascript
var protectBySession = function(req, pathname, version){
	return req.session && req.session.uid;
};
rest.get( { path: '/model/person', unprotected: true, protector: protectBySession, version: '1.0.0' }, async function( request, content ){
	return personModel
});
```

Example to how define a __free-to-call rest function__ in a very restricted environment.
__Dynamic templating__ is a typical scenario, no versioning is needed, nore api_key or session-based protection, must be put on a separate context and result has mime-type of "text/html"

```javascript
var allower = function(req, pathname, version){
	return true;
};
rest.get( { path: '/?page/?id', unprotected: true, protector: allower, context: '/pages' }, async function( request, content ){
	// render some page
	let res = await renderer.render( request.parameters.page, request.parameters.id )
	return res
}, { contentType:'text/html' } )
```

A fairly complex REST path which is needed in some cases and a custom return status code:

```javascript
rest.get( '/call/:system/?entity/?version/:subject/*', async function( request, content ){
	// Do some business logic
	return { result: 'Done.', options: {statusCode:201} }
}, { contentType:'application/json' } )
```

In this case you call this path by the following uris:

	/call/library/books/AliceInWonderland
	/call/library/books/2.0/AliceInWonderland
	/call/library/AliceInWonderland
	/call/library/AliceInWonderland/firstedition/chapter1

Not a typical or strictly REST-conform scenario, but you might end up with the need of complex URIs.

__Tip:__ To manage all calls not handled by connect-rest could be also important. The following code demonstrates how to define a small middleware, which is executed when no REST function is matched.

```javascript
var rest = Rest.create( options )
app.use( rest.processRequest() )
app.use( function(req, res, next){
	if(req.session)
		req.session.destroy()
	// render error page by some renderer...
	renderer.render( 'error', {}, function(err, html){
		res.writeHead( 500, { 'Content-Type' : 'text/html' } )
		res.end( html );
	} )
} )
```

## License

(The MIT License)

Copyright (c) 2014 Imre Fazekas

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


## Changelog

- 3.0.0: Moved to Node8 
- 2.0.0: Moved to Node4 and ES6
- 1.8.0: OPTIONS method supported
- 1.6.0: REST services can possess own API key set
- 1.5.0: remove rest function
- 1.4.0: logging rewritten
- 1.3.0: range-based mapping added
- 1.2.x: fixes...
- 1.2.0: Stream, Buffer and Function can be set as return object
- 1.1.0: Proxies added
- 1.0.0: Switch to connect v3!
- 0.9.x: fixes...
- 0.9.0: context specification at REST function level is allowed.
- 0.8.x: fixes...
- 0.8.0: protector introduced
- 0.7.7: check function added. Now you can test if a given call would/allowed to take place.
- 0.7.x: fixes...
- 0.6.x: fixes...
- 0.6.0: dispatchers added
- 0.5.0: minifying services added
- 0.0.48: An rest service can now be unprotected
- 0.0.43-47: Various fixes/improvements
- 0.0.42: Incoming request count monitoring added
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
	- better optional parameter handling allowing to use optional parameter chain like: /set/?department/?room
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
