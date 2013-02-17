var rest = require('../lib/connect-rest');

var http = require('http');
var connect = require('connect');

var connectApp = connect();
global.server = connectApp;

connectApp.use( connect.query() );

connectApp.use( rest.rester() );

rest.post('*', function(content){
	console.log( 'Received:' + JSON.stringify(content) );
});
rest.post('*', function(content){
	console.log( 'Received:' + JSON.stringify(content) );
	return 'ok';
});

var server = http.createServer( connectApp );

server.listen( 8080 );


var options = {
  hostname: 'localhost',
  port: 8080,
  path: '/upload',
  method: 'POST',
  headers: {
    'Accept-Version': '*'
  }
};
var req = http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
req.write('{"message": "Hello"}\n');
req.end();
