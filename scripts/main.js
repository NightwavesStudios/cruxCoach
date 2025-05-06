//TODO: At type local variable reconizing toprope and lead as the same and writing them respectively to either ropedOnsight or ropedRedpoint. Have different array for averaging again and create another conversion above for roped with 5.5-5.15.. Code: /* Default Data */
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
    Bigmove: 0,
    Meticulous: 0,
    Powerful: 0,
    Routereading: 0,
    Slab: 0,
    Slightoverhang: 0,
    Overhang: 0,
    Cave: 0,
};

/* Safe Storage Utilities */
function loadSafe(key, fallback = {}) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key));
        return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (e) {
        console.warn(`Failed to load key "${key}" from localStorage. Using fallback.`);
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

const styleTraits = {
    Bigmove: traits.Bigmove,
    Meticulous: traits.Meticulous,
    Powerful: traits.Powerful,
    Routereading: traits.Routereading,
};

const holdsTraits = {
    Crimp: traits.Crimp,
    Sloper: traits.Sloper,
    Pocket: traits.Pocket,
    Sidepull: traits.Sidepull,
    Undercling: traits.Undercling,
};

/* Load Grades from Local Storage */
document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("DOMContentLoaded", () => {
    const processedKeys = {}; // Keep track of processed localStorage keys

    Object.keys(localStorage).forEach(key => {
        if (key.endsWith("Grades") && key !== "grades" && !processedKeys[key]) {
            const type = key.replace("Grades", "");
            const data = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(data) && data.length) {
                const sorted = data.slice().sort((a, b) => a - b);
                const median = sorted.length % 2 === 0
                    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                    : sorted[Math.floor(sorted.length / 2)];

                if (type === "topropeOnsight" || type === "leadOnsight") {
                    grades.ropedOnsight = sportNumberToGrade(Math.round(median));
                } else if (type === "topropeRedpoint" || type === "leadRedpoint") {
                    grades.ropedRedpoint = sportNumberToGrade(Math.round(median));
                } else if (type === "ropedOnsight") {
                    grades.ropedOnsight = sportNumberToGrade(Math.round(median));
                } else if (type === "ropedRedpoint") {
                    grades.ropedRedpoint = sportNumberToGrade(Math.round(median));
                } else {
                    grades[type] = numberToGrade(Math.round(median));
                }
                processedKeys[key] = true; // Mark this key as processed
            }
        }
    });
    Object.entries(grades).forEach(([key, value]) => updateElementText(key, value));

/* Utilities */
function updateElementText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = value;
    } else {
        console.error(`Element with id "${id}" not found.`);
    }
}

