console.log("scripts.js loaded");

/* Data Variables (Placeholder) */
let flash = "V4";
let project = "V5";
let onsight = "5.10";
let redpoint = "5.10+";

let bouldering = 32;
let toprope = 20;
let lead = 44;
let other = 4;

let crimp = 2;
let sloper = -5;
let pocket = -1;
let sidepull = 1;
let undercling = 3;
let bigmove = 5;
let meticulous = -1;
let powerful = 2;
let routereading = 3;
let slab = -5;
let slightoverhang = -2;
let overhang = 10;
let cave = 0;

/* Write Data to HTML (Placeholder) */
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOMContentLoaded event triggered");

    const gradeElements = ["flash", "project", "on-sight", "redpoint"];
    const gradeValues = [flash, project, onsight, redpoint];
    for (let i = 0; i < gradeElements.length; i++) {
        const element = document.getElementById(gradeElements[i]);
        if (element) {
            element.innerHTML = gradeValues[i];
        } else {
            console.error(`Element with id "${gradeElements[i]}" not found in the DOM.`);
        }
    }

    const struggleStrongElements = ["crimp", "sloper", "pocket", "sidepull", "undercling", "bigmove", "meticulous", "powerful", "routereading", "slab", "slightoverhang", "overhang", "cave"];
    const struggleStrongValues = [crimp, sloper, pocket, sidepull, undercling, bigmove, meticulous, powerful, routereading, slab, slightoverhang, overhang, cave];
    for (let i = 0; i < struggleStrongElements.length; i++) {
        const element = document.getElementById(struggleStrongElements[i]);
        if (element) {
            element.innerHTML = struggleStrongValues[i];
        } else {
            console.error(`Element with id "${struggleStrongElements[i]}" not found in the DOM.`);
        }
    }

    // Training Distribution Chart
    const chartElement = document.getElementById("trainingDistributionChart");
    if (chartElement) {
        new Chart(chartElement, {
            type: "pie",
            data: {
                labels: ["Bouldering", "Top Rope", "Lead", "Other"],
                datasets: [{
                    backgroundColor: ["#34A85399", "#F28C2899", "#4285f499", "#e8c3b9"],
                    data: [bouldering, toprope, lead, other],
                }]
            },
            options: {
                title: {
                    display: true,
                    text: "Training Type Distribution",
                }
            }
        });
    } else {
        console.error('Canvas element with id "trainingDistributionChart" not found in the DOM.');
    }

    // Popups
    const streaksButton = document.querySelector(".mode");
    if (streaksButton) {
        streaksButton.addEventListener("click", function () {
            console.log("Streaks button clicked");
            openStreaks();
        });
    } else {
        console.error("Streaks button not found in the DOM.");
    }

    const exitButton = document.querySelector(".streaks-header .exit");
    if (exitButton) {
        exitButton.addEventListener("click", function () {
            console.log("Exit button clicked");
            openStreaks("close");
        });
    } else {
        console.error("Exit button not found in the DOM.");
    }

    // Initialize Lazy Load
    if (typeof lazyload === "function") {
        lazyload();
    } else {
        console.error("Lazyload function not found.");
    }
});

function handleStreaksButtonClick() {
    console.log("Streaks button clicked");
    openStreaks();
}

function handleExitButtonClick() {
    console.log("Exit button clicked");
    openStreaks("close");
}

function openStreaks(state) {
    const streaksPopup = document.getElementById("streaksPopup");
    if (streaksPopup) {
        if (state !== "close") {
            document.body.style.overflow = "hidden";
            streaksPopup.style.display = "block";
            streaksPopup.style.overflowY = "auto";
            console.log("Popup opened");
        } else {
            document.body.style.overflow = "";
            streaksPopup.style.display = "none";
            console.log("Popup closed");
        }
    } else {
        console.error("Streaks popup not found in the DOM.");
    }
}
openStreaks("close");

function openJournal(state) {
    if (state !== "close") {
        document.body.style.overflow = "hidden";
        document.getElementById("journalPopup").style.display = "block";
        console.log("openJournal");
    } else {
        document.getElementById("journalPopup").style.display = "none";
        console.log("closeJournal");
    }
}

function openLog(state) {
    if (state !== "close") {
        document.getElementById("logPopup").style.display = "block";
        console.log("openLog");
    } else {
        document.getElementById("logPopup").style.display = "none";
        console.log("closeLog");
    }
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

/* Scroll Animations */
function checkScroll() {
    const scrollElements = document.querySelectorAll('.scroll-element');
    for (let i = scrollElements.length; i--;) {
        if (scrollElements[i].getBoundingClientRect().top < window.innerHeight) {
            scrollElements[i].classList.add('scrolled');
        } else {
            scrollElements[i].classList.remove('scrolled');
        }
    }
}
checkScroll();
document.addEventListener('scroll', checkScroll);
