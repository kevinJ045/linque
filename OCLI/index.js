var fs = require('fs');
var path = require("path");
var db_error = require('./db_error');
var throws = require('../utils/throws');
var insertTo = require('./insert_to');
var getAllFrom = require('./get_all_from');
var existsDB = require('./exists_DB');
var createDB = require('./create_DB');
var updateFrom = require('./update_from');
var validateDB = require('./validate_DB');
var getProp = require('./get_prop');
var findOrFilter = require('./find_or_filter_op');
var OCLIEntry = require('./OCLIEntry');
var OCLIEntries = require('./OCLIEntries');
var PropConstants = require('./prop_constants');
var _md5 = require('../utils/_md5');

function OCLI_SubDataBase(db, name){
	this.db = db;
	this.name = name;
}

OCLI_SubDataBase.prototype = {
	name: "",
	db: {},
	insert(...toInsert){
		var that = this;
		Array.from(toInsert).forEach((item)=>{
			insertTo(this.db.__conn__.path, this.db.__selected_db__, item, that.name);
		});
		return getAllFrom(this.db.__selected_db__, this.db.__conn__.path, that.name);
	},
	find(obj, opt){
		return findOrFilter(obj, opt, 'find', this, opt ? opt.cb || null : null);
	},
	filter(obj, opt){
		return findOrFilter(obj, opt, 'filter', this, opt ? opt.cb || null : null);
	},
	getAll(){
		return getAllFrom(this.__selected_db__, this.db.__conn__.path, that.name);
	},
	update(cb){
		return updateFrom[1](this.__conn__.path, this.db.__selected_db__, cb, that.name);
	},
	updateWhere(obj, updateTo, opt){
		var ths = this;
		return updateFrom[2](ths, obj, updateTo, opt);
	},
	getProperties(...props){
		if(props.length == 1){
			if(props[0] == "pass" || props[0] == "entries") return null; 
			return getProp(this.__conn__.path, this.__selected_db__, props[0], this.name);
		} else {
			var _props = new (class OCLI_DataBase_Properties extends Array{});
			Array.from(props).forEach((prop)=>{
				if(prop == "pass" || prop == "entries") return;
				_props.push(getProp(this.__conn__.path, this.__selected_db__, prop, this.name));
			});
			return _props;
		}
	},
	getAutoIncreaments(){
		return getProp(this.__conn__.path, this.__selected_db__, 'auto_increament', this.name);
	},
	setProperties(){
		this.db.setProperties.apply(this, arguments);
	},
	addAutoIncreaments(){
		this.db.setProperties.apply(this, arguments);
	},
	removeAutoIncreaments(){
		this.db.setProperties.apply(this, arguments);
	}
}

function OCLI_DataBase(dbname, pathname, pass){
	if( !existsDB(dbname, pathname) ) {throws(db_error.not_exist); return}
	this.__conn__.pass = pass;
	this.__selected_db__ = dbname;
	this.__conn__.path = pathname;
	if( !validateDB(dbname, pathname, pass) ) {throws(db_error.not_validated_pass); return}
}

