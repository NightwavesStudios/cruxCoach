/* Filter */
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let tag = urlParams.get("tag");
  let typeParam = urlParams.get("type");

  if (!tag && !typeParam) {
    tag = "all";
  }

  // Sanitize and parse type (e.g. "article,workout" -> ["article", "workout"])
  let typeList = [];
  if (typeParam) {
    typeList = typeParam
      .split(",")
      .map((t) =>
        t
          .trim()
          .replace(/^['"]|['"]$/g, "")
          .toLowerCase()
      )
      .filter(Boolean);
  }

  const titleElem = document.getElementById("filterTitle");
  const container = document.getElementById("filteredCardsContainer");

  // Page title
  if (typeList.length > 0) {
    titleElem.textContent = `${typeList
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      .join(" & ")} Lessons`;
    document.title = `CruxCoach - Filter by Type: ${typeList.join(" & ")}`;
  } else if (tag && tag.toLowerCase() !== "all") {
    titleElem.textContent = `${
      tag.charAt(0).toUpperCase() + tag.slice(1)
    } Lessons`;
    document.title = `CruxCoach - Filter by Tag: ${tag}`;
  } else {
    titleElem.textContent = "All Lessons";
    document.title = "CruxCoach - All Lessons";
  }

  try {
    const response = await fetch("/train/data/lessons.json");
    const lessons = await response.json();

    const filtered = lessons.filter((lesson) => {
      const matchesTag =
        tag && tag.toLowerCase() !== "all"
          ? lesson.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
          : true;

      const matchesType =
        typeList.length > 0
          ? typeList.includes(lesson.type.toLowerCase())
          : true;

      return matchesTag && matchesType;
    });

    const sortedLessons = filtered.sort((a, b) => {
      const isIntroA = a.tags.includes("intro");
      const isIntroB = b.tags.includes("intro");

      if (isIntroA && !isIntroB) return -1;
      if (!isIntroA && isIntroB) return 1;

      return a.title.localeCompare(b.title);
    });

    if (sortedLessons.length === 0) {
      const noResultsMessage = document.createElement("p");
      noResultsMessage.className = "no-results";
      noResultsMessage.textContent = `No lessons found${
        typeList.length ? ` for type(s): ${typeList.join(" & ")}` : ""
      }${tag && tag.toLowerCase() !== "all" ? ` and tag: ${tag}` : ""}.`;
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
