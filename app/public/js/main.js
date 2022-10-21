$(window).on('load',function(that) {
	var page = location.cpath;
	var httpRegEx = /(\b(?:(?:https?|ftp):\/\/|www\.)[-a-z0-9+&@#\/%?=~+|!:,.;]*[-a-z0-9+&@#\/%?=~_|])/ig;
	var socket = io();

	var nav = function(url){
		$.ajax("/app/res/pages/"+url+".ejs")
		.done(function(data){
			writeData(data);
			init(url);
		});
	}

	var errorPage = function(){
		$("#search, html").addClass('error');
		setTimeout(function(){
			$("#search, html").removeClass('error');

			setTimeout(function(){
				$("#search, html").addClass('error');
				setTimeout(function(){
					$("#search, html").removeClass('error');
				},300);
			},300);
		},300);
	};

	var showError = function(err){
		if($("#err").length) return;
		if(showError.timeout){
			clearTimeout(showError.timeout);
			$("#err").remove();
		}
		$("#app").append("<div class=\"err\" id=\"err\">"+err+"</div>");
		showError.timeout = setTimeout(function(){
			$("#err").remove();
		},1500);
		errorPage();
	}

	var openModal = function(modal){
		$("#"+modal).addClass("active");
	}

	var login = function(usr, pwd){
		var uname = usr.trim();
		if(!uname) return showError("No username entered");
		uname = uname.toLowerCase().replace(/\ /i,"");
		if(uname.length > 32) return showError("Max of 32 characters for username");
		var password = pwd;
		if(!password) return showError("No password entered");
		$.ajax("/login?username="+uname+"&password="+password, {method:"POST"}).done(function(e){
			if(e == "err"){
				showError("Wrong username or password");
			} else {
				location.reload();
			}
		});
	}

	var postLink = function(_url,_name,_about, cb){
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
			"about="+about, {method:"POST"}).done(function(e){
			if(e == "err"){
				showError("Some error occured");
			} else {
				cb(e);
			}
		});
	}

	var removeLink = function(id){
		$.ajax("/api/removeLink?id="+id,{method: "POST"})
		.done(function(e){
			if(e == "401") return showError("Not authorized");
			if(e == "404") return showError("Not found");
			if(e == "200") return openUser(__user__.username);
		});
	}

	var openUser = function (user) {
		if(!user) return location.back();
		$.ajax("/api/user/"+user).done(function(user){
			if(!user.username){
				$("#app").text(404);
				return;
			}
			var name = user.username;
			$("#name").text(name);
			$("html").attr("class","theme-"+user.color);
			var links = user.links;
			if(links.length) loadList(links);

			if(__user__.username == user.username) {
				$(".hide").removeClass("hide");
				$("#links-list .card").each(function(i, item){
					item.oncontextmenu = function(e){
						e.preventDefault();
						var con = confirm("Are you sure you want to delete this post?");
						if(con) {
							var id = links[i].id;
							removeLink(id);
						}
					};
					// item.append("<i class='deleter fa fa-delete' data-delete='"+
					// // item.closest('.card').find('.content').data('id')
					// +"'></i>");
				});
			}

		});
	}

	var loadList = function(list){
		var eltl = $("#links-list");

		eltl.empty();

		list.forEach((item, i) => {
			eltl.append('<div class="card">\
					<div class="content" data-id="'+item.id+'">\
						<p class="name">'+item.name+'</p>\
						<p class="poster" data-user="'+item.user+'"><i class="fa fa-user fa-small"></i> | '+item.user+'</p>\
						<p class="about">'+item.about+'</p>\
					</div>\
					<div class="link">\
							<div class="lbtn open" data-url="'+item.url+'"><i class="fa fa-share"></i></div>\
							<div class="lbtn info"><i class="fa fa-info"></i></div>\
					</div>\
			</div>')
		});
		$(".card .open").click(function(){
			window.open($(this).attr("data-url"));
		});
		$(".card .info").click(function(){
			var url = $(this).closest('.card').find('.open').attr('data-url');
			$("#abouttext-div").empty();
			$("#abouttext-div").text($(this).closest('.card').find('.about').text());
			$("#abouttext-div").append('<br /><br /><a href="'+url+'" target="_blank">'+url+'</a>');
			openModal('abouttext');
		});
		$(".card .poster").click(function(){
			location.href = "/app/user#"+$(this).attr("data-user");
		});
	}

	var refreshHome = function(uri){

		$.ajax("/api/links/new").done(function(a){
			if(a.length) loadList(a);
		});

	}

	function init(url){
		if(url == "login"){

			if(__user__.logged_in == "true"){
				location.href = "/app/";
			}

			$("#register-btn").click(function(){
				$("#login").fadeOut();
				setTimeout(function() {
					$("#register").fadeIn();
				}, 600);
			});
			$("#login-btn").click(function(){
				$("#register").fadeOut();
				setTimeout(function() {
					$("#login").fadeIn();
				}, 600);
			});

			$("#submit-login").click(function(){
				login($("#username").val(),$("#password").val());
			});

		} else if(url == "home"){

			if(!__user__.logged_in || __user__.logged_in == "false"){
				location.href = "login";
			}

			$("#add-link").click(function(){
				openModal("linkAdd");
			});

			$("#profile").click(function(){
				location.href = "/app/user#"+__user__.username;
			});

			$("#search").on("change", function(){
				if($("#search").val().trim() == "" || !$("#search").val().trim()){
					return refreshHome();
				}
				$.ajax("/api/search?q="+$("#search").val().trim().replace(/\</g, '&lt;'))
				.done(function(e){
					if(!Array.isArray(e) || !e || !e.length) return showError("No results");
					loadList(e);
				});
			});

			$("#add-link-submit").click(function(){
				postLink($("#url-link").val(),$("#name-link").val(),
				$("#about-link").val(), function(e){
					if(e == "err"){
						showError("Some error occured");
					} else {
						$("#url-link").val("");
						$("#name-link").val("");
						$("#about-link").val("");
						$("#linkAdd").find(".close").click();
						refreshHome();
					}
				});
			});

			refreshHome();

			if(location.search.indexOf("q")){
				var s = location.search.replace("?","");
				if(s.match("&")) s = (function(){
					var t = s.split("&");
					var g;
					t.forEach((item, i) => {
						if(item.match("q=")) g = item.replace("q=","");
					});
					return g;
				})();
				$("#search").val(s.replace("q=",""));
				$("#search").trigger("change");
			}

		} else if (url == "chats") {

			if(!__user__.logged_in || __user__.logged_in == "false"){
				location.href = "login";
			}

			$("body").addClass('unscroll');

			var messagebar = $("#message-input");
			var __rept__;

			var replyTo = function (id){
				__rept__ = id;
				$("#rept").show();
			};

			var stopReply = function (){
				__rept__ = null;
				$("#rept").hide();
				messagebar.focus();
			}

			$("#rept").click(stopReply);

			function initScroll() {
				var last = $("#messages").children(".message").last();
				scrollTo(last);
				// $("#messages").scrollTop(last.offset().top + (last.height() * 100));
			}

			function scrollTo(elt) {
				var top = elt.offset().top;
				// console.log(top);
				// $("#messages").scrollTo(elt);
				elt[0].scrollIntoView({ behavior: "smooth" })
			}

			var addMessage = function(user, msg){
				// console.log(msg);
				var reply = "";
				if(msg.reply) {
					reply = '<div class="reply" data-reply="'
					 + msg.reply.to +
					'"> <i class="fa fa-share"></i> ' + msg.reply.text+ ' </div>'
				}
				var lefty = "";
				if(user.username == __user__.username) lefty = "lefty";
				$("#messages").append('\
				<li class="'+lefty+' message theme-'+user.color+'" data-id="'+ msg.id +'" id="chats-'+ msg.id +'" user="'+ user.username +'">\
					<div class="name" data-name="'+ user.username +'"> <i class="fa fa-user-circle"></i> '+ user.username +' </div>\
					' + reply + '\
					<div class="text"> ' + msg.text + ' </div>\
				</li>\
				');
				initScroll();
			};

			$("#messages").on('contextmenu', (e) => {
				e.preventDefault();
				var that = $(e.target).closest('.message');
				replyTo(that.data('id'));
			});

			$("#messages").on('click', (e) => {
				var that = $(e.target);
				if(that.hasClass('name')){
					var name = that.data('name');
					location.href = "user#"+name;
				} if(that.hasClass('reply')){
					var id = that.data('reply');
					scrollTo($("#chats-"+id));
					$("#chats-"+id).addClass('attention');
					setTimeout(function () {
						$("#chats-"+id).removeClass('attention');
					}, 1200);
				}
			});

			var sendMessage = function(){
				var text = messagebar.val()
				.replace(/\</g, '&lt;')
				.replace(/\n/g, '<br />')
				.trim();
				if(!text) return;
				var user = __user__;
				if(user.logged_in != "true") return;

				var msg = {
					text: text
				};

				if(__rept__ && __rept__.length && __rept__.length > 8) msg.reply = {
					to: __rept__
				}

				socket.emit('chat:new', user.username, msg);
				messagebar.val("");
				if(msg.reply) msg.reply.text = $("#chats-"+__rept__).find('.text').text();
				stopReply();
				addMessage(user, msg);
			};

			messagebar.on('keydown', (e)=>{
	      if(e.keyCode == 13){
	        e.preventDefault();
	        sendMessage();
	      }
	    });

			socket.on('chat:new', (_user, msg) => {
	      addMessage(_user, msg);
	    });

			$.ajax("/api/chats").done(function(e){
				var results = [];
				var length = 100;

				if(e.length < length) length = e.length;

				var ghh = e.reverse();

				for (var i = 0; i < length; i++) {
					results.unshift(ghh[i]);
				}

				results.forEach(function(item){
					addMessage(item.user, item);
				});
			});
		} else if (url == "user") {
			openUser(location.hash.replace("#",""));
		}

		$(".modal .close").click(function(){
			$(this).closest(".modal").removeClass("active");
		});

		$(".openlink").click(function(){
			location.href = $(this).data('link');
		});

		$(".btn-group .open").click(function(){
			$(this).closest(".btn-group").toggleClass('open');
		});

		$(".theme").click(function(){
			var color = $(this).data('theme');
			$.ajax("/api/user/"+__user__.username+"/settings?color="+color).done(function(e){
				location.reload();
			});
		});
	}

	var writeData = function(data){
		$("#app").html(data);
	}

	if(location.pathname == "/app"){
		location.href = "/app/";
	}

	if(location.pathname == "/app/" || page.match("/home")){
		nav("home");
	} else {
		var url = location.pathname.split('/').pop();
		nav(url);
	}

});
