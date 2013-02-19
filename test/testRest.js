var rest = require('../lib/connect-rest');

var http = require('http');
var connect = require('connect');
var assert = require('assert');
var async = require('async');
var _ = require('underscore');

var restBuilder = require('./restBuilder');
var caller = require('./caller');

var connectApp = connect();
global.server = connectApp;

connectApp.use( connect.query() );

var options = {
    'apiKeys': [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
    'discoverPath': 'discover',
    'logger': 'connect-rest'
};
connectApp.use( rest.rester( options ) );

var server = http.createServer( connectApp );

server.listen( 8080 );

restBuilder.buildUpRestAPI( rest );

async.parallel([
  async.apply( caller.testCall1, http, _ ),
  async.apply( caller.testCall2, http, _ ),
  async.apply( caller.testCall3a, http, _ ),
  async.apply( caller.testCall3b, http, _ ),
  async.apply( caller.testCall4, http, _ ),
  async.apply( caller.testCall5, http, _ ),
  async.apply( caller.testCall6, http, _ )
  ], function(err, results){
    console.log('Tests finished.');
    server.close();
    assert.ifError( err );
});
