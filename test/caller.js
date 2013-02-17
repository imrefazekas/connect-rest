var options = {
	hostname: 'localhost',
	port: 8080,
	path: '',
	method: 'GET',
	headers: {
		'accept-version': '*'
	}
};

function testCallZero(http, _, callback, options, payload){ 
	var req = http.request(options, function(res) {
		var body = '';
		res.on('data', function (chunk) {
			body += chunk;
		});
		res.on('end', function ( ) {
			console.log( options.method + ' of '+ options.path +' retrieved: ' + body);
			callback(null, body);
		});
	});
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
		callback(e, 'failed.');
	});
	if( payload )
		req.write( JSON.stringify( payload ) );
	req.end();
}
function testCall1(http, _, callback){ 
	var voptions = _.clone( options );
	voptions.path = '/api/peek';
	voptions.method = 'HEAD';

	testCallZero( http, _, callback, voptions );
}

function testCall2(http, _, callback){
	var voptions = _.clone( options );
	voptions.path = '/api/books';
	voptions.method = 'GET';

	testCallZero( http, _, callback, voptions );
}

function testCall3(http, _, callback){
	var voptions = _.clone( options );
	voptions.path = '/api/store';
	voptions.method = 'POST';

	testCallZero( http, _, callback, voptions, {'message': 'ok'} );
}

function testCall4(http, _, callback){
	var voptions = _.clone( options );
	voptions.path = '/api/make';
	voptions.method = 'POST';
	voptions.headers['accept-version'] = '1.1';

	testCallZero( http, _, callback, voptions, {'message': 'ok'} );
}

function testCall5(http, _, callback){
	var voptions = _.clone( options );
	voptions.path = '/api/do';
	voptions.method = 'POST';

	testCallZero( http, _, callback, voptions, {'message': 'ok'} );
}

function testCall6(http, _, callback){
	var voptions = _.clone( options );
	voptions.path = '/api/twist';
	voptions.method = 'POST';
	voptions.headers['accept-version'] = '2.2.0';

	testCallZero( http, _, callback, voptions, {'message': 'ok'} );
}

exports.testCall1 = testCall1;
exports.testCall2 = testCall2;
exports.testCall3 = testCall3;
exports.testCall4 = testCall4;
exports.testCall5 = testCall5;
exports.testCall6 = testCall6;
