(function() {
  var ConnectionPool, DataTypes, MSSQLConnector, MSSQLRequestBase, MSSQLRequestStoredProd, Request, extend, _isArray, _isFunction,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _isFunction = require("lodash/isFunction");

  _isArray = require("lodash/isArray");

  extend = require("extend");

  ConnectionPool = require("tedious-connection-pool");

  DataTypes = require("tedious").TYPES;

  Request = require("tedious").Request;

  MSSQLRequestBase = (function(_super) {

    __extends(MSSQLRequestBase, _super);

    function MSSQLRequestBase(statement, parent) {
      this.statement = statement;
      this.parent = parent;
      this._setRequestParams = __bind(this._setRequestParams, this);
      this._setParams = __bind(this._setParams, this);
      this._getDataType = __bind(this._getDataType, this);
      this._checkParams = __bind(this._checkParams, this);
      this._checkField = __bind(this._checkField, this);
      this._checkDataType = __bind(this._checkDataType, this);
      this._addINStatement = __bind(this._addINStatement, this);
      this.outParam = __bind(this.outParam, this);
      this.param = __bind(this.param, this);
      this._exec = __bind(this._exec, this);
      this.exec = __bind(this.exec, this);
      MSSQLRequestBase.__super__.constructor.apply(this, arguments);
      this._params = {};
      this._outparams = {};
      this._fields = [];
      this._error = null;
      this._errorcounter = {
        connectiontries: 0
      };
      this._setParams();
      return;
    }

    /*
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
    */


    MSSQLRequestBase.prototype.exec = function(cb) {
      var _ref;
      if (this._error) {
        this._handleError(cb, this._error);
        return;
      }
      if (!this._checkParams()) {
        this._handleError(cb, "param-field-length", "The length of given params is different to set parameters.");
        return;
      } else if (!((_ref = this.statement) != null ? _ref.length : void 0)) {
        this._handleError(cb, "no-statement-given", "The statement of query is missing.");
        return;
      }
      this.parent.execQuery(this, cb);
    };

    /*
    	## _exec
    	
    	`mssqlconnector._exec( id, cb )`
    	
    	Function called to close execute the query or close connection on error.
    	
    	@param { Object } request 
    	@param { Object } connection
    	
    	@api private
    */


    MSSQLRequestBase.prototype._exec = function(request, connection) {
      var _this = this;
      return function() {
        try {
          connection.execSql(request);
        } catch (e) {
          connection.close();
          _this._handleError(cb, "request--params-error", e);
        }
      };
    };

    /*
    	## param
    	
    	`mssqlconnector.param( field, datatype, value )`
    	
    	@param { String } field Fieldname in database 
    	@param { String } datatype Datatype of field
    	@param { String } value Value to set
    	
    	@return { Object } Return this 
    	
    	@api public
    */


    MSSQLRequestBase.prototype.param = function(field, datatype, value) {
      if (this._error) {
        return this;
      }
      if (_isArray(value)) {
        this._addINStatement(field, datatype, value);
        return this;
      }
      if (!this._checkField(field, datatype)) {
        this._handleError(null, "param-not-found", "Param '" + field + "' was not found in query or is tried to set twice");
        return this;
      }
      if (!this._checkDataType(datatype)) {
        this._handleError(null, "invalid-datatype", "Given datatype (" + datatype + ") for field '" + field + "' is not correct");
        return this;
      }
      this._params[field] = {
        type: this._getDataType(datatype),
        value: value != null ? value : null
      };
      return this;
    };

    /*
    	## outParam
    	
    	`mssqlconnector.outParam( field, datatype )`
    	
    	Set the output param for stored procedures.
    	
    	@param { String } field Name of returned value in stored procedure
    	@param { String } datatype Datatype of field
    	
    	@return { Object } Return this 
    	
    	@api public
    */


    MSSQLRequestBase.prototype.outParam = function(field, datatype) {
      this._outparams[field] = {
        type: this._getDataType(datatype)
      };
      return this;
    };

    /*
    	## _addINStatement
    	
    	`mssqlconnector._addINStatement( id, cb )`
    	
    	Run over every param in array and create a new statement. After this insert param into new statement.
    	
    	@param { String } field Fieldname in database 
    	@param { String } datatype Datatype of field
    	@param { String } value Value to set
    	
    	@api private
    */


    MSSQLRequestBase.prototype._addINStatement = function(field, datatype, value) {
      var idx, statement, _i, _j, _len, _len1, _param;
      statement = '';
      for (idx = _i = 0, _len = value.length; _i < _len; idx = ++_i) {
        _param = value[idx];
        if (idx) {
          statement += ',';
        }
        statement += "@" + field + idx;
      }
      this.statement = this.statement.replace(new RegExp("@" + field, "g"), statement);
      this._setParams();
      for (idx = _j = 0, _len1 = value.length; _j < _len1; idx = ++_j) {
        _param = value[idx];
        this.param("" + field + idx, datatype, _param);
      }
    };

    /*
    	## _checkDataType
    	
    	`mssqlconnector._checkDataType( id, cb )`
    	
    	Check if given datatype is valid tedious datatype
    	
    	@param { String } datatype 
    
    	@return { Boolean } Return  
    	
    	@api private
    */


    MSSQLRequestBase.prototype._checkDataType = function(datatype) {
      return DataTypes[datatype] != null;
    };

    /*
    	## checkField
    	
    	`mssqlconnector.checkField( id, cb )`
    	
    	Check if field is in SQL statement and not already set.
    	
    	@param { String } field Fieldname
    	
    	@return { Booelan } Return  
    	
    	@api private
    */


    MSSQLRequestBase.prototype._checkField = function(field, datatype) {
      return __indexOf.call(this._fields, field) >= 0 && (this._params[field] == null) && (datatype != null ? datatype.length : void 0);
    };

    /*
    	## _checkParams
    	
    	`mssqlconnector._checkParams()`
    	
    	Check if the set param items are valid to the fields from SQL statement
    	
    	
    	@return { Boolean } Return  
    	
    	@api private
    */


    MSSQLRequestBase.prototype._checkParams = function() {
      var paramkeys, _field, _i, _len, _ref;
      if (this.config.sqlparams) {
        return true;
      }
      paramkeys = Object.keys(this._params);
      _ref = this._fields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _field = _ref[_i];
        if (__indexOf.call(paramkeys, _field) < 0) {
          this._handleError(null, "missing-field");
          break;
          return false;
        }
      }
      return true;
    };

    /*
    	## _getDataType
    	
    	`mssqlconnector._getDataType( datattype )`
    	
    	Return the correct tedious datatype
    	
    	@param { String } datatype
    	
    	@return { String } Return Correct datatytpe 
    	
    	@api private
    */


    MSSQLRequestBase.prototype._getDataType = function(datatype) {
      if (!this._checkDataType(datatype)) {
        this._handleError(null, "invalid-datatype");
        return;
      }
      return DataTypes[datatype];
    };

    /*
    	## setParams
    	
    	`mssqlconnector._setParams()`
    	
    	Set all given params in SQL statement with @
    		
    	@api private
    */


    MSSQLRequestBase.prototype._setParams = function() {
      var field, givenparams, _fieldname, _i, _len, _regex;
      this._fields = [];
      _regex = /[@]+[A-Za-z0-9_]+/g;
      givenparams = this.statement.match(_regex);
      if (!givenparams) {
        return;
      }
      for (_i = 0, _len = givenparams.length; _i < _len; _i++) {
        field = givenparams[_i];
        _fieldname = field.slice(1);
        if (__indexOf.call(this._fields, _fieldname) < 0 && _fieldname[0] !== '@') {
          this._fields.push(_fieldname);
        }
      }
    };

    /*
    	## _setRequestParams
    	
    	`mssqlconnector._setRequestParams( request, cb )`
    	
    	Set the correct Parameters for tedious request
    	
    	@param { Object } request Request object from tedious 
    	@param { Function } cb Callback function 
    	
    	@api private
    */


    MSSQLRequestBase.prototype._setRequestParams = function(request, cb) {
      var _key, _param, _ref;
      _ref = this._params;
      for (_key in _ref) {
        _param = _ref[_key];
        request.addParameter(_key, _param.type, _param.value);
      }
      if (_isFunction(cb)) {
        cb();
        return;
      }
      this._handleError(null, "no-exec-callback", "There is no exec callback given");
    };

    /*
    	## _parseRow
    	
    	`mssqlconnector._parseRow(columns )`
    	
    	Set the value to a correct JSON. This will called by each row.
    	
    	@param { Object } columns Data which will be returned by tedious 
    	
    	@return { Object } Return Corrected object. 
    	
    	@api private
    */


    MSSQLRequestBase.prototype._parseRow = function(columns) {
      var column, o, _i, _len;
      o = {};
      for (_i = 0, _len = columns.length; _i < _len; _i++) {
        column = columns[_i];
        o[column.metadata.colName.toLowerCase()] = column.value;
      }
      return o;
    };

    return MSSQLRequestBase;

  })(require("./base"));

  MSSQLRequestStoredProd = (function(_super) {

    __extends(MSSQLRequestStoredProd, _super);

    function MSSQLRequestStoredProd() {
      this.param = __bind(this.param, this);
      this._checkParams = __bind(this._checkParams, this);
      this._exec = __bind(this._exec, this);
      MSSQLRequestStoredProd.__super__.constructor.apply(this, arguments);
    }

    MSSQLRequestStoredProd.prototype._exec = function(request, connection) {
      var _this = this;
      return function() {
        var outputparam, param, _ref;
        _ref = _this._outparams;
        for (outputparam in _ref) {
          param = _ref[outputparam];
          request.addOutputParameter(outputparam, param.type);
        }
        try {
          connection.callProcedure(request);
        } catch (e) {
          connection.close();
          _this._handleError(cb, 'request--params-error', e);
        }
      };
    };

    /*
    	## _checkParams
    	
    	`mssqlconnector._checkParams()`
    	
    	Check if the set param items are valid to the fields from SQL statement
    	
    	@return { Boolean } Return  
    	
    	@api private
    */


    MSSQLRequestStoredProd.prototype._checkParams = function() {
      return true;
    };

    /*
    	## param
    	
    	`mssqlconnector.param( field, datatype, value )`
    	
    	@param { String } field Fieldname in database 
    	@param { String } datatype Datatype of field
    	@param { String } value Value to set
    	
    	@return { Object } Return this 
    	
    	@api public
    */


    MSSQLRequestStoredProd.prototype.param = function(field, datatype, value) {
      if (this._error) {
        return this;
      }
      this._params[field] = {
        type: this._getDataType(datatype),
        value: value != null ? value : null
      };
      return this;
    };

    return MSSQLRequestStoredProd;

  })(MSSQLRequestBase);

  module.exports = MSSQLConnector = (function(_super) {

    __extends(MSSQLConnector, _super);

    function MSSQLConnector() {
      this._initConnection = __bind(this._initConnection, this);
      this._errorCb = __bind(this._errorCb, this);
      this.storedprod = __bind(this.storedprod, this);
      this.query = __bind(this.query, this);
      this.execQuery = __bind(this.execQuery, this);
      this.init = __bind(this.init, this);
      this._defaults = __bind(this._defaults, this);
      MSSQLConnector.__super__.constructor.apply(this, arguments);
    }

    /*
    	## _defaults
    	
    	`mssqlconnector._defaults( id, cb )`
    	
    	Set the defaults. Some defaults are set in tedious.
    	
    	@api private
    */


    MSSQLConnector.prototype._defaults = function() {
      var _defaults;
      _defaults = {
        connection: {
          userName: '',
          password: '',
          server: ''
        },
        poolconfig: {
          max: 30,
          min: 0,
          acquireTimeout: 30000,
          idleTimeout: 300000,
          retryDelay: 500,
          log: false,
          tries: 5
        },
        sqlparams: false
      };
      return _defaults;
    };

    /*
    	## init
    	
    	`mssqlconnector.init( id, cb )`
    	
    	Initilaize the connection. We will use the connection pool in _initConnection()
    	
    	@param { Object } options Settings. Structure like _defaults 
    	
    	@api public
    */


    MSSQLConnector.prototype.init = function(options) {
      if (options == null) {
        options = {};
      }
      if (!this.isinit) {
        this._initConnection();
      }
    };

    /*
    	## execQuery
    	
    	`mssqlconnector.execQuery( id, cb )`
    	
    	Execute the query generated from Instance of MSSQLRequestStoredProd or MSSQLRequestBase
    	
    	@param { Object } queryInstance Instance of MSSQLRequestStoredProd or MSSQLRequestBase 
    	@param { Function } cb Callback function 
    	
    	@api private
    */


    MSSQLConnector.prototype.execQuery = function(queryInstance, cb) {
      var _this = this;
      this._error = null;
      this.connectionpool.acquire(function(err, connection) {
        var request, result;
        if (err) {
          connection.release();
          queryInstance._handleError(cb, "connection-failed", err);
          return;
        }
        result = [];
        request = new Request(queryInstance.statement, function(err, rowCount, rows) {
          var returnobj;
          if (err) {
            connection.release();
            queryInstance._handleError(cb, "request-error", err);
            return;
          }
          returnobj = {
            result: result,
            rowcount: rowCount
          };
          if (queryInstance.output != null) {
            returnobj.output = queryInstance.output;
          }
          connection.close();
          request.removeAllListeners();
          _this.connectionpool.connectiontries = 0;
          cb(null, returnobj);
        });
        request.on("row", function(columns) {
          result.push(queryInstance._parseRow(columns));
        });
        request.on("returnValue", function(key, value, options) {
          var obj;
          if (queryInstance.output == null) {
            queryInstance.output = [];
          }
          obj = {};
          obj[key != null ? key.toString() : void 0] = value;
          queryInstance.output.push(obj);
        });
        queryInstance._setRequestParams(request, queryInstance._exec(request, connection));
      });
    };

    /*
    	## query
    	
    	`mssqlconnector.query( id, cb )`
    	
    	Run a SQL query. Initilaize new request for every query.
    	
    	@param { String } statement The complete SQL statement 
    	@param { Object } options Settings for connection and connectionpool
    		
    	@return { Function } Return SQL query
    
    	@api public
    */


    MSSQLConnector.prototype.query = function(statement, options) {
      if (options == null) {
        options = {};
      }
      this.init(options);
      return new MSSQLRequestBase(statement, this);
    };

    /*
    	## storedprod
    	
    	`mssqlconnector.storedprod( id, cb )`
    	
    	Run q stored procecdure.
    	
    	@param { String } statement The complete stored procedure statement
    	@param { Object } options Settings for connection and connectionpool
    	
    	@return { Function } Return Initilaized stored procedure.
    
    	@api public
    */


    MSSQLConnector.prototype.storedprod = function(statement, options) {
      if (options == null) {
        options = {};
      }
      this.init(options);
      return new MSSQLRequestStoredProd(statement, this);
    };

    /*
    	## _errorCb
    	
    	`mssqlconnector._errorCb( id, cb )`
    	
    	Log error to client or console
    	
    	@param { String } errormsg
    	
    	@api private
    */


    MSSQLConnector.prototype._errorCb = function(errormsg) {
      if (this.listenerCount("error")) {
        this.emit("error", errormsg);
        return;
      }
      console.error(errormsg);
    };

    /*
    	## initConnection
    	
    	`mssqlconnector.initConnection()`
    	
    	Init the connection including connection pool for multiple statements.
    	
    	@api private
    */


    MSSQLConnector.prototype._initConnection = function() {
      var _this = this;
      this.isinit = true;
      this.connectionpool = null;
      this.connectionpool = new ConnectionPool(this.config.poolconfig, this.config.connection);
      this.connectionpool.connectiontries = 0;
      this.connectionpool.on("error", function(err, connection) {
        if (err.name.toLowerCase() === "connectionerror") {
          _this.connectionpool.connectiontries++;
          if (_this.config.poolconfig.tries === _this.connectionpool.connectiontries) {
            _this.connectionpool.drain();
            _this._handleError(_this._errorCb, "connection-failed", err);
            return;
          }
          return;
        }
        _this._handleError(_this._errorCb, "connection-error", err);
      });
    };

    return MSSQLConnector;

  })(require("./base"));

}).call(this);
