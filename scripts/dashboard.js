let trainingChart;

function updateTrainingChart() {
  const chartElement = document.getElementById("trainingDistributionChart");
  const noDataMessage = document.getElementById("noTrainingDataMessage");

  const dataValues = Object.values(trainingData);
  const allZero = dataValues.every((val) => val === 0);

  if (allZero) {
    chartElement.style.display = "none";
    noDataMessage.style.display = "block";
    return;
  } else {
    chartElement.style.display = "block";
    noDataMessage.style.display = "none";
  }

  if (trainingChart) {
    trainingChart.destroy();
  }

  trainingChart = new Chart(chartElement, {
    type: "pie",
    data: {
      labels: [
        "Bouldering",
        "Top Rope",
        "Lead",
        "Aerobic",
        "Anaerobic",
        "Other",
      ],
      datasets: [
        {
          data: Object.values(trainingData),
          backgroundColor: [
            "#34A85399",
            "#F28C2899",
            "#4285F499",
            "#e8c3b9",
            "#f3a683",
            "#786fa6",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Training Type Distribution",
        },
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  Object.entries(grades).forEach(([key, value]) =>
    updateElementText(key, value)
  );

  /* Update Traits */
  Object.entries(traits).forEach(([key, value]) => {
    updateElementText(key, value); //Update the UI with Loaded Traits
    const el = document.getElementById(key); //Get the Element by ID
    if (el) {
      el.classList.remove("up", "down"); //Remove Previous Classes
      if (value > 0)
        el.classList.add("up"); //Add "up" Class if Value is Positive
      else if (value < 0) el.classList.add("down"); //Add "down" Class if Value is Negative
    }
  });
  const chartElement = document.getElementById("trainingDistributionChart");
  if (chartElement) {
    updateTrainingChart();
  }
});

/* Form Submission Actions */
function updateAverageGrade(difficulty, grade) {
  const logKey = `${difficulty}Grades`; // Combine difficulty as the key
  const logArrayJSON = localStorage.getItem(logKey); // Get the log array from localStorage
  let logArray = []; // Initialize the log array

  try {
    logArray = JSON.parse(logArrayJSON)?.grades || []; // Parse the log array
  } catch (e) {
    console.warn(`Corrupted data in localStorage for ${logKey}. Resetting.`);
    logArray = []; // Reset the log array if corrupted
  }

  let newGradeNumber;
  let gradeType; // Track the grade type (vscale or yds)

  if (difficulty.startsWith("roped")) {
    newGradeNumber = sportGradeToNumber(grade); // Convert to roped grade number
    gradeType = "yds"; // Mark as YDS scale
  } else {
    newGradeNumber = gradeToNumber(grade); // Convert to bouldering grade number
    gradeType = "vscale"; // Mark as V-scale
  }

  if (isNaN(newGradeNumber)) {
    console.error(`Invalid grade: ${grade}`);
    return;
  }

  logArray.push(newGradeNumber); // Add the new grade to the array

  if (logArray.length > 10) {
    logArray.shift(); // Remove the oldest grade if the array exceeds 10 entries
  }

  // Save the grade type and log array to localStorage
  localStorage.setItem(
    logKey,
    JSON.stringify({ grades: logArray, type: gradeType })
  );

  // Calculate the median grade
  const sortedGrades = logArray.slice().sort((a, b) => a - b); // Sort grades in ascending order
  let medianGrade;

  if (sortedGrades.length % 2 === 0) {
    const mid1 = sortedGrades[sortedGrades.length / 2 - 1];
    const mid2 = sortedGrades[sortedGrades.length / 2];
    medianGrade = (mid1 + mid2) / 2; // Average the two middle values
  } else {
    medianGrade = sortedGrades[Math.floor(sortedGrades.length / 2)]; // Take the middle value
  }

  console.log(`Raw median grade for ${difficulty} (unrounded):`, medianGrade);

  let medianGradeText;
  if (gradeType === "yds") {
    medianGradeText = sportNumberToGrade(Math.round(medianGrade)); // Convert median grade to text
  } else {
    medianGradeText = numberToGrade(Math.floor(medianGrade)); // Convert median grade to text
  }

  grades[difficulty] = medianGradeText;

  saveToStorage("grades", grades); // Save grades object to localStorage
  updateElementText(difficulty, medianGradeText); // Update UI with the new median grade
}

function toggleFormFields() {
  const type = document.getElementById("type").value;
  const climbingFields = document.getElementById("climbingFields");
  const trainingFields = document.getElementById("trainingFields");

  if (type === "climbing") {
    climbingFields.style.display = "block";
    trainingFields.style.display = "none";
    document.getElementById("discipline").required = true;
    document.getElementById("grade").required = true;
    document.getElementById("difficulty").required = true;
    document.getElementById("trainingType").required = false;
  } else if (type === "training") {
    climbingFields.style.display = "none";
    trainingFields.style.display = "block";
    document.getElementById("discipline").required = false;
    document.getElementById("grade").required = false;
    document.getElementById("difficulty").required = false;
    document.getElementById("trainingType").required = true;
  }
}

function handleLogSubmit(event) {
  event.preventDefault();

  const type = document.getElementById("type").value;

  if (type === "climbing") {
    const discipline = document.getElementById("discipline").value;
    const grade = document.getElementById("grade").value;
    const difficulty = document.getElementById("difficulty").value;

    if (!discipline || !grade || !difficulty) {
      alert("Please fill out all climbing fields.");
      return;
    }

    // Save climbing data (already works)
    const gradeDifficultyKey =
      difficulty === "flash" ? `${discipline}Flash` : `${discipline}Project`;
    updateAverageGrade(gradeDifficultyKey, grade);
  } else if (type === "training") {
    const trainingType = document.getElementById("trainingType").value;

    if (!trainingType) {
      alert("Please select a training type.");
      return;
    }

    // Save training data
    if (trainingData[trainingType] !== undefined) {
      trainingData[trainingType]++;
      saveToStorage("trainingData", trainingData);
    }
  }

  // Reset form
  document.getElementById("logForm").reset();
  toggleFormFields(); // Reset visibility
  updateTrainingChart(); // Update the training distribution chart
}

function handleReflectSubmit(event) {
  event.preventDefault();

  const traitMap = {
    crimp: "Crimp",
    sloper: "Sloper",
    pocket: "Pocket",
    sidepull: "Sidepull",
    undercling: "Undercling",
    pinch: "Pinch",
    slab: "Slab",
    slightOverhang: "Slightoverhang",
    overhang: "Overhang",
    cave: "Cave",
    bigMove: "Bigmove",
    meticulous: "Meticulous",
    powerful: "Powerful",
    routeReading: "Routereading",
    endurance: "Endurance",
  };

  Object.keys(traitMap).forEach((id) => {
    const input = document.getElementById(id);
    const val = parseInt(input?.value, 10) || 0;
    const key = traitMap[id];

    if (key && val !== 0) {
      const current = traits[key] || 0;
      traits[key] = Math.max(-10, Math.min(10, current + val));
    }
  });

  saveToStorage("traits", traits);
  event.target.reset();
  location.reload();
}

/* DOM Loaded Safety Function */
document.addEventListener("DOMContentLoaded", () => {
  Object.entries(grades).forEach(([key, value]) =>
    updateElementText(key, value)
  );

  Object.entries(traits).forEach(([key, value]) => {
    updateElementText(key, value);
    const el = document.getElementById(key);
    if (el) {
      el.classList.remove("up", "down");
      if (value > 0) el.classList.add("up");
      else if (value < 0) el.classList.add("down");
    }
  });

  /** Training Distribution Pie Chart **/
  const chartElement = document.getElementById("trainingDistributionChart");
  if (chartElement) {
    updateTrainingChart();
  }

  /** Holds Breakdown Chart **/
  const holdsChartElement = document.getElementById("holdsBreakdownChart");

  if (holdsChartElement) {
    new Chart(holdsChartElement, {
      type: "bar",
      data: {
        labels: Object.keys(holdsTraits),
        datasets: [
          {
            label: "Trait Strength",
            data: Object.values(holdsTraits),
            backgroundColor: Object.values(holdsTraits).map((val) =>
              val > 0 ? "#34A853cc" : val < 0 ? "#EA4335cc" : "#999999cc"
            ),
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.label}: ${ctx.raw > 0 ? "+" : ""}${ctx.raw}`,
            },
          },
        },
        scales: {
          x: {
            min: -10,
            max: 10,
            ticks: {
              callback: (value) => `${value > 0 ? "+" : ""}${value}`,
            },
            title: {
              display: true,
              text: "Weak ←→ Strong",
            },
          },
          y: {
            beginAtZero: false,
            ticks: {
              autoSkip: false,
            },
          },
        },
      },
    });
  }

  /** Style Breakdown Chart **/
  const styleChartElement = document.getElementById("styleBreakdownChart");
  if (styleChartElement) {
    new Chart(styleChartElement, {
      type: "radar",
      data: {
        labels: Object.keys(styleTraits),
        datasets: [
          {
            label: "Style Traits",
            data: Object.values(styleTraits),
            backgroundColor: "rgba(66, 133, 244, 0.2)",
            borderColor: "#0073ff",
            pointBackgroundColor: "#0073ff",
            pointBorderColor: "#0073ff",
            pointHoverBackgroundColor: "#0073ff",
            pointHoverBorderColor: "#0073ff",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const sign = ctx.raw > 0 ? "+" : "";
                return `${ctx.label}: ${sign}${ctx.raw}`;
              },
            },
          },
        },
        scales: {
          r: {
            min: -5,
            max: 10,
            ticks: { stepSize: 5, display: false },
            pointLabels: { font: { size: 12 }, color: "#333" },
            grid: { circular: true, color: "rgba(0,0,0,0.25)" },
            angleLines: { display: false },
          },
        },
        layout: { padding: { top: 0, bottom: 0 } },
      },
    });
  }

  /** Wall Angle Breakdown Chart **/
  const angleChartElement = document.getElementById("wallAngleChart");
  if (angleChartElement) {
    new Chart(angleChartElement, {
      type: "bar",
      data: {
        labels: Object.keys(wallTraits),
        datasets: [
          {
            label: "Trait Strength",
            data: Object.values(wallTraits),
            backgroundColor: Object.values(wallTraits).map((val) =>
              val > 0 ? "#34A853cc" : val < 0 ? "#EA4335cc" : "#999999cc"
            ),
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.label}: ${ctx.raw > 0 ? "+" : ""}${ctx.raw}`,
            },
          },
        },
        scales: {
          x: {
            min: -10,
            max: 10,
            ticks: {
              callback: (value) => `${value > 0 ? "+" : ""}${value}`,
            },
            title: {
              display: true,
              text: "Weak ←→ Strong",
            },
          },
          y: { beginAtZero: true },
        },
      },
    });
  }
});

/* Flesh Options Container JS */
window.onload = window.onresize = function () {
  var buttons = document.querySelectorAll("#optionsContainer button");
  var maxHeight = 0;

  /* Loop Through Each Button To Find The Maximum Height */
  buttons.forEach(function (button) {
    var buttonHeight = button.offsetHeight; //Get the Height of Each Button
    if (buttonHeight > maxHeight) maxHeight = buttonHeight; //Update maxHeight if Current Button is Taller
  });

  /* Set All Buttons to the Maximum Height */
  buttons.forEach(function (button) {
    button.style.height = maxHeight + "px"; //Set Each Button's Height to maxHeight
  });
};

/* Public Popup Control Functions */
function openReflect(state) {
  togglePopup("reflectPopup", state);
}

function openLog(state) {
  togglePopup("logPopup", state);
}

function openCoach() {
  alert("This feature is not currently available.");
}
