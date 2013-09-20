module.exports = function(grunt) {
	var rest = require('./lib/connect-rest');
	var restBuilder = require('./test/restBuilder');

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');

	grunt.initConfig({
		jshint: {
			all: [ 'lib/*.js', 'lib/**/*.js', '!lib/db/connector.js' ]
		},
		connect: {
			server: {
				options: {
					port: 8080,
					middleware: function(connect, options) {
						var restOptions = {
							apiKeys: [ '849b7648-14b8-4154-9ef2-8d1dc4c2b7e9' ],
							discoverPath: 'discover',
							protoPath: 'proto',
							logger:{ name: 'connect-rest', level: 'debug' },
							context: '/api'
						};
						var middlewares = [
							connect.query(),
							rest.rester( restOptions ),
							restBuilder.getDispatcher( rest )
						];
						restBuilder.buildUpRestAPI( rest );

						return middlewares;
					}
				}
			}
		},
		nodeunit: {
			tests: ['test/nodeunit/caller.js']
		}
	});

	grunt.registerTask('test', ['connect', 'nodeunit']);
	grunt.registerTask('default', ['jshint', 'test']);
};