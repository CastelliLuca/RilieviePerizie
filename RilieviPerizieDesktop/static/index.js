"use strict";

let wrapper;
let map=null;
let foto=[];
let _id;
let indexFoto;
let posArrivo;
let directionsRenderer;

$(document).ready(function() {

    directionsRenderer=null;
    wrapper=$("#wrapper");

    $("#addUser").on("click", function() {
        if(map!=null)
        {
            map=null;
            wrapper.empty();
            let mail=$("<input>");
            mail.prop("id","txtMail");
            mail.prop("type","text");
            mail.prop("placeholder","Inserisci la mail");
            mail.appendTo(wrapper);
            let username=$("<input>");
            username.prop("id","txtUser");
            username.prop("placeholder","Inserisci l'username");
            username.prop("type","text");
            username.appendTo(wrapper);
            let btn=$("<button>");
            btn.prop("id","btnInvia");
            btn.text("Aggiungi Utente");
            btn.appendTo(wrapper);
            let div=$("<div>");
            div.prop("id","map");
            div.appendTo(wrapper);
            div=$("<div>");
            div.prop("id","divDettagli");
            div.appendTo(wrapper);
        }
        else if($("#txtMail").length>0)
        {
            wrapper.empty();
            let div=$("<div>");
            div.prop("id","map");
            div.appendTo(wrapper);
            div=$("<div>");
            div.prop("id","divDettagli");
            div.appendTo(wrapper);
        }
        else
        {
            wrapper.empty();
            let mail=$("<input>");
            mail.prop("id","txtMail");
            mail.prop("type","text");
            mail.prop("placeholder","Inserisci la mail");
            mail.appendTo(wrapper);
            let username=$("<input>");
            username.prop("id","txtUser");
            username.prop("placeholder","Inserisci l'username");
            username.prop("type","text");
            username.appendTo(wrapper);
            let btn=$("<button>");
            btn.prop("id","btnInvia");
            btn.text("Aggiungi Utente");
            btn.appendTo(wrapper);
            let div=$("<div>");
            div.prop("id","map");
            div.appendTo(wrapper);
            div=$("<div>");
            div.prop("id","divDettagli");
            div.appendTo(wrapper);

        }
    });

    $("#viewMap").on("click", function() {
        if(wrapper.children().length>2)
        {
            wrapper.empty();
            let div=$("<div>");
            div.prop("id","map");
            div.appendTo(wrapper);
            div=$("<div>");
            div.prop("id","divDettagli");
            div.appendTo(wrapper);
            initMap();

            let request = inviaRichiesta("GET","/api/elencoPerizie");
            request.fail(errore);
            request.done(function(data) {
                console.log(data);

                let marcatore;
                let posizione;
                console.log(data[0]["latitudine"]);
                console.log(data[0]["longitudine"]);


                for(let i=0;i<data.length;i++)
                {
                    posizione = {lat:parseFloat(data[i]["latitudine"]), lng:parseFloat(data[i]["longitudine"])}
            
                    console.log(parseFloat(data[i]["latitudine"]));
                    console.log(parseFloat(data[i]["longitudine"]));
                    marcatore = new google.maps.Marker({
                        map:map,
                        position:posizione,
                        lat:data[i]["latitudine"],
                        long:data[i]["longitudine"],
                        id:data[i]["_id"],
                        title:data[i]["Username"],
                        data:data[i]["data"],
                        descr:data[i]["descr"],
                        foto:data[i]["foto"],
                        note:data[i]["note"],
                        animation: google.maps.Animation.DROP,
                        zIndex: 3, // in caso di marcatori vicini/sovrapposti
                        draggable:false, // rende il marcatore trascinabile
                    });

                    marcatore.addListener('click', function() {

                        posArrivo = {lat:parseFloat(this.lat), lng:parseFloat( this.long)};
                        var options = {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                            }
                            
                        navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
                        console.log(this);
                        foto=[];
                        $("#divDettagli").empty();
                        
                        for(let i=0;i<this.foto.length;i++)
                        {
                            foto.push(this.foto[i]);
                        }
                        indexFoto=0;
                        _id=this.id;
                        let h1=$("<h1>").text(this.title).appendTo($("#divDettagli"));
                        let h2=$("<h2>").text(this.data).appendTo($("#divDettagli"));
                        let p=$("<p>").text(this.descr).appendTo($("#divDettagli"));
                        let imgBox=$("<div>").prop("id","divImgPer").css({"height":"250px"}).css({"width":"350px"}).css("display", "inline-block").css("text-align","center").appendTo($("#divDettagli"));
                        let img=$("<img>").prop("id","imgPer").prop("src",foto[0]).css("height","250px").appendTo(imgBox);
                        let btnSx=$("<Button>").prop("id","btnSx").addClass("btn btn-secondary").text("<").appendTo($("#divDettagli")).on("click",function(){
                            if(indexFoto>0)
                            {
                                $("#imgPer").prop("src",foto[indexFoto-1]);
                                indexFoto--;
                            }
                        });
                        let btnDx=$("<Button>").prop("id","btnDx").addClass("btn btn-secondary").text(">").appendTo($("#divDettagli")).on("click",function(){
                            if(indexFoto<foto.length-1)
                            {
                                $("#imgPer").prop("src",foto[indexFoto+1]);
                                indexFoto++;
                            }
                        });
                        if(this.note==""||this.note==undefined)
                        {
                            $("<input>").prop("type","text").prop("id","txtNote").prop("placeholder","Inserisci note admin").appendTo($("#divDettagli"));
                            let btn=$("<button>").prop("id","btnSave").text("Salva Note").appendTo($("#divDettagli")).on("click",function(){
                                let request = inviaRichiesta("GET", "/api/addNote",
                                {
                                    "_id": _id,
                                    "note": $("#txtNote").val()
                                });
                                request.fail(errore);
                                request.done(function(data) {
                                    console.log(data);  
                                    let pNote=$("<p>").css("margin-top","15px").text(data["ris"]).appendTo($("#divDettagli"));
                                    $("#txtNote").hide();
                                    $("#btnSave").hide();
                                });
                            });
                        }
                        else
                        {
                            p=$("<p>").css("margin-top","15px").text(this.note).appendTo($("#divDettagli"));
                        }
                        
                    });
                }
            });   

        }
        else if(map!=null)
        {
            wrapper.empty();
            map=null;
            let div=$("<div>");
            div.prop("id","map");
            div.appendTo(wrapper);
            div=$("<div>");
            div.prop("id","divDettagli");
            div.appendTo(wrapper);
        }
        else
        {
            initMap();

            let request = inviaRichiesta("GET","/api/elencoPerizie");
            request.fail(errore);
            request.done(function(data) {
                console.log(data);

                let marcatore;
                let posizione;
                console.log(data[0]["latitudine"]);
                console.log(data[0]["longitudine"]);


                for(let i=0;i<data.length;i++)
                {
                    posizione = {lat:parseFloat(data[i]["latitudine"]), lng:parseFloat(data[i]["longitudine"])}
            
                    console.log(parseFloat(data[i]["latitudine"]));
                    console.log(parseFloat(data[i]["longitudine"]));
                    marcatore = new google.maps.Marker({
                        map:map,
                        position:posizione,
                        lat:data[i]["latitudine"],
                        long:data[i]["longitudine"],
                        id:data[i]["_id"],
                        title:data[i]["Username"],
                        data:data[i]["data"],
                        descr:data[i]["descr"],
                        foto:data[i]["foto"],
                        note:data[i]["note"],
                        animation: google.maps.Animation.DROP,
                        zIndex: 3, // in caso di marcatori vicini/sovrapposti
                        draggable:false, // rende il marcatore trascinabile
                    });

                    marcatore.addListener('click', function() {

                        
                        posArrivo = {lat:parseFloat(this.lat), lng:parseFloat( this.long)};
                        var options = {
                            enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0
                            }
                            
                        navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
                        console.log(this);

                        foto=[];
                        $("#divDettagli").empty();
                        for(let i=0;i<this.foto.length;i++)
                        {
                            foto.push(this.foto[i]);
                        }
                        indexFoto=0;
                        _id=this.id;
                        let h1=$("<h1>").text(this.title).appendTo($("#divDettagli"));
                        let h2=$("<h2>").text(this.data).appendTo($("#divDettagli"));
                        let p=$("<p>").text(this.descr).appendTo($("#divDettagli"));
                        let imgBox=$("<div>").prop("id","divImgPer").css({"height":"250px"}).css({"width":"350px"}).css("display", "inline-block").css("text-align","center").appendTo($("#divDettagli"));
                        let img=$("<img>").prop("id","imgPer").prop("src",foto[0]).css("height","250px").appendTo(imgBox);
                        let btnSx=$("<Button>").prop("id","btnSx").addClass("btn btn-secondary").text("<").appendTo($("#divDettagli")).on("click",function(){
                            if(indexFoto>0)
                            {
                                $("#imgPer").prop("src",foto[indexFoto-1]);
                                indexFoto--;
                            }
                        });
                        let btnDx=$("<Button>").prop("id","btnDx").addClass("btn btn-secondary").text(">").appendTo($("#divDettagli")).on("click",function(){
                            if(indexFoto<foto.length-1)
                            {
                                $("#imgPer").prop("src",foto[indexFoto+1]);
                                indexFoto++;
                            }
                        });
                        if(this.note==""||this.note==undefined)
                        {
                            $("<input>").prop("type","text").prop("id","txtNote").prop("placeholder","Inserisci note admin").appendTo($("#divDettagli"));
                            let btn=$("<button>").prop("id","btnSave").text("Salva Note").appendTo($("#divDettagli")).on("click",function(){
                                let request = inviaRichiesta("GET", "/api/addNote",
                                {
                                    "_id": _id,
                                    "note": $("#txtNote").val()
                                });
                                request.fail(errore);
                                request.done(function(data) {
                                    console.log(data);
                                    let pNote=$("<p>").css("margin-top","15px").text(data["ris"]).appendTo($("#divDettagli"));
                                    $("#txtNote").hide();
                                    $("#btnSave").hide();
                                });
                            });
                        }
                        else
                        {
                            p=$("<p>").text(this.note).css("margin-top","15px").appendTo($("#divDettagli"));

                        }
                        
                    });
                }
            });   
        }
    });

    wrapper.on("click","button",function(){
        let sender =$(this);
        if(sender.prop("id")=="btnInvia")
        {
            let request = inviaRichiesta("POST", "/api/addUser",
            {
                "username": $("#txtUser").val(),
                "password": generateRandomString(10),
                "mail":$("#txtMail").val(),
                "role":"dipendente"
            });
            request.fail(errore);
            request.done(function() {
                alert("Utente aggiunto!!");
                wrapper.empty();
            });
        }
    });

    function onSuccess(position){
        
       
        let start = {lat:parseFloat(position.coords.latitude), lng:parseFloat( position.coords.longitude)};
        let finish=posArrivo;

        //caricaRoute();
        let geocoder=new google.maps.Geocoder();
        geocoder.geocode({"location":start},function (results,status)
        {
            if(status==google.maps.GeocoderStatus.OK)
            {
                geocoder.geocode({"location":finish},function (results2,status2)
                {
                    if(status2==google.maps.GeocoderStatus.OK)
                    {
                        let posPartenza=results[0].geometry.location;
                        let posArrivo=results2[0].geometry.location;
                        visualizzaPercorso(posPartenza,posArrivo);
                    }
                    else
                    {
                        alert("Indirizzo arrivo non valido");
                    }
                })
            }
            else
            {
                alert("Indirizzo partenza non valido")
            }

        })
    }

    function onError(err){

    }

    function visualizzaPercorso(posPartenza,posArrivo)
    {
        if (directionsRenderer != null) {
            directionsRenderer.setMap(null);
            directionsRenderer = null;
        }
        directionsRenderer=new google.maps.DirectionsRenderer();
        let directionsService=new google.maps.DirectionsService();
        let percorso={
            "origin":posPartenza,
            "destination":posArrivo,
            "travelMode":google.maps.TravelMode.DRIVING
        };
        directionsService.route(percorso,function (route,status)
        {
            if(status==google.maps.DirectionsStatus.OK)
            {
                directionsRenderer.setMap(map);
                directionsRenderer.setDirections(route);
                let p=$("<p>").text("DISTANZA: "+route.routes[0].legs[0].distance.text).appendTo($("#divDettagli"));
                p=$("<p>").text("TEMPO: "+route.routes[0].legs[0].duration.text).appendTo($("#divDettagli"));
            }
        })
    }

    function generateRandomString(iLen) {
        var sRnd = '';
        var sChrs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        for (var i = 0; i < iLen; i++) {
          var randomPoz = Math.floor(Math.random() * sChrs.length);
          sRnd += sChrs.substring(randomPoz, randomPoz + 1);
        }
        return sRnd;
      }

    function initMap() {
        map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 	41.5330, lng: 12.3040 },
        zoom: 6,
        });
    }

    
});


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

function errore(jqXHR, testStatus, strError) {
    if (jqXHR.status == 0)
        alert("server timeout");
    else if (jqXHR.status == 200)
        alert("Errore Formattazione dati\n" + jqXHR.responseText);
    else
        alert("Server Error: " + jqXHR.status + " - " + jqXHR.responseText);
}