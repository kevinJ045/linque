var trimDash = (i)=>{
	return i.replace("--","").replace("-","");
};

module.exports = (string) => {
	if(string.match(" ")){
		var strings = [];
		var response = {};
		var index = 0;
		string = string.replace(/\"([\s\S]+)\"/ig, (fullstring, str)=>{
			var strid = "@str:::<"+strings.length+">";
			strings.push(str);
			return strid;
		});
		var args = string.split(" ");
		response.CMD = args.shift();
		args.forEach((arg)=>{
			if(arg.match("=")){
				var key = trimDash(arg.split("=")[0]);
				var val = arg.split("=")[1];
				if(val.match(/\@str\:\:\:/)) val = strings[arg.match(/\@str\:\:\:\<([0-9]+)\>/)[1]];
				response[key] = val;
			} else {
				if(arg.match(/\@str\:\:\:/)){
					response[index] = strings[arg.match(/\@str\:\:\:\<([0-9]+)\>/)[1]];
					index++;
				} else {
					response[trimDash(arg)] = true;
				}
			}
		});
		console.log(response);
	} else {
		return {CMD: string};
	}
};