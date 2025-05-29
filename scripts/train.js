document.addEventListener("DOMContentLoaded", async () => {
  const suggestedArticlesContainer =
    document.getElementById("suggestedArticles");
  const suggestedWorkoutsContainer =
    document.getElementById("suggestedWorkouts");

  console.log("Initializing Suggested Collections, Articles, and Workouts...");

  const defaultTraits = {
    Crimp: 0,
    Sloper: 0,
    Pocket: 0,
    Sidepull: 0,
    Undercling: 0,
    Pinch: 0,
    Bigmove: 0,
    Meticulous: 0,
    Powerful: 0,
    Routereading: 0,
    Endurance: 0,
    Slab: 0,
    Slightoverhang: 0,
    Overhang: 0,
    Cave: 0,
  };
  const traits = loadSafe("traits", defaultTraits);

  // Replace mocked user data with real data from localStorage
  const trainingData = loadSafe("trainingData", {
    lead: 0,
    bouldering: 0,
    toprope: 0,
  });

  const grades = loadSafe("grades", {
    boulderingProject: "None",
    ropedRedpoint: "None",
    boulderingFlash: "None",
    ropedOnsight: "None",
  });

  // Heuristic functions
  function getClimbingProfile(trainingData, grades) {
    let primaryDiscipline = "bouldering";
    if (
      trainingData.lead > trainingData.bouldering &&
      trainingData.lead > trainingData.toprope
    ) {
      primaryDiscipline = "lead";
    } else if (trainingData.toprope > trainingData.bouldering) {
      primaryDiscipline = "toprope";
    }

    let skillLevel = "beginner";
    if (
      grades.boulderingProject !== "None" ||
      grades.ropedRedpoint !== "None"
    ) {
      skillLevel = "intermediate";
    }
    if (grades.boulderingFlash === "V8" || grades.ropedOnsight === "5.12") {
      skillLevel = "advanced";
    }

    return { primaryDiscipline, skillLevel };
  }

  const traitWeights = {
    bouldering: {
      Crimp: 2,
      Sloper: 2,
      Bigmove: 3,
      Powerful: 3,
      Endurance: 1,
      Routereading: 1,
    },
    lead: {
      Endurance: 3,
      Routereading: 3,
      Meticulous: 2,
      Slightoverhang: 2,
      Overhang: 2,
    },
    toprope: {
      Endurance: 2,
      Slab: 2,
      Meticulous: 2,
    },
  };

  function getAdjustedTraits(traits, profile) {
    const weights = traitWeights[profile.primaryDiscipline] || {};
    const adjusted = {};
    for (const trait in traits) {
      const weight = weights[trait] || 1;
      adjusted[trait] = traits[trait] * weight;
    }
    return adjusted;
  }

  const profile = getClimbingProfile(trainingData, grades);
  console.log("User climbing profile:", profile);

  const adjustedTraits = getAdjustedTraits(traits, profile);
  const sortedAdjustedTraits = Object.entries(adjustedTraits).sort(
    ([, a], [, b]) => a - b
  );

  let numFocus = 4;
  if (profile.skillLevel === "intermediate") numFocus = 3;
  else if (profile.skillLevel === "advanced") numFocus = 2;

  const bottomFocusTraits = sortedAdjustedTraits
    .slice(0, numFocus)
    .map(([trait]) => trait);
  console.log("Focus traits (adjusted):", bottomFocusTraits);

  const SUGGESTION_CACHE_KEY = "cachedSuggestions";
  const shouldRegenerateSuggestions = () => {
    const cache = loadSafe(SUGGESTION_CACHE_KEY, null);
    if (!cache) return true;

    const oneHour = 60 * 60 * 1000;
    const now = Date.now();
    const isExpired = now - cache.timestamp > oneHour;
    const sameTraits =
      JSON.stringify(bottomFocusTraits.sort()) ===
      JSON.stringify(cache.bottom3.sort());
    return isExpired || !sameTraits;
  };

  const saveSuggestionCache = (suggestions, bottom3) => {
    const cache = {
      timestamp: Date.now(),
      bottom3,
      articles: suggestions.articles,
      workouts: suggestions.workouts,
    };
    localStorage.setItem(SUGGESTION_CACHE_KEY, JSON.stringify(cache));
  };

  try {
    const response = await fetch("/train/data/lessons.json");
    if (!response.ok)
      throw new Error(`Failed to fetch lessons.json: ${response.status}`);
    const lessons = await response.json();
    console.log("Fetched lessons:", lessons);

    const traitToTagMap = {
      Crimp: "crimp",
      Sloper: "sloper",
      Pocket: "pocket",
      Sidepull: "sidepull",
      Undercling: "undercling",
      Pinch: "pinch",
      Bigmove: "big-move",
      Meticulous: "meticulous",
      Powerful: "powerful",
      Routereading: "route-reading",
      Endurance: "endurance",
      Slab: "slab",
      Slightoverhang: "slight-overhang",
      Overhang: "overhang",
      Cave: "cave",
    };

    const filterLessons = (types, category) => {
      const mappedCategory = traitToTagMap[category] || category;
      const typeList = Array.isArray(types) ? types : [types];
      return lessons.filter(
        (lesson) =>
          typeList.includes(lesson.type.toLowerCase()) &&
          lesson.tags.some(
            (tag) => tag.toLowerCase() === mappedCategory.toLowerCase()
          )
      );
    };

    if (shouldRegenerateSuggestions()) {
      const filteredArticles = bottomFocusTraits.flatMap((trait) =>
        filterLessons(["article"], trait)
      );
      const filteredWorkouts = bottomFocusTraits.flatMap((trait) =>
        filterLessons(["workout"], trait)
      );

      saveSuggestionCache(
        { articles: filteredArticles, workouts: filteredWorkouts },
        bottomFocusTraits
      );

      console.log("Regenerated suggestions.");
    }

    const cache = loadSafe(SUGGESTION_CACHE_KEY, null);
    if (cache) {
      const traitToImageMap = {
        Crimp: "https://i.ibb.co/s90Yms7M/crimp-Cover.jpg",
        Sloper: "https://i.ibb.co/nSRY9tF/sloper-Cover.jpg",
        Pocket: "https://i.ibb.co/d4rJMYFm/pocket-Cover.jpg",
        Sidepull: "https://i.ibb.co/dCKZ9hZ/sidepull-Cover.jpg",
        Undercling: "https://i.ibb.co/53q55TK/Round-Undercling.jpg",
        Pinch:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcHe0OUpCfc4jyRbopTr5flXNU3B4cNOnjOAMtlljKedkEHSwEnhB8uqo&s",
        Bigmove:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcHe0OUpCfc4jyRbopTr5flXNU3B4cNOnjOAMtlljKedkEHSwEnhB8uqo&s",
        Meticulous: "https://i.ibb.co/xNpkgcG/meticulous-Footholds.jpg",
        Powerful:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcHe0OUpCfc4jyRbopTr5flXNU3B4cNOnjOAMtlljKedkEHSwEnhB8uqo&s",
        Routereading:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcHe0OUpCfc4jyRbopTr5flXNU3B4cNOnjOAMtlljKedkEHSwEnhB8uqo&s",
        Endurance:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcHe0OUpCfc4jyRbopTr5flXNU3B4cNOnjOAMtlljKedkEHSwEnhB8uqo&s",
        Slab: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcHe0OUpCfc4jyRbopTr5flXNU3B4cNOnjOAMtlljKedkEHSwEnhB8uqo&s",
        Slightoverhang:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcHe0OUpCfc4jyRbopTr5flXNU3B4cNOnjOAMtlljKedkEHSwEnhB8uqo&s",
        Overhang:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcHe0OUpCfc4jyRbopTr5flXNU3B4cNOnjOAMtlljKedkEHSwEnhB8uqo&s",
        Cave: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcHe0OUpCfc4jyRbopTr5flXNU3B4cNOnjOAMtlljKedkEHSwEnhB8uqo&s",
      };
      const suggestedCollectionsContainer = document.getElementById(
        "suggestedCollections"
      );

      bottomFocusTraits.forEach((category) => {
        const collectionCard = `
  <a href="/train/filter.html?tag=${
    traitToTagMap[category] || category.toLowerCase()
  }">
    <div class="collection-card">
      <img class="lazyload" src="${
        traitToImageMap[category] || "/assets/fallback.jpg"
      }" alt="${category} Collection Cover">
      <h4>${category}</h4>
    </div>
  </a>`;
        suggestedCollectionsContainer.innerHTML += collectionCard;
      });
      // Render Suggested Articles with full card layout
      suggestedArticlesContainer.innerHTML = cache.articles
        .map(
          (article) => `
    <a href="${article.url}">
      <div class="lesson-card">
        <img class="lazyload" src="${article.thumbnail}" alt="${article.title}">
        <h4>${article.title}</h4>
        <p><span class="type">${article.type}</span>, <span class="length">${article.length}</span></p>
      </div>
    </a>`
        )
        .join("");

      // Render Suggested Workouts with full card layout
      suggestedWorkoutsContainer.innerHTML = cache.workouts
        .map(
          (workout) => `
    <a href="${workout.url}">
      <div class="lesson-card">
        <img class="lazyload" src="${workout.thumbnail}" alt="${workout.title}">
        <h4>${workout.title}</h4>
        <p><span class="type">${workout.type}</span>, <span class="length">${workout.length}</span></p>
      </div>
    </a>`
        )
        .join("");

      document.querySelector(
        ".reason.collections"
      ).textContent = `Suggestions based on your ${
        profile.primaryDiscipline
      } profile and skill level (${
        profile.skillLevel
      }): ${bottomFocusTraits.join(", ")}`;
    }
    document.querySelector(
      ".reason.articles"
    ).textContent = `Suggestions based on your ${
      profile.primaryDiscipline
    } profile and skill level (${profile.skillLevel}): ${bottomFocusTraits.join(
      ", "
    )}`;
    document.querySelector(
      ".reason.workouts"
    ).textContent = `Suggestions based on your ${
      profile.primaryDiscipline
    } profile and skill level (${profile.skillLevel}): ${bottomFocusTraits.join(
      ", "
    )}`;
  } catch (err) {
    console.error("Error loading lessons:", err);
  }
});

