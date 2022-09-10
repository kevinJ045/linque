const fs = require('fs');
const path = require('path');

var err = (txt) => {
  return {
    status: "err",
    response: txt
  }
}
var suc = (txt) => {
  return {
    status: "suc",
    response: txt
  }
}

var ban = (user, vars) => {
  vars.dbs.users.update(function(a){
    var data = [];
		a.forEach((usr, index) => {
      if(usr.username == user){
        usr.banned = true;
      }
      data.push(usr);
    });
		return a;
	});
}
var unban = (user, vars) => {
  vars.dbs.users.update(function(a){
    var data = [];
		a.forEach((usr, index) => {
      if(usr.username == user){
        delete usr.banned;
      }
      data.push(usr);
    });
		return a;
	});
}

var commands = {
  list(vars, ...args){
    var args = Array.from(args);
    var arg = args.shift();
    var response = "";

    if(arg == "users"){
      var users = vars.usrs.getAll();
      users.forEach((user, i) => {
        if(user.username == "server") return;
        response += "Username: "+user.username+"\n";
        response += "Links: "+user.links.length+"\n";
        response += "Password: "+user.password+"\n";
        response += "Color: "+user.color+"\n\n";
      });
    } else if(arg == "links"){
      var links = vars.dbs.links.getAll();
      links.forEach((link, i) => {
        response += (i+1)+": "+link.id+": "+link.name+"\n";
      });
    } else if(arg == "link"){
      var id = args[0];
      var link = vars.dbs.links.find({id: id});
      response += "Name: "+link.name+"\n";
      response += "User: "+link.user+"\n";
      response += "URL: "+link.url+"\n";
    } else if(arg == "banned"){
      var users = vars.usrs.getAll();
      users.forEach((user, i) => {
        if(user.username == "server") return;
        if(!user.banned) return;
        response += "Username: "+user.username+"\n";
        response += "Links: "+user.links.length+"\n";
        response += "Password: "+user.password+"\n";
        response += "Color: "+user.color+"\n\n";
      });
    } else if (arg == "logs") {
      response = console.logs.join("\n").replace(/\[3(.)m/ig,"");
    } else {
      response = "list [arg: users|links|logs] | list link [id]"
    }

    return response.trim();
  },
  delete(vars, ...args){
    var args = Array.from(args);
    if(!args.length) return "delete [post: id]";
    // var arg = args.shift();
    var response = "";

    args.forEach((id, i) => {
      vars.removeLink(id);
      response += "Deleted: "+id+"\n";
    });

    return response.trim();
  },
  ban(vars, ...args){
    var args = Array.from(args);
    if(!args.length) return "ban [user: id/name]";
    var response = "";

    args.forEach((id, i) => {
      ban(id, vars);
      response += "Banned: "+id+"\n";
    });

    return response.trim();
  },
  unban(vars, ...args){
    var args = Array.from(args);
    if(!args.length) return "unban [user: id/name]";
    var response = "";

    args.forEach((id, i) => {
      unban(id, vars);
      response += "Unbanned: "+id+"\n";
    });

    return response.trim();
  }
};

var admin = (app, usrs, chdb, removeLink, dbs) => {

  app.post("/admin/logout", (req, res) => {
    req.session.admin = false;
    res.send('ok');
  });

  app.post("/admin/login", (req, res) => {
    var u = req.query.u;
    var p = req.query.p;
    if(u == "server" && p == usrs.get('server').password){
      req.session.admin = true;
      res.send('yes');
    } else {
      res.send('nope');
    }
  });

  app.post("/admin/cmd", (req, res) => {
    if(req.session.admin){
      var qry = req.query.qry;
      var cmds = qry.split('|');
      var cmd = cmds.shift();
      if(!commands[cmd]) return res.send(err('ERR 404 No cmd found'));
      var response = "";
      try{
        response = commands[cmd].call(commands, {
          usrs,
          app,
          chdb,
          removeLink,
          dbs
        }, ...cmds);
      } catch(e){
        response = "ScriptError: " +e;
      }
      res.send(suc(response));
    } else {
      res.send(err('ERR 401 Not logged in'));
    }
  });

  app.get("/admin", (req, res) => {
    var html = fs.readFileSync(path.join(__dirname, "../admin/index.html")).toString();
  	html = html.replace('${{{{@insertcode}}}}', fs.readFileSync(path.join(__dirname, "./adminClient.js")).toString());
    if(req.session.admin) html = html.replace('var loggedIn = false;','var loggedIn = true;');
    res.send(html);
  });

};


module.exports = admin;
