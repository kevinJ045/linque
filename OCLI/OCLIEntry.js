function OCLIEntry(entry){
	for(var i in entry){
		this[i] = entry[i];
	}
}

OCLIEntry.prototype = {
	hasProperty(name){
		if(this[name]) return true;
		return false;
	},
	setProperty(name, value){
		if(this[name]) return this[name] = value;
		return false;
	}
}

module.exports = OCLIEntry;