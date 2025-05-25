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

/* Previous Page Function */
function previousPage() {
  if (window.history.length > 1) {
    window.history.back(); //Go back to Previous Page in History
  } else {
    window.location.href = "index.html"; //Redirect to index.html If No History
  }
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

/** Lazyload Images **/
safeLazyLoad();
