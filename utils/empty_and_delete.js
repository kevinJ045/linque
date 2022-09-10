var fs = require('fs');
var path = require('path');

module.exports = (fpath)=>{
	var files = fs.readdirSync(fpath);
	files.forEach((item)=>{
		fs.unlinkSync(path.join(fpath, item));
	});
	fs.rmdirSync(fpath);
}