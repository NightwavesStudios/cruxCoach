/* Data Storage */
const defaultGrades = {
  boulderingFlash: "None",
  boulderingProject: "None",
  ropedOnsight: "None",
  ropedRedpoint: "None",
};

const defaultTrainingData = {
  bouldering: 0,
  toprope: 0,
  lead: 0,
  other: 0,
};

const defaultTraits = {
  Crimp: 0,
  Sloper: 0,
  Pocket: 0,
  Sidepull: 0,
  Undercling: 0,
  Pinch: 0,
  Bigmove: 0,
  Meticulous: 0,
  Powerful: 0,
  Routereading: 0,
  Endurance: 0,
  Slab: 0,
  Slightoverhang: 0,
  Overhang: 0,
  Cave: 0,
};

const defaultAccountInfo = {
  username: "Guest",
  email: "guest@example.com",
  joinDate: new Date().toISOString().split("T")[0], // Default to today's date
};

/* Load Utility and Save Local Storage Function */
function loadSafe(key, fallback = {}) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch (e) {
    console.warn(
      `Failed to load key "${key}" from localStorage. Using fallback.`
    );
    return fallback;
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* Load Data from Storage */
const grades = loadSafe("grades", defaultGrades);
const trainingData = loadSafe("trainingData", defaultTrainingData);
const traits = loadSafe("traits", defaultTraits);

const accountInfo = loadSafe("accountInfo", defaultAccountInfo);

const styleTraits = {
  ...(traits.Crimp !== 0 && { Crimp: traits.Crimp }),
  ...(traits.Meticulous !== 0 && { Meticulous: traits.Meticulous }),
  ...(traits.Powerful !== 0 && { Powerful: traits.Powerful }),
  ...(traits.Routereading !== 0 && { Routereading: traits.Routereading }),
  ...(traits.Endurance !== 0 && { Endurance: traits.Endurance }),
};

const holdsTraits = {
  Crimp: traits.Crimp,
  Sloper: traits.Sloper,
  Pocket: traits.Pocket,
  Sidepull: traits.Sidepull,
  Undercling: traits.Undercling,
  Pinch: traits.Pinch,
};

const wallTraits = {
  Slab: traits.Slab,
  Slightoverhang: traits.Slightoverhang,
  Overhang: traits.Overhang,
  Cave: traits.Cave,
};

/* Load Grades from Local Storage */
Object.keys(localStorage).forEach((key) => {
  if (key.endsWith("Grades") && key !== "grades") {
    const type = key.replace("Grades", "");
    const data = JSON.parse(localStorage.getItem(key));

    if (data && Array.isArray(data.grades) && data.grades.length) {
      const sorted = data.grades.slice().sort((a, b) => a - b);
      const median =
        sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];

      if (data.type === "yds") {
        // Handle YDS grades
        if (
          type === "ropedOnsight" ||
          type === "topropeOnsight" ||
          type === "leadOnsight"
        ) {
          grades.ropedOnsight = sportNumberToGrade(median);
        } else if (
          type === "ropedRedpoint" ||
          type === "topropeRedpoint" ||
          type === "leadRedpoint"
        ) {
          grades.ropedRedpoint = sportNumberToGrade(median);
        }
      } else if (data.type === "vscale") {
        // Handle V-scale grades
        grades[type] = numberToGrade(Math.round(median));
      } else {
        console.warn(`Unknown grade type for ${type}:`, data.type);
      }
    }
  }
});
Object.entries(grades).forEach(([key, value]) => updateElementText(key, value)); //Update the UI with the loaded grades

/* Update Text in Element */
function updateElementText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = value;
  } else {
    //console.error(`Element with id "${id}" not found.`);
  }
}

