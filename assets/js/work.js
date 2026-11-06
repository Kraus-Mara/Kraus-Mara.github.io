import {
  $,
  createElement,
  escapeHtml,
  padNumber,
  showToast,
} from "./utils.js";

const state = {
  projects: [],
  flatScreens: [],
  activeProject: null,
  activeScreens: [],
  currentScreen: 0,
  activeScreen: 0,
  lastTrigger: null,
};

const dom = {};

function esc(value) {
  return escapeHtml(value ?? "");
}

function normaliseScreens(project) {
  const screens =
    Array.isArray(project.screens) && project.screens.length
      ? project.screens
      : [
          {
            src: null,
            file: `assets/work/${project.id}-01.png`,
            caption: "Screen pending",
          },
        ];
  return screens.map((screen) => ({
    src: screen.src || screen.file || null,
    file: screen.file || `assets/work/${project.id}-01.png`,
    caption: screen.caption || "Screen pending",
    type: screen.type || null,
    poster: screen.poster || null,
  }));
}

function flatIndex(projectId, screenIndex) {
  return state.flatScreens.findIndex(
    (entry) => entry.project.id === projectId && entry.index === screenIndex
  );
}

/* ------------------------------------------------------------------
   Placeholder plates — intentionally diagrammatic, not fake UI.
------------------------------------------------------------------ */

function motifSvg(motif) {
  const gold = "rgba(198,161,91,.62)";
  const soft = "rgba(229,204,152,.32)";
  const faint = "rgba(198,161,91,.16)";
  const ivory = "rgba(234,220,197,.38)";
  const common = 'viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"';

  switch (motif) {
    case "vision":
      return `<svg ${common}>
        <rect x="44" y="28" width="512" height="244" fill="none" stroke="${faint}"/>
        <path d="M44 104 H556 M44 196 H556 M190 28 V272 M410 28 V272" stroke="${faint}" stroke-dasharray="3 7"/>
        <rect x="86" y="70" width="128" height="102" fill="none" stroke="${gold}"/>
        <rect x="252" y="126" width="164" height="92" fill="none" stroke="${soft}"/>
        <rect x="452" y="92" width="62" height="64" fill="none" stroke="${soft}"/>
        <path d="M86 70 h12 M86 70 v12 M214 70 h-12 M214 70 v12 M86 172 h12 M86 172 v-12 M214 172 h-12 M214 172 v-12" stroke="${gold}"/>
        <path d="M126 121 h48 M306 168 h64 M470 124 h24" stroke="${ivory}" stroke-width="2"/>
        <circle cx="150" cy="121" r="3" fill="${gold}"/>
        <circle cx="338" cy="168" r="3" fill="${soft}"/>
        <path d="M44 272 L556 28" stroke="${faint}" stroke-dasharray="2 8"/>
      </svg>`;
    case "code":
      return `<svg ${common}>
        <rect x="62" y="38" width="476" height="224" fill="none" stroke="${faint}"/>
        <path d="M62 72 H538" stroke="${gold}"/>
        <circle cx="82" cy="55" r="3" fill="${soft}"/><circle cx="94" cy="55" r="3" fill="${faint}"/><circle cx="106" cy="55" r="3" fill="${faint}"/>
        <g stroke="${soft}" stroke-width="2">
          <path d="M88 100 h108 M88 116 h170 M88 132 h136 M88 148 h192 M88 164 h118 M88 180 h154 M88 196 h84 M88 212 h174"/>
        </g>
        <g fill="none" stroke="${faint}">
          <path d="M330 98 h150 v54 h-150 z M350 108 h74 M350 122 h104 M350 136 h58"/>
          <path d="M368 166 h112 v52 h-112 z M388 178 h52 M388 192 h72"/>
        </g>
        <path d="M300 124 h20 M300 188 h20" stroke="${gold}" stroke-dasharray="3 4"/>
      </svg>`;
    case "graph":
      return `<svg ${common}>
        <path d="M82 42 V254 H538" stroke="${gold}"/>
        <g stroke="${faint}">
          <path d="M82 82 H538 M82 124 H538 M82 166 H538 M82 208 H538"/>
          <path d="M160 42 V254 M238 42 V254 M316 42 V254 M394 42 V254 M472 42 V254"/>
        </g>
        <polyline points="82,220 138,196 190,204 244,158 298,166 354,116 410,130 466,80 538,94" fill="none" stroke="${gold}" stroke-width="2"/>
        <polyline points="82,238 138,224 190,230 244,204 298,210 354,182 410,190 466,162 538,170" fill="none" stroke="${soft}" stroke-dasharray="4 6"/>
        <circle cx="466" cy="80" r="5" fill="none" stroke="${soft}"/>
        <circle cx="466" cy="80" r="11" fill="none" stroke="${faint}"/>
        <path d="M466 80 L520 48" stroke="${faint}"/>
      </svg>`;
    case "logistics":
    default:
      return `<svg ${common}>
        <rect x="44" y="28" width="512" height="244" fill="none" stroke="${faint}"/>
        <path d="M168 28 V272" stroke="${gold}"/>
        <path d="M44 64 H556" stroke="${gold}"/>
        <g fill="none" stroke="${faint}">
          <path d="M70 90 h66 M70 112 h52 M70 134 h74 M70 156 h42 M70 178 h62"/>
        </g>
        <g stroke="${faint}">
          <path d="M168 98 H556 M168 132 H556 M168 166 H556 M168 200 H556 M168 234 H556"/>
          <path d="M292 64 V272 M416 64 V272"/>
        </g>
        <g fill="${soft}" opacity=".6">
          <rect x="486" y="108" width="44" height="12"/>
          <rect x="486" y="142" width="28" height="12"/>
          <rect x="486" y="176" width="52" height="12"/>
          <rect x="486" y="210" width="34" height="12"/>
        </g>
        <g fill="none" stroke="${gold}">
          <rect x="356" y="106" width="74" height="18"/>
          <rect x="356" y="174" width="102" height="18"/>
        </g>
        <circle cx="124" cy="238" r="16" fill="none" stroke="${gold}"/>
        <path d="M124 230 v16 M116 238 h16" stroke="${soft}"/>
      </svg>`;
  }
}

