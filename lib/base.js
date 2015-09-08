(function() {
  var Base, extend, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  extend = require("extend");

  _ = require("lodash")._;

  module.exports = Base = (function() {
    /*
    	## _defaults
    	
    	`base._defaults( id, cb )`
    	
    	Set defaults as empty. They will be set in extened classes.
    	
    	@return { Object } Return empty object 
    	
    	@api private
    */

    Base.prototype._defaults = function() {
      return {};
    };

    /*
    	## constructor
    	
    	`base.constructor( id, cb )`
    	
    	Initialized and set the config.
    	
    	@param { Object } options Desc 
    	
    	@api private
    */


    function Base(options) {
      this._handleError = __bind(this._handleError, this);
      this._defaults = __bind(this._defaults, this);      this.config = extend(true, {}, this._defaults(), options);
      if (this.initialize) {
        this.initialize();
      }
      return;
    }

    /*
    	## _handleError
    	
    	`basic._handleError( cb, err [, data] )`
    	
    	Baisc error handler. It creates a true error object and returns it to the callback, logs it or throws the error hard
    	
    	@param { Function|String } cb Callback function or name to send it to the logger as error 
    	@param { String|Error|Object } err Error type, Obejct or real error object
    	
    	@api private
    */


    Base.prototype._handleError = function(cb, err, detail) {
      var _err;
      if (detail == null) {
        detail = null;
      }
      if (_.isString(err)) {
        _err = {};
        _err.name = err;
        if (detail) {
          _err.message = detail;
        }
      } else {
        _err = err;
      }
      if (this.config.detailerror != null) {
        _err.query = this.statement;
        _err.params = this._params;
      }
      if (!this._error) {
        this._error = _err;
      }
      if (_.isFunction(cb)) {
        cb(_err);
        return;
      }
    };

    return Base;

  })();

}).call(this);
