(function() {
  var ConnectionPool, DataTypes, MSSQLConnector, MSSQLRequestBase, MSSQLRequestStoredProd, Request, extend, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('lodash')._;

  extend = require('extend');

  ConnectionPool = require('tedious-connection-pool');

  DataTypes = require('tedious').TYPES;

  Request = require('tedious').Request;

  MSSQLRequestBase = (function(_super) {

    __extends(MSSQLRequestBase, _super);

    function MSSQLRequestBase(statement, parent) {
      this.statement = statement;
      this._setRequestParams = __bind(this._setRequestParams, this);
      this._setParams = __bind(this._setParams, this);
      this._getDataType = __bind(this._getDataType, this);
      this._checkParams = __bind(this._checkParams, this);
      this._checkField = __bind(this._checkField, this);
      this._checkDataType = __bind(this._checkDataType, this);
      this.outParam = __bind(this.outParam, this);
      this.param = __bind(this.param, this);
      this.exec = __bind(this.exec, this);
      MSSQLRequestBase.__super__.constructor.apply(this, arguments);
      this._params = {};
      this._outparams = {};
      this._fields = [];
      this.config = parent.config;
      this.connectionpool = parent.connectionpool;
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
      var _this = this;
      if (!this._checkParams()) {
        return;
      }
      this.connectionpool.requestConnection(function(err, connection) {
        if (err) {
          _this._handleError(cb, 'connection-failed', err);
          return;
        }
        return connection.on('connect', function(err) {
          var output, request, result;
          if (err) {
            _this._handleError(cb, 'connection-failed', err);
            return;
          }
          result = [];
          output = [];
          request = new Request(_this.statement, function(err, rowCount) {
            var returnobj;
            if (err) {
              _this._handleError(cb, 'request-error', err);
              return;
            }
            returnobj = {
              result: result,
              rowcount: rowCount
            };
            cb(null, returnobj);
            connection.close();
          });
          request.on('row', function(columns) {
            result.push(_this._parseRow(columns));
          });
          request.on('returnValue', function(key, value, options) {
            var obj, _key;
            _key = key != null ? key.toString() : void 0;
            obj = {};
            obj[_key] = value;
            output.push(obj);
          });
          request.on('done', function(key, value, options) {
            console.log('DONE', arguments);
          });
          _this._setRequestParams(request, function() {
            connection.execSql(request);
          });
        });
      });
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
      if (!this._checkField(field, datatype)) {
        this._handleError(null, 'param-not-found');
        return;
      }
      if (!this._checkDataType(datatype)) {
        this._handleError(null, 'invalid-datatype');
        return;
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
      var paramkeys, _field, _i, _len, _ref, _ref1;
      if (this.config.sqlparams) {
        return true;
      }
      paramkeys = _.keys(this._params);
      if ((paramkeys != null ? paramkeys.length : void 0) !== ((_ref = this._fields) != null ? _ref.length : void 0)) {
        this._handleError(null, 'param-field-length');
        return false;
      }
      _ref1 = this._fields;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        _field = _ref1[_i];
        if (__indexOf.call(paramkeys, _field) < 0) {
          this._handleError(null, 'missing-field');
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
        this._handleError(null, 'invalid-datatype');
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
      _regex = /[@]+[A-Za-z0-9]+/g;
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
      if (_.isFunction(cb)) {
        cb();
        return;
      }
      this._handleError(null, 'no-exec-callback');
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

  })(require('./base'));

  MSSQLRequestStoredProd = (function(_super) {

    __extends(MSSQLRequestStoredProd, _super);

    function MSSQLRequestStoredProd() {
      this.param = __bind(this.param, this);
      this._setOutputParams = __bind(this._setOutputParams, this);
      this._checkParams = __bind(this._checkParams, this);
      this.exec = __bind(this.exec, this);
      MSSQLRequestStoredProd.__super__.constructor.apply(this, arguments);
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


    MSSQLRequestStoredProd.prototype.exec = function(cb) {
      var _this = this;
      if (!this._checkParams()) {
        return;
      }
      return this.connectionpool.requestConnection(function(err, connection) {
        if (err) {
          _this._handleError(cb, 'connection-failed', err);
          return;
        }
        connection.on('connect', function(err) {
          var output, request, result;
          if (err) {
            _this._handleError(cb, 'connection-failed', err);
            return;
          }
          result = [];
          output = [];
          request = new Request(_this.statement, function(err, rowCount) {
            var returnobj;
            if (err) {
              _this._handleError(cb, 'request-error', err);
              return;
            }
            returnobj = {
              result: result,
              rowcount: rowCount
            };
            if (output != null ? output.length : void 0) {
              returnobj.output = output;
            }
            cb(null, returnobj);
            connection.close();
          });
          request.on('row', function(columns) {
            result.push(_this._parseRow(columns));
          });
          request.on('returnValue', function(key, value, options) {
            var obj, _key;
            _key = key != null ? key.toString() : void 0;
            obj = {};
            obj[_key] = value;
            output.push(obj);
          });
          _this._setRequestParams(request, function() {
            _this._setOutputParams(connection, request);
          });
        });
      });
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
    	## _setOutputParams
    	
    	`mssqlconnector._setOutputParams()`
    	
    	Set all output params before request is executed.
    		
    	@api private
    */


    MSSQLRequestStoredProd.prototype._setOutputParams = function(connection, request) {
      var outputparam, param, _ref;
      _ref = this._outparams;
      for (outputparam in _ref) {
        param = _ref[outputparam];
        request.addOutputParameter(outputparam, param.type);
      }
      connection.callProcedure(request);
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
      this._params[field] = {
        type: this._getDataType(datatype),
        value: value || null
      };
      return this;
    };

    return MSSQLRequestStoredProd;

  })(MSSQLRequestBase);

  module.exports = MSSQLConnector = (function(_super) {

    __extends(MSSQLConnector, _super);

    function MSSQLConnector() {
      this._initConnection = __bind(this._initConnection, this);
      this.storedprod = __bind(this.storedprod, this);
      this.query = __bind(this.query, this);
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
        settings: {
          max: 20,
          min: 0,
          idleTimeoutMillis: 30000
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
      if (!(statement != null ? statement.length : void 0)) {
        return false;
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
      if (!(statement != null ? statement.length : void 0)) {
        return false;
      }
      this.init(options);
      return new MSSQLRequestStoredProd(statement, this);
    };

    /*
    	## initConnection
    	
    	`mssqlconnector.initConnection()`
    	
    	Init the connection including connection pool for multiple statements.
    	
    	@api private
    */


    MSSQLConnector.prototype._initConnection = function() {
      this.isinit = true;
      this.connectionpool = new ConnectionPool(this.config.settings, this.config.connection);
    };

    return MSSQLConnector;

  })(require("./base"));

}).call(this);
