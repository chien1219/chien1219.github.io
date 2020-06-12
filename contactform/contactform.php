<?php

    $name = $_POST['name'];
    $email = $_POST['email'];
    $subject = $_POST['subject'];
    $message = $_POST['message'];

    if(!empty($_SERVER['HTTP_CLIENT_IP']))
    { 
        //ip from share internet
        $ip = $_SERVER['HTTP_CLIENT_IP'];    
    }
    elseif(!empty($_SERVER['HTTP_X_FORWARDED_FOR']))
    {
        //ip pass from proxy
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
    else
    {
        $ip = $_SERVER['REMOTE_ADDR'];
    }

    $details = json_decode(file_get_contents("http://ipinfo.io/{$ip}/json"));

    $post = http_build_query(array(
    'name' => $name,
    'email' => $email,
    'subject' => $subject,
    'message' => $message,
    'ip' => $ip,
    'city' => $details->city,
    'location' => $details->loc));

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL,"http://104.32.144.237/contactme/contactme.php");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    if (curl_exec($ch)) 
        print("OK");
    else 
        print("Sorry, Message server is currently down! Try 
        <a style=\"color: blue\" href = \"mailto: richard85014@gmail.com?subject=" . $subject . "&body=" . $message . "\">
        email me!
        </a>");

    curl_close ($ch);
?>