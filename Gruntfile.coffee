module.exports = (grunt) ->
	# prevent from throwing event listener warning
	grunt.event.setMaxListeners( 50 )

	# Project configuration
	grunt.initConfig
		pkg: grunt.file.readJSON('package.json')
		regarde:

			src:
				files: ["_src/**/*.coffee"]
				tasks: [ "coffee:src" ]
		# Tasks
		coffee:

			src:
				expand: true
				cwd: '_src',
				src: ["**/*.coffee"]
				dest: ''
				ext: '.js'

		mochacli:
			options: 
				require: [ "should" ]
				reporter: "spec"
				bail: true
				timeout: 300000
			all: [ "tests/main.js" ]
				




	# NPM MODULES
	grunt.loadNpmTasks( "grunt-regarde" )
	grunt.loadNpmTasks( "grunt-contrib-coffee" )
	grunt.loadNpmTasks( "grunt-notify" )
	grunt.loadNpmTasks( "grunt-mocha-cli" )

	# Run on init
	#grunt.task.run('notify_hooks')

	# just a hack until this issue has been fixed: https://github.com/yeoman/grunt-regarde/issues/3
	grunt.option( "force", not grunt.option( "force" ) )


	# ALIAS TASKS
	grunt.registerTask( "watch", "regarde" )
	grunt.registerTask( "test", "mochacli" )
	grunt.registerTask( "build", [ "coffee" ] )