"use strict";

const http=require("http");
const express=require("express");
const app=express();
const fs=require("fs");
const cors=require("cors");
let mongo=require("mongodb");
let async=require("async");
const bodyParser = require("body-parser");
let mongoClient=mongo.MongoClient;
const ObjectId=mongo.ObjectID;
const CONNECTIONSTRING=process.env.MONGODB_URI || "mongodb://lucacastelli:Felix2012@cluster0-shard-00-00.f6esz.mongodb.net:27017,cluster0-shard-00-01.f6esz.mongodb.net:27017,cluster0-shard-00-02.f6esz.mongodb.net:27017/test?replicaSet=atlas-1477sw-shard-0&ssl=true&authSource=admin";
const CONNECTIONOPTIONS={useNewUrlParser: true,useUnifiedTopology:true};
let currentUser="";
const PORT=process.env.PORT || 1337;
const TTL_Token = 10000; //espresso in sec 
const DBNAME="RilieviEPerizie";
let nodemailer = require('nodemailer');

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const server=http.createServer(app);
server.listen(PORT, function() {
    console.log("Server in ascolto sulla porta "+PORT);
    init();
});

let paginaErrore="";
let privateKey;

function init(req,res)
{
    fs.readFile("./static/error.html", function (err, data)
    {
        if (!err)
            paginaErrore = data.toString();
        else
            paginaErrore = "<h1>Risorsa non trovata</h1>";
    });
    fs.readFile("./keys/private.key", function (err, data) {
        if (!err) {
            privateKey = data.toString();
        }
        else {
            //Richiamo la route di gestione degli errori
            console.log("File mancante: private.key");
            server.close();
        }
    })

    app.response.log = function (message) {
        console.log("Errore: " + message);
    }
}
/*********************** MIDDLEWARE ROUTES *********************** */

// log della richiesta
app.use("/", function (req, res, next) {
    console.log(" --------> " + req.method + " : " + req.originalUrl);
    next();
});

app.get("/", function (req, res, next) {
    controllaToken(req, res, next);
});

app.get("/index.html", function (req, res, next) {
    controllaToken(req, res, next);
});

//route relativa alle risorse statiche
app.use("/", express.static("./static"))


//routes di lettura dei parametri post
app.use(bodyParser.json({limit:'500mb'}));

app.use(bodyParser.urlencoded({
    limit: '500mb',
    parameterLimit: 10000000000000,
    extended: true 
}));

// log dei parametri
app.use("/", function (req, res, next) {
    if (Object.keys(req.query).length > 0)
        console.log("parametri GET: " + JSON.stringify(req.query))
    if (Object.keys(req.body).length > 0)
        console.log("parametri BODY: " + JSON.stringify(req.body))
    next();
})



app.get('/api/updatePwd', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING,CONNECTIONOPTIONS,function(err,client){
        if(err){
            res.status(503).send("Errore di connessione al db");
        }else{
            let db=client.db("RilieviEPerizie");
            let collection=db.collection("User");
            collection.updateOne({"Username":req.query.username},{$set:{"password":req.query.password}},function(err,data){
                if(err)
                    res.status(500).send("Errore di esecuzione query");
                else
                {
                    let collection = db.collection("User");
                    collection.find({}).project({ "password": 1 }).toArray((err, data) => {
                    if (err) {
                        log("Errore durante l'esecuzione della query: " + err.errmsg);
                    }
                    else 
                    {
                        async.forEach(data, (item, callback) => {
                        let pwd = item.password;
                        let rgx = new RegExp("^\\$2[ayb]\\$.{56}$");
                        if (!rgx.test(pwd)) {
                            let pwdHash = bcrypt.hashSync(pwd, 10);
                            collection.updateOne({ "_id": item._id }, { "$set": { "password": pwdHash } }, (err, data) => {
                                callback(err);
                            });
                    }
                    else
                    {
                        callback(err);
                    }
                }, (err) => {
                    if (err) {
                    }
                    else {
                        res.send({ "ris": "ok" });
                    }
                });
            }
        });
                }
            });
        }
    });

});




