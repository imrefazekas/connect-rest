function Bus(http, https, url, httphelper, _) {
	this.http = http;
	this.https = https;
	this.url = url;
	this.httphelper = httphelper;
	this._ = _;
	this.metrics = { };

	this.maxCallCount = 0;
	this.maxDuration = 0;
}

var busPrototype = Bus.prototype;


busPrototype.initBus = function( options, logger ) {
	if( options && options.populateInterval ){
		this.logger = logger;

		var self = this;
		self.lastPopulation = Date.now();
		self.intervalId = setInterval( function(){
			self.populateMetrics();
			self.lastPopulation = Date.now();
		}, options.populateInterval );

		this.options = options;

		if(options.newrelic){
			this.newrelicJSON = {
				agent: {
					host : this.options.host || this.options.newrelic.host || 'localhost',
					pid: process.pid,
					version : this.options.version || this.options.newrelic.version || '1.0.0'
				},
				components: []
			};
		}
	}
};
busPrototype.reportExecution = function( callpath, routes, duration ) {
	if(this.options){
		var self = this;
		this._.each( routes, function(element, index, list){
			if( !self.metrics[element.version] )
				self.metrics[element.version] = {};
			if( !self.metrics[element.version][element.path] )
				self.metrics[element.version][element.path] = { maxDuration:0, minDuration:0, sumDuration:0, count:0 };

			var metrics = self.metrics[element.version][element.path];
			metrics.maxDuration = metrics.maxDuration < duration ? duration : metrics.maxDuration;
			metrics.minDuration = metrics.minDuration > duration ? duration : metrics.minDuration;
			metrics.sumDuration += duration;

			metrics.count++;
		} );
	}
};
busPrototype.populateMetrics = function( ) {
	if(this.options){
		if(this.logger)
			this.logger.debug('Populating monitoring results...');

		var self = this;

		if(this.options.newrelic){
			var uri = this.options.newrelic.platformApiUri;
			var licenseKey = self.options.newrelic.licenseKey;
			self.newrelicJSON.components = [];

			self._.each( self.metrics, function(paths, version, list){
				var versionPrefix = 'v'+version+':';
				self._.each( paths, function(metrics, path, list){
					self.newrelicJSON.components.push({
						name: versionPrefix + path,
						guid: self.options.newrelic.pluginName,
						duration : (Date.now() - self.lastPopulation) / 1000,
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
				} );
			} );

			this.httphelper.generalCall(this.http, this.https, this.url, this._, uri, 'POST',
				{'X-License-Key':licenseKey, 'Content-Type':'application/json', 'Accept':'application/json' }, null, self.newrelicJSON, null,
				function(err, result, status){
					console.log('!!!!!!!!!!!!!!!!!!', err, result, status);
				}
			);

		}

		if(this.options.listener){
			this.options.listener( self.metrics );
		}

		if(this.options.console){
			console.log( 'Metrics::', self.metrics );
		}

		self.metrics = { };
	}
};
busPrototype.shutdown = function( ) {
	if( this.intervalId )
		clearInterval( this.intervalId );
};


module.exports = Bus;
