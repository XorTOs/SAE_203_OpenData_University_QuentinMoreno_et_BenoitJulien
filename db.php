<?php
$host = "localhost";
$user = "****";
$pass = "****";
$dbname = "******";

$conn = new mysqli($host, $user, $pass, $dbname);

$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    die("Erreur de connexion");
}
?>