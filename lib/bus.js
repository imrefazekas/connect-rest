function Bus(httphelper, _) {
	this.httphelper = httphelper;
	this._ = _;
	this.metrics = { };
}

var busPrototype = Bus.prototype;


busPrototype.initBus = function( options, logger ) {
	if( options && options.populateInterval ){
		this.logger = logger;

		var self = this;
		self.intervalId = setInterval( function(){
			self.populateMetrics();
		}, options.populateInterval );

		this.options = options;
	}
};
busPrototype.reportCall = function( callpath, routes, duration ) {
	if(this.options){
		var self = this;
		this._.each( routes, function(element, index, list){
			if( !self.metrics[element.path] )
				self.metrics[element.path] = [];
			self.metrics[element.path].push( { version:element.version, duration:duration } );
		} );
	}
};
busPrototype.populateMetrics = function( ) {
	if(this.options){
		if(this.logger)
			this.logger.debug('Populating monitoring results...');

		var self = this;

		if(this.options.newrelic){
		}

		if(this.options.console){
			console.log( 'Metrics::', self.metrics );
		}

		self.metrics = {};
	}
};
busPrototype.shutdown = function( ) {
	if( this.intervalId )
		clearInterval( this.intervalId );
};


module.exports = Bus;
