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
document.getElementById("flash").innerHTML = flash;
document.getElementById("project").innerHTML = project;
document.getElementById("on-sight").innerHTML = onsight;
document.getElementById("redpoint").innerHTML = redpoint;

document.getElementById("crimp").innerHTML = crimp;
document.getElementById("sloper").innerHTML = sloper;
document.getElementById("pocket").innerHTML = pocket;
document.getElementById("sidepull").innerHTML = sidepull;
document.getElementById("undercling").innerHTML = undercling;
document.getElementById("bigmove").innerHTML = bigmove;
document.getElementById("meticulous").innerHTML = meticulous;
document.getElementById("powerful").innerHTML = powerful;
document.getElementById("routereading").innerHTML = routereading;
document.getElementById("slab").innerHTML = slab;
document.getElementById("slightoverhang").innerHTML = slightoverhang;
document.getElementById("overhang").innerHTML = overhang;
document.getElementById("cave").innerHTML = cave;


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