//Questa route deve essere scritta prima del metodo controllaToken()
app.post('/api/login', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database").log(err.message);
        else {
            const db = client.db(DBNAME);
            const collection = db.collection("User");
            console.log(req.body["username"]);
            let role=req.body["role"];
            let username = req.body["username"];
            if(role=="dipendente")
                currentUser=username
            collection.findOne({$and:[{"Username": username },{"role":role}]}, function (err, dbUser) {
                if (err)
                    res.status(500).send("Internal Error in Query Execution").log(err.message);
                else {
                    if (dbUser == null)
                        res.status(401).send("Username e/o Password non validi");
                    else {
                        //req.body.password --> password in chiaro inserita dall'utente
                        //dbUser.password --> password cifrata contenuta nel DB
                        //Il metodo compare() cifra req.body.password e la va a confrontare con dbUser.password
                        bcrypt.compare(req.body["password"], dbUser.password, function (err, ok) {
                            if (err)
                                res.status(500).send("Internal Error in bcrypt compare").log(err.message);
                            else {
                                if (!ok)
                                    res.status(401).send("Username e/o Password non validi");
                                else {
                                    let token = createToken(dbUser);
                                    writeCookie(res, token);
                                    res.send({ "ris": "ok" });
                                }
                            }
                        });
                    }
                }
                client.close();
            })
        }
    });
});


app.get("/api/logout", function (req, res, next) {
    currentUser="";
    res.set("Set-Cookie", `token="";max-age=-1;path=/;httponly=true`);
    res.send({ "ris": "ok" });
})

//Route per fare in modo che il server risponda a qualunque richiesta anche extra-domain.
app.use("/", function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
})

app.use("/api", function (req, res, next) {
    controllaToken(req, res, next);
});

function controllaToken(req, res, next) {
    let token = readCookie(req);
    if (token == "") {
        res.sendFile(__dirname + "/static/login.html");
    }
    else {
        jwt.verify(token, privateKey, function (err, payload) {
            if (err) {
                res.sendFile(__dirname + "/static/login.html");
            }
            else {
                let newToken = createToken(payload);
                writeCookie(res, newToken);
                req.payload = payload; //salvo il payload dentro request in modo che le api successive lo possano leggere e ricavare i dati necessari
                next();
            }
        });
    }
}



app.get('/api/elencoUser', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING,CONNECTIONOPTIONS,function(err,client){
        if(err){
            res.status(503).send("Errore di connessione al db");
        }else{
            let db=client.db("RilieviEPerizie");
            let collection=db.collection("User");
            collection.find().toArray(function(err,data){
                if(err)
                    res.status(500).send("Errore di esecuzione query");
                else
                    res.send(data);
            });
        }
    });
});

app.get('/api/currentUser', function (req, res, next) {
    console.log("Current User: "+currentUser);
    res.send({"ris":currentUser});
});

app.post('/api/addPerizia', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING,CONNECTIONOPTIONS,function(err,client){
        if(err){
            res.status(503).send("Errore di connessione al db");
        }else{
            let db=client.db("RilieviEPerizie");
            let collection=db.collection("Perizie");
            collection.insertOne({"Username":req.body.Username,"latitudine":req.body.latitudine,"longitudine":req.body.longitudine,"foto":req.body.foto,"data":req.body.data,"descr":req.body.descr,"note":""},function(err,data){
                if(err)
                    res.status(500).send("Errore di esecuzione query");
                else
                {
                    res.send(data);
                }
            });
        }
    });

});

app.get('/api/addNote', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING,CONNECTIONOPTIONS,function(err,client){
        if(err){
            res.status(503).send("Errore di connessione al db");
        }else{
            let db=client.db("RilieviEPerizie");
            let collection=db.collection("Perizie");
            let ObjectId = mongo.ObjectId;
            let id=new ObjectId(req.query._id);
            collection.updateOne({"_id":id},{$set:{"note":req.query.note}},function(err,data){
                if(err)
                    res.status(500).send("Errore di esecuzione query");
                else
                {
                    res.send({"ris":req.query.note});
                }
            });
        }
    });

});

