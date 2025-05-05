/**
 * Manages climbing data, local storage, and UI updates.
 */

// --- Local Storage ---
function loadSafe(key, fallback = {}) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.warn(`Failed to load ${key} from localStorage. Using fallback.`);
        return fallback;
    }
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// --- Default Data ---
const defaultGrades = { Flash: "None", Project: "None", Onsight: "None", Redpoint: "None" };
const defaultTrainingData = { bouldering: 0, toprope: 0, lead: 0, other: 0 };
const defaultTraits = {
    Crimp: 0, Sloper: 0, Pocket: 0, Sidepull: 0, Undercling: 0,
    Bigmove: 0, Meticulous: 0, Powerful: 0, Routereading: 0,
    Slab: 0, Slightoverhang: 0, Overhang: 0, Cave: 0
};

// --- Load Initial Data ---
const grades = loadSafe("grades", defaultGrades);
const trainingData = loadSafe("trainingData", defaultTrainingData);
const traits = loadSafe("traits", defaultTraits);

// --- Derived Data ---
const styleTraits = { Bigmove: traits.Bigmove, Meticulous: traits.Meticulous, Powerful: traits.Powerful, Routereading: traits.Routereading };
const holdsTraits = { Crimp: traits.Crimp, Sloper: traits.Sloper, Pocket: traits.Pocket, Sidepull: traits.Sidepull, Undercling: traits.Undercling };

// --- Grade Conversion ---
const GRADE_TO_NUMBER = {
    "VB": 0, "V0": 0, "V1": 1, "V2": 2, "V3": 3, "V4": 4, "V5": 5,
    "V6": 6, "V7": 7, "V8": 8, "V9": 9, "V10": 10, "V11": 11,
    "V12": 12, "V13": 13, "V14": 14, "V15": 15, "V16": 16, "V17": 17
};
const NUMBER_TO_GRADE = {
    0: "VB", 1: "V1", 2: "V2", 3: "V3", 4: "V4", 5: "V5", 6: "V6",
    7: "V7", 8: "V8", 9: "V9", 10: "V10", 11: "V11", 12: "V12",
    13: "V13", 14: "V14", 15: "V15", 16: "V16", 17: "V17"
};

const gradeToNumber = grade => GRADE_TO_NUMBER[grade] !== undefined ? GRADE_TO_NUMBER[grade] : NaN;
const numberToGrade = number => NUMBER_TO_GRADE[number] !== undefined ? NUMBER_TO_GRADE[number] : "None";

// --- DOM Manipulation ---
const updateElementText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
    else console.error(`Element with id "${id}" not found.`);
};

const bindClick = (selector, handler) => {
    const el = document.querySelector(selector);
    if (el) el.addEventListener("click", handler);
    else console.error(`Element "${selector}" not found.`);
};

const togglePopup = (id, state = "open") => {
    const popup = document.getElementById(id);
    if (!popup) {
        console.error(`Popup "${id}" not found.`);
        return;
    }
    const shouldOpen = state !== "close";
    popup.style.display = shouldOpen ? "block" : "none";
    popup.style.overflowY = shouldOpen ? "auto" : "";
    document.body.style.overflow = shouldOpen ? "hidden" : "";
};

const toggleInfoPopup = popupId => {
    const popup = document.getElementById(popupId);
    if (!popup) {
        console.error(`Popup with id "${popupId}" not found.`);
        return;
    }
    popup.style.display = popup.style.display === "block" ? "none" : "block";
};

// --- Utilities ---
const safeLazyLoad = () => typeof lazyload === "function" ? lazyload() : console.warn("Lazyload function not found.");

const checkScroll = () => {
    document.querySelectorAll('.scroll-element').forEach(el => {
        el.classList.toggle('scrolled', el.getBoundingClientRect().top < window.innerHeight);
    });
};

const smoothScroll = y => window.scroll({ top: y, behavior: "smooth" });

const clearData = () => {
    if (confirm("Clear all data? This cannot be undone.")) {
        localStorage.clear();
        alert("Data cleared.");
        location.reload();
    }
};

// --- Data Updating ---
const updateAverageGrade = (difficulty, grade) => {
    const logKey = `${difficulty}Grades`;
    let logArray = loadSafe(logKey, []);
    const newGradeNumber = gradeToNumber(grade);
    if (isNaN(newGradeNumber)) {
        console.error(`Invalid grade: ${grade}`);
        return;
    }
    logArray.push(newGradeNumber);
    if (logArray.length > 10) logArray.shift();
    saveToStorage(logKey, logArray);
    const sortedGrades = [...logArray].sort((a, b) => a - b);
    const mid = Math.floor(sortedGrades.length / 2);
    const medianGrade = sortedGrades.length % 2 === 0 ? (sortedGrades[mid - 1] + sortedGrades[mid]) / 2 : sortedGrades[mid];
    const medianGradeText = numberToGrade(Math.round(medianGrade));
    grades[difficulty] = medianGradeText;
    saveToStorage("grades", grades);
    updateElementText(difficulty, medianGradeText);
};