/* Grade Conversion Functions */
function gradeToNumber(grade) {
  const gradeMap = {
    VB: 0,
    V0: 0,
    V1: 1,
    V2: 2,
    V3: 3,
    V4: 4,
    V5: 5,
    V6: 6,
    V7: 7,
    V8: 8,
    V9: 9,
    V10: 10,
    V11: 11,
    V12: 12,
    V13: 13,
    V14: 14,
    V15: 15,
    V16: 16,
    V17: 17,
  };

  return gradeMap[grade] !== undefined ? gradeMap[grade] : NaN; //Return NaN for invalid grades
}
function numberToGrade(number) {
  const gradeMap = {
    0: "VB",
    1: "V1",
    2: "V2",
    3: "V3",
    4: "V4",
    5: "V5",
    6: "V6",
    7: "V7",
    8: "V8",
    9: "V9",
    10: "V10",
    11: "V11",
    12: "V12",
    13: "V13",
    14: "V14",
    15: "V15",
    16: "V16",
    17: "V17",
  };

  return gradeMap[number] !== undefined ? gradeMap[number] : "None"; //Return "None" for invalid numbers
}
function sportGradeToNumber(grade) {
  const gradeMap = {
    5.5: 0,
    5.6: 1,
    5.7: 2,
    5.8: 3,
    5.9: 4,
    "5.10": 6,
    "5.10a": 5,
    "5.10b": 6,
    "5.10c": 7,
    "5.10d": 8,
    5.11: 10,
    "5.11a": 9,
    "5.11b": 10,
    "5.11c": 11,
    "5.11d": 12,
    5.12: 14,
    "5.12a": 13,
    "5.12b": 14,
    "5.12c": 15,
    "5.12d": 16,
    5.13: 18,
    "5.13a": 17,
    "5.13b": 18,
    5.13: 20,
    "5.13c": 19,
    "5.13d": 20,
    5.14: 22,
    "5.14a": 21,
    "5.14b": 22,
    "5.14c": 23,
    "5.14d": 24,
    5.15: 26,
    "5.15a": 25,
    "5.15b": 26,
    "5.15c": 27,
    "5.15d": 28,
  };
  return gradeMap[grade] !== undefined ? gradeMap[grade] : NaN;
}
function sportNumberToGrade(number) {
  const gradeMap = {
    0: "5.5",
    1: "5.6",
    2: "5.7",
    3: "5.8",
    4: "5.9",
    5: "5.10a",
    6: "5.10b",
    7: "5.10c",
    8: "5.10d",
    9: "5.11a",
    10: "5.11b",
    11: "5.11c",
    12: "5.11d",
    13: "5.12a",
    14: "5.12b",
    15: "5.12c",
    16: "5.12d",
    17: "5.13a",
    18: "5.13b",
    19: "5.13c",
    20: "5.13d",
    21: "5.14a",
    22: "5.14b",
    23: "5.14c",
    24: "5.14d",
    25: "5.15a",
    26: "5.15b",
    27: "5.15c",
    28: "5.15d",
  };
  return gradeMap[number] !== undefined ? gradeMap[number] : "None";
}

/* Popup Functions */
function togglePopup(id, state = "open") {
  const popup = document.getElementById(id);
  if (!popup) {
    console.error(`Popup "${id}" not found.`);
    return;
  }
  const isOpening = state !== "close";
  popup.style.display = isOpening ? "block" : "none";
  popup.style.overflowY = isOpening ? "auto" : "";
  document.body.style.overflow = isOpening ? "hidden" : "";
}

function toggleInfoPopup(popupId) {
  const popup = document.getElementById(popupId);
  if (!popup) {
    console.error(`Popup with id "${popupId}" not found.`);
    return;
  }

  popup.style.display = popup.style.display === "block" ? "none" : "block";
}

/* Lazyload Fallback Function */
function safeLazyLoad() {
  if (typeof lazyload === "function") {
    lazyload();
  } else {
    console.warn("Lazyload function not found.");
  }
}

/* Display Tip */
const tipDisplay = document.getElementById("tipDisplay");
const tips = [
  "Only your last 10 logged grades are saved, keeping your data fresh and recent!",
  "It can take up to 5-10 journals for your data to fully reflect your climbing style and skills.",
  "The more you log, the more accurate your data becomes!",
  "You can download your data on the profile page as a backup, and upload it later as a backup or onto a different device!",
  "You can use the 'Clear Data' button on the profile page to reset your data if you want to start fresh. Do this with caution!",
  "The train page is a place to learn through articles and videos, and practice through exercises!",
  "If you just want to expore all the content, click the 'view all' button on the train page!",
  "To sort the content, click a collection to view articles, videos, and exercises specific to that collection!",
  "View the Holds Breakdown Chart to see your strengths and weaknesses in different climbing holds.",
  "View the Style Breakdown Chart to see your strengths and weaknesses in different climbing styles.",
  "The Training Distribution Chart shows where you spend most of your climbing time.",
];
function updateTip() {
  let previousIndex = -1;
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * tips.length);
  } while (randomIndex === previousIndex && tips.length > 1);

  previousIndex = randomIndex;
  tipDisplay.innerHTML = tips[randomIndex];
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

  /** Lazyload Images **/
  safeLazyLoad();
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

