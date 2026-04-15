const pagesEl = document.getElementById("pages");

const chapterTakeaways = [
  {
    title: "The on-demand basket is diversifying",
    text: "More than 30% of retail sales now come from non-food categories, with strong momentum in health and beauty, pet care, and consumer electronics.",
    metrics: [
      { label: "+30% non-food share", tone: "cyan" },
      { label: "Health & Beauty", tone: "green" },
      { label: "Electronics", tone: "yellow" }
    ]
  },
  {
    title: "Demand is shaped by key moments",
    text: "Retail demand spikes around calendar moments, with major seasonal surges concentrated in gifting, electronics, and occasion-led shopping.",
    metrics: [
      { label: "32x Florists on Valentine's", tone: "pink" },
      { label: "+440% Electronics (Black Friday)", tone: "cyan" },
      { label: "+133% Toys & Games (Christmas)", tone: "yellow" }
    ]
  },
  {
    title: "Marketplace demand is local on both sides",
    text: "Most retail journeys start close to home, and local independent businesses represent a large part of active retail supply.",
    metrics: [
      { label: "3 in 4 orders start locally", tone: "green" },
      { label: "~3 km order radius", tone: "cyan" },
      { label: "57% local businesses", tone: "pink" }
    ]
  },
  {
    title: "On-demand retail is becoming repeat behavior",
    text: "Compared with 2024, monthly retail shoppers and order frequency per shopper both increased, signaling habit formation.",
    metrics: [
      { label: "+30% monthly shoppers", tone: "cyan" },
      { label: "+12% orders per shopper", tone: "green" }
    ]
  },
  {
    title: "Retail comes alive after work",
    text: "Late-day demand is materially higher in retail than in grocery, highlighting after-work relevance for convenience-led purchases.",
    metrics: [
      { label: "40% after 5pm", tone: "yellow" },
      { label: "14% after 8pm", tone: "pink" }
    ]
  }
];

const alphaWeight = (letter = "") => (letter ? letter.toLowerCase().charCodeAt(0) - 96 : 0);

const sortKey = (src) => {
  const name = src.split("/").pop().replace(/\.png$/i, "").toLowerCase();

  const cover = name.match(/^b2b-report-01([a-z])$/);
  if (cover) return [0, 1, alphaWeight(cover[1]), 0, 0];

  const slide = name.match(/^b2b-report-slide-(\d+)([a-z])?$/);
  if (slide) return [1, Number(slide[1]), alphaWeight(slide[2] || ""), 0, 0];

  const variant = name.match(/^b2b-report-slide-(\d+)([a-z])-(\d+)-?$/);
  if (variant) return [1, Number(variant[1]), alphaWeight(variant[2]), Number(variant[3]), 0];

  const group = name.match(/^group-(\d+)$/);
  if (group) return [2, Number(group[1]), 0, 0, 0];

  return [3, 999, 999, 999, 999];
};

const compareKeys = (a, b) => {
  const ka = sortKey(a);
  const kb = sortKey(b);
  for (let i = 0; i < ka.length; i += 1) {
    if (ka[i] !== kb[i]) return ka[i] - kb[i];
  }
  return a.localeCompare(b);
};

const renderCodedChapter = () => {
  const section = document.createElement("section");
  section.className = "coded-section";
  section.id = "chapter-key-takeaways";

  const tiles = chapterTakeaways
    .map(
      (item) => `
      <article class="tile">
        <h2>${item.title}</h2>
        <p>${item.text}</p>
        <div class="metrics">
          ${item.metrics.map((m) => `<span class="metric ${m.tone}">${m.label}</span>`).join("")}
        </div>
      </article>
    `
    )
    .join("");

  section.innerHTML = `
    <div class="chapter-wrap">
      <header class="chapter-head">
        <div>
          <span class="badge">Converted to native HTML/CSS</span>
          <h1>Key Takeaways</h1>
          <p>This chapter is now implemented as real website UI code from slides 01a-01e.</p>
        </div>
      </header>
      <div class="tiles">${tiles}</div>
    </div>
  `;

  pagesEl.appendChild(section);
};

const renderRemainingSlides = (slides) => {
  const ordered = Array.from(new Set(slides)).sort(compareKeys);

  const remaining = ordered.filter((src) => !/assets\/slides\/b2b-report-01[a-e]\.png$/i.test(src));

  remaining.forEach((src, index) => {
    const section = document.createElement("section");
    section.className = "frame";
    section.id = `page-${index + 1}`;

    const img = document.createElement("img");
    img.src = src;
    img.alt = `Report page reference ${index + 1}`;
    img.loading = index < 2 ? "eager" : "lazy";
    img.decoding = "async";

    section.appendChild(img);
    pagesEl.appendChild(section);
  });

  return [...document.querySelectorAll(".coded-section, .frame")];
};

const bindKeyboardPaging = (sections) => {
  window.addEventListener("keydown", (e) => {
    const activeIdx = sections.findIndex((sec) => {
      const r = sec.getBoundingClientRect();
      const y = window.innerHeight * 0.4;
      return r.top <= y && r.bottom >= y;
    });

    const current = activeIdx >= 0 ? activeIdx : 0;

    if (e.key === "ArrowDown" || e.key === "PageDown") {
      const next = Math.min(current + 1, sections.length - 1);
      sections[next].scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (e.key === "ArrowUp" || e.key === "PageUp") {
      const prev = Math.max(current - 1, 0);
      sections[prev].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
};

const init = async () => {
  const res = await fetch("slides.json");
  if (!res.ok) throw new Error(`Failed to load slides.json (${res.status})`);
  const slides = await res.json();

  renderCodedChapter();
  const sections = renderRemainingSlides(slides);
  bindKeyboardPaging(sections);
};

init().catch((err) => {
  console.error(err);
  pagesEl.innerHTML = "";
});
