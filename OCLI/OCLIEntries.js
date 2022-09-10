var OCLIEntry = require('./OCLIEntry');

class OCLIEntries extends Array{
	constructor(...items){
		super();
		var ths = this;
		Array.from(items).forEach((item)=>{
			ths.push(new OCLIEntry(item));
		});
	}
}

module.exports = OCLIEntries;