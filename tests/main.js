(function() {
  var MSSQLClient, MSSQLConnector, TABLENAME, TESTVARIABLES, async, should;

  should = require("should");

  async = require("async");

  MSSQLConnector = require("../lib/mssqlconnector");

  MSSQLClient = new MSSQLConnector({
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
  });

  TESTVARIABLES = {};

  TABLENAME = "NMSQLCON_Testtable";

  describe("Test for node-mssql-connector", function() {
    this.timeout(5000);
    before(function(done) {
      done();
    });
    after(function(done) {
      done();
    });
    describe("Database Statements", function() {
      var _this = this;
      return it("CREATE table (where all tests will be executed)", function(done) {
        var query;
        query = MSSQLClient.query("					CREATE TABLE " + TABLENAME + " 					(						ID INT NOT NULL PRIMARY KEY IDENTITY(1, 1),						Name varchar( 250 ) default '',						jahrgang int,						Created smalldatetime default getDate()					)			");
        query.exec(function(err, res) {
          should.not.exist(err);
          done();
        });
      });
    });
    describe("Error handling and syntax validation checks", function() {
      var _this = this;
      it("Error on empty statement", function(done) {
        var query;
        query = MSSQLClient.query("");
        query.should.not.be.ok;
        done();
      });
      it("Correct statement", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + " 				WHERE id = @id			");
        query.should.be.ok;
        done();
      });
      it("Set params two params on the same field name (Except: error)", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + " 				WHERE id = @id			");
        (function() {
          query.param("id", "Int", 100);
          return query.param("id", "Int", 200);
        }).should["throw"]();
        done();
      });
      it("Set params which are not in statement", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + " 				WHERE id = @id			");
        (function() {
          query.param("id", "Int", 200);
          return query.param('name', "Int", 100);
        }).should["throw"]();
        done();
      });
      it("Insert new item with wrong datatype", function(done) {
        var query;
        query = MSSQLClient.query("				INSERT INTO " + TABLENAME + " ( 					Name, 					Jahrgang 				) 				VALUES( 					@name, 					@jahrgang 				)			'");
        (function() {
          query.param("name", "VarChar", "User Name");
          return query.param("jahrgang", "wrongdatatype", 1986);
        }).should["throw"]();
        done();
      });
      return it("Delete ID which is not in table", function(done) {
        var query;
        query = MSSQLClient.query(" 				DELETE FROM " + TABLENAME + "  				WHERE id = @id			");
        query.param("id", "Int", 999999999);
        return query.exec(function(err, res) {
          res.rowcount.should.equal(0);
          done();
        });
      });
    });
    describe("INSERT statements", function() {
      var _this = this;
      return it("Insert new item", function(done) {
        var query;
        query = MSSQLClient.query("				INSERT INTO " + TABLENAME + " ( 					Name, 					jahrgang 				) 				VALUES( @name, @jahrgang )				SELECT @@IDENTITY AS 'id'			");
        query.param("name", "VarChar", "Username");
        query.param("jahrgang", "Int", 23);
        query.exec(function(err, res) {
          var result;
          res.should.have.keys(['result', 'rowcount']);
          res.rowcount.should.equal(2);
          result = res.result;
          result.should.be.an.instanceOf(Array);
          result[0].should.have.keys(["id"]);
          TESTVARIABLES.insertnewid = result[0].id;
          done();
        });
      });
    });
    describe("UPDATE statements", function() {
      var _this = this;
      return it("Update inserted item (First insert new one)", function(done) {
        var query;
        query = MSSQLClient.query("				INSERT INTO " + TABLENAME + " ( Name, Jahrgang ) 				VALUES( @name, @jahrgang ) SELECT @@IDENTITY AS 'id'			");
        query.param("name", "VarChar", "Hänschen Müller");
        query.param("jahrgang", "Int", 1986);
        return query.exec(function(err, res) {
          TESTVARIABLES.updatedID = res.result[0].id;
          query = MSSQLClient.query("					UPDATE " + TABLENAME + "  					SET Name = @name 					WHERE ID = @id				");
          query.param("id", "Int", TESTVARIABLES.updatedID);
          query.param("name", "VarChar", "UpdatedName");
          query.exec(function(err, res) {
            var result;
            res.should.have.keys(['result', 'rowcount']);
            res.rowcount.should.equal(1);
            result = res.result;
            result.should.be.an.instanceOf(Array);
            done();
          });
        });
      });
    });
    describe("SELECT statements", function() {
      var _this = this;
      it("Get latest inserted ID", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + "  				WHERE id = @id			");
        query.param("id", "Int", TESTVARIABLES.insertnewid);
        return query.exec(function(err, res) {
          var model, result;
          res.should.have.keys(["result", "rowcount"]);
          res.rowcount.should.equal(1);
          result = res.result;
          result.should.be.an.instanceOf(Array);
          model = result[0];
          model.should.have.keys(["id", "name", "jahrgang", "created"]);
          done();
        });
      });
      it("Get updated data", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + " 				WHERE id = @id			");
        query.param("id", "Int", TESTVARIABLES.updatedID);
        return query.exec(function(err, res) {
          var model, result;
          res.should.have.keys(["result", "rowcount"]);
          res.rowcount.should.equal(1);
          result = res.result;
          result.should.be.an.instanceOf(Array);
          model = result[0];
          model.should.have.keys(["id", "name", "jahrgang", "created"]);
          model.name.should.equal("UpdatedName");
          done();
        });
      });
      return it("Select with LIKE statement", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT     *				FROM       " + TABLENAME + " 				WHERE     Name LIKE @Update			");
        query.param("Update", "VarChar", "%Name%");
        return query.exec(function(err, res) {
          res.should.have.keys(["result", "rowcount"]);
          done();
        });
      });
    });
    describe("Syntax checks", function() {
      var _this = this;
      return it("Test SQL injection", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + "  				WHERE name = @name			");
        query.param("name", "VarChar", "sakljasd' OR 1=1 or name='");
        return query.exec(function(err, res) {
          res.should.have.keys(["result", "rowcount"]);
          res.rowcount.should.equal(0);
          done();
        });
      });
    });
    describe("Speed tests", function() {
      var _queryFunc,
        _this = this;
      this.timeout(900000000);
      _queryFunc = function(idx, cb) {
        var query;
        query = MSSQLClient.query("				SELECT TOP 1 ID 				FROM " + TABLENAME + "  				WHERE id = @id			");
        query.param("id", "Int", idx);
        query.exec(cb);
      };
      it("Seriel from ID 80 - 327", function(done) {
        var _i, _results;
        return async.mapSeries((function() {
          _results = [];
          for (var _i = 80; 80 <= .327 ? _i < .327 : _i > .327; 80 <= .327 ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this), _queryFunc, function(err, resp) {
          done();
        });
      });
      it("Parallel from ID 80 - 327", function(done) {
        var _i, _results;
        return async.map((function() {
          _results = [];
          for (var _i = 80; 80 <= .327 ? _i < .327 : _i > .327; 80 <= .327 ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this), _queryFunc, function(err, resp) {
          done();
        });
      });
    });
    return describe("DELETE statements", function() {
      var _this = this;
      it("Delete latest inserted ID", function(done) {
        var query;
        query = MSSQLClient.query("				DELETE FROM " + TABLENAME + "  				WHERE id = @id			");
        query.param("id", "Int", TESTVARIABLES.insertnewid);
        return query.exec(function(err, res) {
          var result;
          res.rowcount.should.equal(1);
          result = res.result;
          result.should.be.an.instanceOf(Array);
          done();
        });
      });
      it("Delete the created table", function(done) {
        var query;
        query = MSSQLClient.query("				DROP TABLE Dbo." + TABLENAME + " 			");
        query.exec(function(err, res) {
          should.not.exist(err);
          done();
        });
      });
    });
  });

}).call(this);
