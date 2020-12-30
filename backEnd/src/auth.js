const express = require('express');
const LocalStrategy = require("passport-local").Strategy
const myDB = require('./db');
require("dotenv").config({path:"secrets.env"})
const session = require('express-session');
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID;


module.exports = function(app, collection){
    //initializing passport authentication
    passport.use(new LocalStrategy(
        function(username, password, done) {

          collection.findOne({ username: username }, function (err, user) {
            console.log('User '+ username +' attempted to log in.');
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            //if (password !== user.password) { return done(null, false); }
            return done(null, user);
          });
        }
      ));

//registration app handle

    
      //session serialization and deserialization
      passport.serializeUser((user, done) => {
        done(null, user._id);
      });
      passport.deserializeUser((id, done) => {
        collection.findOne({ _id: new ObjectID(id) }, (err, doc) => {
          done(null, doc);
        });
      });
    
}