function plateMarkup(project, screen, screenIndex, { compact = false } = {}) {
  const indexLabel = padNumber(screenIndex + 1);
  return `<span class="work-plate-art work-plate-art--${esc(project.motif || "logistics")}${compact ? " is-compact" : ""}" aria-hidden="true">
    <span class="work-plate-top">
      <span>PLATE ${indexLabel}</span>
      <span>${esc(project.period)}</span>
    </span>
    <span class="work-plate-diagram">${motifSvg(project.motif)}</span>
    <span class="work-plate-bottom">
      <span class="work-plate-title">${esc(project.title)}</span>
      <span class="work-plate-status">IMAGE PENDING</span>
    </span>
    <span class="work-plate-file">${esc(screen.file)}</span>
  </span>`;
}

function imageMarkup(project, screen, screenIndex, { compact = false } = {}) {
  const alt = `${project.title} — ${screen.caption}`;
  return `<img class="work-shot${compact ? " is-compact" : ""}" src="${esc(screen.src)}" alt="${esc(alt)}" loading="lazy" data-work-image="true" data-project="${esc(project.id)}" data-screen="${screenIndex}">`;
}

function isVideoScreen(screen) {
  if (screen.type === "video") return true;
  if (screen.type === "image") return false;
  return /\.(mp4|webm|mov|m4v)([?#]|$)/i.test(screen.src || "");
}

function videoMarkup(project, screen, screenIndex, { compact = false } = {}) {
  const poster = screen.poster ? ` poster="${esc(screen.poster)}"` : "";
  return `<span class="work-media work-media--video${compact ? " is-compact" : ""}" aria-hidden="true" data-work-video="true" data-project="${esc(project.id)}" data-screen="${screenIndex}">
    <video class="work-shot" muted playsinline preload="none" tabindex="-1"${poster}>
      <source src="${esc(screen.src)}">
    </video>
    <span class="work-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
    <span class="work-video-tag">VIDEO</span>
  </span>`;
}

function screenMarkup(project, screen, screenIndex, options = {}) {
  if (!screen.src) return plateMarkup(project, screen, screenIndex, options);
  if (isVideoScreen(screen)) return videoMarkup(project, screen, screenIndex, options);
  return imageMarkup(project, screen, screenIndex, options);
}

function stackMarkup(project) {
  return `<ul class="work-stack" aria-label="Stack">${(project.stack || [])
    .map((item) => `<li>${esc(item)}</li>`)
    .join("")}</ul>`;
}

function highlightsMarkup(project) {
  if (!Array.isArray(project.highlights) || !project.highlights.length) return "";
  return `<ul class="work-highlights">${project.highlights
    .map((item) => `<li>${esc(item)}</li>`)
    .join("")}</ul>`;
}

/* ------------------------------------------------------------------
   Render
------------------------------------------------------------------ */

function replaceWithPlate(element, project, screen, screenIndex, compact) {
  const holder = document.createElement("span");
  holder.innerHTML = plateMarkup(project, screen, screenIndex, { compact });
  element.replaceWith(holder.firstElementChild);
}

function bindImageFallbacks(root) {
  root.querySelectorAll("[data-work-image]").forEach((image) => {
    image.addEventListener("error", () => {
      const project = state.projects.find((entry) => entry.id === image.dataset.project);
      const screenIndex = Number(image.dataset.screen);
      if (!project) return;
      replaceWithPlate(
        image,
        project,
        project.screens[screenIndex],
        screenIndex,
        image.classList.contains("is-compact")
      );
    });
  });

  root.querySelectorAll("[data-work-video]").forEach((wrapper) => {
    const video = wrapper.querySelector("video");
    const source = video?.querySelector("source");
    if (!video || !source) return;
    const fail = () => {
      const project = state.projects.find((entry) => entry.id === wrapper.dataset.project);
      const screenIndex = Number(wrapper.dataset.screen);
      if (!project) return;
      replaceWithPlate(
        wrapper,
        project,
        project.screens[screenIndex],
        screenIndex,
        wrapper.classList.contains("is-compact")
      );
    };
    source.addEventListener("error", fail);
    video.addEventListener("error", fail);
  });
}

function stageMarkup(project, screen, index) {
  if (!screen.src) return plateMarkup(project, screen, index);
  if (isVideoScreen(screen)) {
    const poster = screen.poster ? ` poster="${esc(screen.poster)}"` : "";
    return `<video class="work-stage-media" src="${esc(screen.src)}"${poster} controls autoplay playsinline preload="metadata"></video>`;
  }
  return `<img class="work-stage-media" src="${esc(screen.src)}" alt="${esc(project.title)} — ${esc(screen.caption)}" loading="eager">`;
}

function renderStage(project, index, { play = false } = {}) {
  if (!dom.stage) return;
  state.activeScreen = index;
  const screen = project.screens[index];
  const video = isVideoScreen(screen);
  const total = project.screens.length;

  dom.stage.innerHTML = `<div class="work-stage-frame">${stageMarkup(project, screen, index)}</div>
    <div class="work-stage-bar">
      <span class="work-stage-caption">${esc(screen.caption)}</span>
      <span class="work-stage-count">${padNumber(index + 1)} / ${padNumber(total)}${video ? " · VIDEO" : ""}</span>
    </div>`;

  const media = dom.stage.querySelector(".work-stage-media");
  if (media && media.tagName === "VIDEO") {
    media.addEventListener("error", () => {
      const frame = dom.stage.querySelector(".work-stage-frame");
      if (frame) frame.innerHTML = plateMarkup(project, screen, index);
    });
    if (play) {
      const attempt = media.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
    }
  }

  const thumbs = project.screens
    .map((screenItem, screenIndex) => {
      if (screenIndex === index) return "";
      const videoItem = isVideoScreen(screenItem);
      return `<button class="work-thumb" type="button" data-screen-index="${screenIndex}">
        <span class="visually-hidden">Show ${esc(screenItem.caption)}${videoItem ? ", video" : ""}, plate ${screenIndex + 1}</span>
        ${screenMarkup(project, screenItem, screenIndex, { compact: true })}
        <span class="work-thumb-label" aria-hidden="true">${padNumber(screenIndex + 1)}</span>
      </button>`;
    })
    .join("");

  dom.thumbs.innerHTML = thumbs;
  dom.thumbs.hidden = total <= 1;
}

function renderFeature(project) {
  if (!dom.feature) return;
  const projectIndex = state.projects.indexOf(project);
  dom.feature.innerHTML = `<div class="work-feature-media">
    <div class="work-stage" id="work-stage" aria-live="polite"></div>
    <div class="work-thumbs" id="work-thumbs" role="group" aria-label="${esc(project.title)} screens"></div>
  </div>
  <div class="work-feature-meta">
    <p class="work-kicker">FEATURED / ${padNumber(projectIndex + 1)}</p>
    <h3 class="work-title">${esc(project.title)}</h3>
    <p class="work-org">${esc(project.org)} <span class="dot">·</span> ${esc(project.place)}</p>
    <p class="work-period">${esc(project.period)} <span class="dot">·</span> ${esc(project.role)}</p>
    <p class="work-summary">${esc(project.summary)}</p>
    <p class="work-description">${esc(project.description)}</p>
    ${highlightsMarkup(project)}
    ${stackMarkup(project)}
  </div>`;

  dom.stage = $("#work-stage");
  dom.thumbs = $("#work-thumbs");
  dom.thumbs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-screen-index]");
    if (!button) return;
    renderStage(project, Number(button.dataset.screenIndex), { play: true });
  });
  renderStage(project, 0);
  bindImageFallbacks(dom.feature);
}

