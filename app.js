const sectionsEl = document.getElementById("sections");
const tocEl = document.getElementById("tocList");
const searchInput = document.getElementById("searchInput");

const alphaWeight = (letter = "") => (letter ? letter.toLowerCase().charCodeAt(0) - 96 : 0);

const slideSortKey = (src) => {
  const name = src.split("/").pop().replace(/\.png$/i, "").toLowerCase();
  const cover = name.match(/^b2b-report-01([a-z])$/);
  if (cover) return [0, 1, alphaWeight(cover[1]), 0];
  const slide = name.match(/^b2b-report-slide-(\d+)([a-z])?$/);
  if (slide) return [1, Number(slide[1]), alphaWeight(slide[2] || ""), 0];
  const variant = name.match(/^b2b-report-slide-(\d+)([a-z])-(\d+)$/);
  if (variant) return [1, Number(variant[1]), alphaWeight(variant[2]), Number(variant[3])];
  const group = name.match(/^group-(\d+)$/);
  if (group) return [2, Number(group[1]), 0, 0];
  return [3, 999, 999, 999];
};

const compareKeys = (a, b) => {
  const ka = slideSortKey(a);
  const kb = slideSortKey(b);
  for (let i = 0; i < ka.length; i += 1) {
    if (ka[i] !== kb[i]) return ka[i] - kb[i];
  }
  return a.localeCompare(b);
};

const chapterForSource = (source = "") => {
  const s = source.toLowerCase();
  if (s.includes("01a") || s.includes("01b") || s.includes("01c") || s.includes("01d") || s.includes("01e")) {
    return { id: "chapter-takeaways", title: "Key Takeaways", template: "tiles" };
  }
  if (s.includes("slide 2") || s.includes("slide 3") || s.includes("slide 4")) {
    return { id: "chapter-europe", title: "How Europe Shops Now", template: "story" };
  }
  if (s.includes("slide 5") || s.includes("slide 6") || s.includes("slide 7") || s.includes("slide 8") || s.includes("slide 9")) {
    return { id: "chapter-moments", title: "Shopping Moments & Demand Patterns", template: "story" };
  }
  if (s.includes("slide 10") || s.includes("slide 11") || s.includes("slide 12") || s.includes("slide 13") || s.includes("slide 14")) {
    return { id: "chapter-behavior", title: "Behavioral Shifts", template: "story" };
  }
  if (s.includes("slide 16") || s.includes("slide 17") || s.includes("slide 18") || s.includes("slide 19") || s.includes("slide 20") || s.includes("group 57") || s.includes("group 58") || s.includes("group 59")) {
    return { id: "chapter-outlook", title: "Outlook & Strategic Implications", template: "story" };
  }
  return { id: "chapter-other", title: "Additional Pages", template: "story" };
};

const groupByChapter = (rows) => {
  const map = new Map();
  rows.forEach((row) => {
    const chapter = chapterForSource(row.source || "");
    if (!map.has(chapter.id)) {
      map.set(chapter.id, { ...chapter, items: [] });
    }
    map.get(chapter.id).items.push(row);
  });
  return Array.from(map.values());
};

const metricChips = (metrics = []) => {
  if (!metrics.length) return "";
  return `<div class="metrics">${metrics.map((m) => `<span class="metric">${m}</span>`).join("")}</div>`;
};

const tileItem = (row, slide) => `
  <article class="insight-tile">
    <figure class="visual">
      ${slide ? `<img src="${slide}" alt="${row.title}" loading="lazy" decoding="async" />` : ""}
    </figure>
    <div class="tile-body">
      <h4>${row.title}</h4>
      <p>${row.summary || "No extractable text found."}</p>
      ${metricChips(row.metrics || [])}
    </div>
  </article>
`;

const storyItem = (row, slide, i) => `
  <article class="story-block ${i % 2 ? "flip" : ""}">
    <div class="content">
      <h4>${row.title}</h4>
      <p class="meta">${row.source || "Source PDF"}</p>
      <p>${row.summary || "No extractable text found."}</p>
      ${metricChips(row.metrics || [])}
    </div>
    <figure class="visual">
      ${slide ? `<img src="${slide}" alt="${row.title}" loading="lazy" decoding="async" />` : ""}
      <figcaption>Slide-derived design reference</figcaption>
    </figure>
  </article>
`;

const render = (contentRows, slideRows) => {
  const orderedSlides = Array.from(new Set(slideRows)).sort(compareKeys);
  const merged = contentRows.map((row, i) => ({ ...row, slide: orderedSlides[i] || "" }));
  const chapters = groupByChapter(merged);

  chapters.forEach((chapter) => {
    const section = document.createElement("section");
    section.className = "chapter card";
    section.id = chapter.id;
    section.dataset.search = `${chapter.title} ${chapter.items.map((i) => `${i.title} ${i.summary} ${(i.metrics || []).join(" ")}`).join(" ")}`.toLowerCase();

    const intro = `<header class="chapter-head"><h3>${chapter.title}</h3><p>${chapter.items.length} converted pages</p></header>`;

    const body =
      chapter.template === "tiles"
        ? `<div class="tile-grid">${chapter.items.map((item) => tileItem(item, item.slide)).join("")}</div>`
        : `<div class="story-list">${chapter.items.map((item, i) => storyItem(item, item.slide, i)).join("")}</div>`;

    section.innerHTML = `${intro}${body}`;
    sectionsEl.appendChild(section);

    const toc = document.createElement("a");
    toc.className = "toc-item";
    toc.href = `#${chapter.id}`;
    toc.textContent = chapter.title;
    tocEl.appendChild(toc);
  });
};

const bindSearch = () => {
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    document.querySelectorAll(".chapter").forEach((el) => {
      const hit = !q || el.dataset.search.includes(q);
      el.classList.toggle("hidden", !hit);
    });
  });
};

const bindActiveToc = () => {
  const links = [...document.querySelectorAll(".toc-item")];
  const map = new Map(links.map((a) => [a.getAttribute("href")?.slice(1), a]));

  const io = new IntersectionObserver(
    (entries) => {
      const active = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      links.forEach((l) => l.classList.remove("active"));
      const link = map.get(active.target.id);
      if (link) link.classList.add("active");
    },
    { threshold: [0.35, 0.55] }
  );

  document.querySelectorAll(".chapter").forEach((el) => io.observe(el));
};

const init = async () => {
  const [contentRes, slideRes] = await Promise.all([fetch("website-content.json"), fetch("slides.json")]);
  if (!contentRes.ok) throw new Error(`website-content.json failed (${contentRes.status})`);
  if (!slideRes.ok) throw new Error(`slides.json failed (${slideRes.status})`);

  const contentRows = await contentRes.json();
  const slideRows = await slideRes.json();

  render(contentRows, slideRows);
  bindSearch();
  bindActiveToc();
};

init().catch((err) => {
  console.error(err);
  sectionsEl.innerHTML = `<article class="card" style="padding:16px;color:#8b1b1b">Failed to load website content.</article>`;
});
