document.addEventListener("DOMContentLoaded", async () => {
  const currentUrl = window.location.pathname; // Get the current article's URL
  const readNextContainer = document.getElementById("readNextContainer");

  try {
    // Fetch the lessons JSON
    const response = await fetch("/train/data/lessons.json");
    const lessons = await response.json();

    // Find the current article in the JSON
    const currentArticle = lessons.find((lesson) => lesson.url === currentUrl);
    if (!currentArticle) {
      console.error("Current article not found in lessons.json");
      return;
    }

    // Get the collection tag (first tag in the tags array)
    const collectionTag = currentArticle.tags[0];

    // Filter lessons in the same collection
    const collectionLessons = lessons.filter((lesson) =>
      lesson.tags.includes(collectionTag)
    );

    // Sort the collection lessons by their order in the JSON
    const sortedLessons = collectionLessons.sort(
      (a, b) => lessons.indexOf(a) - lessons.indexOf(b)
    );

    // Find the index of the current article in the sorted collection
    const currentIndex = sortedLessons.findIndex(
      (lesson) => lesson.url === currentUrl
    );

    // Determine the "Next in Collection" article
    const nextArticle =
      currentIndex < sortedLessons.length - 1
        ? sortedLessons[currentIndex + 1]
        : null;

    // Update the "Go to Full Collection" button
    const fullCollectionUrl = `/train/filter.html?tag=${collectionTag}`;
    const fullCollectionButton = document.createElement("a");
    fullCollectionButton.href = fullCollectionUrl;
    fullCollectionButton.className = "button-link";
    fullCollectionButton.textContent = "< View Full Collection";
    readNextContainer.appendChild(fullCollectionButton);

    // Update the "Next in Collection" button
    if (nextArticle) {
      const nextArticleButton = document.createElement("a");
      nextArticleButton.href = nextArticle.url;
      nextArticleButton.className = "button-link";
      nextArticleButton.textContent = "Next in Collection >";
      readNextContainer.appendChild(nextArticleButton);
    }
  } catch (err) {
    console.error("Failed to load lessons.json:", err);
  }
});
