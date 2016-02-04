(function() {
  var Chart, MSSQLClient, MSSQLClient2, MSSQLClientFalseCon, MSSQLConnector, ProgressBar, TABLENAME, TESTVARIABLES, async, config, should;

  should = require("should");

  async = require("async");

  Chart = require("cli-chart");

  ProgressBar = require("progress");

  MSSQLConnector = require("../lib/mssqlconnector");

  try {
    config = require("../config.json");
  } catch (error) {
    console.error("loading config file");
    console.log(error);
    return;
  }

  MSSQLClient = new MSSQLConnector(config.config1);

  MSSQLClient2 = new MSSQLConnector(config.config2);

  MSSQLClientFalseCon = new MSSQLConnector({
    detailerror: true,
    poolconfig: {
      max: 3000000,
      min: 0,
      acquireTimeout: 30000000,
      idleTimeout: 30000000,
      retryDelay: 500,
      log: false,
      tries: 3
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

  TABLENAME = "GruntTest21";

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
      return it("Create new tables", function(done) {
        var query;
        query = MSSQLClient.query("				CREATE TABLE " + TABLENAME + " 				(					ID INT NOT NULL PRIMARY KEY IDENTITY(1, 1),					Name varchar( 250 ) default '',					jahrgang int,					Created smalldatetime default getDate()				)			");
        query.exec(function(err, res) {
          should.not.exist(err);
          done();
        });
        return;
        query = MSSQLClient2.query("				CREATE TABLE " + TABLENAME + " 				(					ID INT NOT NULL PRIMARY KEY IDENTITY(1, 1),					Name varchar( 250 ) default '',					jahrgang int,					Created smalldatetime default getDate()				)			");
        query.exec(function(err, res) {
          should.not.exist(err);
          done();
        });
      });
    });
    describe("Error handling and syntax validation check", function() {
      var _this = this;
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
      it("Insert new item2", function(done) {
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
        return;
        query = MSSQLClient2.query("				INSERT INTO " + TABLENAME + " ( 					Name, 					jahrgang 				) 				VALUES( @name, @jahrgang )				SELECT @@IDENTITY AS 'id'			");
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
      it("Select with IN statement (ids)", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT     *				FROM       " + TABLENAME + " 				WHERE     ID IN (@idlist)			");
        query.param("idlist", "Int", [1, 2, 3]);
        return query.exec(function(err, res) {
          should.not.exist(err);
          res.should.have.keys(["result", "rowcount"]);
          done();
        });
      });
      it("Select from different databases (Part 1)", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT     TOP 1 *				FROM       " + TABLENAME + "			");
        return query.exec(function(err, res) {
          should.not.exist(err);
          res.should.have.keys(["result", "rowcount"]);
          res.rowcount.should.equal(1);
          done();
        });
      });
      return it("Select from different databases (Part 2)", function(done) {
        var query;
        query = MSSQLClient2.query("				SELECT     TOP 1 *				FROM       " + TABLENAME + "			");
        return query.exec(function(err, res) {
          should.not.exist(err);
          res.should.have.keys(["result", "rowcount"]);
          res.rowcount.should.equal(1);
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
    describe("Tests for connection pool with different databases", function() {
      var _this = this;
      it("Check database on first client (1/3)", function(done) {
        var query;
        query = MSSQLClient.query("					SELECT db_name() as db				");
        return query.exec(function(err, res) {
          should.not.exist(err);
          res.result[0].db.should.equal(config.config1.connection.options.database);
          done();
        });
      });
      it("Check database on second client (2/3)", function(done) {
        var query;
        query = MSSQLClient2.query("					SELECT db_name() as db				");
        return query.exec(function(err, res) {
          should.not.exist(err);
          res.result[0].db.should.equal(config.config2.connection.options.database);
          done();
        });
      });
      return it("Check database on first client again (3/3)", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT db_name() as db			");
        return query.exec(function(err, res) {
          should.not.exist(err);
          res.result[0].db.should.equal(config.config1.connection.options.database);
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
    describe("Single / multiple IN select statements", function() {
      var _this = this;
      it("Insert first user with \"jahrgang\" 56", function(done) {
        var query;
        query = MSSQLClient.query("				INSERT INTO " + TABLENAME + " ( 					Name, 					jahrgang 				) 				VALUES( @name, @jahrgang )			");
        query.param("name", "VarChar", "In_User 1");
        query.param("jahrgang", "Int", 56);
        query.exec(function(err, res) {
          should.not.exist(err);
          done();
        });
      });
      it("Insert second user with \"jahrgang\" 69", function(done) {
        var query;
        query = MSSQLClient.query("				INSERT INTO " + TABLENAME + " ( 					Name, 					jahrgang 				) 				VALUES( @name, @jahrgang )			");
        query.param("name", "VarChar", "In_User 1");
        query.param("jahrgang", "Int", 69);
        query.exec(function(err, res) {
          should.not.exist(err);
          done();
        });
      });
      it("Select IN statement with one parameter", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + "  				WHERE jahrgang IN (@jahrgaenge)			");
        query.param("jahrgaenge", "Int", [56, 69]);
        return query.exec(function(err, res) {
          should.not.exist(err);
          res.rowcount.should.equal(2);
          done();
        });
      });
      it("Select IN statement with two parameter with the same name", function(done) {
        var query;
        query = MSSQLClient.query("				SELECT * 				FROM " + TABLENAME + "  				WHERE jahrgang IN (@jahrgaenge) or jahrgang IN (@jahrgaenge)			");
        query.param("jahrgaenge", "Int", [56, 69]);
        return query.exec(function(err, res) {
          should.not.exist(err);
          res.rowcount.should.equal(2);
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
      it("Seriel from ID (100 records)", function(done) {
        var _i, _results;
        return async.mapSeries((function() {
          _results = [];
          for (_i = 1; _i <= 100; _i++){ _results.push(_i); }
          return _results;
        }).apply(this), _queryFunc, function(err, resp) {
          should.not.exist(err);
          done();
        });
      });
      it("Parallel from ID (100 records)", function(done) {
        var _i, _results;
        return async.map((function() {
          _results = [];
          for (_i = 1; _i <= 100; _i++){ _results.push(_i); }
          return _results;
        }).apply(this), _queryFunc, function(err, resp) {
          should.not.exist(err);
          done();
        });
      });
    });
    describe("Benchmarks tests", function() {
      var chart, convertByteinMB, getCurrentMemory, progressBar, _queryFunc, _total,
        _this = this;
      this.timeout(900000000);
      _total = 5000;
      progressBar = new ProgressBar("Start queries (Total: " + _total + " ) [:bar] :percent", {
        total: _total
      });
      chart = new Chart({
        xlabel: "Request (Step 100)",
        ylabel: "memory in usage (MB)",
        direction: "y",
        width: 100,
        height: 0,
        lmargin: 15,
        step: 2
      });
      convertByteinMB = function(x) {
        return Math.round(((x / 1024) / 1024) * 100) / 100;
      };
      getCurrentMemory = function() {
        var _memory;
        _memory = process.memoryUsage();
        return convertByteinMB(_memory.heapUsed);
      };
      _queryFunc = function(idx, cb) {
        var query;
        query = MSSQLClient.query("				SELECT TOP 1 ID 				FROM " + TABLENAME + "  			");
        query.exec(function(err, resp) {
          if (idx % 100 === 0) {
            chart.addBar(getCurrentMemory());
          }
          progressBar.tick();
          cb();
        });
      };
      it("Check memory leak (" + _total + " requests)", function(done) {
        var _i, _results;
        async.eachSeries((function() {
          _results = [];
          for (var _i = 1; 1 <= _total ? _i <= _total : _i >= _total; 1 <= _total ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this), _queryFunc, function(err, resp) {
          chart.draw();
          done();
        });
      });
    });
    describe("DATABASE end", function() {
      var _this = this;
      it("Delete the created tables", function(done) {
        var query;
        query = MSSQLClient.query("				DROP TABLE Dbo." + TABLENAME + " 			");
        query.exec(function(err, res) {
          should.not.exist(err);
          done();
        });
        return;
        query = MSSQLClient2.query("				DROP TABLE Dbo." + TABLENAME + " 			");
        query.exec(function(err, res) {
          should.not.exist(err);
          done();
        });
      });
    });
    return describe("Connection tests", function() {
      var _this = this;
      this.timeout(900000000);
      return it("Check incorrect connection (Except: error)", function(done) {
        var query;
        MSSQLClientFalseCon.on("error", function(msg) {
          should.exist(msg);
          done();
        });
        query = MSSQLClientFalseCon.query("				SELECT TOP 1 ID 				FROM " + TABLENAME + " 			");
        query.exec(function(err, res) {});
      });
    });
  });

}).call(this);
