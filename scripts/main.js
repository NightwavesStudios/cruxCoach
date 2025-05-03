console.log("scripts.js loaded");

/* Data Variables (Placeholder) */
const grades = {
    Flash: "V4",
    Project: "V5",
    Onsight: "5.10",
    Redpoint: "5.10+",
};

const trainingData = {
    bouldering: 47,
    toprope: 10,
    lead: 53,
    other: 4,
};

const traits = {
    Crimp: -5,
    Sloper: 2,
    Pocket: 1,
    Sidepull: 6,
    Undercling: 0,
    Bigmove: 10,
    Meticulous: -2,
    Powerful: 0,
    Routereading: -7,
    Slab: -3,
    Slightoverhang: 2,
    Overhang: 5,
    Cave: -1,
};

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

        const el = document.getElementById(key);
        if (el) {
            el.classList.remove("up", "down");
        if (value > 0) {
            el.classList.add("up");
        } else if (value < 0) {
            el.classList.add("down");
        } else {}
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
        console.log("Training distribution chart initialized.");
    } else {
        console.error('Canvas element "trainingDistributionChart" not found.');
    }

    //Holds Breakdown Chart
    const holdsChartElement = document.getElementById("holdsBreakdownChart");
    if (holdsChartElement) {
        const maxAbs = Math.max(...Object.values(holdsTraits).map(Math.abs), 1);

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
        indexAxis: 'y', // ← replaces horizontalBar
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const value = ctx.raw;
                        return `${ctx.label}: ${value > 0 ? '+' : ''}${value}`;
                    }
                }
            }
        },
        scales: {
            x: {
                min: -10,
                max: 10,
                ticks: {
                    callback: (value) => `${value > 0 ? '+' : ''}${value}`
                },
                title: {
                    display: true,
                    text: 'Weak ←→ Strong'
                }
            },
            y: {
                beginAtZero: true
            }
        }
    }
});

    }

    //Style Breakdown Chart
    const styleChartElement = document.getElementById("styleBreakdownChart");
    if (styleChartElement) {
        const maxAbs = Math.max(...Object.values(styleTraits).map(Math.abs), 1);

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
            pointRadius: 3,
            pointHoverRadius: 5,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: false,
                text: "Style Trait Radar",
                font: {
                    size: 16
                }
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const label = ctx.label;
                        const value = ctx.raw;
                        return `${label}: ${value > 0 ? '+' : ''}${value}`;
                    }
                }
            }
        },
        scales: {
            r: {
                min: -5,
                max: 10,
                beginAtZero: true,
                ticks: {
                    stepSize: 5,
                    display: false
                },
                pointLabels: {
                    font: {
                        size: 12
                    },
                    color: "#333"
                },
                grid: {
                    circular: true,
                    color: "rgba(0,0,0,0.25)"
                },
                angleLines: {
                    display: false
                }
            }
        },
        layout: {
            padding: {
                top: 0,
                bottom: 0
            }
        }
    }
});



        console.log("Style breakdown chart initialized.");
    } else {
        console.error('Canvas element "styleBreakdownChart" not found.');
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

/* Flesh Options Container JS */
window.onload = window.onresize = function() {
    var buttons = document.querySelectorAll('#optionsContainer button');
    var maxHeight = 0;

    // Find the tallest button
    buttons.forEach(function(button) {
        var buttonHeight = button.offsetHeight;
        if (buttonHeight > maxHeight) {
            maxHeight = buttonHeight;
        }
    });

    // Set all buttons to the height of the tallest button
    buttons.forEach(function(button) {
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
