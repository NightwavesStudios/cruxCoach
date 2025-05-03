console.log("scripts.js loaded");

/* Data Variables (Placeholder) */
const grades = {
    flash: "V4",
    project: "V5",
    onsight: "5.10",
    redpoint: "5.10+",
};

const trainingData = {
    bouldering: 32,
    toprope: 20,
    lead: 44,
    other: 4,
};

const traits = {
    crimp: 2,
    sloper: -5,
    pocket: -1,
    sidepull: 1,
    undercling: 3,
    bigmove: 5,
    meticulous: -1,
    powerful: 2,
    routereading: 3,
    slab: -5,
    slightoverhang: -2,
    overhang: 10,
    cave: 0,
};

/* Utilities */
function updateElementText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = value;
        console.log(`Updated #${id} to "${value}"`);
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
    Object.entries(traits).forEach(([key, value]) => updateElementText(key, value));

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
                title: {
                    display: true,
                    text: "Training Type Distribution",
                }
            }
        });
        console.log("Training distribution chart initialized.");
    } else {
        console.error('Canvas element "trainingDistributionChart" not found.');
    }

    // Bind popup buttons
    bindClick(".mode", () => togglePopup("streaksPopup", "open"));
    bindClick(".streaks-header .exit", () => togglePopup("streaksPopup", "close"));

    // Lazyload
    safeLazyLoad();

    // Scroll animations
    checkScroll();
    document.addEventListener("scroll", checkScroll);
});

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

/* Smooth Scroll */
function smoothScroll(y) {
    window.scroll({
        top: y,
        behavior: "smooth",
    });
}
