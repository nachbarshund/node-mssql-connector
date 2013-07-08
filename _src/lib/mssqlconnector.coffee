_ 		= require('lodash')._
extend 	= require('extend')
Connection 	= require('tedious').Connection
DataTypes 	= require('tedious').TYPES
Request 	= require('tedious').Request


class MSSQLRequestBase extends require('./base')

	constructor: ( @statement, parent )->
		super

		# Set the defaults
		@_params 	= {}
		@_outparams 	= {}
		@_fields 	= []

		@connection 	= parent.connection
		@config 	= parent.config

		@_setParams()
		return

	###
	## exec
	
	`mssqlconnector.exec( cb )`
	
	Execute the query. Make a new connection for each request and close after success. 
	Output will only set on storedprocedure.

	Example return:

		{
		    result: [
		        {
		            id: 144,
		            name: 'UpdatedName',
		            jahrgang: 1986,
		            created: FriApr19201311: 46: 00GMT+0200(CEST)
		        }
		    ],
		    rowcount: 3,
		    output: [
		        {
		            Total: 100
		        },
		        {
		            Teststring: 'Output'
		        }
		    ]
		}

	@param { Function } cb Callback function 
	
	@api public
	###
	exec: ( cb ) =>	
		if not @_checkParams()
			return

		# Start when connection is there
		@connection.on 'connect', ( err ) =>
			if err
				@_handleError( cb, 'connection-failed', err )
				return
			
			# Result which will be returned
			result 	= []
			output 	= []

			request = new Request @statement, (err, rowCount) =>
				if err
					@_handleError( cb, 'request-error', err )
					return

				returnobj = 
					result: result
					rowcount: rowCount

				# Return the data
				cb( null,  returnobj )
				return

			request.on 'row', (columns) =>
				result.push( @_parseRow( columns ) )
				return

			# This is only called if there are any output parameters in SQL 
			request.on 'returnValue', ( key, value, options )->
				_key = key?.toString()
				obj = {}
				obj[ _key ] = value
				output.push( obj )
				return
			
			@_setRequestParams request,  =>
				@connection.execSql( request )
				return
			return
		return

	
	###
	## param
	
	`mssqlconnector.param( field, datatype, value )`
	
	@param { String } field Fieldname in database 
	@param { String } datatype Datatype of field
	@param { String } value Value to set
	
	@return { Object } Return this 
	
	@api public
	###
	param:  ( field, datatype, value ) =>
		# Check if field is valid

		if not @_checkField( field, datatype )
			@_handleError( null, 'param-not-found' )
			return

		if not @_checkDataType( datatype )
			@_handleError( null, 'invalid-datatype' )
			return
		
		# If everything correct set param to global
		@_params[ field ] = 
			type: @_getDataType( datatype )
			value: if value? then value else null
		return @
	

	###
	## outParam
	
	`mssqlconnector.outParam( field, datatype )`
	
	Set the output param for stored procedures.
	
	@param { String } field Name of returned value in stored procedure
	@param { String } datatype Datatype of field
	
	@return { Object } Return this 
	
	@api public
	###
	outParam:  ( field, datatype ) =>
		@_outparams[ field ] = 
			type: @_getDataType( datatype )
		return @


	###
	## _checkDataType
	
	`mssqlconnector._checkDataType( id, cb )`
	
	Check if given datatype is valid tedious datatype
	
	@param { String } datatype 

	@return { Boolean } Return  
	
	@api private
	###
	_checkDataType: ( datatype )=>
		return DataTypes[ datatype ]?


	###
	## checkField
	
	`mssqlconnector.checkField( id, cb )`
	
	Check if field is in SQL statement and not already set.
	
	@param { String } field Fieldname
	
	@return { Booelan } Return  
	
	@api private
	###
	_checkField: ( field, datatype )=>
		return field in @_fields and not @_params[ field ]? and datatype?.length


	###
	## _checkParams
	
	`mssqlconnector._checkParams()`
	
	Check if the set param items are valid to the fields from SQL statement
	
	
	@return { Boolean } Return  
	
	@api private
	###
	_checkParams: =>
		# If there are more internal SQL params as @DECLARE We could not check here
		if @config.sqlparams
			return true

		paramkeys = _.keys( @_params )

		if paramkeys?.length isnt @_fields?.length
			@_handleError( null, 'param-field-length' )
			return false

		# Check if there are all files set
		for _field in @_fields
			if _field not in paramkeys
				@_handleError( null, 'missing-field' )
				break
				return false
		return true


	###
	## _getDataType
	
	`mssqlconnector._getDataType( datattype )`
	
	Return the correct tedious datatype
	
	@param { String } datatype
	
	@return { String } Return Correct datatytpe 
	
	@api private
	###
	_getDataType: ( datatype ) =>
		# Doublcheck validation
		if not @_checkDataType( datatype )
			@_handleError( null, 'invalid-datatype' )
			return
		return DataTypes[ datatype ]



	###
	## setParams
	
	`mssqlconnector._setParams()`
	
	Set all given params in SQL statement with @
		
	@api private
	###
	_setParams: =>
		_regex = /[@]+[A-Za-z0-9]+/g

		# All params with leading @
		givenparams =  @statement.match( _regex )

		if not givenparams
			return

		for field in givenparams
			# Cut the @
			_fieldname =  field[1...]

			# Check if there are any SQL statements like @@@IDENTITY
			if _fieldname not in @_fields and _fieldname[0] isnt '@'
				@_fields.push(  _fieldname )
		return


	###
	## _setRequestParams
	
	`mssqlconnector._setRequestParams( request, cb )`
	
	Set the correct Parameters for tedious request
	
	@param { Object } request Request object from tedious 
	@param { Function } cb Callback function 
	
	@api private
	###
	_setRequestParams: ( request, cb ) =>
		for _key, _param of @_params
			request.addParameter _key, _param.type, _param.value

		if _.isFunction( cb )
			cb()		
			return
		@_handleError( null, 'no-exec-callback' )
		return


	###
	## _parseRow
	
	`mssqlconnector._parseRow(columns )`
	
	Set the value to a correct JSON. This will called by each row.
	
	@param { Object } columns Data which will be returned by tedious 
	
	@return { Object } Return Corrected object. 
	
	@api private
	###
	_parseRow: ( columns ) ->
		o = {}
		for column in columns
			o[column.metadata.colName.toLowerCase()] = column.value
		return o


