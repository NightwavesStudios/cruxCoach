console.log("scripts.js loaded");

/* Safe Storage Utilities */
function loadSafe(key, fallback = {}) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key));
        console.log(`Loaded key "${key}":`, parsed);
        return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (e) {
        console.warn(`Failed to load key "${key}" from localStorage. Using fallback.`);
        return fallback;
    }
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/* Default Data */
const defaultGrades = {
    Flash: "None",
    Project: "None",
    Onsight: "None",
    Redpoint: "None"
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

Object.keys(localStorage).forEach(key => {
    if (key.endsWith("Grades") && key !== "grades") {
        const type = key.replace("Grades", "");
        const data = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(data) && data.length) {
            const sorted = data.slice().sort((a, b) => a - b);
            const median = sorted.length % 2 === 0
                ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                : sorted[Math.floor(sorted.length / 2)];
            grades[type] = numberToGrade(Math.round(median));
        }
    }
});
Object.entries(grades).forEach(([key, value]) => updateElementText(key, value));

/* Utilities */
function updateElementText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = value;
        console.log(`Updated #${id} to "${value}". Current innerHTML: ${el.innerHTML}`);
    } else {
        console.error(`Element with id "${id}" not found.`);
    }
}

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

    return gradeMap[grade] !== undefined ? gradeMap[grade] : NaN;
}

function numberToGrade(number) {
    const gradeMap = {
        0: "VB",
        0: "V0",
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

    return gradeMap[number] !== undefined ? gradeMap[number] : "None";
}

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
    console.log(`Popup "${id}" toggled to "${isOpening ? "open" : "closed"}"`);
}

function toggleInfoPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (!popup) {
        console.error(`Popup with id "${popupId}" not found.`);
        return;
    }

    popup.style.display = popup.style.display === "block" ? "none" : "block";
}