function renderGrid(projects) {
  if (!dom.grid) return;
  if (!projects.length) {
    dom.grid.innerHTML = "";
    return;
  }
  dom.grid.innerHTML = projects
    .map((project) => {
      const projectIndex = state.projects.indexOf(project);
      const media =
        project.screens.length > 1
          ? `<div class="work-card-gallery">${project.screens
              .map(
                (screen, screenIndex) =>
                  `<div class="work-card-tile">${screenMarkup(project, screen, screenIndex, { compact: true })}</div>`
              )
              .join("")}</div>`
          : `<div class="work-card-media">${screenMarkup(project, project.screens[0], 0, { compact: true })}</div>`;
      return `<article class="work-card">
        ${media}
        <div class="work-card-body">
          <p class="work-kicker">${padNumber(projectIndex + 1)} <span class="dim">/ ${esc(project.period)}</span></p>
          <h3 class="work-card-title">${esc(project.title)}</h3>
          <p class="work-org">${esc(project.org)} <span class="dot">·</span> ${esc(project.place)}</p>
          <p class="work-card-role">${esc(project.role)}</p>
          <p class="work-card-summary">${esc(project.summary)}</p>
          ${stackMarkup(project)}
        </div>
      </article>`;
    })
    .join("");

  bindImageFallbacks(dom.grid);
}

