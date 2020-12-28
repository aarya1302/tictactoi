$(document).ready(function(){
    
    $(".close_alert").click(function(){
        $("#message_regis").addClass("alert-close");
        
            $("message_regis").css("display", "none")
        
    })
    /* $("#register_button").click(function(e){
        var input = document.getElementById("nickname").value;
        console.log(input.match("/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/"))
        $("form").submit((e)=>{
            e.preventDefault();
        })
        return true;
    }) */
})