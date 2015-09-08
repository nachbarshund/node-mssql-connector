# import required test modules
should 			= 	require "should"
async 			= 	require "async"

MSSQLConnector 	= 	require( "../lib/mssqlconnector" )

try
	config = require( "../config.json" )

catch error
	console.error "loading config file:"
	console.log error
	return

# Here must be set the connection settings
MSSQLClient 		=  	new MSSQLConnector( config )
	

# This must be empty to check wrong connection
MSSQLClientFalseCon  =  	new MSSQLConnector
					detailerror: true
					poolconfig:
						max: 			30
						min: 			0
						acquireTimeout: 	30000
						idleTimeout:		300000
						retryDelay:		500
						log:			false
					connection:
						userName: ""
						password: ""
						server: ""
						options: 
							database: ""	


TESTVARIABLES  = {}

# Name for test table
TABLENAME 	=  "GruntTest"


describe "Test for node-mssql-connector", ->

	# Set default timeout
	@timeout( 5000 )

	before ( done )->
		done()
		return

	after ( done )->
		done()
		return

	describe "Init setup", ->
		it "Create new table", ( done ) =>
			query = MSSQLClient.query( "
				CREATE TABLE #{ TABLENAME } 
				(
					ID INT NOT NULL PRIMARY KEY IDENTITY(1, 1),
					Name varchar( 250 ) default '',
					jahrgang int,
					Created smalldatetime default getDate()
				)
			" )
			query.exec ( err, res ) ->
				should.not.exist( err )
				done()
				return	
			return

	describe "Error handling, Connection check and syntax validation check", ->

		it "Check incorrect connection (Except: error)", ( done ) ->
			query = MSSQLClientFalseCon.query( "
				SELECT * 
				FROM #{ TABLENAME } 
				WHERE id = @id
			" )
			query.param( "id", "Int",  100 )
			query.param( "id", "Int",  200 )
			query.exec ( err, res ) ->
				should.exist( err )
				done()
				return
			return


		it "Try to create same table again (Except: error)", ( done ) =>
			query = MSSQLClient.query( "
				CREATE TABLE #{ TABLENAME } 
				(
					ID INT NOT NULL PRIMARY KEY IDENTITY(1, 1),
					Name varchar( 250 ) default '',
					jahrgang int,
					Created smalldatetime default getDate()
				)
			" )
			query.exec ( err, res ) ->
				should.exist( err )
				done()
				return	
			return


		it "Throw error on empty statement", ( done ) ->
			query = MSSQLClient.query( "" )
			query.exec ( err, res ) ->
				should.exist( err )
				done()
				return
			return

		
		it "Set params with Invalid column name (Except: error)", ( done )->
			query = MSSQLClient.query( "
				INSERT INTO #{ TABLENAME } ( 
					Name, 
					wrongkey 
				) 
				VALUES( @name, @wrongkey )
				SELECT @@IDENTITY AS 'id'
			" )
			query.param( "name", "VarChar",  "Chris" )
			query.param( "wrongkey", "Int",  200 )
			query.exec ( err, res ) ->
				should.exist( err )
				done()
				return
			return		


		it "Set params two params on the same field name (Except: error)", ( done ) ->
			query = MSSQLClient.query( "
				SELECT * 
				FROM #{ TABLENAME } 
				WHERE id = @id
			" )
			query.param( "id", "Int",  100 )
			query.param( "id", "Int",  200 )
			query.exec ( err, res ) ->
				should.exist( err )
				done()
				return
			return

		

		it "Set params which are not in statement", ( done ) ->
			query = MSSQLClient.query( "
				SELECT * 
				FROM #{ TABLENAME } 
			" )
			query.param( "id", "Int",  200 )
			query.exec ( err, res ) ->
				should.exist( err )
				done()
				return
			return


		it "Insert new item with wrong datatype", ( done ) ->
			query = MSSQLClient.query( "
				INSERT INTO #{ TABLENAME } ( 
					Name, 
					Jahrgang 
				) 
				VALUES( 
					@name, 
					@jahrgang 
				)
			'" )
			query.param( "name", "VarChar",  "User Name" )
			query.param( "jahrgang", "custominteger",  1986 )
			query.exec ( err, res ) ->
				should.exist( err )
				done()
				return
			return

		it "Correct statement", ( done )->
			query = MSSQLClient.query( "
				SELECT * 
				FROM #{ TABLENAME } 
				WHERE id = @id
			" )
			query.exec ( err, res ) ->
				should.exist( err )
				done()
				return
			return


	describe "Syntax checks", ->
		
		it "Test SQL injection", ( done )=>
			query = MSSQLClient.query( "
				SELECT * 
				FROM #{ TABLENAME }  
				WHERE name = @name
			" )
			query.param( "name", "VarChar",  "sakljasd' OR 1=1 or name='" )
			query.exec ( err, res ) ->
				res.should.have.keys( ["result", "rowcount"] )
				( res.rowcount ).should.equal( 0 )
				done()
				return
	

	describe "INSERT statements", ->
		
		it "Insert new item", ( done )=>
			query = MSSQLClient.query( "
				INSERT INTO #{ TABLENAME } ( 
					Name, 
					jahrgang 
				) 
				VALUES( @name, @jahrgang )
				SELECT @@IDENTITY AS 'id'
			" )
			query.param( "name", "VarChar",  "Username" )
			query.param( "jahrgang", "Int",  23 )
			query.exec ( err, res ) ->
				should.not.exist( err )
				
				res.should.have.keys( ['result', 'rowcount'] )
				( res.rowcount ).should.equal( 2 )
				
				result = res.result
				result.should.be.an.instanceOf( Array )
				result[ 0 ].should.have.keys( ["id"] )

				# Save this for next check
				TESTVARIABLES.insertnewid = result[ 0 ].id

				done()
				return				
			return

		it "Insert with integer > 2147483647", ( done )=>
			query = MSSQLClient.query( "
				INSERT INTO #{ TABLENAME } ( 
					Name, 
					jahrgang 
				) 
				VALUES( @name, @jahrgang )
				SELECT @@IDENTITY AS 'id'
			" )
			query.param( "name", "VarChar",  "IntegerCheck" )
			query.param( "jahrgang", "Int",  2147483648 )
			query.exec ( err, res ) ->
				should.exist( err )
				( err.name ).should.equal( 'request-error' )
				done()
				return				
			return

	
	describe "UPDATE statements", ->
		
		it "Update inserted item (First insert new one)", ( done )=>
			query = MSSQLClient.query( "
				INSERT INTO #{ TABLENAME } ( Name, Jahrgang ) 
				VALUES( @name, @jahrgang ) SELECT @@IDENTITY AS 'id'
			" )
			query.param( "name", "VarChar",  "Hänschen Müller" )
			query.param( "jahrgang", "Int",  1986 )
			query.exec ( err, res ) ->
				should.not.exist( err )

				TESTVARIABLES.updatedID = res.result[ 0 ].id

				query = MSSQLClient.query( "
					UPDATE #{ TABLENAME }  
					SET Name = @name 
					WHERE ID = @id
				" )
				query.param( "id", "Int",   TESTVARIABLES.updatedID )
				query.param( "name", "VarChar",  "UpdatedName" )
				query.exec ( err, res ) ->
					should.not.exist( err )

					res.should.have.keys( ['result', 'rowcount'] )
					( res.rowcount ).should.equal( 1 )

					result = res.result
					result.should.be.an.instanceOf( Array )
					
					done()
					return
				return

	
	describe "SELECT statements", ->

		it "Set internal variable in statement", ( done )=>
			query = MSSQLClient.query( "
				DECLARE @lastid int

				SET @lastid = #{ TESTVARIABLES.insertnewid }

				SELECT ID
				FROM #{ TABLENAME }  
				WHERE ID = @lastid
			" )
			query.exec ( err, res ) ->
				should.not.exist( err )
				res.should.have.keys( ["result", "rowcount"] )
				
				result = res.result
				result.should.be.an.instanceOf( Array )

				model = result[ 0 ]
				model.should.have.keys( ["id"])
				
				done()
				return

		it "Select with underscore(_) variables", ( done )=>
			query = MSSQLClient.query( "
				SELECT * 
				FROM #{ TABLENAME }  
				WHERE ID = @last_id
			" )
			query.param( "last_id", "Int",  TESTVARIABLES.insertnewid )
			query.exec ( err, res ) ->
				should.not.exist( err )
				res.should.have.keys( ["result", "rowcount"] )
				( res.rowcount ).should.equal( 1 )

				result = res.result
				result.should.be.an.instanceOf( Array )

				model = result[ 0 ]
				model.should.have.keys( ["id", "name", "jahrgang", "created"] )
				
				done()
				return


		it "Get latest inserted ID", ( done )=>
			query = MSSQLClient.query( "
				SELECT * 
				FROM #{ TABLENAME }  
				WHERE id = @id
			" )
			query.param( "id", "Int",  TESTVARIABLES.insertnewid )
			query.exec ( err, res ) ->
				should.not.exist( err )
				res.should.have.keys( ["result", "rowcount"] )
				( res.rowcount ).should.equal( 1 )

				result = res.result
				result.should.be.an.instanceOf( Array )

				model = result[ 0 ]
				model.should.have.keys( ["id", "name", "jahrgang", "created"] )
				
				done()
				return
		
		
		it "Get updated data", ( done )=>
			query = MSSQLClient.query( "
				SELECT * 
				FROM #{ TABLENAME } 
				WHERE id = @id
			" )
			query.param( "id", "Int",  TESTVARIABLES.updatedID )
			query.exec ( err, res ) ->
				should.not.exist( err )
				res.should.have.keys( ["result", "rowcount"] )
				( res.rowcount ).should.equal( 1 )

				result = res.result
				result.should.be.an.instanceOf( Array )

				model = result[ 0 ]
				model.should.have.keys( ["id", "name", "jahrgang", "created"] )
				( model.name ).should.equal( "UpdatedName" )
				
				done()
				return

				
		it "Select with LIKE statement", ( done )=>
			query = MSSQLClient.query( "
				SELECT     *
				FROM       #{ TABLENAME } 
				WHERE     Name LIKE @Update
			" )
			query.param( "Update", "VarChar",  "%Name%" )
			query.exec ( err, res ) ->
				should.not.exist( err )
				res.should.have.keys( ["result", "rowcount"] )
				
				done()
				return

		it "Select with IN statement (ids)", ( done )=>
			query = MSSQLClient.query( "
				SELECT     *
				FROM       #{ TABLENAME } 
				WHERE     ID IN (@idlist)
			" )
			query.param( "idlist", "Int",  [1,2,3] )
			query.exec ( err, res ) ->
				should.not.exist( err )
				res.should.have.keys( ["result", "rowcount"] )
				done()
				return
	
	
	describe "DELETE statements", ->


		it "Delete ID which is not in table", ( done )=>
			query = MSSQLClient.query( " 
				DELETE FROM #{ TABLENAME }  
				WHERE id = @id
			" )
			query.param( "id", "Int",  999999999 )
			query.exec ( err, res ) ->
				should.not.exist( err )
				( res.rowcount ).should.equal( 0 )
				done()
				return


		it "Delete latest inserted ID", ( done )=>
			query = MSSQLClient.query( "
				DELETE FROM #{ TABLENAME }  
				WHERE id = @id
			" )
			query.param( "id", "Int",  TESTVARIABLES.insertnewid )
			query.exec ( err, res ) ->		
				should.not.exist( err )		
				( res.rowcount ).should.equal( 1 )
				result = res.result
				result.should.be.an.instanceOf( Array )
				done()
				return


	describe "TESTS for tedious v1.11.5", ->

		it "Insert three datasets", ( done )=>
			query = MSSQLClient.query( "
				INSERT INTO #{ TABLENAME } ( 
					Name, 
					jahrgang 
				) 
				VALUES( @name, @jahrgang )
			" )
			query.param( "name", "VarChar",  "Testuser" )
			query.param( "jahrgang", "Int",  28 )
			query.exec ( err, res ) ->
				should.not.exist( err )

				query = MSSQLClient.query( "
					INSERT INTO #{ TABLENAME } ( 
						Name, 
						jahrgang 
					) 
					VALUES( @name, @jahrgang )
				" )
				query.param( "name", "VarChar",  "Testuser" )
				query.param( "jahrgang", "Int",  28 )
				query.exec ( err, res ) ->
					should.not.exist( err )
					done()
					return	
				return			
			return

		it "Select with multiple results", ( done )=>
			query = MSSQLClient.query( "
				SELECT TOP 2 * 
				FROM #{ TABLENAME }  
				WHERE jahrgang = @jahrgang
			" )
			query.param( "jahrgang", "Int",  28 )
			query.exec ( err, res ) ->
				should.not.exist( err )
				( res.rowcount ).should.equal( 2 )
				( res.result.length ).should.equal( 2 )
				done()
				return

	
	describe "Speed tests", ->

		@timeout( 900000000 )
		_queryFunc = ( idx, cb )->
			query = MSSQLClient.query( "
				SELECT TOP 1 ID 
				FROM #{ TABLENAME }  
			" )			
			query.exec (err, resp)->
				if err
					cb( err )
					return

				if resp.rowcount is 1
					cb(null, "Row: #{ idx }")
				else
					cb( true, 'No recorcd error')
				return
			return
		
		it "Seriel from ID (500 records)", ( done )=>
			async.mapSeries [1..500], _queryFunc, ( err, resp ) ->
				should.not.exist( err )
				done()
				return

		it "Parallel from ID (500 records)", ( done )=>			
			async.map [1....500], _queryFunc, ( err, resp ) ->
				should.not.exist( err )
				done()
				return
		return

	describe "DATABASE end", ->
		
		it "Delete the created table", ( done ) =>

			query = MSSQLClient.query( "
				DROP TABLE Dbo.#{ TABLENAME } 
			" )
			query.exec ( err, res ) ->
				should.not.exist( err )
				done()
				return	
			return
		return

