var OCLIEntry = require('./OCLIEntry');
var OCLIEntries = require('./OCLIEntries');

module.exports = (obj, _opt, op, that, cb) => {
	var opt = Object.assign({
		matches: []
	}, _opt);
	var entries = new OCLIEntries();
	var toReturn = that.getAll()[op]((item, index)=>{
		if(cb){
			return cb(new OCLIEntry(item), index);
		} else {
			var matches = 0;
			for(var i in obj){
				if(opt.matches.indexOf(i) > -1){
					if(item[i].match(new RegExp(obj[i], 'ig'))) matches++;
				} else {
					if(obj[i] == item[i]) matches++;
				}
			}
			if(matches == Object.keys(obj).length) return true;
			return false;
		}
	});
	if(op == "filter"){
		toReturn.forEach((item)=>{
			entries.push(new OCLIEntry(item));
		});
	}
	return op == "find" ? (toReturn ? new OCLIEntry(toReturn) : null) : entries;
}