<?php
include 'db.php';
header('Content-Type: application/json');

if (isset($_GET['titre'])) {
    $titre = $_GET['titre'];
    $stmt = $conn->prepare("SELECT * FROM films WHERE titre = ?");
    $stmt->bind_param("s", $titre);
    $stmt->execute();
    $result = $stmt->get_result();
    
    echo json_encode($result->fetch_assoc());
}

$conn->close();
?>