class MSSQLRequestStoredProd extends MSSQLRequestBase

	###
	## exec
	
	`mssqlconnector.exec( cb )`
	
	Execute the query. Make a new connection for each request and close after success. 
	Output will only set on storedprocedure.

	Example return:

		{
		    result: [
		        {
		            id: 144,
		            name: 'UpdatedName',
		            jahrgang: 1986,
		            created: FriApr19201311: 46: 00GMT+0200(CEST)
		        }
		    ],
		    rowcount: 3,
		    output: [
		        {
		            Total: 100
		        },
		        {
		            Teststring: 'Output'
		        }
		    ]
		}

	@param { Function } cb Callback function 
	
	@api public
	###
	exec: ( cb ) =>	
		if not @_checkParams()
			return

		# Start when connection is there
		@connection.on 'connect', (err) =>
			if err
				@_handleError( cb, 'connection-failed', err )
				return
			
			# Result which will be returned
			result 	= []
			output 	= []

			return
			request = new Request @statement, (err, rowCount) =>
				if err
					@_handleError( cb, 'request-error', err )
					return

				returnobj = 
					result: result
					rowcount: rowCount
					 
				# Return output if it is stored procedure	
				if output?.length
					returnobj.output = output

				# Return the data
				cb( null,  returnobj )
				return

			request.on 'row', (columns) =>
				result.push( @_parseRow( columns ) )
				return

			# This is only called if there are any output parameters in SQL 
			request.on 'returnValue', ( key, value, options )->
				_key 		= key?.toString()
				obj 		= {}
				obj[ _key ] 	= value
				output.push( obj )
				return
			
			@_setRequestParams request,  =>
				@_setOutputParams( @connection, request )
				return
			return
		return


	###
	## _checkParams
	
	`mssqlconnector._checkParams()`
	
	Check if the set param items are valid to the fields from SQL statement
	
	
	@return { Boolean } Return  
	
	@api private
	###
	_checkParams: =>
		return true


	###
	## _setOutputParams
	
	`mssqlconnector._setOutputParams()`
	
	Set all output params before request is executed.
		
	@api private
	###
	_setOutputParams: ( connection, request ) =>
		for outputparam, param  of @_outparams
			request.addOutputParameter( outputparam, param.type)
		connection.callProcedure(request)
		return

	###
	## param
	
	`mssqlconnector.param( field, datatype, value )`
	
	@param { String } field Fieldname in database 
	@param { String } datatype Datatype of field
	@param { String } value Value to set
	
	@return { Object } Return this 
	
	@api public
	###
	param:  ( field, datatype, value ) =>		
		# If everything correct set param to global
		@_params[ field ] = 
			type: @_getDataType( datatype )
			value: value or null
		return @



module.exports = class MSSQLConnector extends require( './base' )
	
	_defaults: =>
		_defaults = 
			connection:
				userName: 	''
				password: 	''
				server: 	''
			sqlparams: false

		return _defaults

	init: ( options = {} )=>
		@config = extend( true, {}, @config, options )

		# Initialize the connection to server
		@_initConnection()
		return

	query: (statement, options = {})=>
		if not statement?.length
			return false

		@init( options )
		return new MSSQLRequestBase( statement, @ )

	storedprod: (statement, options = {})=>
		if not statement?.length
			return false
		@init( options )
		return new MSSQLRequestStoredProd( statement, @ )


	###
	## initConnection
	
	`mssqlconnector.initConnection()`
	
	Init the connection and reconnect on losing 
	
	@api private
	###
	_initConnection: =>
		@connection = new Connection( @config.connection )
		@connection.on 'end', ()=>
			# Reconnect
			@_initConnection()
			return