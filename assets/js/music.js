import {
  $,
  $$,
  clamp,
  createElement,
  debounce,
  formatTime,
  readStored,
  setRangeFill,
  showToast,
  writeStored,
} from "./utils.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const state = {
  records: [],
  filtered: [],
  selectedId: null,
  activeEra: "all",
  columns: 4,
  volume: Number(readStored("nn-volume", "0.8")),
};

const dom = {};

function s(tag, attrs = {}, text) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) element.setAttribute(key, value);
  }
  if (text !== undefined) element.textContent = text;
  return element;
}

function add(parent, tag, attrs = {}, text) {
  const element = s(tag, attrs, text);
  parent.append(element);
  return element;
}

/* ------------------------------------------------------------------
   Procedural sleeve art. Each motif is deliberately graphic and era-
   coded, so the shelf looks complete before any real covers land.
------------------------------------------------------------------ */

function makeCover(record) {
  const palette = record.palette || {};
  const bg = palette.bg || "#c85834";
  const ink = palette.ink || "#f2e7d2";
  const accent = palette.accent || "#e8a34a";
  const accent2 = palette.accent2 || "#14100d";
  const root = s("svg", {
    viewBox: "0 0 100 100",
    preserveAspectRatio: "xMidYMid slice",
    "aria-hidden": "true",
    focusable: "false",
  });

  add(root, "rect", { width: 100, height: 100, fill: bg });

  switch (record.motif) {
    case "sun": {
      for (let index = 0; index < 28; index += 1) {
        const angle = (index / 28) * Math.PI * 2;
        add(root, "line", {
          x1: 50,
          y1: 43,
          x2: 50 + Math.cos(angle) * 76,
          y2: 43 + Math.sin(angle) * 76,
          stroke: accent2,
          "stroke-width": 1.2,
          opacity: 0.22,
        });
      }
      add(root, "circle", { cx: 50, cy: 43, r: 25, fill: accent });
      add(root, "circle", { cx: 50, cy: 43, r: 16, fill: accent2, opacity: 0.52 });
      add(root, "rect", { x: 0, y: 65, width: 100, height: 35, fill: accent2, opacity: 0.94 });
      add(root, "line", { x1: 0, y1: 65, x2: 100, y2: 65, stroke: ink, "stroke-width": 0.5, opacity: 0.55 });
      for (let index = 0; index < 7; index += 1) {
        add(root, "circle", {
          cx: 8 + index * 14,
          cy: 78 + (index % 2) * 5,
          r: 1.2,
          fill: ink,
          opacity: 0.35,
        });
      }
      break;
    }
    case "orbit": {
      add(root, "ellipse", { cx: 50, cy: 48, rx: 38, ry: 20, fill: "none", stroke: accent, "stroke-width": 0.8, opacity: 0.8 });
      add(root, "ellipse", { cx: 50, cy: 48, rx: 30, ry: 32, fill: "none", stroke: accent2, "stroke-width": 0.7, opacity: 0.6, transform: "rotate(44 50 48)" });
      add(root, "ellipse", { cx: 50, cy: 48, rx: 42, ry: 12, fill: "none", stroke: accent, "stroke-width": 0.5, opacity: 0.45, transform: "rotate(-24 50 48)" });
      add(root, "circle", { cx: 50, cy: 48, r: 12, fill: accent });
      add(root, "circle", { cx: 50, cy: 48, r: 5, fill: accent2 });
      add(root, "circle", { cx: 83, cy: 30, r: 2.6, fill: accent2 });
      add(root, "circle", { cx: 18, cy: 68, r: 1.8, fill: ink, opacity: 0.8 });
      for (let index = 0; index < 12; index += 1) {
        add(root, "circle", {
          cx: 6 + ((index * 17) % 88),
          cy: 10 + ((index * 23) % 70),
          r: index % 3 === 0 ? 0.7 : 0.4,
          fill: ink,
          opacity: 0.5,
        });
      }
      add(root, "rect", { x: 0, y: 86, width: 100, height: 14, fill: accent2, opacity: 0.55 });
      break;
    }
    case "wave": {
      for (let index = 0; index < 6; index += 1) {
        const y = 34 + index * 9;
        add(root, "path", {
          d: `M0 ${y} C 20 ${y - 16}, 35 ${y + 16}, 50 ${y} S 80 ${y - 16}, 100 ${y}`,
          fill: "none",
          stroke: index % 2 === 0 ? accent : accent2,
          "stroke-width": index % 2 === 0 ? 2.4 : 1.2,
          opacity: 0.82 - index * 0.07,
        });
      }
      add(root, "circle", { cx: 76, cy: 22, r: 9, fill: accent2, opacity: 0.7 });
      add(root, "rect", { x: 0, y: 84, width: 100, height: 16, fill: accent2, opacity: 0.75 });
      add(root, "line", { x1: 0, y1: 84, x2: 100, y2: 84, stroke: ink, "stroke-width": 0.5, opacity: 0.5 });
      break;
    }
    case "road": {
      add(root, "circle", { cx: 72, cy: 30, r: 17, fill: accent });
      add(root, "polygon", { points: "0,100 100,100 62,56 38,56", fill: accent2 });
      add(root, "line", { x1: 0, y1: 56, x2: 100, y2: 56, stroke: accent, "stroke-width": 0.8, opacity: 0.8 });
      add(root, "line", { x1: 50, y1: 60, x2: 50, y2: 96, stroke: ink, "stroke-width": 0.9, "stroke-dasharray": "3 5", opacity: 0.7 });
      add(root, "line", { x1: 38, y1: 56, x2: 12, y2: 100, stroke: ink, "stroke-width": 0.4, opacity: 0.35 });
      add(root, "line", { x1: 62, y1: 56, x2: 88, y2: 100, stroke: ink, "stroke-width": 0.4, opacity: 0.35 });
      add(root, "rect", { x: 0, y: 52, width: 100, height: 4, fill: accent2, opacity: 0.4 });
      break;
    }
    case "grid": {
      add(root, "circle", { cx: 50, cy: 38, r: 19, fill: accent });
      add(root, "rect", { x: 0, y: 52, width: 100, height: 48, fill: accent2, opacity: 0.22 });
      add(root, "line", { x1: 0, y1: 52, x2: 100, y2: 52, stroke: accent2, "stroke-width": 0.8, opacity: 0.9 });
      for (let index = -7; index <= 7; index += 1) {
        add(root, "line", { x1: 50, y1: 52, x2: 50 + index * 12, y2: 100, stroke: accent2, "stroke-width": 0.5, opacity: 0.55 });
      }
      for (let index = 0; index < 6; index += 1) {
        const y = 56 + index * 8;
        add(root, "line", { x1: 0, y1: y, x2: 100, y2: y, stroke: accent2, "stroke-width": 0.4, opacity: 0.5 });
      }
      for (let index = 0; index < 9; index += 1) {
        add(root, "circle", {
          cx: 12 + ((index * 19) % 78),
          cy: 8 + ((index * 11) % 36),
          r: 0.55,
          fill: ink,
          opacity: 0.7,
        });
      }
      break;
    }
    case "bloom": {
      for (let index = 0; index < 12; index += 1) {
        const angle = (index / 12) * Math.PI * 2;
        add(root, "ellipse", {
          cx: 50 + Math.cos(angle) * 15,
          cy: 43 + Math.sin(angle) * 15,
          rx: 17,
          ry: 6.5,
          fill: index % 2 === 0 ? accent : accent2,
          opacity: 0.6,
          transform: `rotate(${(index * 30).toFixed(1)} 50 43)`,
        });
      }
      add(root, "circle", { cx: 50, cy: 43, r: 9, fill: accent2 });
      add(root, "circle", { cx: 50, cy: 43, r: 3.5, fill: accent });
      for (let index = 0; index < 14; index += 1) {
        add(root, "circle", {
          cx: 5 + ((index * 13) % 90),
          cy: 66 + ((index * 7) % 28),
          r: 0.5,
          fill: ink,
          opacity: 0.5,
        });
      }
      break;
    }
    case "stripes": {
      for (let index = 0; index < 12; index += 1) {
        add(root, "rect", {
          x: -45 + index * 16,
          y: -30,
          width: 7,
          height: 170,
          fill: index % 2 === 0 ? accent : accent2,
          opacity: index % 2 === 0 ? 0.22 : 0.1,
          transform: "rotate(26 50 50)",
        });
      }
      add(root, "circle", { cx: 62, cy: 38, r: 17, fill: accent, opacity: 0.85 });
      add(root, "circle", { cx: 62, cy: 38, r: 6, fill: accent2, opacity: 0.6 });
      add(root, "line", { x1: 0, y1: 72, x2: 100, y2: 72, stroke: ink, "stroke-width": 0.5, opacity: 0.4 });
      break;
    }
    case "glitch":
    default: {
      add(root, "circle", { cx: 58, cy: 37, r: 18, fill: accent, opacity: 0.7 });
      add(root, "rect", { x: 8, y: 20, width: 44, height: 5, fill: accent2, opacity: 0.8 });
      add(root, "rect", { x: 34, y: 29, width: 58, height: 3, fill: accent, opacity: 0.9 });
      add(root, "rect", { x: 19, y: 43, width: 38, height: 12, fill: accent2, opacity: 0.6 });
      add(root, "rect", { x: 61, y: 54, width: 31, height: 4, fill: accent, opacity: 0.8 });
      add(root, "rect", { x: 0, y: 62, width: 100, height: 1.5, fill: accent2, opacity: 0.7 });
      add(root, "rect", { x: 0, y: 70, width: 100, height: 0.8, fill: ink, opacity: 0.4 });
      add(root, "rect", { x: 0, y: 74, width: 100, height: 0.8, fill: ink, opacity: 0.3 });
      add(root, "rect", { x: 0, y: 86, width: 100, height: 14, fill: accent2, opacity: 0.55 });
      break;
    }
  }

  return root;
}

