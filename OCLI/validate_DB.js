var fs = require('fs');
var path = require("path");
var existsDB = require('./exists_DB');
var throws = require('../utils/throws');
var db_error = require('./db_error');
var _md5 = require('../utils/_md5');

module.exports = (dbname, pathname, pass) => {
	var _dbp = path.join(pathname, dbname+".json");
	var db_json = JSON.parse(fs.readFileSync(_dbp));
	return _md5(pass) == db_json.pass;
};