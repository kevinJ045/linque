var fs = require('fs');
var path = require("path");
var existsDB = require('./exists_DB');
var throws = require('../utils/throws');
var db_error = require('./db_error');
var OCLIEntry = require('./OCLIEntry');
var OCLIEntries = require('./OCLIEntries');

module.exports = (dbname, dbpath, subdb) => {
	if( !existsDB(dbname, dbpath) ) {throws(db_error.not_exist); return}
	var _dbp = path.join(dbpath, dbname+".json");
	var _db_json = JSON.parse(fs.readFileSync(_dbp));
	var db_json = _db_json;
	if(subdb) db_json = _db_json.sub_db[subdb];
	var entries = db_json.entries || [];
	var entries_ocli = new OCLIEntries();

	entries.forEach((item)=>{
		entries_ocli.push(new OCLIEntry(item));
	});

	return entries_ocli;
};