function sleeveCover(record) {
  if (record.cover) {
    const image = document.createElement("img");
    image.className = "sleeve-img";
    image.src = record.cover;
    image.alt = `${record.title} cover`;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      const sleeve = image.closest(".record-sleeve");
      if (sleeve) sleeve.dataset.realCover = "false";
      image.replaceWith(makeCover(record));
    });
    return image;
  }
  return makeCover(record);
}

/* ------------------------------------------------------------------
   Shelf
------------------------------------------------------------------ */

function columnsForViewport() {
  return window.matchMedia("(max-width: 860px)").matches ? 2 : 4;
}

function rowLabel(records, rowIndex) {
  const years = records.map((record) => record.year);
  const min = Math.min(...years);
  const max = Math.max(...years);
  const range = min === max ? String(min) : `${min}—${max}`;
  return `SIDE ${rowIndex === 0 ? "A" : "B"} · ${range}`;
}

function createRecord(record, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "record";
  button.dataset.id = record.id;
  const palette = record.palette || {};
  button.style.setProperty("--cover-bg", palette.bg || "#c85834");
  button.style.setProperty("--cover-ink", palette.ink || "#f2e7d2");
  button.setAttribute("aria-pressed", String(record.id === state.selectedId));
  const actionHint = createElement("span", "visually-hidden", "Inspect record: ");

  const sleeve = document.createElement("span");
  sleeve.className = "record-sleeve";
  if (record.cover) sleeve.dataset.realCover = "true";

  const art = document.createElement("span");
  art.className = "sleeve-art";
  art.append(sleeveCover(record));

  const type = document.createElement("span");
  type.className = "sleeve-type";
  const artist = createElement("span", "sleeve-artist", record.artist);
  const title = createElement("span", "sleeve-title", record.title);
  const catalog = createElement("span", "sleeve-catalog", `${record.catalog} · ${record.label}`);
  type.append(artist, title, catalog);

  const sticker = createElement("span", "era-sticker", `'${String(record.year).slice(-2)}`);
  sticker.setAttribute("aria-hidden", "true");

  sleeve.append(art, type, sticker);
  button.append(actionHint, sleeve);
  return button;
}

