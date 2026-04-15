const pageStream = document.getElementById("pageStream");
const counter = document.getElementById("counter");
const toggleChrome = document.getElementById("toggleChrome");

const humanize = (name) =>
  name
    .replace(/\.pdf$/i, "")
    .replace(/^b2b report\s*-\s*/i, "")
    .replace(/\s+/g, " ")
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

const isReadableHeading = (txt = "") => {
  if (!txt || txt.length < 3) return false;
  if (!txt.includes(" ")) return false;
  if (/\bea\b/.test(txt) && /Tak\s*ea/.test(txt)) return false;
  return true;
};

const buildPages = (slides, semanticRecords) => {
  const orderedSlides = Array.from(new Set(slides)).sort(compareKeys);

  orderedSlides.forEach((src, i) => {
    const semantic = semanticRecords[i] || {};
    const fallbackHeading = humanize(semantic.pdf || semantic.title || `Page ${i + 1}`);
    const heading = isReadableHeading(semantic.heading) ? semantic.heading : fallbackHeading;
    const paragraphs = Array.isArray(semantic.paragraphs) ? semantic.paragraphs.slice(0, 8) : [];

    const section = document.createElement("section");
    section.className = "page";
    section.id = `page-${i + 1}`;

    const paraHtml =
      paragraphs.length > 0
        ? paragraphs.map((p) => `<p>${p}</p>`).join("")
        : "<p>No extractable text was detected for this page.</p>";

    section.innerHTML = `
      <div class="page-frame">
        <img src="${src}" alt="${heading}" loading="eager" decoding="async" />
      </div>
      <article class="semantic" aria-label="Semantic transcript for ${heading}">
        <h2>${heading}</h2>
        ${paraHtml}
      </article>
    `;

    pageStream.appendChild(section);
  });

  return orderedSlides.length;
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
    { threshold: [0.35, 0.5, 0.7] }
  );

  pages.forEach((p) => observer.observe(p));

  window.addEventListener("keydown", (e) => {
    const activeIdx = pages.findIndex((p) => {
      const r = p.getBoundingClientRect();
      return r.top <= window.innerHeight * 0.3 && r.bottom >= window.innerHeight * 0.3;
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
  const [slidesRes, semanticRes] = await Promise.all([fetch("slides.json"), fetch("report-content.json")]);
  if (!slidesRes.ok) throw new Error(`Failed to load slides.json (${slidesRes.status})`);
  if (!semanticRes.ok) throw new Error(`Failed to load report-content.json (${semanticRes.status})`);

  const slides = await slidesRes.json();
  const semantic = await semanticRes.json();

  const count = buildPages(slides, semantic);
  setupCounter(count);
  setupChromeToggle();
};

init().catch((err) => {
  console.error(err);
  pageStream.innerHTML = `<p style="padding:20px;color:#ffb5b5">Could not load report pages.</p>`;
});
