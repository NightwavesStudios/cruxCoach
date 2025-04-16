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
    var gradeElements = ["flash", "project", "on-sight", "redpoint"];
    var gradeValues = [flash, project, onsight, redpoint];
    for (let i = 0; i < gradeElements.length; i++) {
        document.getElementById(gradeElements[i]).innerHTML = gradeValues[i];
    }

    var struggleStrongElements = ["crimp", "sloper", "pocket", "sidepull", "undercling", "bigmove", "meticulous", "powerful", "routereading", "slab", "slightoverhang", "overhang", "cave"];
    var struggleStrongValues = [crimp, sloper, pocket, sidepull, undercling, bigmove, meticulous, powerful, routereading, slab, slightoverhang, overhang, cave];

    for (let i = 0; i < struggleStrongElements.length; i++) {
        document.getElementById(struggleStrongElements[i]).innerHTML = struggleStrongValues[i];
    }

    /* Training Distribution Chart */
    new Chart("trainingDistributionChart", {
        type: "pie",
        data: {
            labels: ["Bouldering", "Top Rope", "Lead", "Other"],
            datasets: [{
                backgroundColor: [
                    "#34A85399",
                    "#F28C2899",
                    "#4285f499",
                    "#e8c3b9"],
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

    /* Popups */
    let open = false;
    const streaksButton = document.querySelector(".mode");
    console.log("Streaks button:", streaksButton);

    if (streaksButton) {
        streaksButton.addEventListener("click", function () {
            console.log("Streaks button clicked");
            if (open === false) {
                openStreaks();
                open = true;
                console.log("Popup opened");
            } else if (open === true) {
                openStreaks("close");
                open = false;
                console.log("Popup closed");
            }
        });
    } else {
        console.error("Streaks button not found in the DOM.");
    }

    const exitButton = document.querySelector(".streaks-header .exit");
    console.log("Exit button:", exitButton);

    if (exitButton) {
        exitButton.addEventListener("click", function () {
            console.log("Exit button clicked");
            openStreaks("close");
            open = false;
            console.log("Popup closed via exit button");
        });
    } else {
        console.error("Exit button not found in the DOM.");
    }
});

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOMContentLoaded event triggered");

    // Attach event listener to the streaks button
    const streaksButton = document.querySelector(".mode");
    console.log("Streaks button:", streaksButton);

    if (streaksButton) {
        streaksButton.addEventListener("click", function () {
            console.log("Streaks button clicked");
            if (open === false) {
                openStreaks();
                open = true;
                console.log("Popup opened");
            } else if (open === true) {
                openStreaks("close");
                open = false;
                console.log("Popup closed");
            }
        });
    } else {
        console.error("Streaks button not found in the DOM.");
    }

    // Attach event listener to the .exit button
    const exitButton = document.querySelector(".streaks-header .exit");
    console.log("Exit button:", exitButton);

    if (exitButton) {
        exitButton.addEventListener("click", function () {
            console.log("Exit button clicked");
            openStreaks("close");
            open = false;
            console.log("Popup closed via exit button");
        });
    } else {
        console.error("Exit button not found in the DOM.");
    }
});

function openStreaks(state) {
    const streaksPopup = document.getElementById("streaksPopup");
    if (state !== "close") {
        document.body.style.overflow = "hidden";
        streaksPopup.style.display = "block";
        streaksPopup.style.overflowY = "auto";
        console.log("openStreaks");
    } else {
        document.body.style.overflow = "";
        streaksPopup.style.display = "none";
        console.log("closeStreaks");
    }
}
openStreaks("close");

function openJournal(state) {
    if (state != "close") {
        document.body.style.overflow = "hidden";
        document.getElementById("journalPopup").style.display = "block";
        console.log("openJournal");
    } else {
        document.getElementById("journalPopup").style.display = "none";
        console.log("closeJournal");
    }
}

function openLog(state) {
    if (state != "close") {
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
    var scrollElements = document.querySelectorAll('.scroll-element');
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

/* Initialize Lazy Load */
document.addEventListener("DOMContentLoaded", function () {
    lazyload();
});