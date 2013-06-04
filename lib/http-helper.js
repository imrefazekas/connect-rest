exports.opt = {
	hostname: 'localhost',
	port: 8080,
	path: '',
	method: 'POST',
	headers: {
		'accept-version': '1.0.0'
	}
};
exports.generalCall = function(http, voptions, callback, payload){
	var req = http.request( voptions, function(res) {
		console.log("Got response: " + res.statusCode);
		var body = '';
		res.on('data', function (chunk) {
			body += chunk;
		});
		res.on('end', function ( ) {
			callback(null, body);
		});
	});
	req.on('error', function(err) {
		console.log("Got error: " + e.message);
		callback(err, 'failed.');
	});
	if( payload )
		req.write( JSON.stringify( payload ) );
	req.end();
};