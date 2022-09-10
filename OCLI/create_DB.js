var fs = require('fs');
var path = require("path");
var existsDB = require('./exists_DB');
var throws = require('../utils/throws');
var db_error = require('./db_error');
var _md5 = require('../utils/_md5');

module.exports = (_p, name, pass, conditional) => {
	if(existsDB(name, _p)){
		if(conditional) return true;
		throws(db_error.exists);
		return false;
	} else {
		var _dbp = path.join(_p, name);
		fs.writeFileSync(_dbp+".json", `{
	"name": "${name}",
	"pass": "${_md5(pass)}",
	"saved_entries": 0,
	"auto_increament": [],
	"entries": [],
	"sub_db": {}
}`);
		return true;
	}
};