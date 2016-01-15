# node-mssql-connector

A simple way to connect to Microsoft SQL (MS-SQL) databases from Node.js.

Run queries or stored procedures. Based on [tedious by Mike D Pilsbury](http://pekim.github.io/tedious/index.html). 

## Basics
- Supports all simple SQL-Statements like `UPDATE`, `DELETE`, `SELECT` etc.
- Supports multiple connections via `tedious-connection-pool`.
- *Stored procedures* can be executed
- Get the data in JSON format
- Run the test to check that everything is correct

CurrentVersion: `1.0.0`

## Installation

`npm install node-mssql-connector`


## Example

### Initialize node-mssql-connector

```js
MSSQLConnector = require( "node-mssql-connector" );
MSSQLClient = new MSSQLConnector( {
	settings: {
		max: 20,
		min: 0,
		idleTimeoutMillis: 30000,
		detailerror: true # To show detail error information
	},
	connection: {
		userName: "",
		password: "",
		server: "",
		options: {
			database: ""
		}
	}
})
```

### Connection error handling
Since `v1.0.0`:

```js
# Initiliazed client
MSSQLClient.on( "error", function( error ){
	// handle error
} );
```

### SQL statement  

First define the query statement.

```js
query = MSSQLClient.query( "
	SELECT ID, Name, Lastname
	FROM Table
	WHERE id = @id
")
```

Set the parameters. Values with leading `@` are defined as parameters.
If there aren't any parameter you do not need the following line.  
 
**Important** You have to use the *correct datatype* from tedious. They can be found here (column "Constant"): [http://pekim.github.io/tedious/api-datatypes.html](http://pekim.github.io/tedious/api-datatypes.html)

```js
query.param( "id", "Int",  23 )
```


Execute the query. The result will be returned as an `Array` with an `Object` for each result.


```js
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

```sql
CREATE PROCEDURE [dbo].[sp_demo] 

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

```js
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
  
For recent changes please see the [Changelog](https://github.com/Nachbarshund/node-mssql-connector/blob/master/CHANGELOG.md).


## Tips
To run a local (test) enviroment for mssql use the awesome tool from fgrehm via Virtual Box: [https://github.com/fgrehm/vagrant-mssql-express](https://github.com/fgrehm/vagrant-mssql-express)

## The MIT License (MIT)

Copyright © 2014 - 2016 Christopher Zotter  
[http://www.tcs.de](http://www.tcs.de) | [http://www.webCIT.de](http://www.webCIT.de)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

