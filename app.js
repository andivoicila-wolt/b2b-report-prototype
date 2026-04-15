const pagesEl = document.getElementById("pages");

const alphaWeight = (letter = "") => (letter ? letter.toLowerCase().charCodeAt(0) - 96 : 0);

const sortKey = (src) => {
  const name = src.split("/").pop().replace(/\.png$/i, "").toLowerCase();

  const cover = name.match(/^b2b-report-01([a-z])$/);
  if (cover) return [0, 1, alphaWeight(cover[1]), 0, 0];

  const slide = name.match(/^b2b-report-slide-(\d+)([a-z])?$/);
  if (slide) return [1, Number(slide[1]), alphaWeight(slide[2] || ""), 0, 0];

  const variant = name.match(/^b2b-report-slide-(\d+)([a-z])-(\d+)$/);
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

const render = (slides) => {
  const ordered = Array.from(new Set(slides)).sort(compareKeys);

  ordered.forEach((src, index) => {
    const section = document.createElement("section");
    section.className = "frame";
    section.id = `page-${index + 1}`;

    const img = document.createElement("img");
    img.src = src;
    img.alt = `Report page ${index + 1}`;
    img.loading = index < 2 ? "eager" : "lazy";
    img.decoding = "async";

    section.appendChild(img);
    pagesEl.appendChild(section);
  });

  const sections = [...document.querySelectorAll(".frame")];

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
  render(slides);
};

init().catch((err) => {
  console.error(err);
  pagesEl.innerHTML = "";
});