/* ------------------------------------------------------------------
   Work lightbox
------------------------------------------------------------------ */

function resetLightboxVideo() {
  if (!dom.lightboxVideo) return;
  dom.lightboxVideo.pause();
  dom.lightboxVideo.hidden = true;
  dom.lightboxVideo.removeAttribute("src");
  dom.lightboxVideo.removeAttribute("poster");
  dom.lightboxVideo.onerror = null;
  dom.lightboxVideo.load();
}

function showMissingMedia(project, screen, index, kind) {
  const holder = document.createElement("span");
  holder.innerHTML = plateMarkup(project, screen, index);
  const note = createElement("span", "work-lightbox-note");
  note.append(
    document.createTextNode(`Could not load this ${kind}. Expected: `),
    createElement("code", "", screen.file)
  );
  dom.lightboxPlaceholder.replaceChildren(holder.firstElementChild, note);
}

function renderLightbox() {
  const project = state.activeProject;
  const screens = state.activeScreens;
  if (!project || !screens.length || !dom.lightbox) return;

  const index = ((state.currentScreen % screens.length) + screens.length) % screens.length;
  state.currentScreen = index;
  const screen = screens[index];

  dom.lightboxKicker.textContent = `PLATE ${padNumber(index + 1)} / ${padNumber(screens.length)}`;
  dom.lightboxTitle.textContent = project.title;
  dom.lightboxCaption.textContent = screen.caption;
  dom.lightboxFile.textContent = screen.src || `Add: ${screen.file}`;
  dom.lightboxCount.textContent = `${index + 1} / ${screens.length}`;
  dom.lightboxPlaceholder.replaceChildren();
  resetLightboxVideo();

  if (!screen.src) {
    dom.lightboxImg.hidden = true;
    dom.lightboxImg.removeAttribute("src");
    showMissingMedia(project, screen, index, "screen");
    return;
  }

  if (isVideoScreen(screen)) {
    dom.lightboxImg.hidden = true;
    dom.lightboxImg.removeAttribute("src");
    dom.lightboxVideo.hidden = false;
    dom.lightboxVideo.poster = screen.poster || "";
    dom.lightboxVideo.src = screen.src;
    dom.lightboxVideo.onerror = () => {
      dom.lightboxVideo.hidden = true;
      showMissingMedia(project, screen, index, "video");
    };
    dom.lightboxVideo.load();
    return;
  }

  dom.lightboxImg.hidden = false;
  dom.lightboxImg.src = screen.src;
  dom.lightboxImg.alt = `${project.title} — ${screen.caption}`;
  dom.lightboxImg.onerror = () => {
    dom.lightboxImg.hidden = true;
    showMissingMedia(project, screen, index, "image");
  };
}

