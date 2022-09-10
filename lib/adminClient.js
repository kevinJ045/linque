var loggedIn = false;
var commands = {
  login(term, username, password){
    if(!username || !password){
      return term.error('Put in credentials!');
    }
    $.ajax("/admin/login?p="+password+"&u="+username,{
      method: "POST"
    }).done(function(e){
      if(e == "yes") loggedIn = true;
      else term.error('Not admin username and password');
    });
  },
  status(term){
    term.echo("Logged in: " + loggedIn);
  },
  echo(term, ...words){
    term.echo(...words);
  },
  do(term, ...args){
    $.ajax("/admin/cmd/?qry="+args.join("|"),{
      method: "POST"
    }).done(function(e){
      if(e.status == "err"){
        term.error(e.response);
      } else {
        term.echo(e.response);
      }
    });
  },
  logout(term){
    $.ajax("/admin/logout",{
      method: "POST"
    }).done(function(e){
      location.reload();
    });
  }
};



var term = $('body').terminal(function(command, term) {
	var cmds = command.match(' ') ? command.split(' ') : [command];
	var cmd = cmds.shift();
  if(cmd == "login" || cmd == "status"){
    commands[cmd].call(commands, term, ...cmds);
  } else if(loggedIn){
  	if(commands[cmd]){
  		commands[cmd].call(commands, term, ...cmds);
  	} else {
  		term.error('No command found');
  	}
  } else {
      term.error('Not logged in, try "$ login [username] [password]"');
  }
}, {
	greetings: "Admin Command Prompt for Linque",
	prompt: "$ "
});
