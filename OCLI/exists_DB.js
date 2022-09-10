var fs = require('fs');
var path = require("path");

module.exports = (db, _path) => fs.existsSync(path.join(_path, db+".json"));