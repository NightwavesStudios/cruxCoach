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

    const usedArticles = new Set();
    suggestedArticlesContainer.innerHTML = "";
    let articlesAdded = 0;

    bottom3Categories.forEach((category) => {
      if (articlesAdded >= 3) return;

      const articles = filterLessons("article", category);
      const firstNewArticle = articles.find(
        (article) => !usedArticles.has(article.id)
      );

      if (firstNewArticle) {
        usedArticles.add(firstNewArticle.id);
        const articleCard = `
      <a href="${firstNewArticle.url}">
        <div class="lesson-card">
          <img class="lazyload" src="${firstNewArticle.thumbnail}" alt="${firstNewArticle.title}">
          <h4>${firstNewArticle.title}</h4>
          <p><span class="type">${firstNewArticle.type}</span>, <span class="length">${firstNewArticle.length}</span></p>
        </div>
      </a>`;
        suggestedArticlesContainer.innerHTML += articleCard;
        articlesAdded++;
      }
    });

    const usedWorkouts = new Set();
    suggestedWorkoutsContainer.innerHTML = "";
    let workoutsAdded = 0;

    bottom3Categories.forEach((category) => {
      if (workoutsAdded >= 3) return;

      const workouts = filterLessons(["workout", "practice"], category);
      const firstNewWorkout = workouts.find(
        (workout) => !usedWorkouts.has(workout.id)
      );

      if (firstNewWorkout) {
        usedWorkouts.add(firstNewWorkout.id);
        const workoutCard = `
      <a href="${firstNewWorkout.url}">
        <div class="lesson-card">
          <img class="lazyload" src="${firstNewWorkout.thumbnail}" alt="${firstNewWorkout.title}">
          <h4>${firstNewWorkout.title}</h4>
          <p><span class="type">${firstNewWorkout.type}</span>, <span class="length">${firstNewWorkout.length}</span></p>
        </div>
      </a>`;
        suggestedWorkoutsContainer.innerHTML += workoutCard;
        workoutsAdded++;
      }
    });
  } catch (error) {
    console.error("Error fetching or processing lessons data:", error);
  }
});
