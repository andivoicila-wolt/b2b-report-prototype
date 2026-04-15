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

const render = (contentRows, slideRows) => {
  const orderedSlides = Array.from(new Set(slideRows)).sort(compareKeys);

  contentRows.forEach((row, i) => {
    const id = `section-${row.id}`;
    const slide = orderedSlides[i] || orderedSlides[0] || "";

    const article = document.createElement("article");
    article.className = "section-card card";
    article.id = id;
    article.dataset.search = `${row.title} ${row.section} ${row.summary} ${(row.metrics || []).join(" ")}`.toLowerCase();

    const chips = (row.metrics || []).map((m) => `<span class="metric">${m}</span>`).join("");

    article.innerHTML = `
      <div class="section-grid">
        <div class="content">
          <h3>${row.title || row.section || `Section ${row.id}`}</h3>
          <p class="meta">${row.source || "Source PDF"}</p>
          <p class="summary">${row.summary || "No extractable text found for this section."}</p>
          <div class="metrics">${chips}</div>
        </div>
        <figure class="visual">
          ${slide ? `<img src="${slide}" alt="Reference visual for ${row.title}" loading="lazy" decoding="async" />` : ""}
          <figcaption>Slide-derived visual reference</figcaption>
        </figure>
      </div>
    `;

    sectionsEl.appendChild(article);

    const tocLink = document.createElement("a");
    tocLink.className = "toc-item";
    tocLink.href = `#${id}`;
    tocLink.textContent = `${row.id}. ${row.title || row.section || "Section"}`;
    tocEl.appendChild(tocLink);
  });
};

const bindSearch = () => {
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    document.querySelectorAll(".section-card").forEach((el) => {
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
      const active = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      links.forEach((l) => l.classList.remove("active"));
      const link = map.get(active.target.id);
      if (link) link.classList.add("active");
    },
    { threshold: [0.45, 0.6] }
  );

  document.querySelectorAll(".section-card").forEach((el) => io.observe(el));
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
