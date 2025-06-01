let trainingChart;

const defaultJournal = [];
const journalData = loadSafe("journalData", defaultJournal);
console.log("Initialized journalData:", journalData);

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
          data: [
            trainingData.bouldering,
            trainingData.toprope,
            trainingData.lead,
            trainingData.aerobic,
            trainingData.anaerobic,
            trainingData.other,
          ],
          backgroundColor: [
            "#34A85399", // Bouldering
            "#F28C2899", // Top Rope
            "#4285F499", // Lead
            "#34A85377", // Aerobic
            "#F28C2877", // Anaerobic
            "#4285F477", // Other
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
  event.preventDefault(); // Prevent form refresh

  const type = document.getElementById("type").value;

  if (type === "climbing") {
    const discipline = document.getElementById("discipline").value;
    const grade = document.getElementById("grade").value;
    const difficulty = document.getElementById("difficulty").value;

    if (!discipline || !grade || !difficulty) {
      alert("Please fill out all climbing fields.");
      return;
    }

    let gradeDifficultyKey;

    if (discipline === "toprope" || discipline === "lead") {
      if (difficulty === "flash" || difficulty === "onsight") {
        gradeDifficultyKey = "ropedOnsight"; // map to ropedOnsight
      } else if (difficulty === "redpoint" || difficulty === "project") {
        gradeDifficultyKey = "ropedRedpoint"; // map to ropedRedpoint
      }
      updateAverageGrade(gradeDifficultyKey, grade);
    } else if (discipline === "bouldering") {
      if (difficulty === "flash") {
        gradeDifficultyKey = "boulderingFlash";
      } else if (difficulty === "project") {
        gradeDifficultyKey = "boulderingProject";
      }
      updateAverageGrade(gradeDifficultyKey, grade);
    }

    // Create the log entry
    const logEntry = {
      type: "climbing",
      discipline,
      grade,
      difficulty,
      timestamp: new Date().toISOString(),
    };

    // Add the log entry to the top of the journal
    journalData.unshift(logEntry);
    saveToStorage("journalData", journalData); // Save journal data to localStorage
    renderJournal(); // Update the UI
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

    // Create the training log entry
    const logEntry = {
      type: "training",
      trainingType,
      timestamp: new Date().toISOString(),
    };

    // Add the training log entry to the top of the journal
    journalData.unshift(logEntry);
    saveToStorage("journalData", journalData); // Save journal data to localStorage
    renderJournal(); // Update the UI
  }

  // Reset form
  document.getElementById("logForm").reset();
  toggleFormFields(); // Reset visibility

  // Close the form popup
  openLog("close"); // Assuming `openLog` handles opening/closing the form
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

  const reflection = {
    type: "reflection",
    timestamp: new Date().toISOString(),
    struggles: [],
    strengths: [],
    comments: document.getElementById("notes").value || "",
  };

  Object.keys(traitMap).forEach((id) => {
    const input = document.getElementById(id);
    const val = parseInt(input?.value, 10) || 0;
    const key = traitMap[id];

    if (key && val !== 0) {
      if (val < 0) {
        reflection.struggles.push({ trait: key, value: val });
      } else if (val > 0) {
        reflection.strengths.push({ trait: key, value: val });
      }

      // Update the traits object
      if (traits[key] !== undefined) {
        traits[key] += val; // Add the reflection value to the existing trait value
      } else {
        traits[key] = val; // Initialize the trait if it doesn't exist
      }
    }
  });

  // Save the updated traits to localStorage
  saveToStorage("traits", traits);

  // Sort struggles and strengths by value
  reflection.struggles.sort((a, b) => a.value - b.value);
  reflection.strengths.sort((a, b) => b.value - a.value);

  // Add the reflection to the top of the journal
  journalData.unshift(reflection);
  saveToStorage("journalData", journalData); // Save journal data to localStorage
  renderJournal(); // Update the UI

  // Reset form and reload journal
  event.target.reset();
  location.reload();
}

function renderJournal() {
  console.log("Rendering journalData:", journalData); // Debugging log
  const journalContainer = document.getElementById("journalContainer");
  journalContainer.innerHTML = ""; // Clear existing entries

  journalData.forEach((entry, index) => {
    const entryCard = document.createElement("div");
    entryCard.className = "journal-card";

    if (entry.type === "climbing" || entry.type === "training") {
      entryCard.innerHTML = `
        <h4>${entry.type === "climbing" ? "Climbing Log" : "Training Log"}</h4>
        ${
          entry.type === "climbing"
            ? `
          <p><strong>Discipline:</strong> ${entry.discipline}</p>
          <p><strong>Grade:</strong> ${entry.grade}</p>
          <p><strong>Difficulty:</strong> ${entry.difficulty}</p>
        `
            : `
          <p><strong>Training Type:</strong> ${entry.trainingType}</p>
        `
        }
        <p><strong>Date:</strong> ${new Date(
          entry.timestamp
        ).toLocaleString()}</p>
      `;
    } else if (entry.type === "reflection") {
      entryCard.innerHTML = `
        <h4>Reflection</h4>
        <p><strong>Struggles:</strong> ${entry.struggles
          .map((s) => s.trait)
          .join(", ")}</p>
        <p><strong>Strengths:</strong> ${entry.strengths
          .map((s) => s.trait)
          .join(", ")}</p>
        <p><strong>Comments:</strong> ${entry.comments}</p>
        <p><strong>Date:</strong> ${new Date(
          entry.timestamp
        ).toLocaleString()}</p>
      `;
    }

    journalContainer.appendChild(entryCard);
  });
}

function saveJournal() {
  console.log("Saving journalData:", journalData);
  saveToStorage("journalData", journalData); // Save journal data to localStorage
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

  renderJournal();

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

function openJournal(state = "open") {
  const journalPopup = document.getElementById("journalPopup");
  if (state === "open") {
    renderJournal(); // Render journal entries
    journalPopup.style.display = "block";
    document.body.classList.add("no-scroll"); // Disable scrolling on the dashboard
  } else {
    journalPopup.style.display = "none";
    document.body.classList.remove("no-scroll"); // Enable scrolling on the dashboard
  }
}

renderJournal();
