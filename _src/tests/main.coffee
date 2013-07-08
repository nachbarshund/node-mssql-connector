# import required test modules
should 			= 	require( "should" )
async 			= 	require "async"

MSSQLConnector 	= require( '../lib/mssqlconnector')
MSSQLClient 		= new MSSQLConnector( 
				connection: { 
					userName: '', 
					password: '', 
					server: '', 
					options: { 
						database: '' 
					} 
				} 
			)

MyTestVariables 	= {}

# Name for test Table
TABLENAME 		= 'TediousTestTable'

describe 'Tedious MSSQL Connector', ->

	# Set default timeout
	@timeout( 5000 )

	before ( done )->
		done()
		return

	after ( done )->
		done()
		return

	###
	describe 'CREATE statements', ->
		
		it "Create table", ( done ) =>

			query = MSSQLClient.query( "
					CREATE TABLE #{ TABLENAME } 
					(
						ID INT NOT NULL PRIMARY KEY IDENTITY(1, 1),
						Name varchar(250) default 'Hans',
						Jahrgang int,
						Created smalldatetime default getDate()
					)
			" )
			query.exec ( err, res ) ->
				should.not.exist( err )
				done()
				return	
			return
	###	

	describe 'Error handling', ->
		
		it "Error on empty statement", ( done )->
			query = MSSQLClient.query( "")
			query.should.not.be.ok
			done()
			return

		it "Correct statement", ( done )->
			query = MSSQLClient.query( "
				SELECT * 
				FROM #{ TABLENAME } 
				WHERE id = @id
			")
			query.should.be.ok
			done()
			return

		it "Set params two params on the same field name (Except: error)", ( done )->
			query = MSSQLClient.query( "
				SELECT * 
				FROM #{ TABLENAME } 
				WHERE id = @id
			")
			( () ->
				query.param( 'id', 'Int',  100 )
				query.param( 'id', 'Int',  200 )
			).should.throw()
			done()
			return


		it "Set params which are not in statement", ( done )->
			query = MSSQLClient.query( "
				SELECT * FROM 
				#{ TABLENAME } 
				WHERE id = @id
			")
			
			( () ->
				query.param( 'id', 'Int',  200 )
				query.param( 'name', 'Int',  100 )
			).should.throw()
			done()
			return

		it "Insert new item with wrong datatype", ( done )->
			query = MSSQLClient.query( "
				INSERT INTO #{ TABLENAME } ( 
					Name, 
					Jahrgang 
				) 
				VALUES( 
					@name, 
					@jahrgang 
				)
			'")
			( () ->
				query.param( 'name', 'VarChar',  "User Name" )
				query.param( 'jahrgang', 'wrongdatatype',  1986 )
			).should.throw()
			done()
			return

		it "Delete ID which is not in table", ( done )=>
			query = MSSQLClient.query( " 
				DELETE FROM #{ TABLENAME }  
				WHERE id = @id
			" )
			query.param( 'id', 'Int',  999999999 )
			query.exec ( err, res ) ->
				(res.rowcount).should.equal(0)
				done()
				return


	describe 'INSERT statements', ->
		
		it "Insert new item", ( done )=>
			query = MSSQLClient.query( "
				INSERT INTO #{ TABLENAME } ( 
					Name, 
					Jahrgang 
				) 
				VALUES( @name, @jahrgang )
				SELECT @@IDENTITY AS 'ID'
			")
			query.param( 'name', 'VarChar',  "Username" )
			query.param( 'jahrgang', 'Int',  1986 )
			query.exec ( err, res ) ->
				res.should.have.keys( ['result', 'rowcount'] )
				(res.rowcount).should.equal( 2 )
				
				result = res.result
				result.should.be.an.instanceOf(Array)
				result[0].should.have.keys( ['id'] )

				# Save this for next check
				MyTestVariables.insertnewid = result[ 0 ].id
				
				done()
				return				
			return

	describe 'UPDATE statements', ->
		
		it "Update inserted item (First insert new one)", ( done )=>
			query = MSSQLClient.query( "INSERT INTO #{ TABLENAME } ( Name, Jahrgang ) VALUES( @name, @jahrgang ) SELECT @@IDENTITY AS 'ID'" )
			query.param( 'name', 'VarChar',  "Hänschen Müller" )
			query.param( 'jahrgang', 'Int',  1986 )
			query.exec ( err, res ) ->
				
				MyTestVariables.updatedID = res.result[0].id

				query = MSSQLClient.query( "UPDATE #{ TABLENAME }  SET Name = @name WHERE ID = @id" )
				query.param( 'id', 'Int',   MyTestVariables.updatedID )
				query.param( 'name', 'VarChar',  "UpdatedName" )
				query.exec ( err, res ) ->
					res.should.have.keys( ['result', 'rowcount'] )
					(res.rowcount).should.equal(1)

					result = res.result
					result.should.be.an.instanceOf(Array)
					
					done()
					return
				return
		

	describe 'SELECT statements', ->
		
		it "Get latest inserted ID", ( done )=>
			query = MSSQLClient.query( "SELECT * FROM #{ TABLENAME }  WHERE id = @id" )
			query.param( 'id', 'Int',  MyTestVariables.insertnewid )
			query.exec ( err, res ) ->
				
				res.should.have.keys( ['result', 'rowcount'] )
				(res.rowcount).should.equal(1)

				result = res.result
				result.should.be.an.instanceOf(Array)

				model = result[0]
				model.should.have.keys( ['id', 'name', 'jahrgang', 'created'] )
				
				done()
				return
		
		
		it "Get updated data", ( done )=>
			query = MSSQLClient.query( "SELECT * FROM #{ TABLENAME }  WHERE id = @id" )
			query.param( 'id', 'Int',  MyTestVariables.updatedID )
			query.exec ( err, res ) ->
				
				res.should.have.keys( ['result', 'rowcount'] )
				(res.rowcount).should.equal(1)

				result = res.result
				result.should.be.an.instanceOf(Array)

				model = result[0]
				model.should.have.keys( ['id', 'name', 'jahrgang', 'created'] )
				(model.name).should.equal( 'UpdatedName' )
				
				done()
				return

		
		
		it "Select with LIKE statement", ( done )=>
			query = MSSQLClient.query( "
				SELECT     *
				FROM         #{ TABLENAME } 
				WHERE     Name LIKE @Update
			" )
			query.param( 'Update', 'VarChar',  "%Name%" )
			query.exec ( err, res ) ->
				res.should.have.keys( ['result', 'rowcount'] )
				
				done()
				return
		
	###
	describe 'Stored Procedures', ->
		
		it "Call stored procedure updated data", ( done )=>
			storedprod = MSSQLClient.storedprod( "tedious_get" )
			storedprod.param( 'id', 'Int',  MyTestVariables.insertnewid )
			storedprod.exec ( err, res ) ->
				res.should.be.a('object').and.have.property('result')
				(res.rowcount).should.equal(1)
				done()
				return
		
		
		it "Call stored procedure with output parameter (multi parameter) ", ( done )=>
			storedprod = MSSQLClient.storedprod( "tedious_get2")
			storedprod.param( 'id', 'Int',  MyTestVariables.insertnewid )
			storedprod.outParam( 'Total', 'Int' )
			storedprod.outParam( 'Teststring', 'VarChar' )
			storedprod.exec ( err, res ) ->
				res.should.be.a('object').and.have.property('output')
				res.output[ 0 ].should.have.ownProperty('Total')
				res.output[ 1 ].should.have.ownProperty('Teststring')
				done()
				return
		
		it "Call stored procedure with multi queries ", ( done )=>
			storedprod = MSSQLClient.storedprod( "tedious_get3")
			storedprod.param( 'id', 'Int',  MyTestVariables.insertnewid )
			storedprod.exec ( err, res ) ->
				res.should.have.keys( ['result', 'rowcount'] )
				(res.rowcount).should.equal(2)
				done()
				return
	###

	describe 'Syntax checks', ->
		
		it "Check @Declare problem", ( done )=>
			query = MSSQLClient.query( "
				DECLARE @name varchar 
				SELECT @name = name FROM #{ TABLENAME }  WHERE id=@id
				SELECT * FROM #{ TABLENAME }  WHERE name = @name" 
			, {sqlparams: true})
			query.param( 'id', 'Int',  MyTestVariables.insertnewid )
			query.exec ( err, res ) ->
				res.should.have.keys( ['result', 'rowcount'] )
				done()
				return


		it "Test SQL injection", ( done )=>
			query = MSSQLClient.query( "SELECT * FROM #{ TABLENAME }  WHERE name = @name" )
			query.param( 'name', 'VarChar',  "sakljasd' OR 1=1 or name='" )
			query.exec ( err, res ) ->
				res.should.have.keys( ['result', 'rowcount'] )
				(res.rowcount).should.equal(0)
				done()
				return
	
	describe 'Speed tests', ->

		@timeout( 900000000 )
		_queryFunc = (idx, cb)->
			query = MSSQLClient.query( "SELECT TOP 1 * FROM #{ TABLENAME }  WHERE id = @id" )
			query.param( 'id', 'Int',  idx )
			query.exec cb
			return
		
		it "Seriel from ID 80 - 327", ( done )=>
			async.mapSeries [80....327], _queryFunc, ( err, resp ) ->
				done()
				return

		
		it "Parallel from ID 80 - 327", ( done )=>			
			async.map [80....327], _queryFunc, ( err, resp ) ->
				done()
				return

		return

	describe 'DELETE statements', ->
		
		it "Delete latest inserted ID", ( done )=>
			query = MSSQLClient.query( "DELETE FROM #{ TABLENAME }  WHERE id = @id" )
			query.param( 'id', 'Int',  MyTestVariables.insertnewid )
			query.exec ( err, res ) ->				
				(res.rowcount).should.equal(1)
				result = res.result
				result.should.be.an.instanceOf(Array)
				done()
				return

		###
		it "Delete table", ( done ) =>

			query = MSSQLClient.query( "
				DROP TABLE #{ TABLENAME } 
			" )
			query.exec ( err, res ) ->
				should.not.exist( err )
				done()
				return	
			return
		###
		return