# node-mssql-connector

CurrentVersion: `0.2.4`

This is a NodeJS module to connect to MSSQL databases and executed queries or stored procedures. This plugin is based on [tedious by Mike D Pilsbury](http://pekim.github.io/tedious/index.html). 

The plugin is written in CoffeeScript.

Take a lot of changes in [Changelog](#changelog)

# Basics
- Supports all simple SQL- Statements like `UPDATE`, `DELETE`, `SELECT` etc.
- Supports multiple connections via `tedious-connection-pool`.
- *Stored procedures* can be executed
- Get the data in JSON format
- Run the test to check that everything is correct


# Installation

`npm install node-mssql-connector`


# Example

## Use In NodeJS

### Initialize node-mssql-connector

```
MSSQLConnector = require( "node-mssql-connector" )
MSSQLClient = new MSSQLConnector( {
	settings: {
		max: 20,
		min: 0,
		idleTimeoutMillis: 30000
	},
	connection: {
		userName: "",
		password: "",
		server: "",
		options: {
			database: ""
		}
	}
```



## SQL statement  

First define the query statement.

```
query = MSSQLClient.query( "
	SELECT ID, Name, Lastname
	FROM Table
	WHERE id = @id
")
```

Set the parameters. Values with leading `@` are defined as parameters.
If there aren't any parameter you do not need the following line.  
 
**Important** You have to use the *correct datatype* from tedious. They can be found here (column "Constant"): [http://pekim.github.io/tedious/api-datatypes.html](http://pekim.github.io/tedious/api-datatypes.html)

```
query.param( "id", "Int",  23 )
```


Execute the query. The result will be returned as an `Array` with an `Object` for each result.


```
query.exec( function( err, res ){
	if( err ){
		console.error( err );
		return
	}
	
	/*
	
	The result looks like this:
	
	{ 
		result:[ 
			{ 
   				id: 23,
       			name: "Testuser"",
       			lastname: "Testlast" 
       		} 
       	],
  		rowcount: 1 
  	}
  	
  	*/
	
})
```

Since `v0.2.1`:
You can also add a list of (Array) parameters into one param statement, e.g.

	query = MSSQLClient.query( "
		SELECT ID, Name, Lastname
		FROM Table
		WHERE id IN (@idlist)
	")

	query.param( "idlist", "Int",  [23,34,67] )

Check that every parameter in this array has the given type.

## Stored procedure

The stored procedure in database looks like:

``` 
...
ALTER PROCEDURE [dbo].[sp_demo] 

@ID Int,
@Total Tinyint = 0 Output,
@Teststring Varchar(100) = 'Default' Output
AS

SET @Teststring = "Modifed"

SET @Total = 100

SELECT ID, Name, Lastname
FROM Table
WHERE ID = @id
```

The difference to **SQL Statment** is that you have to call the `storedprod` method of **MSSQLClient**. If your stored procedure has output params (like in this example) then you must define this via `storedprod.outParam`

```
storedprod = MSSQLClient.storedprod( "tedious_get2" )
storedprod.param( "id", "Int",  23 )
storedprod.outParam( "Total", "Int" )
storedprod.outParam( "Teststring", "VarChar" )
storedprod.exec( function( err, res ){
	if( err ){
		console.error( err );
		return
	}
	
	/*
	
	The result looks like this. The paran 'output' is only by stored procedures.
	
	{ 
		result:[ 
			{ 
   				id: 23,
       			name: "Testuser"",
       			lastname: "Testlast" 
       		} 
       	],
       	output: [ 
       		{ 
       			Total: 100 
       		}, 
       		{ 
       			Teststring: "Modifed" 
       		} 
       	],
  		rowcount: 1 
  	}
  	
  	*/
	
})

```
  
# <a name="changelog"></a>Changelog
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

# Not implemented yet
- Test for inserting stored procedures
- Test for run stored procedures
- Check if database exists


# The MIT License (MIT)

Copyright © 2014 Christopher Zotter, http://www.tcs.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

