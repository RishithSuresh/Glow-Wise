<?php
header('Content-Type: application/json');
$conn = new mysqli('localhost', 'root', '', 'glow_wise');

if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed']));
}

$result = $conn->query("SELECT * FROM user LIMIT 1");
if ($result->num_rows > 0) {
    echo json_encode($result->fetch_assoc());
} else {
    echo json_encode(null);
}

$conn->close();
?>
