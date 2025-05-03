console.log("scripts.js loaded");

/* Data Variables (Placeholder) */
const grades = {
    Flash: "V4",
    Project: "V5",
    Onsight: "5.10",
    Redpoint: "5.10+",
};

const trainingData = {
    bouldering: 32,
    toprope: 20,
    lead: 44,
    other: 4,
};

const traits = {
    Crimp: 2,
    Sloper: -5,
    Pocket: -1,
    Sidepull: 1,
    Undercling: 3,
    Bigmove: 5,
    Meticulous: -1,
    Powerful: 2,
    Routereading: 3,
    Slab: -5,
    Slightoverhang: -2,
    Overhang: 10,
    Cave: 0,
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
        console.log(`Updating element with id "${key}" to value "${value}"`);
        updateElementText(key, value);
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
    } else {
        return;
    }
}

/* Smooth Scroll */
function smoothScroll(y) {
    window.scroll({
        top: y,
        behavior: "smooth",
    });
}