/* Display Tip */
const tipsContainer = document.getElementById("tipsContainer");
const tipDisplay = document.getElementById("tipDisplay");

const tips = [
  "Only your last 10 logged grades are saved, keeping your data fresh and recent!",
  "It can take up to 5-10 journals for your data to fully reflect your climbing style and skills.",
  "The more you log, the more accurate your data becomes!",
  "You can download your data on the profile page as a backup, and upload it later as a backup or onto a different device!",
  "You can use the 'Clear Data' button on the profile page to reset your data if you want to start fresh. Do this with caution!",
  "The train page is a place to learn through articles and videos, and practice through exercises!",
  "If you just want to explore all the content, click the 'view all' button on the train page!",
  "To sort the content, click a collection to view articles, videos, and exercises specific to that collection!",
  "View the Holds Breakdown Chart to see your strengths and weaknesses in different climbing holds.",
  "View the Style Breakdown Chart to see your strengths and weaknesses in different climbing styles.",
  "The Training Distribution Chart shows where you spend most of your climbing time.",
  "The Train Page will recommend content based on your struggle traits and current grade.",
  "You can update your username and email through the Profile Page's customization form.",
];

let previousIndex = -1;

function getNewTipIndex() {
  let index;
  do {
    index = Math.floor(Math.random() * tips.length);
  } while (index === previousIndex && tips.length > 1);
  previousIndex = index;
  return index;
}

let intervalId;

function startTipInterval() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  intervalId = setInterval(updateTip, 5000);
}

let firstLoad = true;

function updateTip() {
  if (firstLoad) {
    tipDisplay.innerHTML = `<b>Tip:</b> ${tips[getNewTipIndex()]}`;
    firstLoad = false;
    tipDisplay.classList.add("fade-in");
    return;
  }

  tipDisplay.classList.remove("fade-in");
  tipDisplay.classList.add("fade-out");

  setTimeout(() => {
    tipDisplay.innerHTML = `<b>Tip:</b> ${tips[getNewTipIndex()]}`;
    tipDisplay.classList.remove("fade-out");
    tipDisplay.classList.add("fade-in");
  }, 500);

  startTipInterval();
}

window.addEventListener("load", () => {
  updateTip();
  startTipInterval();
});
