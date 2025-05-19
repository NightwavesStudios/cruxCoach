document.addEventListener("DOMContentLoaded", async () => {
  const currentUrl = window.location.pathname;
  const readNextContainer = document.getElementById("readNextContainer");

  try {
    const response = await fetch("/train/data/lessons.json");
    const lessons = await response.json();

    const currentArticle = lessons.find((lesson) => lesson.url === currentUrl);
    if (!currentArticle) {
      console.error("Current article not found in lessons.json");
      return;
    }

    const collectionTag = currentArticle.tags[0];

    const collectionLessons = lessons.filter((lesson) =>
      lesson.tags.includes(collectionTag)
    );

    const sortedLessons = collectionLessons.sort(
      (a, b) => lessons.indexOf(a) - lessons.indexOf(b)
    );

    const currentIndex = sortedLessons.findIndex(
      (lesson) => lesson.url === currentUrl
    );

    const nextArticle =
      currentIndex < sortedLessons.length - 1
        ? sortedLessons[currentIndex + 1]
        : null;

    const fullCollectionUrl = `/train/filter.html?tag=${collectionTag}`;
    const fullCollectionButton = document.createElement("a");
    fullCollectionButton.href = fullCollectionUrl;
    fullCollectionButton.className = "button-link";
    fullCollectionButton.textContent = "< View Full Collection";
    readNextContainer.appendChild(fullCollectionButton);

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
