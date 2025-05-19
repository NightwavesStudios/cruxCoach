document.addEventListener("DOMContentLoaded", async () => {
  const suggestedCollectionsContainer = document.getElementById(
    "suggestedCollections"
  );
  const suggestedArticlesContainer =
    document.getElementById("suggestedArticles");
  const suggestedWorkoutsContainer =
    document.getElementById("suggestedWorkouts");

  console.log("Initializing Suggested Collections, Articles, and Workouts...");

  // Load traits from localStorage
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

  const traits = loadSafe("traits", defaultTraits);
  console.log("Loaded traits:", traits);

  try {
    // Fetch lessons data
    const response = await fetch("/train/data/lessons.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch lessons.json: ${response.status}`);
    }
    const lessons = await response.json();
    console.log("Fetched lessons:", lessons);

    // Sort traits to get the weakest categories
    const sortedTraits = Object.entries(traits).sort(([, a], [, b]) => a - b);
    console.log("Sorted traits:", sortedTraits);

    const bottom3Categories = sortedTraits.slice(0, 3).map(([key]) => key);
    console.log("Bottom 3 categories:", bottom3Categories);

    // Helper function to filter lessons by type and category
    const filterLessons = (type, category) => {
      console.log(`Filtering ${type} lessons for category "${category}"`);

      const filtered = lessons.filter((lesson) => {
        const matchesType = lesson.type.toLowerCase() === type.toLowerCase();
        const matchesCategory = lesson.tags.some(
          (tag) => tag.toLowerCase() === category.toLowerCase()
        );

        console.log(`Lesson: ${lesson.title}`);
        console.log(`  Matches Type: ${matchesType}`);
        console.log(`  Matches Category: ${matchesCategory}`);

        return matchesType && matchesCategory;
      });

      console.log(
        `Filtered ${type} lessons for category "${category}":`,
        filtered
      );
      return filtered;
    };

    // Populate Suggested Collections
    const suggestedCollectionsContainer = document.getElementById(
      "suggestedCollections"
    );
    suggestedCollectionsContainer.innerHTML = ""; // Clear any existing content

    const bottom2Categories = sortedTraits.slice(0, 2).map(([key]) => key); // Get bottom 2 traits
    console.log(
      "Bottom 2 categories for Suggested Collections:",
      bottom2Categories
    );

    bottom2Categories.forEach((category) => {
      const collectionCard = `
    <a href="/train/filter.html?tag=${category.toLowerCase()}">
      <div class="collection-card">
        <img class="lazyload" src="https://via.placeholder.com/150" alt="${category} Collection Cover">
        <h4>${category}</h4>
      </div>
    </a>`;
      suggestedCollectionsContainer.innerHTML += collectionCard;
    });

    console.log("Rendered Suggested Collections.");

    // Populate Suggested Articles
    const usedArticles = new Set();
    suggestedArticlesContainer.innerHTML = "";
    let articlesAdded = 0;

    bottom3Categories.forEach((category) => {
      const articles = filterLessons("article", category);
      articles.forEach((article) => {
        if (articlesAdded < 3 && !usedArticles.has(article.id)) {
          usedArticles.add(article.id);
          const articleCard = `
        <a href="${article.url}">
          <div class="lesson-card">
            <img class="lazyload" src="${article.thumbnail}" alt="${article.title}">
            <h4>${article.title}</h4>
            <p><span class="type">${article.type}</span>, <span class="length">${article.length}</span></p>
          </div>
        </a>`;
          suggestedArticlesContainer.innerHTML += articleCard;
          articlesAdded++;
        }
      });
    });

    // Fallback: Add random articles if fewer than 3 were added
    if (articlesAdded < 3) {
      const fallbackArticles = lessons.filter(
        (lesson) =>
          lesson.type.toLowerCase() === "article" &&
          !usedArticles.has(lesson.id)
      );
      fallbackArticles.slice(0, 3 - articlesAdded).forEach((article) => {
        usedArticles.add(article.id);
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
    }
    console.log("Rendered Suggested Articles.");

    // Populate Suggested Workouts
    const usedWorkouts = new Set();
    suggestedWorkoutsContainer.innerHTML = "";
    let workoutsAdded = 0;

    bottom3Categories.forEach((category) => {
      const workouts = filterLessons("workout", category);
      workouts.forEach((workout) => {
        if (workoutsAdded < 3 && !usedWorkouts.has(workout.id)) {
          usedWorkouts.add(workout.id);
          const workoutCard = `
        <a href="${workout.url}">
          <div class="lesson-card">
            <img class="lazyload" src="${workout.thumbnail}" alt="${workout.title}">
            <h4>${workout.title}</h4>
            <p><span class="type">${workout.type}</span>, <span class="length">${workout.length}</span></p>
          </div>
        </a>`;
          suggestedWorkoutsContainer.innerHTML += workoutCard;
          workoutsAdded++;
        }
      });
    });

    // Fallback: Add random workouts if fewer than 3 were added
    if (workoutsAdded < 3) {
      const fallbackWorkouts = lessons.filter(
        (lesson) =>
          lesson.type.toLowerCase() === "workout" &&
          !usedWorkouts.has(lesson.id)
      );
      fallbackWorkouts.slice(0, 3 - workoutsAdded).forEach((workout) => {
        usedWorkouts.add(workout.id);
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
    }
    console.log("Rendered Suggested Workouts.");
  } catch (error) {
    console.error("Error fetching or processing lessons data:", error);
  }
});
