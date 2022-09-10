module.exports = function(err){
	if(err.match(/^([A-Za-z0-9_]+)Error\:/)){
    var s = err.match(/^([A-Za-z0-9_]+)Error\:/);
    var type = s[1];
    var ename = type+"Error";
    var es = err.split(s[0])[1].trim();
    var E = new Error(es);
    E.name = ename;
    throw E;
  } else{
	  throw new Error(err);
  }
}