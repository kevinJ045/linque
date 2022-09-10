var fs = require('fs');
var path = require("path");
var existsDB = require('./exists_DB');
var throws = require('../utils/throws');
var db_error = require('./db_error');
var OCLIEntry = require('./OCLIEntry');
var OCLIEntries = require('./OCLIEntries');
var PropConstants = require('./prop_constants');

module.exports = [(_p, name, id, item) => {
	if(id < 1){
		throws("Entry id starts from 1");
		return false;
	}
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
	var db_json = JSON.parse(fs.readFileSync(_dbp));
	var entries = db_json.entries;
	if(id > entries.length){
		throws("IndexError: the maximum amount of this DB entries is "+entries.length);
		return;
	}
	for(var i in item){
		if(item[i] == null && entries[id-1][i] != null) delete entries[id-1][i];
		else entries[id-1][i] = item[i];
	}
	fs.writeFileSync(_dbp, JSON.stringify(db_json));
	return true;
},(dbpath, dbname, cb, subdb)=>{
	if( !existsDB(dbname, dbpath) ) {throws(db_error.not_exist); return false;}
	var _dbp = path.join(dbpath, dbname+".json");
	var _db_json = JSON.parse(fs.readFileSync(_dbp));
	var db_json = _db_json;
	if(subdb) db_json = _db_json.sub_db[subdb];
	var entries = db_json.entries;
	var entries_ocli = new OCLIEntries();

	entries.forEach((item)=>{
		entries_ocli.push(new OCLIEntry(item));
	});

	var ent = cb.apply(db_json, [entries]);
	if(!ent) ent = entries;
	if(!ent instanceof OCLIEntries){
		throws("Did not return OCLIEntries");
		return false;
	}

	db_json.entries = ent;

	fs.writeFileSync(_dbp, JSON.stringify(db_json));
	return entries_ocli;
}, (ths, obj, updateTo, opt) => {
	ths.update((entries)=>{
		return entries.map((entry)=>{
			ths.filter(obj, opt).forEach((item)=>{
				var _id = item.__id__;
				if(entry.__id__ == _id){
					for(var i in updateTo){
						if(updateTo[i] && updateTo[i].match(/\$_([A-Z]+)\((.+)\)/)){
							var matches = updateTo[i].match(/\$_([A-Z]+)\((.+)\)/);
							if(PropConstants[matches[1]]) PropConstants[matches[1]].apply(ths, [entry, i, matches[2].match(",") ? matches[2].split(',') : [matches[2]]]);
						} else if(i.match(/\%([A-Z]+)\@\$/)) {
							var matches = i.match(/\%([A-Z]+)\@\$/);
							for(var j in updateTo[i]){
								if(PropConstants[matches[1]])
									PropConstants[matches[1]].apply(ths, [entry, j, [updateTo[i][j]]]);
							}
						} else {
							entry[i] = updateTo[i];
						}
					}
				}
			});
			return entry;
		});
	});
}];
