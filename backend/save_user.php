<?php
header('Content-Type: application/json');
$conn = new mysqli('localhost', 'root', '', 'glow_wise');

if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed']));
}

$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $stmt = $conn->prepare("REPLACE INTO user (id, name, age, height, weight, activity, email) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param(
        "ssissss",
        $data['id'],
        $data['name'],
        $data['age'],
        $data['height'],
        $data['weight'],
        $data['activity'],
        $data['email']
    );

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Failed to save user data']);
    }

    $stmt->close();
}

$conn->close();
?>
