var fs = require('fs');
var path = require("path");

module.exports = (pathname, dbname, prop) => {
	var _dbp = path.join(pathname, dbname+".json");
	var db_json = JSON.parse(fs.readFileSync(_dbp));
	return db_json[prop];
};