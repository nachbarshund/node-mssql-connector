(function() {
  var MSSQLClient, MSSQLClientFalseCon, MSSQLConnector, TABLENAME, TESTVARIABLES, async, config, should;

  should = require("should");

  async = require("async");

  MSSQLConnector = require("../lib/mssqlconnector");

  try {
    config = require("../config.json");
  } catch (error) {
    console.error("loading config file:");
    console.log(error);
    return;
  }

  MSSQLClient = new MSSQLConnector(config);

  MSSQLClientFalseCon = new MSSQLConnector({
    detailerror: true,
    poolconfig: {
      max: 30,
      min: 0,
      acquireTimeout: 30000,
      idleTimeout: 300000,
      retryDelay: 500,
      log: false
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

  TABLENAME = "GruntTest";

  describe("Test for node-mssql-connector", function() {
    this.timeout(5000);
    before(function(done) {
      done();
    });
    after(function(done) {
      done();
    });
    describe("Init setup", function() {
      var _this = this;
      return it("Create new table", function(done) {
        var query;
        query = MSSQLClient.query("				CREATE TABLE " + TABLENAME + " 				(					ID INT NOT NULL PRIMARY KEY IDENTITY(1, 1),					Name varchar( 250 ) default '',					jahrgang int,					Created smalldatetime default getDate()				)			");
        query.exec(function(err, res) {
          should.not.exist(err);
          done();
        });
      });
    });
    describe("Error handling, Connection check and syntax validation check", function() {
      var _this = this;
      it("Check incorrect connection (Except: error)", function(done) {
        var query;
        query = MSSQLClientFalseCon.query("				SELECT * 				FROM " + TABLENAME + " 				WHERE id = @id			");
        query.param("id", "Int", 100);
        query.param("id", "Int", 200);
        query.exec(function(err, res) {
          should.exist(err);
          done();
        });
      });
      it("Try to create same table again (Except: error)", function(done) {
        var query;
        query = MSSQLClient.query("				CREATE TABLE " + TABLENAME + " 				(					ID INT NOT NULL PRIMARY KEY IDENTITY(1, 1),					Name varchar( 250 ) default '',					jahrgang int,					Created smalldatetime default getDate()				)			");
        query.exec(function(err, res) {
          should.exist(err);
          done();
        });
      });
      it("Throw error on empty statement", function(done) {
        var query;
        query = MSSQLClient.query("");
        query.exec(function(err, res) {
          should.exist(err);
          done();
        });
      });
      it("Set params with Invalid column name (Except: error)", function(done) {
        var query;
        query = MSSQLClient.query("				INSERT INTO " + TABLENAME + " ( 					Name, 					wrongkey 				) 				VALUES( @name, @wrongkey )				SELECT @@IDENTITY AS 'id'			");
        query.param("name", "VarChar", "Chris");
        query.param("wrongkey", "Int", 200);
        query.exec(function(err, res) {
          should.exist(err);
          done();
        });
      });
      it("Set params two params on the same field name (Except: error)", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + " 				WHERE id = @id			");
        query.param("id", "Int", 100);
        query.param("id", "Int", 200);
        query.exec(function(err, res) {
          should.exist(err);
          done();
        });
      });
      it("Set params which are not in statement", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + " 			");
        query.param("id", "Int", 200);
        query.exec(function(err, res) {
          should.exist(err);
          done();
        });
      });
      it("Insert new item with wrong datatype", function(done) {
        var query;
        query = MSSQLClient.query("				INSERT INTO " + TABLENAME + " ( 					Name, 					Jahrgang 				) 				VALUES( 					@name, 					@jahrgang 				)			'");
        query.param("name", "VarChar", "User Name");
        query.param("jahrgang", "custominteger", 1986);
        query.exec(function(err, res) {
          should.exist(err);
          done();
        });
      });
      return it("Correct statement", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + " 				WHERE id = @id			");
        query.exec(function(err, res) {
          should.exist(err);
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
    describe("INSERT statements", function() {
      var _this = this;
      it("Insert new item", function(done) {
        var query;
        query = MSSQLClient.query("				INSERT INTO " + TABLENAME + " ( 					Name, 					jahrgang 				) 				VALUES( @name, @jahrgang )				SELECT @@IDENTITY AS 'id'			");
        query.param("name", "VarChar", "Username");
        query.param("jahrgang", "Int", 23);
        query.exec(function(err, res) {
          var result;
          should.not.exist(err);
          res.should.have.keys(['result', 'rowcount']);
          res.rowcount.should.equal(2);
          result = res.result;
          result.should.be.an.instanceOf(Array);
          result[0].should.have.keys(["id"]);
          TESTVARIABLES.insertnewid = result[0].id;
          done();
        });
      });
      return it("Insert with integer > 2147483647", function(done) {
        var query;
        query = MSSQLClient.query("				INSERT INTO " + TABLENAME + " ( 					Name, 					jahrgang 				) 				VALUES( @name, @jahrgang )				SELECT @@IDENTITY AS 'id'			");
        query.param("name", "VarChar", "IntegerCheck");
        query.param("jahrgang", "Int", 2147483648);
        query.exec(function(err, res) {
          should.exist(err);
          err.name.should.equal('request-error');
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
          should.not.exist(err);
          TESTVARIABLES.updatedID = res.result[0].id;
          query = MSSQLClient.query("					UPDATE " + TABLENAME + "  					SET Name = @name 					WHERE ID = @id				");
          query.param("id", "Int", TESTVARIABLES.updatedID);
          query.param("name", "VarChar", "UpdatedName");
          query.exec(function(err, res) {
            var result;
            should.not.exist(err);
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
      it("Set internal variable in statement", function(done) {
        var query;
        query = MSSQLClient.query("				DECLARE @lastid int				SET @lastid = " + TESTVARIABLES.insertnewid + "				SELECT ID				FROM " + TABLENAME + "  				WHERE ID = @lastid			");
        return query.exec(function(err, res) {
          var model, result;
          should.not.exist(err);
          res.should.have.keys(["result", "rowcount"]);
          result = res.result;
          result.should.be.an.instanceOf(Array);
          model = result[0];
          model.should.have.keys(["id"]);
          done();
        });
      });
      it("Select with underscore(_) variables", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + "  				WHERE ID = @last_id			");
        query.param("last_id", "Int", TESTVARIABLES.insertnewid);
        return query.exec(function(err, res) {
          var model, result;
          should.not.exist(err);
          res.should.have.keys(["result", "rowcount"]);
          res.rowcount.should.equal(1);
          result = res.result;
          result.should.be.an.instanceOf(Array);
          model = result[0];
          model.should.have.keys(["id", "name", "jahrgang", "created"]);
          done();
        });
      });
      it("Get latest inserted ID", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + "  				WHERE id = @id			");
        query.param("id", "Int", TESTVARIABLES.insertnewid);
        return query.exec(function(err, res) {
          var model, result;
          should.not.exist(err);
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
          should.not.exist(err);
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
      it("Select with LIKE statement", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT     *				FROM       " + TABLENAME + " 				WHERE     Name LIKE @Update			");
        query.param("Update", "VarChar", "%Name%");
        return query.exec(function(err, res) {
          should.not.exist(err);
          res.should.have.keys(["result", "rowcount"]);
          done();
        });
      });
      return it("Select with IN statement (ids)", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT     *				FROM       " + TABLENAME + " 				WHERE     ID IN (@idlist)			");
        query.param("idlist", "Int", [1, 2, 3]);
        return query.exec(function(err, res) {
          should.not.exist(err);
          res.should.have.keys(["result", "rowcount"]);
          done();
        });
      });
    });
    describe("DELETE statements", function() {
      var _this = this;
      it("Delete ID which is not in table", function(done) {
        var query;
        query = MSSQLClient.query(" 				DELETE FROM " + TABLENAME + "  				WHERE id = @id			");
        query.param("id", "Int", 999999999);
        return query.exec(function(err, res) {
          should.not.exist(err);
          res.rowcount.should.equal(0);
          done();
        });
      });
      return it("Delete latest inserted ID", function(done) {
        var query;
        query = MSSQLClient.query("				DELETE FROM " + TABLENAME + "  				WHERE id = @id			");
        query.param("id", "Int", TESTVARIABLES.insertnewid);
        return query.exec(function(err, res) {
          var result;
          should.not.exist(err);
          res.rowcount.should.equal(1);
          result = res.result;
          result.should.be.an.instanceOf(Array);
          done();
        });
      });
    });
    describe("TESTS for tedious v1.11.5", function() {
      var _this = this;
      it("Insert three datasets", function(done) {
        var query;
        query = MSSQLClient.query("				INSERT INTO " + TABLENAME + " ( 					Name, 					jahrgang 				) 				VALUES( @name, @jahrgang )			");
        query.param("name", "VarChar", "Testuser");
        query.param("jahrgang", "Int", 28);
        query.exec(function(err, res) {
          should.not.exist(err);
          query = MSSQLClient.query("					INSERT INTO " + TABLENAME + " ( 						Name, 						jahrgang 					) 					VALUES( @name, @jahrgang )				");
          query.param("name", "VarChar", "Testuser");
          query.param("jahrgang", "Int", 28);
          query.exec(function(err, res) {
            should.not.exist(err);
            done();
          });
        });
      });
      return it("Select with multiple results", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT TOP 2 * 				FROM " + TABLENAME + "  				WHERE jahrgang = @jahrgang			");
        query.param("jahrgang", "Int", 28);
        return query.exec(function(err, res) {
          should.not.exist(err);
          res.rowcount.should.equal(2);
          res.result.length.should.equal(2);
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
        query = MSSQLClient.query("				SELECT TOP 1 ID 				FROM " + TABLENAME + "  			");
        query.exec(function(err, resp) {
          if (err) {
            cb(err);
            return;
          }
          if (resp.rowcount === 1) {
            cb(null, "Row: " + idx);
          } else {
            cb(true, 'No recorcd error');
          }
        });
      };
      it("Seriel from ID (500 records)", function(done) {
        var _i, _results;
        return async.mapSeries((function() {
          _results = [];
          for (_i = 1; _i <= 500; _i++){ _results.push(_i); }
          return _results;
        }).apply(this), _queryFunc, function(err, resp) {
          should.not.exist(err);
          done();
        });
      });
      it("Parallel from ID (500 records)", function(done) {
        var _i, _results;
        return async.map((function() {
          _results = [];
          for (var _i = 1; 1 <= .500 ? _i < .500 : _i > .500; 1 <= .500 ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this), _queryFunc, function(err, resp) {
          should.not.exist(err);
          done();
        });
      });
    });
    return describe("DATABASE end", function() {
      var _this = this;
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
