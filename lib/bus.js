var newrelic = require('./newrelic');

function Bus(httphelper) {
	this.httphelper = httphelper;
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
			options.newrelic.version = options.newrelic.version || options.version;
			options.newrelic.host = options.newrelic.host || options.host;
			this.newrelic = new newrelic( options.newrelic, this.httphelper, logger );
		}
	}
};
busPrototype.reportExecution = function( callpath, routes, duration ) {
	if(this.options){
		var self = this;
		routes.forEach(function(element, index, list) {
			if( !self.metrics[element.version] )
				self.metrics[element.version] = {};
			if( !self.metrics[element.version][element.path] )
				self.metrics[element.version][element.path] = { maxDuration:0, minDuration:Number.MAX_VALUE, sumDuration:0, count:0 };

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
		var self = this;

		this.logger.debug('Populating monitoring results...' );

		if(this.options.newrelic){
			self.newrelic.populate( self.metrics, self.lastPopulation );
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
