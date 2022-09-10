$(window).on('load',function(that) {
	var page = location.cpath;
	var httpRegEx = /(\b(?:(?:https?|ftp):\/\/|www\.)[-a-z0-9+&@#\/%?=~+|!:,.;]*[-a-z0-9+&@#\/%?=~_|])/ig;

	var nav = function(url){
		$.ajax("/app/res/pages/"+url+".html")
		.done(function(data){
			writeData(data);
			init(url);
		});
	}

	var showError = function(err){
		if($("#err").length) return;
		$("#app").append("<div class=\"err\" id=\"err\">"+err+"</div>");
		setTimeout(function(){
			$("#err").remove();
		},3000);
	}

	var login = function(usr, pwd){
		var uname = usr.trim();
		if(!uname) return showError("No username entered");
		uname = uname.toLowerCase().replace(/\ /i,"");
		if(uname.length > 32) return showError("Max of 32 characters for username");
		var password = pwd;
		if(!password) return showError("No password entered");
		if(password.length > 12) return showError("Max of 12 characters for username");
		$.ajax("/login?username="+uname+"&password="+password).done(function(e){
			if(e == "err"){
				showError("Wrong username or password");
			} else {
				location.reload();
			}
		});
	}

	var postLink = function(_url,_name,_about){
		var url = _url.replace(/\</g, '&lt;').trim();
		var name = _name.replace(/\</g, '&lt;').trim();
		var about = _about.trim();
		if(!name || !about || !url) return showError("Fill all inputs");
		if(!url.match(httpRegEx)) return showError("Link invalid");
		if(name.length > 14) return showError("Name too long...");
		if(about.length > 300) return showError("About is too long...");
		$.ajax("/api/addLink?"+
			"username="+__user__.username+"&"+
			"name="+name+"&"+
			"url="+url+"&"+
			"about="+about
		).done(function(e){
			if(e == "err"){
				showError("Some error occured");
			} else {
				cb(e);
			}
		});
	}

	var refreshHome = function(){
		var eltl = $("#links-list");

		eltl.empty();

		$.ajax("/api/links/new").done(function(a){
			a.forEach((item, i) => {
				// eltl.append('<div class="card">\
				// 		<div class="content">\
				// 			<p class="name">'+item.name+'</p>\
				// 			<p class="poster"><i class="fa fa-user fa-small"></i> | '+item.user+'</p>\
				// 			<p class="about">'+item.about+'</p>\
				// 		</div>\
				// 		<div class="link">\
				// 				<div class="lbtn open" data-url="'+item.url+'"><i class="fa fa-share"></i></div>\
				// 				<div class="lbtn info"><i class="fa fa-info"></i></div>\
				// 		</div>\
				// </div>')
			});
			$(".card .open").click(function(){
				window.open($(this).attr("data-url"));
			});
		});
	}

	function init(url){
		if(url == "login"){

			if(__user__.logged_in == "true"){
				location.href = "/app/";
			}

			$("#submit-login").click(function(){
				login($("#username").val(),$("#password").val());
			});

		} else if(url == "home"){
			if(!__user__.logged_in || __user__.logged_in == "false"){
				location.href = "login";
			}

			$("#add-link-submit").click(function(){
				postLink($("#url-link").val(),$("#name-link").val(),
				$("#about-link").val(), function(e){
					if(e == "err"){
						showError("Some error occured");
					} else {
						$("#url-link").val("");
						$("#name-link").val("");
						$("#about-link").val("");
						refreshHome();
					}
				});
			});

			refreshHome();

		}

	}

	var writeData = function(data){
		$("#app").html(data);
	}

	if(page.match("/login")){
		nav("login");
	} else if(page == "/" || page.match("/login")){
		nav("home");
	} else {
		nav("home")
	}

});
