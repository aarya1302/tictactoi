const express = require("express");
const LocalStrategy = require("passport-local").Strategy;
const myDB = require("./db");
require("dotenv").config({ path: "secrets.env" });
const session = require("express-session");
const passport = require("passport");
const ObjectID = require("mongodb").ObjectID;
const routes = require("./routes");
const auth = require("./auth");
const { info } = require("console");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const passportSocketIo = require("passport.socketio");
const cookieParser = require("cookie-parser");
const roomsDb = require("./rooms");
const rooms = require("./rooms");
const MongoStore = require("connect-mongo")(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });
const tournamentTimeline = require("./gameTimeline");
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

var registrationMin = 4;
var qualifyingMin = 4;
var semiFinalsMin = 4;
var setTimeline = () => {
  var date = new Date();
  tournamentTimeline.register.startTime = date.getTime();
  tournamentTimeline.register.endTime =
    tournamentTimeline.register.startTime + 1000 * 60 * registrationMin;
  tournamentTimeline.qualifying.startTime = date.getTime();
  tournamentTimeline.qualifying.endTime =
    tournamentTimeline.qualifying.startTime + 1000 * 60 * qualifyingMin;
  tournamentTimeline.semi_finals.startTime =
    tournamentTimeline.qualifying.endTime + 1000 * 60 * 1;
  tournamentTimeline.semi_finals.endTime =
    tournamentTimeline.semi_finals.startTime + 1000 * 60 * semiFinalsMin;
  tournamentTimeline.finals.startTime =
    tournamentTimeline.semi_finals.endTime + 1000 * 60 * 1;
  tournamentTimeline.finals.endTime =
    tournamentTimeline.finals.startTime + 1000 * 60 * 4;
};
setTimeline();
//console.log(tournamentTimeline)
var _dirname = "/Users/aarya/Documents/GitHub/tictactoi/frontEnd";
app.set("view engine", "pug");
app.set("views", process.cwd() + "/views/pug/");
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
    key: "express.sid",
    store: store,
  })
);
app.use(passport.initialize());
app.use(passport.session());

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: "express.sid",
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail,
  })
);

var arrayWaitingRooms = [];
var finishedRooms = [];
var arrayEmptyRooms = [];
function siftRooms(rooms) {
  arrayWaitingRooms = [];
  arrayEmptyRooms = [];
  Object.keys(rooms).forEach((room) => {
    if (rooms[room]["status"] === "waiting") {
      if (rooms[room]["finished"]) {
        finishedRooms.push(room);
      } else {
        arrayWaitingRooms.push(room);
      }
    } else if (rooms[room]["status"] === "empty") {
      arrayEmptyRooms.push(room);
    }
  });
}
function Room() {
  this.users = [
    {
      userDetails: null,
      userType: "",
      userOrder: null,
      userTurn: null,
      socketId: null,
      room: null,
    },
    {
      userDetails: null,
      userType: "",
      userOrder: null,
      userTurn: null,
      socketId: null,
    },
  ];
  this.status = "empty";
  this.finished = false;
  this.usersNumber = 0;
}