OCLI_DataBase.prototype = {
	__selected_db__: "",
	__conn__: {
		path: "",
		pass: ""
	},
	insert(...toInsert){
		if( !existsDB(this.__selected_db__, this.__conn__.path) ) {throws(db_error.not_exist); return}
		Array.from(toInsert).forEach((item)=>{
			insertTo(this.__conn__.path, this.__selected_db__, item);
		});
		return getAllFrom(this.__selected_db__, this.__conn__.path);
	},
	find(obj, opt){
		return findOrFilter(obj, opt, 'find', this, opt ? opt.cb || null : null);
	},
	filter(obj, opt){
		return findOrFilter(obj, opt, 'filter', this, opt ? opt.cb || null : null);
	},
	getAll(){
		return getAllFrom(this.__selected_db__, this.__conn__.path);
	},
	updateByID(id, item){
		return updateFrom[0](this.__conn__.path, this.__selected_db__, id, item);
	},
	update(cb){
		return updateFrom[1](this.__conn__.path, this.__selected_db__, cb);
	},
	updateWhere(obj, updateTo, opt){
		var ths = this;
		return updateFrom[2](ths, obj, updateTo, opt);
	},
	setPassword(pass){
		try{
			updateFrom[1](this.__conn__.path, this.__selected_db__, function(){
				this.pass = _md5(pass);
			});
			return true;
		} catch(e){
			return false;
		}
		//entry[i] = updateT
	},
	setProperties(props){
		try{
			this.update(function(){
				for(var i in props){
					this[i] = props[i];
				}
			});
			return true;
		} catch(e){
			return false;
		}
	},
	getProperties(...props){
		if(props.length == 1){
			if(props[0] == "pass" || props[0] == "entries") return null; 
			return getProp(this.__conn__.path, this.__selected_db__, props[0]);
		} else {
			var _props = new (class OCLI_DataBase_Properties extends Array{});
			Array.from(props).forEach((prop)=>{
				if(prop == "pass" || prop == "entries") return;
				_props.push(getProp(this.__conn__.path, this.__selected_db__, prop));
			});
			return _props;
		}
	},
	getAutoIncreaments(){
		return getProp(this.__conn__.path, this.__selected_db__, 'auto_increament');
	},
	addAutoIncreaments(...props){
		try{
			this.update(function(){
				var ths = this;
				Array.from(props).forEach((prop)=>{
					ths.auto_increament.push(prop);
				});
			});
			return this.getAutoIncreaments();
		} catch(e){
			return false;
		}
	},
	removeAutoIncreaments(...props){
		try{
			this.update(function(){
				var ths = this;
				Array.from(props).forEach((prop)=>{
					ths.auto_increament = ths.auto_increament.filter((_prop) => _prop != prop);
				});
			});
			return this.getAutoIncreaments();
		} catch(e){
			return false;
		}
	},
	createSubDB(name){
		this.update(function(){
			if(!this.sub_db) this.sub_db = {};
			this.sub_db[name] = {
				"name": name,
				"saved_entries": 0,
				"auto_increament": [],
				"entries": []
			};
		});
		return new OCLI_SubDataBase(this, name);
	},
	db(name){
		return new OCLI_SubDataBase(this, name);
	},
	getSubDB(){
		var th = this;
		var dbs_list = new (class OCLI_SubDataBases extends Array{});
		this.update(function(){
			if(!this.sub_db) this.sub_db = {};
			for(var i in this.sub_db){
				dbs_list.push(th.db(i));
			}
		});
		return dbs_list;
	},
	toString(){
		return this.__selected_db__;
	}
}

class OCLI_DataBases {
	__databases__ = [];
	toString(){
		return this.__databases__.join(', ');
	};
	constructor(access, ...names){
		var ths = this;
		Array.from(names).forEach((db)=>{
			var __db = access.db(db);
			ths.__databases__.push(__db);
			for(var i in __db){
				if(!ths[i]){
					ths[i] = function(){
						var args = arguments;
						var toReturn = [];
						ths.__databases__.forEach((db)=>{
							toReturn.push(db[i].apply(db, args));
						});
						return toReturn;
					};
				}
			}
		});
	};
}

function OCLI(opts){
	if(opts.pass) this.__conn__.pass = opts.pass;
	if(opts.path) this.__conn__.path = opts.path;
};

OCLI.prototype = {
	__conn__: {
		path: "",
		pass: ""
	},
	create(dbname, pass, conditional){
		return createDB(this.__conn__.path, dbname, pass || this.__conn__.pass, conditional) ? this.db('dbname') : false;
	},
	db(...dbname){
		if(dbname.length == 1){
			return new OCLI_DataBase(dbname[0], this.__conn__.path, this.__conn__.pass);
		} else {
			var dbset = new OCLI_DataBases(this, ...dbname);
			return dbset;
		}
	},
	pass(pass){
		this.__conn__.pass = pass;
	},
	query(str){
		if(str.match(/^select \* from (.+)/i)){
			var m = str.match(/^select \* from (.+)/i)[1];
			return this.db(m).getAll();
		}
	}
};


module.exports = OCLI;