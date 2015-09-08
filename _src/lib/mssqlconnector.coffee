_ 			= require('lodash')._
extend 		= require('extend')
ConnectionPool 	= require('tedious-connection-pool')
DataTypes 		= require('tedious').TYPES
Request 		= require('tedious').Request


class MSSQLRequestBase extends require( './base' )

	constructor: ( @statement, parent ) ->
		super

		# Set the defaults
		@_params 		= {}
		@_outparams 		= {}
		@_fields 		= []
		@_error		= null

		@_errorcounter 	= 
			connectiontries: 	0

		# Get data from paren
		@config 		= parent.config
		@connectionpool 	= parent.connectionpool

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
		# Check if there is any error bevore then return this
		if @_error
			@_handleError( cb, @_error )
			return

		if not @_checkParams()
			@_handleError( cb, "param-field-length", "The length of given params is different to set parameters." )
			return

		# Check if statement is given
		else if not @statement?.length
			@_handleError( cb, "no-statement-given", "The statement of query is missing." )
			return

		# Reset the error 
		@_error = null
		
		@connectionpool.connectiontries = 0

		# Error handling for connection pool
		@connectionpool.on "error", ( err, connection ) =>
			if err.name.toLowerCase() is "connectionerror"
				@connectionpool.connectiontries++
				if @config.poolconfig.tries is @connectionpool.connectiontries
					@connectionpool.drain()
					@_handleError( cb, "connection-failed", err )
					return
				return

			@_handleError( cb, "connection-error", err )
			return


		@connectionpool.acquire ( err, connection ) =>
			if err
				# Release connection on error
				connection.release()
				@_handleError( cb, 'connection-failed', err )
				return

			# Result which will be returned
			result 		= []
			

			request = new Request @statement, ( err, rowCount, rows ) =>
				if err
					connection.release()
					@_handleError( cb, 'request-error', err )
					return

				returnobj = 
					result: result
					rowcount: rowCount

				# Check if there is output for stored procedures
				if @output?
					returnobj.output = @output

				# Release the connection back to the pool when finished
				connection.close()

				# Return the data
				cb( null,  returnobj )
				return

			request.on "row", ( columns ) =>
				result.push( @_parseRow( columns ) )
				return

			# This is only called if there are any output parameters in SQL 
			request.on "returnValue", ( key, value, options ) =>
				if not @output?
					@output = []

				obj = {}
				obj[ key?.toString() ] = value
				@output.push( obj )
				return

			@_setRequestParams( request,  @_exec( request, connection ) )
			return
		return


	_exec: ( request, connection ) =>
		return  =>
			# Catch errors whith the executed statement
			try
				connection.execSql( request )
			catch e
				connection.close()
				@_handleError( cb, 'request--params-error', e )
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

		# Check if there is any error before. Then stop.
		if @_error
			return @

		# If its is an array then add IN statement
		if _.isArray( value )
			@_addINStatement( field, datatype, value )
			return


		# Check if field is valid
		if not @_checkField( field, datatype )
			@_handleError( null, 'param-not-found', "Param '#{ field }' was not found in query or is tried to set twice" )
			return @

		if not @_checkDataType( datatype )
			@_handleError( null, 'invalid-datatype', "Given datatype (#{ datatype }) for field '#{ field }' is not correct" )
			return @
		

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
	## _addINStatement
	
	`mssqlconnector._addINStatement( id, cb )`
	
	Run over every param in array and create a new statement. After this insert param into new statement.
	
	@param { String } field Fieldname in database 
	@param { String } datatype Datatype of field
	@param { String } value Value to set
	
	@api private
	###
	_addINStatement: ( field, datatype, value ) =>
		statement = ''

		# 1. First get all new fields
		for _param, idx in value
			if idx
				statement += ','
			statement += "@#{ field }#{ idx }"


		# 2. Replace the statement with new fields
		@statement = @statement.replace( "@#{ field }", statement )
		
		# 3. Reset all params
		@_setParams()

		# 4. Set new params
		for _param, idx in value
			@param(  "#{ field }#{ idx }", datatype, _param )
		return
		

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
		# Set empty
		@_fields = []

		_regex = /[@]+[A-Za-z0-9_]+/g

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

		@_handleError( null, 'no-exec-callback', 'There is no exec callback given' )
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


	_exec: ( request, connection ) =>
		return  =>
			# Set outpur parameters
			for outputparam, param of @_outparams
				request.addOutputParameter( outputparam, param.type )

			# Catch errors whith the executed statement
			try
				connection.callProcedure( request )
			catch e
				connection.close()
				@_handleError( cb, 'request--params-error', e )
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
	## param
	
	`mssqlconnector.param( field, datatype, value )`
	
	@param { String } field Fieldname in database 
	@param { String } datatype Datatype of field
	@param { String } value Value to set
	
	@return { Object } Return this 
	
	@api public
	###
	param:  ( field, datatype, value ) =>
		# Check if there is any error before. Then stop.
		if @_error
			return @	
			
		# If everything correct set param to global
		@_params[ field ] = 
			type: @_getDataType( datatype )
			value: if value? then value else null
		return @



module.exports = class MSSQLConnector extends require( "./base" )
	
	###
	## _defaults
	
	`mssqlconnector._defaults( id, cb )`
	
	Set the defaults. Some defaults are set in tedious.
	
	@api private
	###
	_defaults: =>
		_defaults = 
			connection:
				userName: 		''
				password: 		''
				server: 		''
			poolconfig:
				max: 			30
				min: 			0
				acquireTimeout: 	30000
				idleTimeout:		300000
				retryDelay:		500
				log:			false
				tries:			5

			sqlparams: false

		return _defaults


	###
	## init
	
	`mssqlconnector.init( id, cb )`
	
	Initilaize the connection. We will use the connection pool in _initConnection()
	
	@param { Object } options Settings. Structure like _defaults 
	
	@api public
	###
	init: ( options = {} )=>
		if not @isinit 
			# Initialize the connection to server
			@_initConnection()
		return


	###
	## query
	
	`mssqlconnector.query( id, cb )`
	
	Run a SQL query. Initilaize new request for every query.
	
	@param { String } statement The complete SQL statement 
	@param { Object } options Settings for connection and connectionpool
		
	@return { Function } Return SQL query

	@api public
	###
	query: ( statement, options = {} )=>
		@init( options )
		return new MSSQLRequestBase( statement, @ )


	###
	## storedprod
	
	`mssqlconnector.storedprod( id, cb )`
	
	Run q stored procecdure.
	
	@param { String } statement The complete stored procedure statement
	@param { Object } options Settings for connection and connectionpool
	
	@return { Function } Return Initilaized stored procedure.

	@api public
	###
	storedprod: ( statement, options = {} )=>
		@init( options )
		return new MSSQLRequestStoredProd( statement, @ )


	###
	## getPool
	
	`mssqlconnector.getPool( id, cb )`
	
	Return the current connection pool.
	
	
	@return { Object } Return Current connection pool 
	
	@api private
	###
	getPool: =>
		if not @isinit
			return "is-not-inited-yet"
		return @connectionpool

	###
	## initConnection
	
	`mssqlconnector.initConnection()`
	
	Init the connection including connection pool for multiple statements.
	
	@api private
	###
	_initConnection: =>
		@isinit = true
		@connectionpool = new ConnectionPool( @config.poolconfig, @config.connection )
		return