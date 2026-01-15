<?php
include 'db.php';
header('Content-Type: application/json');

$sql = "SELECT titre, annee_de_production AS annee, nb_de_diffusions AS diff, groupe_de_nationalite2 AS nat 
        FROM films";

$result = $conn->query($sql);
$data = [];

while($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);
$conn->close();
?>