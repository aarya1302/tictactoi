
var port = 3000;
var ip = "http://192.168.100.6:"
var room;
var thisPlayer;
var opponent;
let board = [["", "", ""], 
             ["", "", ""], 
             ["", "", ""]];
var ifWin=(board) =>{
    console.log(board)
    var count =0;
    var returnVal;
     board.forEach(row=>{
        if(row[0]=== row[1] && row[0] === row[2]){
            if(row[0] !== ""){
                returnVal = true;
                return true
            }
            
        }else if(board[1][count]=== board[2][count] && board[0][count]===board[2][count]){
            console.log('here though')
            if(board[1][count] !== ""){
                console.log('here')
                returnVal = true;
                return true
            }
        }else if(board[0][0] === board[1][1]&& board[0][0]=== board[2][2]){
            if(board[0][0] !==""){
                returnVal = true;
                return true
            }
        }else if(board[0][2] === board[1][1]&& board[0][2]=== board[2][1]){
            if(board[0][2]){
                returnVal = true;
                return true
            }
        }
        count++
    })
    return returnVal
}
var ifDraw = (board) =>{
    var draw = true
    board.forEach(elem =>{
        elem.forEach(state =>{
            if (state === ""){
                draw = false;
            }
        })
    })
    return draw;
}

$(document).ready(function(){
    let socket = io();
    var handleFinish = (user, room) =>{
        console.log("handling finsh");
        console.log("user deets", user);
        console.log("room", room)
        var req = (user.userDetails.gamePlayed <2)?"game":"lounge/"+user.userDetails.username
        console.log(req, 'this req will be sent')
        //socket.emit("new loungeUser", user.userDetails);
        $("#next").html("<a href='/"+req+"'id='next_game'>Next Game</a>")
        
        $("#next").click(async function(){
            await socket.emit("finished game", {user:user, room:room})
            return true;
        })
        
       
         
    }
    socket.on("redirect home", (data)=>{
        if(data.socketId === socket.id){
            window.location.replace(ip+port+"/logout/"+data.dbId);
        }
    })
    console.log(document.getElementById("peoples"))

    socket.on("update lounge", (data)=>{
        $("#peoples").html("")
        $("#message").html("")
        var orderInUsernames = []
        $("#logout").attr("href", "/logout/"+data.username);
        var socketId = data.socketId
        console.log("gote messages")
        console.log(data)
       
        
        console.log(orderInUsernames)
        data.array.forEach(elem =>{
            $("#peoples").append(`<div class='person'>${elem.user.username} <span class='points'>points: ${elem.user.points}</span></div>`)
            orderInUsernames.push(elem.socketId);
        })
        var myVar = setInterval(myTimer, 1000);
        var count = 60;
        function myTimer() {
        
            console.log("hi")
            console.log("upadating every 10s")
            var date = new Date
            console.log(data.timeline.semi_finals.startTime, "start", date.getTime(), "now", (orderInUsernames.indexOf(socket.id)), "condition met")
            
                
               
                if(data.level === "semi finals"){
                    console.log(socket.id)
                    console.log(socketId)
                    console.log(orderInUsernames, "this should be the array of ids before done")
                    if(data.timeline.semi_finals.startTime < date.getTime()){
                        clearInterval(myVar)
                        
                        console.log(orderInUsernames, "this should be the array of ids after done")
                        console.log(data.username, "this should be the username of the client")
                        if(orderInUsernames.indexOf(socket.id)>5){
                            $("#message").html("Sorry you didn't qualify for the semifinals")
                            $("#continueLounge").html(`<a href='/logout/'+${data.username}> Click Here to logout</a>`)
                        }else{
                            $("#message").html("Congrats you qualifed for the semifinals")
                            $("#continueLounge").html("<a href='/game'>Continue</a>")
                            $("#continueLounge").click(async function(){
                                await socket.emit("go to next level", data.username);
                                return true;
                            })
                        }
                        
                    }
                    }else if (data.level == "finals"){
                        console.log(data.timeline.finals.startTime, "start", date.getTime(), "now", (data.timeline.finals.startTime > date.getTime()), "condition met")
                        console.log(orderInUsernames, "array of user names in correct order");
                        console.log(data.username, "username of of person connected")
                        if(data.timeline.finals.startTime < date.getTime()){
                            
                            var indexOfClient = orderInUsernames.indexOf(socket.id);
                            console.log(indexOfClient, "this is the index of the client")
                            if(orderInUsernames.indexOf(socket.id)>1){
                                $("#message").html("Sorry you didn't qualify for the finals")
                                $("#continueLounge").html(`<a href='/logout/'+${data.loungeUsers[indexOfClient].username}> Click Here to logout</a>`)
                            }else{
                                $("#message").html("Congrats you qualifed for the finals")
               
                                $("#continueLounge").html("<a href='/game'>Continue</a>")
                                $("#continueLounge").click(async function(){
                                    await socket.emit("go to next level", data.username);
                                    return true;
                                })
                            }
                            clearInterval(myVar)
                        }   
                    }else{
                       
                        $("#peoples").html(`<h3>${orderInUsernames[0]} won the Tournament!!!</h3>`)
                        clearInterval(myVar)    
                    }
          
        }
            /* var myVar = setInterval(myFuncUpdate, 1000);
        var myFuncUpdate = () =>{
            console.log("upadating every 10s")
            
        var date = new Date
        console.log(data.timeline.semi_finals.startTime, "start", date.getTime(), "now", (orderInUsernames.indexOf(socket.request.user.username)>5), "condition met")
        if(data.timline.semi_finals.startTime < date.getTime()){
            if(orderInUsernames.indexOf(socket.request.user.username)>5){
                $("#message").html("Sorry you didn't qualify for the semifinals")
                $("#continueLounge").html(`<a href='/logout/'+${socket.request.user.username}> Click Here to go to semi finals</a>`)
            }else{
                $("#message").html("Congrats you qualifed for the semifinals")
                socket.emit("go to semiFinals", elem.username)
                $("#continueLounge").html("<a href='/game'>Continue</a>")
            }
        }
    } */
    })
    
    socket.on("logout", function(data){
        console.log("here but")
        window.location.replace("http://localhost:3300/");
    })


    socket.on("entered room", function(data){
        console.log(data.room)
        console.log(socket.id)
        
        $("#players").html("")
        var count = 0;
        console.log(data)
        data.players.users.forEach(elem=>{
            if(socket.id === elem.socketId){
                thisPlayer=elem;
            }else{
                opponent = elem;
            }
            count++
            console.log(elem.userDetails.points)
            $("#players").append(`<div id="player${count}"><span class="userType">${elem.userType}</span> ${elem.userDetails.username}<span class="points">${elem.userDetails.points}</span></div>`)
            
        })
        $("#logout").attr("href", "/logout/"+thisPlayer.userDetails.username);
        console.log($("#logout"))
       console.log("begining", thisPlayer)
       opponentMove = (thisPlayer.userType === "X")?"O":"X";
       var whoTurnText = (thisPlayer.userTurn)?"Your turn":"Opponent's turn"
       room = data.room
    
       $("#whoTurn").html(whoTurnText);

        console.log("userType", thisPlayer.userType, "opponent type", opponentMove)
        $("#logout").click(function(){
            socket.emit("opponent disconnected", room)
            
        })
        $(".gameSquare").click( function(e){
            console.log(thisPlayer.userTurn)
                if(thisPlayer.userTurn){

                    console.log("allowed to click")
                    var id = e.target.id;
                    $("#"+id).removeClass(".gameSquare");
                    var boardDimensions= id.split("_").map(elem => parseInt(elem))
                    var board_level = boardDimensions[0]-1;
                    var boardItem = boardDimensions[1] - 1;
                    board[board_level][boardItem] = thisPlayer.userType;

                    console.log(board);

                     $("#"+ id).html(thisPlayer.userType)
                    thisPlayer.userTurn = false;
                    console.log(ifWin(board))
                    
                    console.log("Set thisPlayer.userTurn", thisPlayer.userTurn)
                    $("#whoTurn").html("Your Opponent's Turn")
                    
                    if(ifWin(board)){
                        console.log("here")
                        $("#whoTurn").html(`<h3>${thisPlayer.userDetails.username} WON</h3>`)
                        thisPlayer.userDetails.points++
                        thisPlayer.userDetails.gamePlayed++
                        console.log("checking update on win", thisPlayer)
                        handleFinish(thisPlayer, data.room)
                       
                    }else if (ifDraw(board)){
                        $("#whoTurn").html(`<h3>Draw</h3>`)
                        
                        thisPlayer.userDetails.gamePlayed++
                        handleFinish(thisPlayer, data.room)
                    }
                    socket.emit("made move", {divId:id, room:data.room, socketId:socket.id})
                }
                
            })
            
        
    });
        console.log("this players is ", thisPlayer)
        socket.on("made move", (moveData)=>{
            
            if(moveData.socketId !==  socket.id){
                console.log("here")
                var boardDimensions= moveData.divId.split("_").map(elem => parseInt(elem))
                var board_level = boardDimensions[0]-1;
                var boardItem = boardDimensions[1]-1;
                board[board_level][boardItem] = opponentMove;
                console.log(board)
                   thisPlayer.userTurn = true;
                console.log("thisPlayer")
                $("#"+moveData.divId).html(opponentMove);
                console.log(ifWin(board))
                if(ifWin(board)){
                    thisPlayer.userDetails.gamePlayed++
                    thisPlayer.userDetails.points--
                    console.log("checking update on win", thisPlayer)
                    $("#whoTurn").html(`<h3>${opponent.userDetails.username} WON</h3>`)
                    handleFinish(thisPlayer, moveData.room)
                }else if (ifDraw(board)){
                    console.log("draw")
                    thisPlayer.userDetails.gamePlayed++
                    console.log("checking update on win", thisPlayer)
                    $("#whoTurn").html(`<h3>Draw</h3>`)
                    handleFinish(thisPlayer, moveData.room)
                }else{
                    $("#whoTurn").html("Your Turn")
                }
            }
        })
        socket.on("user disconnect", (data)=>{
            console.log("got message")
            console.log("user from this room got disconnected")
            console.log(room, "dis our room")
            console.log(socket.id, "this is the left user")
            console.log(data.user, "socket.id of opponent")
            
            socket.emit("opponent disconnected", data)
          
        })
        socket.on("changes on disconnect", (data)=>{
            $("#players").html("")
            var count = 0;
            console.log(data)
            data.players.users.forEach(elem=>{
                console.log(socket.id)
                if(socket.id === elem.socketId){
                    thisPlayer=elem;
                 }else{
                    opponent = elem;
            }
                if(elem.userDetails){
                    $("#players").append(`<div id="player${count}"><span class="userType">${elem.userType}</span> ${elem.userDetails.username}</div>`)
                }
                
            
        })

        })
        
        
    
})