const handleJournalSubmit = event => {
    event.preventDefault();
    const traitMap = {
        crimp: "Crimp", sloper: "Sloper", pocket: "Pocket", sidepull: "Sidepull",
        undercling: "Undercling", slab: "Slab", slightOverhang: "Slightoverhang",
        overhang: "Overhang", cave: "Cave", bigMove: "Bigmove", meticulous: "Meticulous",
        powerful: "Powerful", routeReading: "Routereading"
    };
    Object.entries(traitMap).forEach(([inputId, traitKey]) => {
        const inputElement = document.getElementById(inputId);
        const inputValue = parseInt(inputElement?.value, 10) || 0;
        if (traits.hasOwnProperty(traitKey) && inputValue !== 0) {
            traits[traitKey] = Math.max(-10, Math.min(10, (traits[traitKey] || 0) + inputValue));
        }
    });
    saveToStorage("traits", traits);
    event.target.reset();
    location.reload();
};

const handleLogSubmit = event => {
    event.preventDefault();
    const difficulty = document.getElementById("difficulty").value.toLowerCase();
    const grade = document.getElementById("grade").value;
    const type = document.getElementById("type").value.toLowerCase();
    const storageKey = `${(type === "lead" || type === "toprope") ? "roped" : type}${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
    if (grade && difficulty && type) updateAverageGrade(storageKey, grade);
    trainingData[type] = (trainingData[type] || 0) + 1;
    saveToStorage("trainingData", trainingData);
    updateTrainingChart();
    togglePopup("logPopup", "close");
    event.target.reset();
};

// --- Chart Management ---
let trainingChart;

const updateTrainingChart = () => {
    const chartElement = document.getElementById("trainingDistributionChart");
    const noDataMessage = document.getElementById("noTrainingDataMessage");
    const hasData = Object.values(trainingData).some(val => val > 0);
    if (!chartElement) return;
    chartElement.style.display = hasData ? "block" : "none";
    noDataMessage.style.display = hasData ? "none" : "block";
    if (!hasData) return;
    if (trainingChart) trainingChart.destroy();
    trainingChart = new Chart(chartElement, {
        type: "pie",
        data: {
            labels: Object.keys(trainingData),
            datasets: [{
                backgroundColor: ["#34A85399", "#F28C2899", "#4285f499", "#e8c3b9"],
                data: Object.values(trainingData),
            }]
        },
        options: { responsive: true, plugins: { title: { display: true, text: "Training Distribution" }, legend: { position: 'bottom' } } }
    });
};

// --- Public Functions ---
const openStreaks = state => togglePopup("streaksPopup", state);
const openJournal = state => togglePopup("journalPopup", state);
const openLog = state => togglePopup("logPopup", state);
const openCoach = () => alert("Feature not available.");
openStreaks("close");

const previousPage = () => window.history.length > 1 && window.history.back();

// --- Responsive Options Container ---
window.onload = window.onresize = () => {
    const buttons = document.querySelectorAll('#optionsContainer button');
    let maxHeight = 0;
    buttons.forEach(button => maxHeight = Math.max(maxHeight, button.offsetHeight));
    buttons.forEach(button => button.style.height = maxHeight + 'px');
};

// --- Initialization ---
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
    const chartElement = document.getElementById("trainingDistributionChart");
    if (chartElement) updateTrainingChart();

    const initChart = (elementId, chartConfig) => {
        const el = document.getElementById(elementId);
        if (el) new Chart(el, chartConfig);
    };

    initChart("holdsBreakdownChart", {
        type: "bar",
        data: { labels: Object.keys(holdsTraits), datasets: [{ label: "Trait Strength", data: Object.values(holdsTraits), backgroundColor: Object.values(holdsTraits).map(val => val > 0 ? "#34A853cc" : val < 0 ? "#EA4335cc" : "#999999cc") }] },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw > 0 ? '+' : ''}${ctx.raw}` } } },
            scales: { x: { min: -10, max: 10, ticks: { callback: value => `${value > 0 ? '+' : ''}${value}` }, title: { display: true, text: 'Weak ←→ Strong' } }, y: { beginAtZero: true } } }
    });

    initChart("styleBreakdownChart", {
        type: "radar",
        data: { labels: Object.keys(styleTraits), datasets: [{ label: "Style Traits", data: Object.values(styleTraits), backgroundColor: "rgba(66, 133, 244, 0.2)", borderColor: "rgba(66, 133, 244, 0.8)", borderWidth: 2, pointBackgroundColor: "rgba(66, 133, 244, 1)" }] },
        options: { responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw > 0 ? '+' : ''}${ctx.raw}` } } },
            scales: { r: { min: -5, max: 10, ticks: { stepSize: 5, display: false }, pointLabels: { font: { size: 12 }, color: "#333" }, grid: { circular: true, color: "rgba(0,0,0,0.25)" }, angleLines: { display: false } } },
            layout: { padding: { top: 0, bottom: 0 } } }
    });

    bindClick(".mode", () => togglePopup("streaksPopup", "open"));
    bindClick(".streaks-header .exit", () => togglePopup("streaksPopup", "close"));
    safeLazyLoad();
    checkScroll();
    document.addEventListener("scroll", checkScroll);

    // Process stored grades on load
    Object.keys(localStorage).forEach(key => {
        if (key.endsWith("Grades") && key !== "grades") {
            const type = key.replace("Grades", "");
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (Array.isArray(data) && data.length) {
                    const sorted = [...data].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
                    grades[type] = numberToGrade(Math.round(median));
                }
            } catch (error) {
                console.warn(`Error processing stored grades for ${key}`, error);
            }
        }
    });
    Object.entries(grades).forEach(([key, value]) => updateElementText(key, value));
});