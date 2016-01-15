# Changelog
`v1.0.0`

- Fix [#11](https://github.com/Nachbarshund/node-mssql-connector/issues/11) Remove memory leak in connection pool. There is also a test for memory leak.
- `Breaking change` Global connection error handler on initialized client instance (more information in README). You have to detect connection problems global since this version. .exec callback will *not* be called
- Upgrade to tedious version `1.13.2`
- Upgrade to tedious-connection-pool version `0.3.9`
- Tested nodejs version: `4.2.x`

`v0.4.0`

- Fix [#7](https://github.com/Nachbarshund/node-mssql-connector/issues/7): Multiple IN statement with the same parameter 

`v0.3.0`

- Upgrade to tedious version `1.11.5`
- Upgrade to tedious-connection-pool version `0.3.8`
- Change internal stored procedure exec (Alpha)
- Detail error information with query and parameters.

`v0.2.7`

- Upgrade to tedious version `1.7.0`
- Catch error in executing SQL, e.g. Values greater than integer max (2147483647)

`v0.2.6`

- Update docs and create changelog

`v0.2.5`
 
- Fix set param bug on stored procedures

`v0.2.4`

- Update tedious version vo 1.0.0 and add tests for this

`v0.2.3`

- Set correct versions in np modules (package.json)

`v0.2.2`

- Remove unused test for length of given params. This allows using variables in the query statement, e.g.
	
	```
	DECLARE @sorting int  		
	SET @sorting = 1
	...
	```
- Allow setting variables with underscore, e.g.

	```
	query = MSSQLClient.query( "
			SELECT * 
			FROM Table
			WHERE id = @last_id
	" )
	query.param( "last_id", "Int",  23 )
	...
	```
	
`v0.2.1`

- Add IN statement in one param. 
- Run on nodejs v0.10.25


`v0.2.0`

- Change the complete error handling. Errors will now always be returned as an object in the callback method:
	
	```
	// Example of an error whcih happens when there will be more params set than in query 
	query = MSSQLClient.query( "
			SELECT * 
			FROM Table
			WHERE id = @id
	" )
	query.param( "id", "Int",  100 )
	query.param( "otherfield", "Int",  200 )
	query.exec( function( err, res ){
		console.log( err );
		
		/*
			Result
						
			{ 
				name: 'param-not-found',
  				message: 'Param 'otherfield' was not found in query or is tried to set twice' 
  			}	
  				
		*/
	});
	```
	This is already implemented into the tests.

`v0.1.2`

- Implement connection pool.