function openWorkLightbox(flatIndexValue, trigger) {
  if (!dom.lightbox) return;
  const entry = state.flatScreens[flatIndexValue];
  if (!entry) return;
  state.activeProject = entry.project;
  state.activeScreens = entry.project.screens;
  state.currentScreen = entry.index;
  state.lastTrigger = trigger || document.activeElement;
  renderLightbox();
  if (!dom.lightbox.open) {
    if (typeof dom.lightbox.showModal === "function") dom.lightbox.showModal();
    else dom.lightbox.setAttribute("open", "");
  }
}

function stepLightbox(direction) {
  if (!dom.lightbox?.open || !state.activeScreens.length) return;
  state.currentScreen += direction;
  renderLightbox();
}

function closeLightbox() {
  if (!dom.lightbox) return;
  if (typeof dom.lightbox.close === "function") dom.lightbox.close();
  else dom.lightbox.removeAttribute("open");
}

function bindLightbox() {
  dom.lightbox = $("#work-lightbox");
  dom.lightboxImg = $("#work-lightbox-img");
  dom.lightboxVideo = $("#work-lightbox-video");
  dom.lightboxPlaceholder = $("#work-lightbox-placeholder");
  dom.lightboxKicker = $("#work-lightbox-kicker");
  dom.lightboxTitle = $("#work-lightbox-title");
  dom.lightboxCaption = $("#work-lightbox-caption");
  dom.lightboxFile = $("#work-lightbox-file");
  dom.lightboxCount = $("#work-lightbox-count");

  $("#work-lightbox-close")?.addEventListener("click", closeLightbox);
  $("#work-lightbox-prev")?.addEventListener("click", () => stepLightbox(-1));
  $("#work-lightbox-next")?.addEventListener("click", () => stepLightbox(1));

  dom.lightbox?.addEventListener("click", (event) => {
    if (event.target === dom.lightbox) closeLightbox();
  });
  dom.lightbox?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepLightbox(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepLightbox(1);
    }
  });
  dom.lightbox?.addEventListener("close", () => {
    resetLightboxVideo();
    state.lastTrigger?.focus?.();
  });
}

/* ------------------------------------------------------------------
   Init
------------------------------------------------------------------ */

export function initWork(data) {
  dom.feature = $("#work-feature");
  dom.grid = $("#work-grid");
  if (!dom.feature) return;

  state.projects = (data.projects || []).map((project) => ({
    ...project,
    screens: normaliseScreens(project),
  }));

  state.flatScreens = [];
  state.projects.forEach((project) => {
    project.screens.forEach((screen, index) => {
      state.flatScreens.push({ project, screen, index });
    });
  });

  if (!state.projects.length) {
    dom.feature.textContent = "No projects in data/work.json yet.";
    return;
  }

  const featured = state.projects.find((project) => project.featured) || state.projects[0];
  const others = state.projects.filter((project) => project !== featured);

  const count = $("#hero-project-count");
  if (count) count.textContent = padNumber(state.projects.length);



  renderFeature(featured);
  renderGrid(others);
}
