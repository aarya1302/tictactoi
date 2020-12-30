

$(document).ready(function(){
    var socket = socket.io()
    console.log("c")
    socket.emit("entered lounge")
})