var http = require('http');
var https = require('https');
var _ = require('underscore');
var url = require('url');

function NewRelic(options, httphelper, logger){
	this.options = options;
	this.httphelper = httphelper;
	this.logger = logger;

	this.json = {
		agent: {
			host : options.host || 'localhost',
			pid: process.pid,
			version : options.version || '1.0.0'
		},
		components: []
	};
}

var newrelicPrototype = NewRelic.prototype;
newrelicPrototype.populate = function( data, lastPopulation ){
	var self = this;

	var uri = self.options.platformApiUri;
	var licenseKey = self.options.licenseKey;
	self.json.components = [];

	Object.keys( data ).forEach(function(version, vindex, _array) {
		var paths = data[version];
		var versionPrefix = 'v'+version+':';

		Object.keys(paths).forEach(function(path, pindex, _array) {
			var metrics = paths[path];

			self.json.components.push({
				name: versionPrefix + path,
				guid: self.options.pluginName,
				duration : (Date.now() - lastPopulation) / 1000,
				metrics: {
					"Average duration": {
						min : metrics.minDuration,
						max : metrics.maxDuration,
						value: metrics.sumDuration,
						total: metrics.sumDuration,
						count: metrics.count
					}
				}
			});
		});
	});

	self.httphelper.generalCall(uri, 'POST',
		{'X-License-Key':licenseKey, 'Content-Type':'application/json', 'Accept':'application/json' }, null, self.json, null,
		function(err, result, status){
			if( status.statusCode === 204 ){
				self.logger.info('Metrics have been populated.', err, result, status);
			}
			else if( status.statusCode === 400 ){
				self.logger.error('Request was malformed.', err, result, status);
			}
			else if( status.statusCode === 403 ){
				self.logger.error('Forbidden probably due to a bad license key.', err, result, status);
			}
			else if( status.statusCode === 404 ){
				self.logger.error('Invalid URL.', err, result, status);
			}
			else if( status.statusCode === 405 ){
				self.logger.error('Invalid method.', err, result, status);
			}
			else if( status.statusCode === 413 ){
				self.logger.error('POST body too large. Try splitting at component boundaries. Split along metric name spaces.', err, result, status);
			}
			else if( status.statusCode === 500 ){
				self.logger.error('Error on New Relic\'s servers. could be due to malformed data or system trouble.', err, result, status);
			}
			else if( status.statusCode === 503 || status.statusCode === 504 ){
				self.logger.error('New Relic servers busy - this happens by design from time-to-time keep collecting metrics.', err, result, status);
			}
			else {
				self.logger.info('Returned.', err, result, status);
			}
		}
	);
};

module.exports = NewRelic;
