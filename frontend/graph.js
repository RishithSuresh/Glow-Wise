// Fetch calorie data from the backend
async function fetchCalorieData() {
    try {
        const response = await fetch('http://localhost:3000/api/calories-data');
        const result = await response.json();
        if (result.success) {
            return result.data;
        } else {
            console.error('Failed to fetch calorie data:', result.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching calorie data:', error);
        return [];
    }
}

// Render the graph using Chart.js
async function renderGraph() {
    const data = await fetchCalorieData();
    const labels = data.map(entry => entry.timestamp); // X-axis labels (dates)
    const values = data.map(entry => entry.totalCalories); // Y-axis values (calories)

    const ctx = document.getElementById('calorieChart').getContext('2d');
    new Chart(ctx, {
        type: 'line', // Line chart
        data: {
            labels: labels,
            datasets: [{
                label: 'Calories Over Time',
                data: values,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                tension: 0.4 // Smooth curve
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Calories'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Call the renderGraph function when the page loads
document.addEventListener('DOMContentLoaded', renderGraph);
