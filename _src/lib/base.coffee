extend 	= require('extend')
_ 		= require('lodash')._

# # Basic Module

# Worker basics to handle errors and initialize modules

module.exports = class Base

	_defaults: =>
		return {}

	constructor: ( options )->
		@config = extend( true, {}, @_defaults(), options )

		@initialize() if @initialize
		return

	# handle a error
	###
	## _handleError
	
	`basic._handleError( cb, err [, data] )`
	
	Baisc error handler. It creates a true error object and returns it to the callback, logs it or throws the error hard
	
	@param { Function|String } cb Callback function or NAme to send it to the logger as error 
	@param { String|Error|Object } err Error type, Obejct or real error object
	
	@api private
	###
	_handleError: ( cb, err, data = {} )=>
		#console.log 'DEBUG', cb, err, data
		

		# try to create a error Object with humanized message
		if _.isString( err )
			_err = new Error()
			_err.name = err
			_err.message = data or "unkown"
			_err.customError = true
		else 
			_err = err

		if _.isFunction( cb )
			cb( _err )

		else if _.isString( cb )
			console.error "error", cb, _err

		else
			throw _err
		return

	