app.get('/api/elencoPerizie', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING,CONNECTIONOPTIONS,function(err,client){
        if(err){
            res.status(503).send("Errore di connessione al db");
        }else{
            let db=client.db("RilieviEPerizie");
            let collection=db.collection("Perizie");
            collection.find().toArray(function(err,data){
                if(err)
                    res.status(500).send("Errore di esecuzione query");
                else
                    res.send(data);
            });
        }
    });
});


app.post('/api/addUser', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING,CONNECTIONOPTIONS,function(err,client){
        if(err){
            res.status(503).send("Errore di connessione al db");
        }else{
            let db=client.db("RilieviEPerizie");
            let collection=db.collection("User");
            collection.insertOne({"Username":req.body.username,"password":req.body.password,"mail":req.body.mail,"role":req.body.role},function(err,data){
                if(err)
                    res.status(500).send("Errore di esecuzione query");
                else
                {
                    let collection = db.collection("User");
                    collection.find({}).project({ "password": 1 }).toArray((err, data) => {
                    if (err) {
                        log("Errore durante l'esecuzione della query: " + err.errmsg);
                    }
                    else 
                    {
                        async.forEach(data, (item, callback) => {
                        let pwd = item.password;
                        let rgx = new RegExp("^\\$2[ayb]\\$.{56}$");
                        if (!rgx.test(pwd)) {
                            let pwdHash = bcrypt.hashSync(pwd, 10);
                            collection.updateOne({ "_id": item._id }, { "$set": { "password": pwdHash } }, (err, data) => {
                                callback(err);
                            });
                    }
                    else
                    {
                        callback(err);
                    }
                }, (err) => {
                    if (err) {
                    }
                    else {
                        var transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: 'luca.castelli02@gmail.com',
                                pass: 'Felix2012??'
                            }
                        });

                        var mailOptions = {
                            from: 'luca.castelli02@gmail.com',
                            to: req.body.mail,
                            subject: 'Imposta Passord',
                            text: 'Username: '+req.body.username+' \nPassword: '+req.body.password+'\nClicca il link per impostare la password.\nhttps://luca-castelli-rilievieperizie.herokuapp.com/pass.html?user='+req.body.username
                        };

                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });
                        res.send({ "ris": "ok" });
                    }
                });
            }
        });
                }
            });
        }
    });

});

function inviaErrore(req, res, cod, errorMessage) {
    if (req.originalUrl.startsWith("/api/")) {
        res.status(cod).send(errorMessage);
    }
    else {
        res.sendFile(__dirname + "/static/login.html");
    }
}

function readCookie(req) {
    let valoreCookie = "";
    if (req.headers.cookie) {
        let cookies = req.headers.cookie.split(';');
        for (let item of cookies) {
            item = item.split('='); //item = chiave=valore --> split --> [chiave, valore]
            if (item[0].includes("token")) {
                valoreCookie = item[1];
                break;
            }
        }
    }
    return valoreCookie;
}

//data --> record dell'utente
function createToken(data) {
    //sign() --> si aspetta come parametro un json con i parametri che si vogliono mettere nel token
    let json = {
        "_id": data["_id"],
        "username": data["username"],
        "iat": data["iat"] || Math.floor((Date.now() / 1000)),
        "exp": (Math.floor((Date.now() / 1000)) + TTL_Token)
    }
    let token = jwt.sign(json, privateKey);
    //console.log(token);
    return token;

}

function writeCookie(res, token) {
    //set() --> metodo di express che consente di impostare una o più intestazioni nella risposta HTTP
    res.set("Set-Cookie", `token=${token};max-age=${TTL_Token};path=/;httponly=true`);
}

app.use("/",express.static("./static"));

app.use('/', function (req, res, next) {
    res.status(404);
    if(req.originalUrl.startsWith("/api/"))
        {
            res.json('"Risorsa non trovata"');
        }
    else
        {
            res.send(paginaErrore);
        }
   });