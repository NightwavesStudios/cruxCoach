/* Filter */
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let tag = urlParams.get("tag");
  let typeParam = urlParams.get("type");
  let sortParam = urlParams.get("sort")?.toLowerCase();

  if (!tag && !typeParam) {
    tag = "all";
  }

  const difficultyOrder = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };

  const getDifficultyRank = (lesson) => {
    const raw = lesson.difficulty;

    if (!raw) return Infinity;

    const difficulties = Array.isArray(raw)
      ? raw
      : String(raw)
          .split(",")
          .map((d) => d.trim().toLowerCase());

    let minRank = Infinity;
    for (const diff of difficulties) {
      const rank = difficultyOrder[diff];
      if (rank && rank < minRank) {
        minRank = rank;
      }
    }

    return minRank;
  };

  const getDifficultyCount = (lesson) => {
    const raw = lesson.difficulty;
    if (!raw) return Infinity;
    return Array.isArray(raw)
      ? raw.length
      : String(raw).split(",").filter(Boolean).length;
  };

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
    titleElem.innerHTML = `${typeList
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

      // 1. Intro first
      if (isIntroA && !isIntroB) return -1;
      if (!isIntroA && isIntroB) return 1;

      // 2. Difficulty rank (lowest first)
      const diffRankA = getDifficultyRank(a);
      const diffRankB = getDifficultyRank(b);
      if (diffRankA !== diffRankB) return diffRankA - diffRankB;

      // 3. Single difficulty before multiple
      const countA = getDifficultyCount(a);
      const countB = getDifficultyCount(b);
      if (countA !== countB) return countA - countB;

      // 4. Alphabetical by title
      return a.title.localeCompare(b.title);
    });

    if (sortedLessons.length === 0) {
      const noResultsMessage = document.createElement("p");
      noResultsMessage.className = "no-results";
      const sanitizedTag = tag && tag.toLowerCase() !== "all" ? ` and tag: ${tag.replace(/</g, "&lt;").replace(/>/g, "&gt;")}` : "";
      const message = `No lessons found${
        typeList.length ? ` for type(s): ${typeList.join(" & ")}` : ""
      }${sanitizedTag}.`;
      noResultsMessage.textContent = message;
      container.textContent = "";
      container.appendChild(noResultsMessage);
      return;
    }

    container.textContent = "";
    sortedLessons.forEach((lesson) => {
      const card = document.createElement("a");
      card.href = card.href = `${lesson.url}?from=${encodeURIComponent(tag)}`;
      card.innerHTML = `
        <div class="lesson-card">
            <img class="lazyload" src="${lesson.thumbnail}" alt="${lesson.title}">
            <h4>${lesson.title}</h4>
            <p>
  <span class="type">${lesson.type}</span>, 
  <span class="length">${lesson.length}</span> 
</p>
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
