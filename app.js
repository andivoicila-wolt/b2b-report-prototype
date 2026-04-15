const pageStream = document.getElementById("pageStream");
const counter = document.getElementById("counter");
const toggleChrome = document.getElementById("toggleChrome");

const cleanLabel = (src) =>
  src
    .split("/")
    .pop()
    .replace(/\.png$/i, "")
    .replace(/^b2b-report-/, "")
    .replace(/-/g, " ")
    .trim();

const alphaWeight = (letter = "") => (letter ? letter.toLowerCase().charCodeAt(0) - 96 : 0);

const sortKey = (src) => {
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
  const ka = sortKey(a);
  const kb = sortKey(b);
  for (let i = 0; i < ka.length; i += 1) {
    if (ka[i] !== kb[i]) return ka[i] - kb[i];
  }
  return a.localeCompare(b);
};

const buildPages = (slides) => {
  const ordered = Array.from(new Set(slides)).sort(compareKeys);

  ordered.forEach((src, i) => {
    const section = document.createElement("section");
    section.className = "page";
    section.id = `page-${i + 1}`;

    section.innerHTML = `
      <div class="page-frame">
        <img src="${src}" alt="${cleanLabel(src)}" loading="eager" decoding="async" />
      </div>
    `;
    pageStream.appendChild(section);
  });

  return ordered.length;
};

const setupCounter = (count) => {
  const pages = [...document.querySelectorAll(".page")];

  const update = (idx) => {
    counter.textContent = `Page ${idx + 1} / ${count}`;
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const idx = pages.indexOf(visible.target);
      if (idx >= 0) update(idx);
    },
    { threshold: [0.5, 0.65, 0.8] }
  );

  pages.forEach((p) => observer.observe(p));

  window.addEventListener("keydown", (e) => {
    const activeIdx = pages.findIndex((p) => {
      const r = p.getBoundingClientRect();
      return r.top <= window.innerHeight * 0.35 && r.bottom >= window.innerHeight * 0.35;
    });

    const current = activeIdx >= 0 ? activeIdx : 0;
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      const next = Math.min(current + 1, pages.length - 1);
      pages[next].scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (e.key === "ArrowUp" || e.key === "PageUp") {
      const prev = Math.max(current - 1, 0);
      pages[prev].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
};

const setupChromeToggle = () => {
  toggleChrome.addEventListener("click", () => {
    document.body.classList.toggle("ui-hidden");
    toggleChrome.textContent = document.body.classList.contains("ui-hidden") ? "Show UI" : "Hide UI";
  });
};

const init = async () => {
  const response = await fetch("slides.json");
  if (!response.ok) throw new Error(`Failed to load slides.json (${response.status})`);
  const slides = await response.json();

  const count = buildPages(slides);
  setupCounter(count);
  setupChromeToggle();
};

init().catch((err) => {
  console.error(err);
  pageStream.innerHTML = `<p style="padding:20px;color:#ffb5b5">Could not load report pages.</p>`;
});
