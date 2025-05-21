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

  const SUGGESTION_CACHE_KEY = "cachedSuggestions";

  function shouldRegenerateSuggestions(currentBottom3) {
    const cache = loadSafe(SUGGESTION_CACHE_KEY, null);
    if (!cache) return true;

    const oneHour = 60 * 60 * 1000;
    const now = Date.now();
    const isExpired = now - cache.timestamp > oneHour;

    const sameTraits =
      JSON.stringify(currentBottom3.sort()) ===
      JSON.stringify(cache.bottom3.sort());

    return isExpired || !sameTraits;
  }

  function saveSuggestionCache(suggestions, bottom3) {
    const cache = {
      timestamp: Date.now(),
      bottom3: bottom3,
      articles: suggestions.articles,
      workouts: suggestions.workouts,
    };
    localStorage.setItem(SUGGESTION_CACHE_KEY, JSON.stringify(cache));
  }

  try {
    const response = await fetch("/train/data/lessons.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch lessons.json: ${response.status}`);
    }
    const lessons = await response.json();
    console.log("Fetched lessons:", lessons);

    const sortedTraits = Object.entries(traits).sort(([, a], [, b]) => a - b);
    console.log("Sorted traits:", sortedTraits);

    const bottom3Categories = sortedTraits.slice(0, 3).map(([key]) => key);
    console.log("Bottom 3 categories:", bottom3Categories);

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

      console.log(
        `Filtering lessons for types "${typeList.join(
          ", "
        )}" and category "${category}" (mapped: "${mappedCategory}")`
      );

      const filtered = lessons.filter((lesson) => {
        const matchesType = typeList.includes(lesson.type.toLowerCase());
        const matchesCategory = lesson.tags.some(
          (tag) => tag.toLowerCase() === mappedCategory.toLowerCase()
        );

        console.log(`Lesson: ${lesson.title}`);
        console.log(`  Matches Type: ${matchesType}`);
        console.log(`  Matches Category: ${matchesCategory}`);

        return matchesType && matchesCategory;
      });

      if (filtered.length === 0) {
        console.warn(
          `No lessons found for category: "${category}" (mapped: "${mappedCategory}") with types: ${typeList.join(
            ", "
          )}`
        );
      }

      return filtered;
    };

    const suggestedCollectionsContainer = document.getElementById(
      "suggestedCollections"
    );
    suggestedCollectionsContainer.innerHTML = ""; // Clear any existing content

    const bottom2Categories = sortedTraits.slice(0, 2).map(([key]) => key); // Get bottom 2 traits
    console.log(
      "Bottom 2 categories for Suggested Collections:",
      bottom2Categories
    );

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

    bottom2Categories.forEach((category) => {
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

    const cached = loadSafe(SUGGESTION_CACHE_KEY, null);
    let articlesToUse = [];
    let workoutsToUse = [];

    if (!shouldRegenerateSuggestions(bottom3Categories)) {
      console.log("Using cached suggestions");
      articlesToUse = cached.articles;
      workoutsToUse = cached.workouts;
    } else {
      console.log("Regenerating suggestions");
      const usedArticles = new Set();
      const usedWorkouts = new Set();

      bottom3Categories.forEach((category) => {
        const articles = filterLessons("article", category);
        const availableArticles = articles.filter(
          (article) => !usedArticles.has(article.id)
        );
        if (availableArticles.length) {
          const randomArticle =
            availableArticles[
              Math.floor(Math.random() * availableArticles.length)
            ];
          if (randomArticle) {
            usedArticles.add(randomArticle.id);
            articlesToUse.push(randomArticle);
          }
        }

        const workouts = filterLessons(["workout", "practice"], category);
        const availableWorkouts = workouts.filter(
          (workout) => !usedWorkouts.has(workout.id)
        );
        if (availableWorkouts.length) {
          const randomWorkout =
            availableWorkouts[
              Math.floor(Math.random() * availableWorkouts.length)
            ];
          if (randomWorkout) {
            usedWorkouts.add(randomWorkout.id);
            workoutsToUse.push(randomWorkout);
          }
        }
      });

      // Trim to 3 max
      articlesToUse = articlesToUse.slice(0, 3);
      workoutsToUse = workoutsToUse.slice(0, 3);

      saveSuggestionCache(
        { articles: articlesToUse, workouts: workoutsToUse },
        bottom3Categories
      );
    }

    // Render Articles
    suggestedArticlesContainer.innerHTML = "";
    articlesToUse.forEach((article) => {
      const articleCard = `
    <a href="${article.url}">
      <div class="lesson-card">
        <img class="lazyload" src="${article.thumbnail}" alt="${article.title}">
        <h4>${article.title}</h4>
        <p><span class="type">${article.type}</span>, <span class="length">${article.length}</span></p>
      </div>
    </a>`;
      suggestedArticlesContainer.innerHTML += articleCard;
    });

    // Render Workouts
    suggestedWorkoutsContainer.innerHTML = "";
    workoutsToUse.forEach((workout) => {
      const workoutCard = `
    <a href="${workout.url}">
      <div class="lesson-card">
        <img class="lazyload" src="${workout.thumbnail}" alt="${workout.title}">
        <h4>${workout.title}</h4>
        <p><span class="type">${workout.type}</span>, <span class="length">${workout.length}</span></p>
      </div>
    </a>`;
      suggestedWorkoutsContainer.innerHTML += workoutCard;
    });
  } catch (error) {
    console.error("Error fetching or processing lessons data:", error);
  }
});