function handleLogSubmit(event) {
  event.preventDefault();

  const typeSelect = document.getElementById("type");
  const gradeInput = document.getElementById("grade");
  const difficultySelect = document.getElementById("difficulty");

  const type = typeSelect.value;
  const grade = gradeInput.value.trim();
  const difficulty = difficultySelect.value;

  if (!type || (type !== "other" && (!grade || !difficulty))) {
    alert("Please complete all required fields.");
    return;
  } else {
    openLog("close");
  }

  let gradeDifficultyKey;

  // Modified handling to recognize toprope and lead as the same
  if (type === "toprope" || type === "lead") {
    if (difficulty === "flash" || difficulty === "onsight") {
      gradeDifficultyKey = "ropedOnsight"; // map to ropedOnsight
    } else if (difficulty === "redpoint" || difficulty === "project") {
      gradeDifficultyKey = "ropedRedpoint"; // map to ropedRedpoint
    }
  } else if (type === "bouldering") {
    if (difficulty === "flash") {
      gradeDifficultyKey = "boulderingFlash";
    } else if (difficulty === "project") {
      gradeDifficultyKey = "boulderingProject";
    }
  }

  if (gradeDifficultyKey) {
    updateAverageGrade(gradeDifficultyKey, grade);
  } else {
    console.warn("Unknown difficulty key:", type, difficulty);
  }

  if (trainingData[type] !== undefined) {
    trainingData[type]++;
    saveToStorage("trainingData", trainingData);
  }

  updateTrainingChart();

  typeSelect.value = "";
  gradeInput.value = "";
  difficultySelect.value = "";
}

function handleJournalSubmit(event) {
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

/* Public Popup Control Functions */
function openJournal(state) {
  togglePopup("journalPopup", state);
}

function openLog(state) {
  togglePopup("logPopup", state);
}

function openCoach() {
  alert("This feature is not currently available.");
}

/* Previous Page Function */
function previousPage() {
  if (window.history.length > 1) {
    window.history.back(); //Go back to Previous Page in History
  } else {
    window.location.href = "index.html"; //Redirect to index.html If No History
  }
}

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

/* Smooth Scroll */
function smoothScroll(y) {
  window.scroll({
    top: y,
    behavior: "smooth",
  });
}

/* Clear Local Storage */
function clearData() {
  if (
    confirm(
      "Are you sure you want to clear all data? This action cannot be undone."
    )
  ) {
    localStorage.clear(); // Clear Local Storage
    alert("All data has been cleared.");
    location.reload(); // Reload Page to Reflect Changes
  }
}

let trainingChart;

function updateTrainingChart() {
  const chartElement = document.getElementById("trainingDistributionChart");
  const noDataMessage = document.getElementById("noTrainingDataMessage");

  const dataValues = Object.values(trainingData); // Get Values from trainingData
  const allZero = dataValues.every((val) => val === 0); // Check if all Values are Zero

  if (allZero) {
    chartElement.style.display = "none";
    noDataMessage.style.display = "block";
    return;
  } else {
    chartElement.style.display = "block";
    noDataMessage.style.display = "none";
  }

  if (trainingChart) {
    trainingChart.destroy(); // Destroy Existing Chart Instance
  }

  /* Create New Chart Instance */
  trainingChart = new Chart(chartElement, {
    type: "pie",
    data: {
      labels: ["Bouldering", "Top Rope", "Lead", "Other"],
      datasets: [
        {
          backgroundColor: ["#34A85399", "#F28C2899", "#4285f499", "#e8c3b9"],
          data: Object.values(trainingData),
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

  updateTip();
});
