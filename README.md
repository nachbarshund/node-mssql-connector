node-mssql-connector
====================

A simple connect and execute plugins for MSSQL querys on nodejs. Ths plugin is based on [tedious by Mike D Pilsbury](http://pekim.github.io/tedious/index.html). 

The plugin is written in coffeescript.

## Alpha Version
This is still an alpha version. Use with care.

## Features
- Use all the simple SQL- Statements like `UPDATE`, `DELETE`, `SELECT`etc.
- *Stored procedures* are also supported
- Get data via *Output parameters* in queries
- Test coverage

## Installation

`npm install node-mssql-connector`

## Example

### Initialize

Insert the correct database connection data.

```
MSSQLConnector 	= require( 'node-mssql-connector')
MSSQLClient 	= new MSSQLConnector( 
				connection: { 
					userName: 'admin', 
					password: 'password', 
					server: '127.0.0.1', 
					options: { 
						database: 'Database' 
					} 
				} 
			)
```



### Query statement  

```
query = MSSQLClient.query( "
	INSERT INTO #{ TABLENAME } ( 
		Name, 
		Jahrgang 
	) 
	VALUES( @name, @jahrgang )
")
```

First initiialize an the Client. 

*Info*: Values with leading `@` must be set in the next step

### Set parameters

```
query.param( 'name', 'VarChar',  "Username" )
query.param( 'jahrgang', 'Int',  1986 )
```

**Important** You have to use the *correct datatype* from tedious. They can be found here (column "Constant"): [http://pekim.github.io/tedious/api-datatypes.html](http://pekim.github.io/tedious/api-datatypes.html)

### Execute the query
```
query.exec( function( err, res ){
	if( err ){
		console.error( err );
		return
	}
	
	// If res.rowocunt is 1 then update was successfull
})
```

# Not implemented yet
- Test for inserting stored procedures
- Test for run stored procedures


# The MIT License (MIT)

Copyright © 2013 Christopher Zotter, http://www.tcs.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

