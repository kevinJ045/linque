module.exports = {
	POP(entry, prop, args){
		Array.from(args).forEach((arg)=>{
			entry[prop] = entry[prop].filter((item) => item != arg);
		});
	},
	PUSH(entry, prop, args){
		Array.from(args).forEach((arg)=>{
			entry[prop].push(arg);
		});
	},
	INCREASE(entry, prop, args){
		entry[prop] = parseInt(entry[prop]) + parseInt(args[0]);
	},
	DECREASE(entry, prop, args){
		entry[prop] = parseInt(entry[prop]) - parseInt(args[0]);
	}
}