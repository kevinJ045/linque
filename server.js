console.stdlog = console.log.bind(console);
console.logs = [];
console.log = function(){
    console.logs.push(Array.from(arguments));
    console.stdlog.apply(console, arguments);
}

const express = require("express");
const session = require("express-session");
const fs = require('fs');
const path = require('path');
const OCLI = require("./OCLI/index");
const cookieParser = require('cookie-parser');
const { get } = require("express/lib/response");
const { v4: uuidV4 } = require('uuid');
const callMoxi = require('./lib/moxi');
const crypto = require("crypto");
const axios = require("axios");
const moxidata = require('./lib/data_manager');
const { pickRandom, randFrom } = require('./lib/rand');
const adminPage = require('./lib/admin');

var app = express();
var server = require('http').createServer(app);

const io = require("socket.io")(server);

require("dotenv").config();

var con = new OCLI({
	pass: process.env.OCLI_DB_PASS,
	database: process.env.DB_NAME,
	path: "OCLI/DataBases"
});

var port = process.env.PORT || 1284;

app.use(session({
	secret: process.env.OCLI_DB_PASS,
	resave: true,
	// saveUninitialized: true
	saveUninitialized: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

var dbLinks = con.db("links");
var dbUsers = con.db("users");
var dbChats = con.db("chats");

const getLinkID = () => {
	var id = uuidV4();
	if(dbLinks.find({id: id})) return getLinkID();
	return id;
};

const addLink = (url,about,name,user) => {
	var id = getLinkID();
	var link = {
		id: id,
		url: url,
		about: about,
		name: name,
		user: user.username
	};
	var userlinks = dbUsers.find({username: user.username}).links;
	userlinks.push(id);
	dbUsers.updateWhere({
		username: user.username
	},{
		links: "$_PUSH("+id+")"
	});
	dbLinks.insert(link);
	return link;
};

const removeLink = (id) => {
	dbUsers.updateWhere({
		username: getLink(id).user
	},{
		links: "$_POP("+id+")"
	})
	dbLinks.update(function(a){
		var data = a;
		data = data.filter(function(dis){
			return dis.id != id;
		});
		return data;
	});
};

const getLink = (id) => {
	return dbLinks.find({id: id}) || dbLinks.find({__id__: id});
};
getLink.name = b => {
	return dbLinks.filter({name: b});
};
getLink.url = b => {
	return dbLinks.filter({url: b});
};
getLink.user = b => {
	return dbLinks.filter({user: b});
};
getLink.about = b => {
	return dbLinks.filter({about: b});
};

const usrs = {
	getAll(){
		return dbUsers.getAll();
	},
	register(username,pwd){
		if(dbUsers.find({username: username})){
			return "exists";
		} else {
			var user = {
				username: username,
				links: [],
				color: "",
				password: pwd
			}
			dbUsers.insert(user);
		}
	},
	get(username){
		return dbUsers.find({username: username});
	}
};

const chdb = {
	save(user, msg){
		// console.log(msg);
		var all = dbChats.getAll();
		if(all.length > 100){
			var _id = all[0].id;
			dbChats.update(function(a){
				var data = a;
				data = data.filter(function(dis){
					return dis.id != _id;
				});
				return data;
			});
		}
		dbChats.insert({
			text: msg.text,
			time: new Date().getTime(),
			reply: msg.reply || null,
			user: user.username,
			id: msg.id
		});
	},
	get(id){
		var msg = dbChats.find({id: id});
		if(!msg || !msg.user) return null;
		msg.user = usrs.get(msg.user);
		if(!msg.user) return null;
		delete msg.user.password;
		msg.user.time = new Date(msg.user.time);
		if(msg.reply){
			msg.reply.text = (chdb.get(msg.reply.to) || {}).text;
		}
		return msg;
	},
	getAll(){
		var all = dbChats.getAll();
		var results = [];
		all.forEach((msg, i) => {
			msg.user = usrs.get(msg.user.toLowerCase());
			delete msg.user.password;
			msg.time = new Date(msg.time);
			if(msg.reply){
				msg.reply.text = (chdb.get(msg.reply.to) || {}).text;
			}
			results.push(msg);
		});
		return results;
	}
}

const searchLinks = (query) => {
	var qry = query.trim();
	if(qry.length < 1) return res.send("nope");
	var rg = /\@([A-Za-z]+)\:([A-Za-z]+)/ig;
	var params = {};
	var results = [];

	if(qry.match(rg)){
		qry = qry.replace(rg, (a, b, c) => {
			var key = a.split(':')[0].replace("@","");
			var val = a.split(':')[1];

			params[key] = val;

			return "";
		}).replace("  ", " ").trim();
	}

	results = dbLinks.getAll().filter((link) => {
		var nm = link.name.match(new RegExp(qry,'i'));
		var txt = link.about.match(new RegExp(qry,'i'));
		var ur = link.url.match(new RegExp(qry,'i'));
		var r = nm || txt || ur;
		if(params.user){
			r = r && link.user == params.user;
		}
		link.match = 0;
		if(nm) link.match = 3;
		if(txt) link.match++;
		if(ur) link.match++;
		return r;
	});

	if(results.length == 1 && results[0].name == null) results = [];

	results = results.sort((a, b) => {
		return a.match < b.match ? 1 : -1;
	});

	return results;
};

const md5 = str => crypto.createHash("md5").update(str).digest("hex");

var genIDmsg = () => {
	return md5(uuidV4()+uuidV4()+uuidV4());
};

var searchImage = (query, cb) => {
  axios.get('https://api.unsplash.com/search/photos?client_id=mSbEkWVk8FdP55NlScHtRh1avojGBRht1HlbIuFhCWg', {
      params: {
        query: query
      }
  })
  .then(function (response) {
    cb({original: response.data.results[0].urls.regular});
  });
}

var moxi = {
	enabled: false,
	get: callMoxi,
	addMessage(socket, username, msg){
		var user = usrs.get(username);
		if(!user) return;
		delete user.password;
		if(msg.server_response) return;
    msg.text = msg.text.replace("<script>","&lt;script>");
		msg.id = genIDmsg();
		chdb.save(user, msg);
		if(msg.reply){
			msg.reply.text = (chdb.get(msg.reply.to) || {}).text;
		}
		socket.broadcast.emit('chat:new', user, msg);
	},
	sendmsg(socket, msg, text){
		var opt = [{
			username: "Server",
			color: "aqua"
		}, {
			text: text,
			reply: {
				to: msg.id,
				text: msg.text
			},
			id: "server-"+uuidV4()
		}];
		moxi.addMessage(socket, opt[0] ,opt[1]);
		chdb.save(opt[0] ,opt[1]);
		socket.emit('chat:new', opt[0], opt[1]);
	}
}

var checkForCommands = (socket, msg, username) => {
	if(msg.text[0] == "/"){
		if(msg.text.match("/moxi enable")){
			moxi.enabled = true;
		} else if(msg.text.match("/moxi disable")){
			moxi.enabled = false;
		} else if(msg.text.match('/pic')){
			searchImage(msg.text.replace("@pic","").trim(),(name) => {
				var text = "<img src='"+name.original+"' width='100%'/>";
				moxi.sendmsg(socket, msg, text);
			});
		}
	} else {
		if(moxi.enabled){
			moxi.sendmsg(socket, msg, moxi.get(msg.text));
		}
	}
}

io.on('connection', (socket) => {

	socket.on('chat:new', (username, msg) => {
		moxi.addMessage(socket, username, msg);
		checkForCommands(socket, msg, username);
	});

	socket.on('typing', username => {
		var user = usrs.get(username);
		if(!user) return;
		delete user.password;
		socket.broadcast.emit('typing', user);
	});


});

app.use("*", (req, res, next) => {
	var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
	console.log("\033[33m@Server: \033[39mDetected request from "+ip);
	if(req.session.username){
		if(usrs.get(req.session.username)){
			if(usrs.get(req.session.username).banned) {
				delete req.session.username;
			}
		}
	}
	next();
});

app.post("/login", (req, res) => {
	var uname = req.query.username;
	if(uname == "server") return res.send('err');
	uname = uname.toLowerCase().replace(/\ /i,"");
	var pwd = req.query.password;
	if(usrs.get(uname)){
		var usr = usrs.get(uname);
		if(pwd == usr.password && !usr.banned){
			req.session.username = uname;
			res.send("suc");
		} else {
			res.send("err");
		}
	} else {
		usrs.register(uname, pwd);
		req.session.username = uname;
		res.send("suc");
	}
});

app.use("/logout", (req, res) => {
	req.session.destroy();
	res.redirect("/app");
});

app.post("/api/addLink", (req, res) => {
	var uname = req.session.username || "";
	var name = req.query.name;
	var about = req.query.about;
	var url = req.query.url;

	if(!uname) return;

	var link = addLink(url,about,name,usrs.get(uname));

	res.send(link ? "suc" : "err");
});

app.post("/api/removeLink", (req, res) => {
	var link = getLink(req.query.id);
	if(!link) return res.send("404");
	if(req.session.username == link.user){
		removeLink(req.query.id);
		res.send("200");
	} else {
		res.send("401");
	}
});

app.use("/api/search", (req, res) => {
	var results = searchLinks(req.query.q);

	res.send(results.length ? results : "nope");
});

app.use("/api/chats", (req, res) => {
	var results = chdb.getAll();

	res.send(results.length ? results : "nope");
});

app.use("/api/links/new", (req, res) => {
	var links = dbLinks.getAll().reverse();
	var tosend = [];
	var length = links.length;
	if(length > 24) length = 24;
	for (var i = 0; i < length; i++) {
		tosend.push(links[i]);
	}
	res.send(tosend);
});

app.use("/api/links", (req, res) => {
	res.send(dbLinks.getAll());
});

app.use("/api/link/:id", (req, res) => {
	res.send(dbUsers.find({id: req.params.id}));
});

app.use("/api/users", (req, res) => {
	var users = dbUsers.getAll();
	users.forEach((item, i) => {
		delete item.password;
	});
	res.send(users);
});

app.use("/api/user/:username/settings", (req, res) => {
	var color = req.query.color;
	var username = req.params.username;
	if(!color) return res.send('what');
	dbUsers.updateWhere({
		username: username
	},{
		color: color
	});
	res.send('ok');
});

app.use("/api/user/:username", (req, res) => {
	var usr = usrs.get(req.params.username);
	if(usr) delete usr.password;
	var links = [];

	(usr || {links:[]}).links.forEach((item, i) => {
		links.push(getLink(item));
	});

	if(usr) usr.links = links;

	res.send(usr || "nope");
});

adminPage(app, usrs, chdb, removeLink, {
	links: dbLinks,
	users: dbUsers,
	chats: dbChats
});

app.use('/app/res', express.static(path.join(__dirname, 'app/public')));
app.get("/favicon.ico", (req, res) => {
	res.sendFile(path.join(__dirname, "logo/logo.png"));
});
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app/views'));
app.get(['/app/:page','/app/'], (req, res)=>{
	var user = dbUsers.find({
		username: req.session.username || ""
	});
	if(user) user.logged_in = true;

	var ur = (function(){
		var d = req.url.split("/");
		return d[d.length-1].split(".")[0];
	})()

	res.render("index", {
		user: user || {
			username: "user",
			logged_in: false,
			color: "default"
		},
		page: req.url.replace(/.+\/app\//,"")
	});
});
server.listen(port, () => console.log("\033[33m@Server: \033[32mServer started \033[35mhttp://[Host: localhost]:"+port));
