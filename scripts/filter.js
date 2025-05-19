/* Filter */
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let tag = urlParams.get("tag");

  if (!tag) tag = "all";

  if (tag) {
    document.title = `CruxCoach - Filter '${tag}' Tags`;
  } else {
    document.title = "CruxCoach - Filter Lessons";
  }

  console.log(`Filtering lessons for tag: ${tag}`);
  const titleElem = document.getElementById("filterTitle");
  const container = document.getElementById("filteredCardsContainer");

  try {
    const response = await fetch("/train/data/lessons.json");
    const lessons = await response.json();
    console.log("Fetched lessons:", lessons);

    const filtered =
      tag.toLowerCase() === "all"
        ? lessons
        : lessons.filter((lesson) =>
            lesson.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
          );

    console.log("Filtered lessons:", filtered);

    const sortedLessons = filtered.sort((a, b) => {
      const isIntroA = a.tags.includes("intro");
      const isIntroB = b.tags.includes("intro");

      if (isIntroA && !isIntroB) return -1;
      if (!isIntroA && isIntroB) return 1;

      return a.title.localeCompare(b.title);
    });

    titleElem.textContent =
      tag.toLowerCase() === "all"
        ? "All Lessons"
        : `${tag.charAt(0).toUpperCase() + tag.slice(1)} Lessons`;

    if (sortedLessons.length === 0) {
      const noResultsMessage = document.createElement("p");
      noResultsMessage.className = "no-results";
      noResultsMessage.textContent = `No lessons found for "${tag}".`;
      container.innerHTML = "";
      container.appendChild(noResultsMessage);
      return;
    }

    container.innerHTML = "";
    sortedLessons.forEach((lesson) => {
      const card = document.createElement("a");
      card.href = lesson.url;
      card.innerHTML = `
                <div class="lesson-card">
                    <img class="lazyload" src="${lesson.thumbnail}" alt="${lesson.title}">
                    <h4>${lesson.title}</h4>
                    <p><span class="type">${lesson.type}</span>, <span class="length">${lesson.length}</span></p>
                </div>
            `;
      container.appendChild(card);
    });

    if (typeof lazyload === "function") {
      lazyload();
    }
  } catch (err) {
    console.error("Failed to load lessons.json:", err);
  }
});
