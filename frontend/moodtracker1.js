const moodForm = document.getElementById("mood-form");
const moodChartCanvas = document.getElementById("mood-chart");

if (!moodChartCanvas) {
  console.error("Chart canvas not found!");
} else {
  const moodChartCtx = moodChartCanvas.getContext("2d");
  let moodData = []; // Array to store logged moods
  let moodChart = null; // Initialize the chart variable

  moodForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Retrieve values from the form
    const mood = document.getElementById("mood").value;
    const intensity = parseInt(document.getElementById("intensity").value);
    const note = document.getElementById("note").value;

    // Validate input
    if (!mood || isNaN(intensity) || intensity < 1 || intensity > 10) {
      alert("Please select a mood and enter a valid intensity (1-10).");
      return;
    }

    // Log mood data
    moodData.push({ mood, intensity, note, date: new Date() });
    
    updateChart(); // Update chart after logging mood

    // Clear the form
    moodForm.reset();
  });

  function updateChart() {
    if (moodData.length === 0) return; // Don't update if no data

    const labels = moodData.map((entry) =>
      entry.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    );
    const intensities = moodData.map((entry) => entry.intensity);

    if (moodChart) {
      moodChart.destroy(); // Clear previous chart before updating
    }

    moodChart = new Chart(moodChartCtx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Mood Intensity",
            data: intensities,
            borderColor: "#4b306a",
            backgroundColor: "rgba(75, 48, 106, 0.2)",
            borderWidth: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            min: 1,
            max: 11,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });
  }
}
