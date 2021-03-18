"use strict"

let Username;
$(document).ready(function () {

	let q=getUrlVars();
	console.log(q["user"]);
	Username=q["user"];

	$("#btnInvia").on("click",function(){
		let pwd1=$("#txtPassword").val();
		let pwd2=$("#txtPasswor1").val();
		if(pwd1==pwd2)
		{
			alert("Le password non corrispondono");
		}
		else
		{
			let request = inviaRichiesta("GET", "/api/updatePwd",
			{
				"username": Username,
				"password": pwd1
			});
			request.fail(function () {});
			request.done(function (data) {
				alert("Password modificata prova l'accesso dalla tua app");
			});
		}
	});

	function getUrlVars()
	{
    	let vars = [], hash;
    	let hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    	for(var i = 0; i < hashes.length; i++)
    	{
        	hash = hashes[i].split('=');
        	vars.push(hash[0]);
        	vars[hash[0]] = hash[1];
    	}
    	return vars;
	}

});