myDB(async (client) => {
  var collection = await client.db("tictactoe").collection("tictactoeUsers");

  routes(app, collection);
  auth(app, collection);

  let currentUsers = 0;
  var loungeUserSocket = [];
  var loungeUserArray = [];
  var roomsCounter = 0;
  var stage = "qualifying";
  var countStateChange = 0;

  io.on("connection", (socket) => {
    console.log("new connection");

    if (socket.request.user.logged_in) {
      socket.on("go to next level", (data) => {
        count++;

        collection.updateOne(
          { username: data },
          { $set: { gamePlayed: 0, points: 0 } }
        );
        loungeUserArray = [];
        console.log("update for semi finals");
      });
      var date = new Date();
      console.log(
        tournamentTimeline.register.endTime,
        "endtime register",
        date.getTime(),
        "time now"
      );
      console.log(
        tournamentTimeline.register.endTime > date.getTime(),
        "condition to start the socket connection"
      );

      console.log(socket.request.user);
      console.log(typeof socket.request.user.gamePlayed, "gamplayed");
      if (socket.request.user.gamePlayed >= 6) {
        socket.on("reset server", () => {
          collection.deleteMany({});
          loungeUserArray = [];
        });

        socket.on("remove user from lounge", (data) => {
          console.log("got remove user form lounge req");
          loungeUserArray.forEach((elem) => {
            if (elem.user.username === data) {
              console.log(elem.user.username, "this is elem username");
              console.log(data, "this is the username sent");
              var index = loungeUserArray.indexOf(elem);
              console.log("this is index of to be removed", index);
              loungeUserArray.splice(index, 1);
              console.log(
                loungeUserArray,
                "this is loungeUserArray after removal"
              );
            }
          });
          io.emit("update lounge", {
            array: loungeUserArray,
            timeline: tournamentTimeline,
            socketId: socket.id,
            username: socket.request.user.username,
            level: socket.request.user.level,
          });
        });
        io.emit("update lounge", {
          array: loungeUserArray,
          timeline: tournamentTimeline,
          socketId: socket.id,
          username: socket.request.user.username,
          level: socket.request.user.level,
        });
        socket.join(socket.id);
        console.log(socket.id, "this is socket.id");
        console.log(io.sockets.adapter.rooms);
        socket.on("get username", () => {
          console.log("got get username request");
          console.log(
            "sending this to lounge users",
            socket.request.user.username
          );
          io.to(socket.id).emit(
            "message to lounge",
            socket.request.user.username
          );
        });
        console.log(loungeUserArray, "this was sent as lounge user array");
      } else {
        siftRooms(rooms);

        console.log("entering game room");

        var disconnectAdjustments = (room, userOrder) => {
          console.log(userOrder);
          if (rooms[room]) {
            rooms[room]["users"].splice(userOrder, 1, {
              userDetails: null,
              socketId: null,
              userTurn: rooms[room]["users"][userOrder]["userTurn"],
              userType: rooms[room]["users"][userOrder]["userType"],
              userOrder: userOrder,
            });
            console.log(
              rooms[room]["usersNumber"],
              "number of users before disconnect"
            );
            rooms[room]["usersNumber"]--;
            rooms[room]["status"] = "waiting";
            console.log(rooms[room], "after disconnect changes");
          }
        };
        console.log(roomsCounter, "rooms counter");
        // handle disconnect
        socket.on("disconnect", () => {
          var userOrder;
          var roomName;
          currentUsers--;
          console.log("disconnecting");

          console.log(rooms, "rooms before adjustments");
          Object.keys(rooms).forEach((room) => {
            var count = 0;
            rooms[room]["users"].forEach((user) => {
              console.log("user");
              if (user.socketId === socket.id) {
                console.log("user from dis room ", room);
                console.log("userOrder", user["userOrder"]);
                roomName = room;
                userOrder = user["userOrder"];
                io.to(room).emit("user disconnect", { user: socket.id });
                count++;
                return "got user";
              }
            });
            console.log(roomName, "this is roomName");
            console.log("userOrder", userOrder);
            disconnectAdjustments(roomName, userOrder);
            var nullUsers = (users) => {
              var isNull = true;
              users.forEach((elem) => {
                if (elem[userDetails][username] !== null) {
                  isNull = false;
                }
              });
              return isNull;
            };
            if (rooms[roomName]) {
              if (rooms[roomName]["usersNumber"] > 0) {
                rooms[roomName]["status"] = "waiting";
                console.log(
                  "opponent disconnect changes sent",
                  roomName,
                  rooms[roomName]
                );
                console.log("these are the rooms after changes", rooms);
                io.to(roomName).emit("changes on disconnect", {
                  room: roomName,
                  players: rooms[roomName],
                });
              } else if (
                rooms[roomName]["usersNumber"] <= 0 ||
                nullUsers(rooms[roomName]["users"])
              ) {
                console.log("user number is equal to zero");

                delete rooms[roomName];
              }
            }
            console.log("rooms after", rooms);
          });

          /* rooms[data.room]["users"].forEach(elem =>{
                console.log(elem);
                if(elem.socketId === socket.id){
                    console.log("found")
                }
            }) */
        });

        socket.on("finished game", (data) => {
          console.log("finished GAME");

          collection.updateOne(
            { username: data.user.userDetails.username },
            {
              $set: {
                gamePlayed: data.user.userDetails.gamePlayed,
                points: data.user.userDetails.points,
              },
            },
            function (err, doc) {
              if (err) {
                console.log(err);
              } else {
                console.log(
                  "update tot points and gamePlayed done on finished game"
                );
              }
            }
          );
          console.log(
            data.user.userDetails.gamePlayed,
            "number of game played"
          );
          if (data.user.userDetails.gamePlayed >= 6) {
            console.log("condition met");
            function compare(a, b) {
              // Use toUpperCase() to ignore character casing
              const bandA = a.user.points;
              const bandB = b.user.points;

              let comparison = 0;
              if (bandA < bandB) {
                comparison = 1;
              } else if (bandA > bandB) {
                comparison = -1;
              }
              return comparison;
            }
            var alreadyAdded = () => {
              var state = false;

              loungeUserArray.forEach((elem) => {
                console.log(elem, "this is elem during test");
                console.log(data.user, "this is data user");

                if (elem.user.username) {
                  if (elem.user.username === data.user.userDetails.username) {
                    state = true;
                  }
                }
              });
              return state;
            };
            if (!alreadyAdded()) {
              loungeUserArray.push({
                user: data.user.userDetails,
                socketId: socket.id,
              });
              loungeUserArray.sort(compare);
            }

            console.log(loungeUserArray, "lounge obj and array");
          }

          delete rooms[data.room];
          console.log(rooms, "after finish");

          /* console.log(data.userDetails, "these are the deets to update")
            console.log("here")
            collection.findOneAndUpdate({username:data.userDetails.username}, {$set:{gamePlayed:data.userDetails.gamePlayed, gameWins:data.userDetails.gameWins}}, (err, doc)=>{
                if(err){
                    console.log(err)
                }else{
                    console.log(socket.request.user, "updated socket")
                }
            }) */
        });

        socket.on("made move", (data) => {
          console.log("made move");
          console.log(data.room);
          io.to(data.room).emit("made move", data);
        });
        var count = 0;

        socket.on("opponent disconnected", (data) => {
          console.log(data, "this should be data");
        });

        currentUsers++;
        console.log("before", arrayWaitingRooms, "waiting");
        console.log(rooms);

        if (currentUsers <= 40) {
          if (arrayWaitingRooms[0]) {
            rooms[arrayWaitingRooms[0]]["status"] = "full";

            rooms[arrayWaitingRooms[0]]["users"][1]["userDetails"] =
              socket.request.user;
            console.log(
              socket.request.user,
              "user deets when adding to room await"
            );
            rooms[arrayWaitingRooms[0]]["users"][1]["userType"] = "O";
            rooms[arrayWaitingRooms[0]]["users"][1]["userOrder"] = 1;
            rooms[arrayWaitingRooms[0]]["users"][1]["userTurn"] = false;
            rooms[arrayWaitingRooms[0]]["users"][1]["socketId"] = socket.id;
            rooms[arrayWaitingRooms[0]]["users"][1]["room"] =
              arrayWaitingRooms[0];
            rooms[arrayWaitingRooms[0]]["usersNumber"] = 2;

            socket.join(arrayWaitingRooms[0]);

            io.to(arrayWaitingRooms[0]).emit("entered room", {
              players: rooms[arrayWaitingRooms[0]],
              room: arrayWaitingRooms[0],
            });

            siftRooms(rooms);
            console.log(rooms, "checking whether status successfully changed");
          } else {
            var roomName = "room" + roomsCounter;
            rooms[roomName] = new Room();
            rooms[roomName]["users"][0]["userDetails"] = socket.request.user;
            console.log(
              socket.request.user,
              "user deets when adding to new room await"
            );
            rooms[roomName]["users"][0]["userType"] = "X";
            rooms[roomName]["users"][0]["userTurn"] = true;
            rooms[roomName]["users"][0]["userOrder"] = 0;
            rooms[roomName]["users"][0]["socketId"] = socket.id;
            rooms[roomName]["users"][0]["room"] = roomName;
            rooms[roomName]["status"] = "waiting";
            rooms[roomName]["usersNumber"] = 1;
            arrayWaitingRooms.push(roomName);

            socket.join(roomName);
            io.to(roomName).emit("entered room", {
              players: rooms[roomName],
              room: roomName,
            });
            roomsCounter++;
          }
          console.log(roomsCounter);
          console.log(rooms, "after");
        }
      }
    }
  });
}).catch((e) => {
  console.log(e);
  app.route("/").get((req, res) => {
    res.render(process.cwd() + "/frontEnd", {
      title: e,
      message: "Unable to login",
    });
  });
});

function onAuthorizeSuccess(data, accept) {
  console.log("successful connection to socket.io");

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log("failed connection to socket.io:", message);

  accept(null, false);
}
var port = process.env.PORT || 3000;
http.listen(process.env.PORT || 3000, function () {
  console.log("port working" + port);
});
