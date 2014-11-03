# Changelog
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