function renderShelf() {
  if (!dom.shelf) return;
  const records = state.filtered;
  dom.shelf.replaceChildren();
  if (!records.length) {
    dom.shelf.append(createElement("p", "shelf-empty", "No records on this side yet."));
    return;
  }

  const columns = columnsForViewport();
  state.columns = columns;
  for (let index = 0; index < records.length; index += columns) {
    const rowRecords = records.slice(index, index + columns);
    const row = createElement("div", "shelf-row");
    rowRecords.forEach((record, offset) => {
      row.append(createRecord(record, index + offset));
    });
    const plank = createElement("div", "plank");
    plank.append(
      createElement("span", "plank-label", rowLabel(rowRecords, Math.floor(index / columns)))
    );
    dom.shelf.append(row, plank);
  }
}

function updateSelectedClasses() {
  $$(".record", dom.shelf).forEach((button) => {
    const selected = button.dataset.id === state.selectedId;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function applyFilter(era, { selectFirst = true } = {}) {
  state.activeEra = era;
  state.filtered = state.records.filter((record) => era === "all" || record.era === era);
  if (selectFirst && !state.filtered.some((record) => record.id === state.selectedId)) {
    const next = state.filtered[0];
    if (next) {
      state.selectedId = next.id;
      renderTurntable(next);
    }
  }
  renderShelf();
  updateSelectedClasses();
  $$(".era-filter .chip").forEach((chip) => {
    const active = chip.dataset.era === era;
    chip.classList.toggle("is-active", active);
    chip.setAttribute("aria-pressed", String(active));
  });
}

/* ------------------------------------------------------------------
   Turntable / audio player
------------------------------------------------------------------ */

function recordIndex(id) {
  return state.filtered.findIndex((record) => record.id === id);
}

function contrastInk(hex) {
  const value = String(hex).replace("#", "");
  if (value.length !== 6) return "#14100d";
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? "#14100d" : "#f2e7d2";
}

function setPlayerReady(ready) {
  if (dom.turntable) dom.turntable.dataset.ready = String(ready);
  if (dom.playBtn) {
    dom.playBtn.setAttribute("aria-disabled", String(!ready));
    dom.playBtn.setAttribute("aria-label", ready ? "Play record" : "Play record — no master attached");
  }
  if (dom.seek) dom.seek.disabled = !ready;
  if (dom.masterStatus) {
    dom.masterStatus.textContent = ready ? "MASTER READY" : "MASTER PENDING";
    dom.masterStatus.classList.toggle("is-ready", ready);
  }
}

function resetAudioDisplay() {
  if (dom.audio) {
    dom.audio.pause();
    dom.audio.removeAttribute("src");
    dom.audio.load();
  }
  if (dom.turntable) dom.turntable.classList.remove("is-playing");
  if (dom.seek) {
    dom.seek.value = "0";
    setRangeFill(dom.seek, 0);
  }
  if (dom.currentTime) dom.currentTime.textContent = "0:00";
  if (dom.duration) dom.duration.textContent = "0:00";
}

function renderTurntable(record) {
  if (!record) return;
  if (dom.npCatalog) dom.npCatalog.textContent = record.catalog;
  if (dom.npArtist) dom.npArtist.textContent = record.artist;
  if (dom.npTitle) dom.npTitle.textContent = record.title;
  if (dom.npYear) dom.npYear.textContent = String(record.year);
  if (dom.npGenre) dom.npGenre.textContent = record.genre;
  if (dom.npNote) dom.npNote.textContent = record.note;
  if (dom.npLabelCat) dom.npLabelCat.textContent = record.catalog;
  if (dom.turntable) {
    const palette = record.palette || {};
    dom.turntable.style.setProperty("--vinyl-label", palette.accent || "#e8a34a");
    dom.turntable.style.setProperty("--vinyl-ink", contrastInk(palette.accent || "#e8a34a"));
  }

  resetAudioDisplay();
  const hasAudio = Boolean(record.audio);
  setPlayerReady(hasAudio);

  if (hasAudio) {
    if (dom.audio) {
      dom.audio.src = record.audio;
      dom.audio.load();
    }
    if (dom.turntableFoot) {
      dom.turntableFoot.textContent = "Master attached. Press play and drop the needle.";
    }
  } else {
    if (dom.turntableFoot) {
      dom.turntableFoot.innerHTML =
        'No master attached yet. Add an <code>audio</code> path in <code>data/music.json</code> to bring this side to life.';
    }
  }

  setMediaSession(record);
}

function setMediaSession(record) {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: record.title,
      artist: record.artist,
      album: record.label,
      artwork: record.cover ? [{ src: record.cover, sizes: "512x512", type: "image/png" }] : [],
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => moveRecord(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => moveRecord(1));
  } catch {
    /* media session is a progressive enhancement */
  }
}

function selectRecord(id, { autoplay = false } = {}) {
  const record = state.records.find((entry) => entry.id === id);
  if (!record) return;
  state.selectedId = id;
  updateSelectedClasses();
  renderTurntable(record);
  if (autoplay && record.audio) {
    dom.audio
      ?.play()
      .catch(() => showToast("The browser blocked playback. Press play once."));
  }
}

function moveRecord(direction) {
  if (!state.filtered.length) return;
  const current = Math.max(0, recordIndex(state.selectedId));
  const next = (current + direction + state.filtered.length) % state.filtered.length;
  const wasPlaying = dom.audio && !dom.audio.paused && dom.audio.currentSrc;
  selectRecord(state.filtered[next].id, { autoplay: Boolean(wasPlaying) });
}

async function togglePlayback() {
  const record = state.records.find((entry) => entry.id === state.selectedId);
  if (!record) return;
  if (!record.audio) {
    showToast("No master attached yet — add an audio path in data/music.json.");
    return;
  }
  if (!dom.audio) return;
  if (dom.audio.paused) {
    try {
      await dom.audio.play();
    } catch {
      showToast("Could not play this master. Check the audio path.");
    }
  } else {
    dom.audio.pause();
  }
}

function bindPlayer() {
  if (dom.playBtn) dom.playBtn.addEventListener("click", togglePlayback);

  if (dom.seek) {
    dom.seek.addEventListener("input", () => {
      if (!dom.audio || !Number.isFinite(dom.audio.duration) || dom.audio.duration <= 0) return;
      const percent = Number(dom.seek.value);
      dom.audio.currentTime = (percent / 100) * dom.audio.duration;
      setRangeFill(dom.seek, percent);
    });
  }

  if (dom.volume) {
    const volume = clamp(Number.isFinite(state.volume) ? state.volume : 0.8, 0, 1);
    dom.volume.value = String(volume);
    setRangeFill(dom.volume, volume * 100);
    if (dom.audio) dom.audio.volume = volume;
    dom.volume.addEventListener("input", () => {
      const next = clamp(Number(dom.volume.value), 0, 1);
      state.volume = next;
      if (dom.audio) dom.audio.volume = next;
      setRangeFill(dom.volume, next * 100);
      writeStored("nn-volume", next);
    });
  }

  if (!dom.audio) return;

  dom.audio.addEventListener("play", () => {
    dom.turntable?.classList.add("is-playing");
    dom.playBtn?.setAttribute("aria-label", "Pause record");
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
  });
  dom.audio.addEventListener("pause", () => {
    dom.turntable?.classList.remove("is-playing");
    dom.playBtn?.setAttribute("aria-label", "Play record");
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
  });
  dom.audio.addEventListener("loadedmetadata", () => {
    if (dom.duration) dom.duration.textContent = formatTime(dom.audio.duration);
    if (dom.seek) dom.seek.disabled = false;
  });
  dom.audio.addEventListener("timeupdate", () => {
    if (!Number.isFinite(dom.audio.duration) || dom.audio.duration <= 0) return;
    const percent = (dom.audio.currentTime / dom.audio.duration) * 100;
    if (dom.seek) {
      dom.seek.value = String(percent);
      setRangeFill(dom.seek, percent);
    }
    if (dom.currentTime) dom.currentTime.textContent = formatTime(dom.audio.currentTime);
  });
  dom.audio.addEventListener("ended", () => {
    dom.turntable?.classList.remove("is-playing");
    if (dom.playBtn) dom.playBtn.setAttribute("aria-label", "Play record");
    if (dom.seek) {
      dom.seek.value = "100";
      setRangeFill(dom.seek, 100);
    }
  });
  dom.audio.addEventListener("error", () => {
    if (!dom.audio?.currentSrc) return;
    setPlayerReady(false);
    if (dom.masterStatus) {
      dom.masterStatus.textContent = "MASTER ERROR";
      dom.masterStatus.classList.remove("is-ready");
    }
    if (dom.turntableFoot) {
      dom.turntableFoot.textContent = "That master could not be loaded. Check the file path in data/music.json.";
    }
    showToast("Could not load this master. Check the file path.");
  });
}

/* ------------------------------------------------------------------
   Init
------------------------------------------------------------------ */

export function initMusic(records) {
  if (!Array.isArray(records) || !records.length) {
    const shelf = $("#shelf");
    if (shelf) {
      shelf.textContent = "No records found. Add entries to data/music.json.";
    }
    return;
  }

  state.records = records;
  dom.shelf = $("#shelf");
  dom.turntable = $("#turntable");
  dom.audio = $("#audio");
  dom.playBtn = $("#play-btn");
  dom.seek = $("#seek");
  dom.currentTime = $("#current-time");
  dom.duration = $("#duration");
  dom.volume = $("#volume");
  dom.masterStatus = $("#master-status");
  dom.turntableFoot = $("#turntable-foot");
  dom.npCatalog = $("#np-catalog");
  dom.npArtist = $("#np-artist");
  dom.npTitle = $("#np-title");
  dom.npYear = $("#np-year");
  dom.npGenre = $("#np-genre");
  dom.npNote = $("#np-note");
  dom.npLabelCat = $("#np-label-cat");

  state.selectedId = records[0].id;
  state.filtered = records;
  state.columns = columnsForViewport();

  renderShelf();
  updateSelectedClasses();
  renderTurntable(records[0]);
  bindPlayer();

  const count = $("#hero-record-count");
  if (count) count.textContent = String(records.length).padStart(2, "0");

  $$(".era-filter .chip").forEach((chip) => {
    chip.addEventListener("click", () => applyFilter(chip.dataset.era));
  });

  dom.shelf.addEventListener("click", (event) => {
    const button = event.target.closest(".record");
    if (!button) return;
    selectRecord(button.dataset.id);
  });

  window.addEventListener(
    "resize",
    debounce(() => {
      const nextColumns = columnsForViewport();
      if (nextColumns !== state.columns) {
        renderShelf();
        updateSelectedClasses();
      }
    }, 180)
  );
}
