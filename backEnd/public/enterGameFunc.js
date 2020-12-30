$(document).ready(function(){
    
    $(".close_alert").click(function(){
        $("#message_regis").addClass("alert-close");
        
            $("message_regis").css("display", "none")
        
    })
    /*  $("#register_button").click(function(e){
        var validationRegex = /(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/;
        var input = document.getElementById("nickname").value;
        console.log(validationRegex.test(input))
        $("#invalidDiv").html("")
        if(!validationRegex.test(input)){
            
            $("#invalidDiv").append("Username invalid please do make sure that your username does not containe any special characters or spaces.")
        }else{
            $("form").submit(()=>{
                return true;
            })
        }
       
        
    }) */ 
})