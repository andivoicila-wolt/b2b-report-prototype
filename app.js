const HIGHLIGHT_COUNT = 8;

const labelFromPath = (path) =>
  path
    .split("/")
    .pop()
    .replace(/\.png$/i, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const makeCard = (src, index) => {
  const fig = document.createElement("figure");
  fig.className = "card";
  fig.style.animationDelay = `${Math.min(index * 30, 520)}ms`;

  const label = labelFromPath(src);
  fig.innerHTML = `
    <button type="button" data-src="${src}" data-label="${label}">
      <img src="${src}" alt="${label}" loading="lazy" decoding="async" />
      <figcaption>${label}</figcaption>
    </button>
  `;
  return fig;
};

const bindLightbox = () => {
  const lightbox = document.getElementById("lightbox");
  const image = document.getElementById("lightboxImage");
  const caption = document.getElementById("lightboxCaption");
  const close = document.getElementById("closeLightbox");

  document.body.addEventListener("click", (e) => {
    const trigger = e.target.closest("button[data-src]");
    if (!trigger) return;

    image.src = trigger.dataset.src;
    image.alt = trigger.dataset.label;
    caption.textContent = trigger.dataset.label;
    lightbox.showModal();
  });

  close.addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (e) => {
    const rect = lightbox.getBoundingClientRect();
    const inside =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!inside) lightbox.close();
  });
};

const render = async () => {
  const response = await fetch("slides.json");
  const slides = await response.json();

  const deduped = Array.from(new Set(slides));
  const highlights = deduped.slice(0, HIGHLIGHT_COUNT);
  const remainder = deduped.slice(HIGHLIGHT_COUNT);

  const highlightGrid = document.getElementById("highlightGrid");
  const slideGrid = document.getElementById("slideGrid");

  highlights.forEach((src, i) => highlightGrid.appendChild(makeCard(src, i)));
  remainder.forEach((src, i) => slideGrid.appendChild(makeCard(src, i + HIGHLIGHT_COUNT)));

  bindLightbox();
};

render().catch((err) => {
  console.error("Failed to render slide gallery", err);
});
