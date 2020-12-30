const express = require('express');
const LocalStrategy = require("passport-local").Strategy
const myDB = require('./db');
require("dotenv").config({path:"secrets.env"})
const session = require('express-session');
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID; 
const tournamentTimeline = require("./gameTimeline")

var registrationMin = 4;
var qualifyingMin = 4;
var semiFinalsMin = 4;
var setTimeline =()=>{
    var date = new Date();
    tournamentTimeline.register.startTime = date.getTime();
    tournamentTimeline.register.endTime = tournamentTimeline.register.startTime + (1000*60*registrationMin);
    tournamentTimeline.qualifying.startTime = date.getTime();
    tournamentTimeline.qualifying.endTime = tournamentTimeline.qualifying.startTime + (1000*60*qualifyingMin);
    tournamentTimeline.semi_finals.startTime = tournamentTimeline.qualifying.endTime
    tournamentTimeline.semi_finals.endTime = tournamentTimeline.semi_finals.startTime +(1000*60*semiFinalsMin);
    tournamentTimeline.finals.startTime = tournamentTimeline.semi_finals.endTime +(1000*60*1);
    tournamentTimeline.finals.endTime = tournamentTimeline.finals.startTime +(1000*60*1);
}

module.exports = function(app, collection){
  var _dir = "/Users/aarya/Documents/GitHub/tictactoi/frontEnd";
  var message = "";
  var level_stage= "qualifying";
    app.route(_dir + '/register')
  .post((req, res, next) => {
    level_stage = "qualifying"
    console.log("got req")
    var date = new Date
    collection.findOne({ username: req.body.username }, function(err, user) {
      if (err) {
        next(err);
      } else if (user) {
        console.log('already have user')
        message = "Nickname already in database. Please pick a new one"
        res.redirect('/');
      } else if(tournamentTimeline.register.endTime > date.getTime()) {
        
        collection.insertOne({
          username: req.body.username,
          password: req.body.password,
          userLoggedIn:0,
          points: 0,
          gamePlayed: 0, 
          level:"qualifying"
        },
          (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              console.log(doc.ops[0])
              next(null, doc.ops[0]);
            }
          }
        )
      }else if (tournamentTimeline.register.endTime < date.getTime()&& tournamentTimeline.finals.endTime > date.getTime()){
        message = "sorry tournament already started please try again later."
        res.redirect("/")
      }else if(tournamentTimeline.finals.endTime < date.getTime()){
        setTimeline();
        collection.insertOne({
          username: req.body.username,
          password: req.body.password,
          userLoggedIn:0,
          points: 0,
          gamePlayed: 0, 
          level:"qualifying"
        },
          (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              console.log(doc.ops[0])
              next(null, doc.ops[0]);
            }
          }
        )
      }
    })
  },
    passport.authenticate('local', { failureRedirect: "http://google.com" }),
    (req, res, next) => {
      req.session.id = req.user.id;
      res.redirect('/game');
    }
  );
    
    //rendering index.pug
    app.get("/", (req, res)=>{
      
      var date = new Date();
      if(message !== ""){
        messageDisplay="block";
      }else{
        messageDisplay="none";
      }
        res.render("public/index.pug", {
            title: "Connected to Database",
            message: message,
            messageDisplay:messageDisplay, 
            showRegistration: true
        })
        message=""
    })

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
          return next();

        }
        res.redirect('/');
      };

      


      
      
    //rendering route to profile
    app.get("/game", ensureAuthenticated,(req, res)=>{
        res.render(_dir +'/game.pug', {username:req.user.username, stage:level_stage})
    })
    var usersInLounge = []
    app.get("/lounge/:username", ensureAuthenticated, (req, res)=>{
      console.log("got req and user is authenticated")
      var level;
      var newLevel  = (prevLevel) =>{
        if(prevLevel === "qualifying"){
          return "semi finals"
        }else if(prevLevel === "semi finals"){
          return "finals"
        }else{
          return "finished game"
        }
      }
      console.log(req.params.username);
      collection.findOne({username:req.params.username}, (err, doc)=>{
        if(err){
          console.log(err)
        }else{
          console.log(doc)
          if(doc.level)
           { level = newLevel(doc.level)
            level_stage = level;
            console.log(level)
            collection.findOneAndUpdate({username:req.params.username}, {$set:{level:level}}, (err, document)=>{
              if(err){
                console.log("err")
              }else{
                console.log("here about to render lounge")
                collection.findOne({username: req.params.username}, (err, updatedDoc)=>{
                  res.render(_dir+"/lounge.pug", {level:updatedDoc.level})
                  
                })
            }
            })}
          
        }
      })
      
    })

    //logout
    app.route('/logout/:username')
        .get((req, res) => {
          console.log("got logout req")
            collection.deleteOne({username:req.params.username})
            req.logout();
            res.redirect('/');  
    });


}