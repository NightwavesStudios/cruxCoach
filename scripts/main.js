console.log("scripts.js loaded");

/* Safe Storage Utilities */
function loadSafe(key, fallback = {}) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key));
        return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (e) {
        return fallback;
    }
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/* Default Data */
const defaultGrades = {
    Flash: "V4",
    Project: "V5",
    Onsight: "5.10",
    Redpoint: "5.10+"
};

const defaultTrainingData = {
    bouldering: 47,
    toprope: 10,
    lead: 53,
    other: 4,
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
        new Chart(chartElement, {
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

    // Mutation Observer
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            console.log(`Mutation detected: ${mutation.target.innerHTML}`);
        });
    });

    Object.keys(traits).forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            observer.observe(element, { childList: true });
        }
    });
});

/* Form Submission Actions */
function handleJournalSubmit(event) {
    event.preventDefault();

    const traitKeys = [
        "crimp", "sloper", "pocket", "sidepull", "undercling",
        "slab", "slightOverhang", "overhang", "cave",
        "bigMove", "meticulous", "powerful", "routeReading"
    ];

    traitKeys.forEach((id) => {
        const input = document.getElementById(id);
        const val = parseInt(input.value, 10) || 0;

        const key = id.charAt(0).toUpperCase() + id.slice(1); // Capitalize to match `traits` keys
        if (traits.hasOwnProperty(key)) {
    traits[key] = Math.max(-10, Math.min(10, traits[key] + val));
} else {
    traits[key] = Math.max(-10, Math.min(10, val));
}
    });

    saveToStorage("traits", traits);
    location.reload(); // or call a chart update function instead
}

function handleLogSubmit(event) {
    event.preventDefault();

    const type = document.getElementById("type").value;
    const grade = document.getElementById("grade").value;
    const difficulty = document.getElementById("difficulty").value;

    // Update median grade
    grades[difficulty] = grade;

    // Count session type
    if (trainingData.hasOwnProperty(type)) {
        trainingData[type]++;
    } else {
        trainingData[type] = 1;
    }

    // Save to localStorage
    saveToStorage("grades", grades);
    saveToStorage("trainingData", trainingData);

    // Update the DOM elements without refreshing the page
    updateElementText(difficulty, grade);  // Update the displayed grade for difficulty
    updateElementText(type, trainingData[type]);  // Update the displayed session count for the type

    // Specific logic to handle difficulty and climbing type relationships
    if (type === "bouldering") {
        if (difficulty === "flash") {
            updateElementText("Flash", grade);  // Update Flash with median grade
        } else if (difficulty === "project") {
            updateElementText("Project", grade);  // Update Project with median grade
        }
    } else if (type === "top rope" || type === "lead") {
        if (difficulty === "flash") {
            updateElementText("Onsight", grade);  // Update Onsight with median grade for rope climbing
        } else if (difficulty === "project") {
            updateElementText("Redpoint", grade);  // Update Redpoint with median grade for rope climbing
        }
    }

    // Optionally, close the popup if needed
    togglePopup("logPopup", "close");
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