<?php
include 'db.php';
header('Content-Type: application/json');

$resVod = $conn->query("SELECT * FROM vod");
$vod = $resVod->fetch_assoc();

$resTv = $conn->query("SELECT * FROM tv");
$tv = $resTv->fetch_assoc();

$years = array_keys($vod);
$formatted = [];

foreach($years as $year) {
    $formatted[] = [
        "annee" => $year,
        "vod" => floatval(str_replace(',', '.', $vod[$year])),
        "tv" => intval($tv[$year])
    ];
}

echo json_encode($formatted);
$conn->close();
?>