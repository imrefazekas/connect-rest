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

connectApp.use( rest.rester() );

var server = http.createServer( connectApp );

server.listen( 8080 );

restBuilder.buildUpRestAPI( rest );

async.parallel([
  async.apply( caller.testCall1, http, _ ),
  async.apply( caller.testCall2, http, _ ),
  async.apply( caller.testCall3, http, _ ),
  async.apply( caller.testCall4, http, _ ),
  async.apply( caller.testCall5, http, _ ),
  async.apply( caller.testCall6, http, _ )
  ], function(err, results){
    console.log('Tests finished.');
    server.close();
    assert.ifError( err );
});