/* Grade Conversion Functions */
function gradeToNumber(grade) {
    const gradeMap = {
        "VB": 0,
        "V0": 0,
        "V1": 1,
        "V2": 2,
        "V3": 3,
        "V4": 4,
        "V5": 5,
        "V6": 6,
        "V7": 7,
        "V8": 8,
        "V9": 9,
        "V10": 10,
        "V11": 11,
        "V12": 12,
        "V13": 13,
        "V14": 14,
        "V15": 15,
        "V16": 16,
        "V17": 17,
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

    return gradeMap[number] !== undefined ? gradeMap[number] : "None";//Return "None" for invalid numbers
}

function sportGradeToNumber(grade) {
    const gradeMap = {
        "5.5": 0,
        "5.6": 1,
        "5.7": 2,
        "5.8": 3,
        "5.9": 4,
        "5.10a": 5,
        "5.10b": 6,
        "5.10c": 7,
        "5.10d": 8,
        "5.11a": 9,
        "5.11b": 10,
        "5.11c": 11,
        "5.11d": 12,
        "5.12a": 13,
        "5.12b": 14,
        "5.12c": 15,
        "5.12d": 16,
        "5.13a": 17,
        "5.13b": 18,
        "5.13c": 19,
        "5.13d": 20,
        "5.14a": 21,
        "5.14b": 22,
        "5.14c": 23,
        "5.14d": 24,
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
function bindClick(selector, handler) {
    const el = document.querySelector(selector);
    if (el) {
        el.addEventListener("click", handler);
    } else {
        console.error(`Element "${selector}" not found.`);
    }
}

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

/* Scroll Animations */
function checkScroll() {
    document.querySelectorAll('.scroll-element').forEach(el => {
        const inView = el.getBoundingClientRect().top < window.innerHeight;
        el.classList.toggle('scrolled', inView);
    });
}

/* DOM Ready */
document.addEventListener("DOMContentLoaded", () => {

    Object.entries(grades).forEach(([key, value]) => updateElementText(key, value));


    Object.entries(traits).forEach(([key, value]) => {
        updateElementText(key, value);
        const el = document.getElementById(key);
        if (el) {
            el.classList.remove("up", "down");
            if (value > 0) el.classList.add("up");
            else if (value < 0) el.classList.add("down");
        }
    });

    // Training Chart
    const chartElement = document.getElementById("trainingDistributionChart");
    if (chartElement) {
        updateTrainingChart();
    }

    // Holds Breakdown Chart
const holdsChartElement = document.getElementById("holdsBreakdownChart");
    if (holdsChartElement) {
        new Chart(holdsChartElement, {
            type: "bar",
            data: {
                labels: Object.keys(holdsTraits),
                datasets: [{
                    label: "Trait Strength",
                    data: Object.values(holdsTraits),
                    backgroundColor: Object.values(holdsTraits).map(val =>
                        val > 0 ? "#34A853cc" : val < 0 ? "#EA4335cc" : "#999999cc"
                    ),
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${ctx.raw > 0 ? '+' : ''}${ctx.raw}`
                        }
                    }
                },
                scales: {
                    x: {
                        min: -10,
                        max: 10,
                        ticks: {
                            callback: value => `${value > 0 ? '+' : ''}${value}`
                        },
                        title: {
                            display: true,
                            text: 'Weak ←→ Strong'
                        }
                    },
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Style Breakdown Chart
    const styleChartElement = document.getElementById("styleBreakdownChart");
    if (styleChartElement) {
        new Chart(styleChartElement, {
            type: "radar",
            data: {
                labels: Object.keys(styleTraits),
                datasets: [{
                    label: "Style Traits",
                    data: Object.values(styleTraits),
                    backgroundColor: "rgba(66, 133, 244, 0.2)",
                    borderColor: "rgba(66, 133, 244, 0.8)",
                    borderWidth: 2,
                    pointBackgroundColor: "rgba(66, 133, 244, 1)",
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.label}: <span class="math-inline">\{ctx\.raw \> 0 ? '\+' \: ''\}</span>{ctx.raw}`
                        }
                    }
                },
                scales: {
                    r: {
                        min: -5,
                        max: 10,
                        ticks: { stepSize: 5, display: false },
                        pointLabels: { font: { size: 12 }, color: "#333" },
                        grid: { circular: true, color: "rgba(0,0,0,0.25)" },
                        angleLines: { display: false }
                    }
                },
                layout: { padding: { top: 0, bottom: 0 } }
            }
        });
    }

    // Popup Bindings
    bindClick(".mode", () => togglePopup("streaksPopup", "open"));
    bindClick(".streaks-header .exit", () => togglePopup("streaksPopup", "close"));

    // Lazyload
    safeLazyLoad();

    // Scroll animations
    checkScroll();
    document.addEventListener("scroll", checkScroll);
});

/* Form Submission Actions */
// Updated `updateAverageGrade` function
function updateAverageGrade(difficulty, grade) {
    const logKey = `${difficulty}Grades`; // Combine Difficulty as the Key
    const logArrayJSON = localStorage.getItem(logKey); // Get the Log Array from Local Storage
    let logArray = []; // Initialize the Log Array

    try {
        logArray = JSON.parse(logArrayJSON) || []; // Parse the Log Array
    } catch (e) {
        console.warn(`Corrupted data in localStorage for ${logKey}. Resetting.`);
        logArray = []; // Reset the Log Array if Corrupted Local Storage
    }

    let newGradeNumber;
    if (difficulty.startsWith("roped")) {
        newGradeNumber = sportGradeToNumber(grade); // Convert to roped grade number
    } else {
        newGradeNumber = gradeToNumber(grade); // Convert standard grade to number
    }

    if (isNaN(newGradeNumber)) {
        console.error(`Invalid grade: ${grade}`);
        return;
    }

    logArray.push(newGradeNumber); // Add New Grade to Array

    if (logArray.length >= 10) {
        logArray.shift(); // Remove Oldest Grade Entry if Exceeds 10
    }

    localStorage.setItem(logKey, JSON.stringify(logArray)); // Save the Log Array to Local Storage

    const sortedGrades = logArray.slice().sort((a, b) => a - b); // Sort Grades in Ascending Order
    let medianGrade; // Initialize Median Grade

    if (sortedGrades.length % 2 === 0) {
        const mid1 = sortedGrades[sortedGrades.length / 2 - 1]; // Get the First Middle Value
        const mid2 = sortedGrades[sortedGrades.length / 2]; // Get the Second Middle Value
        medianGrade = (mid1 + mid2) / 2; // Calculate the Median Grade
    } else {
        medianGrade = sortedGrades[Math.floor(sortedGrades.length / 2)]; // Get the Middle Value
    }

    console.log(`Raw median grade for ${difficulty} (unrounded):`, medianGrade);

    let medianGradeText;
    if (difficulty.startsWith("roped")) {
        medianGradeText = sportNumberToGrade(Math.round(medianGrade)); // Convert Median Grade to Text
    } else {
        medianGradeText = numberToGrade(Math.floor(medianGrade)); // Convert Median Grade to Text
    }

    // Update the Grades Object for toprope and lead grades into roped grades
    if (difficulty.startsWith("toprope") || difficulty.startsWith("lead")) {
        grades.ropedOnsight = medianGradeText; // Assuming we want to write to ropedOnsight for Onsight and Flash
        grades.ropedRedpoint = medianGradeText; // Assuming we want to write to ropedRedpoint for Project and Redpoint
    } else {
        grades[difficulty] = medianGradeText;
    }

    saveToStorage("grades", grades); // Save Grades Object to Local Storage
    updateElementText(difficulty.replace("toprope", "roped").replace("lead", "roped"), medianGradeText); // Update UI with New Median Grade
    saveToStorage("grades", grades); // Save Grades Object to Local Storage
}

// Modified `handleLogSubmit` to properly map difficulty
function handleLogSubmit(event) {
    event.preventDefault();

    const typeSelect = document.getElementById("type");
    const gradeInput = document.getElementById("grade");
    const difficultySelect = document.getElementById("difficulty");

    const type = typeSelect.value;
    const grade = gradeInput.value.trim();
    const difficulty = difficultySelect.value;

    if (!type || !grade || !difficulty) {
        alert("Please complete all fields.");
        return;
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
    // Update training data separately by actual type
    if (trainingData[type] !== undefined) {
        trainingData[type]++;
        saveToStorage("trainingData", trainingData);
    }

    // Clear form fields
    typeSelect.value = "";
    gradeInput.value = "";
    difficultySelect.value = "";
}


/* Public Popup Control Functions */
function openStreaks(state) {
    togglePopup("streaksPopup", state);
}
openStreaks("close");

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
    var buttons = document.querySelectorAll('#optionsContainer button');
    var maxHeight = 0;

    /* Loop Through Each Button To Find The Maximum Height */
    buttons.forEach(function (button) {
        var buttonHeight = button.offsetHeight; //Get the Height of Each Button
        if (buttonHeight > maxHeight) maxHeight = buttonHeight; //Update maxHeight if Current Button is Taller
    });

    /* Set All Buttons to the Maximum Height */
    buttons.forEach(function (button) {
        button.style.height = maxHeight + 'px'; //Set Each Button's Height to maxHeight
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
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
        localStorage.clear(); // Clear Local Storage
        alert("All data has been cleared.");
        location.reload(); // Reload Page to Reflect Changes
    }
}

let trainingChart; // Global Variable to Store Chart Instance

function updateTrainingChart() {
    
    const chartElement = document.getElementById("trainingDistributionChart");
    const noDataMessage = document.getElementById("noTrainingDataMessage");

    const dataValues = Object.values(trainingData); // Get Values from trainingData
    const allZero = dataValues.every(val => val === 0); // Check if all Values are Zero

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
            datasets: [{
                backgroundColor: ["#34A85399", "#F28C2899", "#4285f499", "#e8c3b9"],
                data: Object.values(trainingData),
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Training Type Distribution"
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {

    Object.entries(grades).forEach(([key, value]) => updateElementText(key, value)); //Update the UI with Loaded Grades

    /* Update Traits */
    Object.entries(traits).forEach(([key, value]) => {
        updateElementText(key, value); //Update the UI with Loaded Traits
        const el = document.getElementById(key); //Get the Element by ID
        if (el) {
            el.classList.remove("up", "down"); //Remove Previous Classes
            if (value > 0) el.classList.add("up"); //Add "up" Class if Value is Positive
            else if (value < 0) el.classList.add("down"); //Add "down" Class if Value is Negative
        }
    });
    const chartElement = document.getElementById("trainingDistributionChart");
    if (chartElement) {
        updateTrainingChart();
    }
});
