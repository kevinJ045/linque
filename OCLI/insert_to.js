var fs = require('fs');
var path = require("path");
var existsDB = require('./exists_DB');
var throws = require('../utils/throws');
var db_error = require('./db_error');

module.exports = (_p, name, item, subdb) => {
	if( !existsDB(name, _p) ) {throws(db_error.not_exist); return false;}
	if(typeof item != "object"){
		throws("JSONError: this is not a JS Object");
		return false;
	}
	try{
		JSON.stringify(item);
	} catch(e){
		throws("JSONError: this is not a JS Object");
		return false;
	}
	var _dbp = path.join(_p, name+".json");
	var _db_json = JSON.parse(fs.readFileSync(_dbp));
	var db_json = _db_json;
	if(subdb) db_json = _db_json.sub_db[subdb];
	var entries = db_json.entries;
	item.__id__ = (entries.length+1);
	(db_json.auto_increament || []).forEach((prop)=>{
		item[prop] = db_json.saved_entries;
	});
	entries.push(item);
	db_json.saved_entries++;
	fs.writeFileSync(_dbp, JSON.stringify(db_json));
	return true;
};