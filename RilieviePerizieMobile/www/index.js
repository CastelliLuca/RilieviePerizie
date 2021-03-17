"use strict";
let contSelected=0;
let contImage=0;
let watchID=null;
let photo=[];
let username;

$(document).ready(function () {
    document.addEventListener("deviceready", function () {

            
        let request = inviaRichiesta("GET","https://luca-castelli-rilievieperizie.herokuapp.com/api/currentUser");
        request.fail(function () {
            window.location.href="login.html";
        });
        request.done(function (data) {
        if(data["ris"]=="")
            window.location.href="login.html";
        else
            username=data["ris"];
        console.log(data["ris"]);
        });

        let _wrapper = $("#wrapper");
        let cameraOptions = {
            "quality":50,
            "correctOrientation":true
        }

        $("#btnScatta").on("click", function () {
            cameraOptions.sourceType = Camera.PictureSourceType.CAMERA;
            cameraOptions.destinationType = Camera.DestinationType.DATA_URL;
            navigator.camera.getPicture(success, error, cameraOptions);
        });

        $("#btnCerca").on("click", function () {
            cameraOptions.sourceType = Camera.PictureSourceType.SAVEDPHOTOALBUM;
            cameraOptions.destinationType = Camera.DestinationType.DATA_URL;
            navigator.camera.getPicture(success, error, cameraOptions);
        });

        //viene iniettata l'immagine scattata
        function success(image) {
            let wrap=$("<div>");
            wrap.addClass("divWrap col-md-3");
            let _img = $("<img>");
            _img.prop("id","img-"+contImage);
            _img.prop("selected","false");
            contImage++;
            let div = $("<div>");
            div.prop("class","divSelection");
            _img.css({
                "height":100,
                "width":60
            });
            if (cameraOptions.destinationType == Camera.DestinationType.DATA_URL) {
                //base64
                _img.prop("src", "data:image/jpeg;base64,"+image);
                photo.push("data:image/jpeg;base64,"+image);
            }
            wrap.appendTo(_wrapper);
            div.appendTo(wrap);
            _img.appendTo(wrap);
        }

        function error(err) {
            if (err.code) {
                alert("Errore: "+err.code+"-"+err.message);
            }
        }

        $("#wrapper").on("click","img",function(){
            let sender=$(this);
            let id=parseInt(sender.prop("id").split('-')[1]);
            if(sender.prop("selected")=="true")
            {
                sender.prop("selected","false");
                contSelected--;
                $($(".divSelection")[id]).removeClass("selected");
            }
            else
            {
                sender.prop("selected","true");
                contSelected++;
                $($(".divSelection")[id]).addClass("selected");
            }
            if(contSelected==0)
                $("#btnCarica").hide();
            else if(contSelected==1)
                $("#btnCarica").show();
        });
    });
    $("#btnCarica").on("click",function(){
		let gpsOptions = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
        watchID=navigator.geolocation.watchPosition(onsuccess, error, gpsOptions);

    });

    $("#btnLogout").on("click",function(){
        let request = inviaRichiesta("GET","https://luca-castelli-rilievieperizie.herokuapp.com/api/logout");
        request.fail(function () {});
    request.done(function () {
        window.location.href="login.html";
    });
    });

    function onsuccess(position) {
        let latitude= position.coords.latitude;
        let longitude=position.coords.longitude;

        let selectedPhotos=[];
        for(let i=0;i<photo.length;i++)
        {
            if($("#img-"+i).prop("selected")=="true")
            {
                selectedPhotos.push(photo[i]);
            }
        }

        let date=new  Date();
        let strDate=date.toLocaleString();
        console.log(strDate);
        let request = inviaRichiesta("POST","https://luca-castelli-rilievieperizie.herokuapp.com/api/addPerizia",
        {
            "foto":selectedPhotos,
            "Username":username,
            "latitudine":latitude,
            "longitudine":longitude,
            "data":strDate,
            "descr":$("#txtDescrizione").val()
        });
        request.fail(function(){
            notifica("Errore");
        });
        request.done(function(data) {
            console.log(data);
            notifica("La perizia è stata caricata!");	 
            $("#wrapper div").empty();
            contImage=0;
            contSelected=0;
            $("#btnCarica").hide();
            $("#txtDescrizione").val("");
        });

		navigator.geolocation.clearWatch(watchID);
		watchID=null;

    }

    function error(err) {
		notifica("Errore: " + err.code + " - " + err.message);
    }
	
   function notifica(msg){		 
        navigator.notification.alert(
		    msg,    
		    function() {},       
		    "Info",       // Titolo finestra
		    "Ok"          // pulsante di chiusura
	    );			 
	}
    function inviaRichiesta(method, url,  parameters="") {
        return $.ajax({
            url: url, //default: currentPage
            type: method,
            data: parameters,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            dataType: "json",
            timeout: 5000,
        });
    }
});