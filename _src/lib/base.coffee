extend 	= require( "extend" )
_ 		= require( "lodash" )._

# # Basic Module

# Worker basics to handle errors and initialize modules

module.exports = class Base

	###
	## _defaults
	
	`base._defaults( id, cb )`
	
	Set defaults as empty. They will be set in extened classes.
	
	@return { Object } Return empty object 
	
	@api private
	###
	_defaults: =>
		return {}


	###
	## constructor
	
	`base.constructor( id, cb )`
	
	Initialized and set the config.
	
	@param { Object } options Desc 
	
	@api private
	###
	constructor: ( options )->
		@config =  extend( true, {}, @_defaults(), options )

		# If an initilized function is given then it will be called
		@initialize() if @initialize
		return


	###
	## _handleError
	
	`basic._handleError( cb, err [, data] )`
	
	Baisc error handler. It creates a true error object and returns it to the callback, logs it or throws the error hard
	
	@param { Function|String } cb Callback function or NAme to send it to the logger as error 
	@param { String|Error|Object } err Error type, Obejct or real error object
	
	@api private
	###
	_handleError: ( cb, err, data = {} )=>
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

	