function safeLazyLoad() {
    if (typeof lazyload === "function") {
        lazyload();
        console.log("Lazyload initialized.");
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
    console.log("DOMContentLoaded event triggered");

    // Update grades
    Object.entries(grades).forEach(([key, value]) => updateElementText(key, value));

    // Update trait values
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
    console.log(Object.values(trainingData));

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
                            label: (ctx) => `${ctx.label}: ${ctx.raw > 0 ? '+' : ''}${ctx.raw}`
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
function updateAverageGrade(difficulty, grade) {
    const logKey = `${difficulty}Grades`; // Combine difficulty as the key
    const logArrayJSON = localStorage.getItem(logKey);
    let logArray = [];

    try {
        logArray = JSON.parse(logArrayJSON) || [];
    } catch (e) {
        console.warn(`Corrupted data in localStorage for ${logKey}. Resetting.`);
        logArray = [];
    }

    // Validate and add the new grade entry
    const newGrade = gradeToNumber(grade);
    if (isNaN(newGrade)) {
        console.error(`Invalid grade: ${grade}`);
        return;
    }

    // Add the new grade to the array
    logArray.push(newGrade);

    // Keep only the last 10 grades
    if (logArray.length > 10) {
        logArray.shift(); // Remove the oldest grade
    }

    // Save the updated log array back to localStorage
    localStorage.setItem(logKey, JSON.stringify(logArray));

    // Calculate the median grade
    const sortedGrades = logArray.slice().sort((a, b) => a - b); // Sort grades in ascending order
    let medianGrade;

    if (sortedGrades.length % 2 === 0) {
        // Even number of grades: average the two middle values
        const mid1 = sortedGrades[sortedGrades.length / 2 - 1];
        const mid2 = sortedGrades[sortedGrades.length / 2];
        medianGrade = (mid1 + mid2) / 2;
    } else {
        // Odd number of grades: take the middle value
        medianGrade = sortedGrades[Math.floor(sortedGrades.length / 2)];
    }

    const medianGradeText = numberToGrade(Math.round(medianGrade)); // Convert the median to a grade
    grades[difficulty] = medianGradeText; // Update the grades object with the new median

    // Save the updated grades object to localStorage
    saveToStorage("grades", grades);

    // Update the UI with the new median
    updateElementText(difficulty, medianGradeText);
    saveToStorage("grades", grades);
    console.log(`Updated median grade for ${difficulty}: ${medianGradeText}`);
}

function handleJournalSubmit(event) {
    event.preventDefault();

    const traitMap = {
        crimp: "Crimp",
        sloper: "Sloper",
        pocket: "Pocket",
        sidepull: "Sidepull",
        undercling: "Undercling",
        slab: "Slab",
        slightOverhang: "Slightoverhang",
        overhang: "Overhang",
        cave: "Cave",
        bigMove: "Bigmove",
        meticulous: "Meticulous",
        powerful: "Powerful",
        routeReading: "Routereading"
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

/* Form Submission Actions */
function updateAverageGrade(difficulty, grade) {
    const logKey = `${difficulty}Grades`; // Combine difficulty as the key
    const logArrayJSON = localStorage.getItem(logKey);
    let logArray = [];

    try {
        logArray = JSON.parse(logArrayJSON) || [];
    } catch (e) {
        console.warn(`Corrupted data in localStorage for ${logKey}. Resetting.`);
        logArray = [];
    }

    // Validate and add the new grade entry
    const newGrade = gradeToNumber(grade);
    if (isNaN(newGrade)) {
        console.error(`Invalid grade: ${grade}`);
        return;
    }

    // Add the new grade to the array
    logArray.push(newGrade);

    // Keep only the last 10 grades
    if (logArray.length > 10) {
        logArray.shift(); // Remove the oldest grade
    }

    // Save the updated log array back to localStorage
    localStorage.setItem(logKey, JSON.stringify(logArray));

    // Calculate the median grade
    const sortedGrades = logArray.slice().sort((a, b) => a - b); // Sort grades in ascending order
    let medianGrade;

    if (sortedGrades.length % 2 === 0) {
        // Even number of grades: average the two middle values
        const mid1 = sortedGrades[sortedGrades.length / 2 - 1];
        const mid2 = sortedGrades[sortedGrades.length / 2];
        medianGrade = (mid1 + mid2) / 2;
    } else {
        // Odd number of grades: take the middle value
        medianGrade = sortedGrades[Math.floor(sortedGrades.length / 2)];
    }

    const medianGradeText = numberToGrade(Math.round(medianGrade)); // Convert the median to a grade
    grades[`${difficulty}`] = medianGradeText; // Update the grades object with the new median
    updateElementText(`${difficulty}`, medianGradeText); // Update the UI with the new median

    console.log(`Updated median grade for ${difficulty}: ${medianGradeText}`);
}

function handleLogSubmit(event) {
    event.preventDefault();

    const difficulty = document.getElementById("difficulty").value.toLowerCase(); // Get difficulty (e.g., "flash")
    const grade = document.getElementById("grade").value; // Get the grade (e.g., "V4")
    let type = document.getElementById("type").value.toLowerCase();
    const isRoped = (type === "lead" || type === "toprope");
    const typeKey = isRoped ? "roped" : type;  // for grades/traits

    // Combine type and difficulty to create a unique key (e.g., "boulderingFlash")
    const key = `${type}${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;

    // Make sure grade and difficulty are valid before calling the function
    if (grade && difficulty && type) {
        updateAverageGrade(key, grade);
    }

    // Update training data
    if (trainingData.hasOwnProperty(type)) {
        trainingData[type]++;
    } else {
        trainingData[type] = 1;
    }

    saveToStorage("trainingData", trainingData);
    updateTrainingChart();
    

    togglePopup("logPopup", "close");

    // Reset the form
    event.target.reset();
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
        window.history.back();
    }
}

/* Flesh Options Container JS */
window.onload = window.onresize = function () {
    var buttons = document.querySelectorAll('#optionsContainer button');
    var maxHeight = 0;

    buttons.forEach(function (button) {
        var buttonHeight = button.offsetHeight;
        if (buttonHeight > maxHeight) maxHeight = buttonHeight;
    });

    buttons.forEach(function (button) {
        button.style.height = maxHeight + 'px';
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
        localStorage.clear(); // Clear all local storage
        alert("All data has been cleared.");
        location.reload(); // Reload the page to reflect changes
    }
}

let trainingChart; // Global variable to store the chart instance

function updateTrainingChart() {
    
    const chartElement = document.getElementById("trainingDistributionChart");
    const noDataMessage = document.getElementById("noTrainingDataMessage");

    const dataValues = Object.values(trainingData);
    const allZero = dataValues.every(val => val === 0);

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

    // Initialize a new chart instance
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
    console.log("DOMContentLoaded event triggered");

    // Update grades
    Object.entries(grades).forEach(([key, value]) => updateElementText(key, value));

    // Update trait values
    Object.entries(traits).forEach(([key, value]) => {
        updateElementText(key, value);
        const el = document.getElementById(key);
        if (el) {
            el.classList.remove("up", "down");
            if (value > 0) el.classList.add("up");
            else if (value < 0) el.classList.add("down");
        }
    });

    // Update training chart
    const chartElement = document.getElementById("trainingDistributionChart");
    if (chartElement) {
        updateTrainingChart();
    }
});