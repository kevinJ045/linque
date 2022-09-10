var fs = require("fs");
var path = require("path");

var log = console.log;

var data = fs.readFileSync(path.join(__dirname, "./data.js")).toString();

var exp = eval(data);

var get = (question) => {
				return exp.find((data)=>{
								return question.match(data.keyword);
				});
}

var set = (question, response) => {
      var _data = `{
								keyword: new RegExp("${question}", 'i'),
								response: (text) => {
												return "${response}";
								}
				}`;
				try{
				exp.push(eval('('+_data+')'));
				fs.writeFileSync(path.resolve("./data.js"), data.replace(/\]\)/i, _data + ",\n])"));
				} catch (e) {
								
				}
				return exp;
}


module.exports = { get, set }
