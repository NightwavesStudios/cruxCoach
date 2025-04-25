document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let tag = urlParams.get("tag");

    if (!tag) tag = "all";

    console.log(`Filtering lessons for tag: ${tag}`);
    const titleElem = document.getElementById("filterTitle");
    const container = document.getElementById("filteredCardsContainer");

    try {
        const response = await fetch("/train/data/lessons.json");
        const lessons = await response.json();
        console.log("Fetched lessons:", lessons);

        const filtered = tag.toLowerCase() === "all"
            ? lessons
            : lessons.filter(lesson =>
                lesson.tags.some(t => t.toLowerCase() === tag.toLowerCase())
            );

        console.log("Filtered lessons:", filtered);
        titleElem.innerHTML = tag.toLowerCase() === "all"
    ? "<br>All Lessons"
    : `<br>${tag.charAt(0).toUpperCase() + tag.slice(1)}Lessons`;

        if (filtered.length === 0) {
            container.innerHTML = `<p class="no-results">No lessons found for "${tag}".</p>`;
            return;
        }

        filtered.forEach(lesson => {
            const card = document.createElement("a");
            card.href = lesson.url;
            card.innerHTML = `
                <div class="collection-card">
                    <img class="lazyload" src="${lesson.thumbnail}" alt="${lesson.title}">
                    <h4>${lesson.title}</h4>
                    <p><span class="type">${lesson.type}</span>, <span class="category">${lesson.length}</span></p>
                </div>
            `;
            container.appendChild(card);
        });

        if (typeof lazyload === "function") {
            lazyload(); // reinit lazy loading if needed
        }
    } catch (err) {
        console.error("Failed to load lessons.json:", err);
    }
});