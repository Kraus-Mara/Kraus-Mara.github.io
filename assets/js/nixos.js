import {
  $,
  createElement,
  escapeHtml,
  fetchText,
  padNumber,
  showToast,
} from "./utils.js";

const state = {
  screens: [],
  configs: [],
  cache: new Map(),
  activeConfigId: null,
  activeCode: "",
  lightboxIndex: 0,
  lastTrigger: null,
  host: {},
};

const dom = {};

function el(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/* ------------------------------------------------------------------
   Placeholder desktops
------------------------------------------------------------------ */

function mockBar(hostname, clock) {
  const bar = el("div", "mock-bar");
  const left = el("div", "mock-left");
  left.append(el("span", "mock-ws", "1"), el("span", "", "hyprland"), el("span", "", hostname));
  const right = el("div", "mock-right");
  right.append(el("span", "", "vol 64%"), el("span", "", clock));
  bar.append(left, right);
  return bar;
}

function windowBox({ className = "", title = "", body, close = true }) {
  const box = el("div", `mock-window ${className}`.trim());
  const bar = el("div", "mock-window-bar");
  if (close) bar.append(el("i", ""));
  bar.append(el("span", "", title));
  const content = el("div", "mock-window-body");
  if (body) content.append(body);
  box.append(bar, content);
  return box;
}

function termLines(lines) {
  const fragment = document.createDocumentFragment();
  lines.forEach((line) => {
    const row = el("div", "mock-term-line");
    const prompt = el("span", "prompt", line.prompt || "> ");
    const text = el("span", line.ok ? "ok" : "", line.text);
    row.append(prompt, text);
    fragment.append(row);
  });
  return fragment;
}

function codeLines(lines) {
  const fragment = document.createDocumentFragment();
  lines.forEach((parts, index) => {
    const row = el("div", "mock-code-line");
    row.append(el("span", "ln", String(index + 1)));
    const text = el("span");
    parts.forEach(([part, className]) => {
      text.append(el("span", className || "", part));
    });
    row.append(text);
    fragment.append(row);
  });
  return fragment;
}

function makeMockScreen(screen) {
  const palette = screen.palette || {};
  const root = el("div", `mock-screen mock-screen--${screen.motif || "dawn"}`);
  root.style.setProperty("--mock-bg", palette.bg || "#141a2e");
  root.style.setProperty("--mock-panel", palette.panel || "#e8b84b");
  root.style.setProperty("--mock-ink", palette.ink || "#f2e7d2");
  root.style.setProperty("--mock-accent", palette.accent || "#ff5d73");

  const clock = "06:41";
  const host = state.host || {};
  const hostname = host.hostname || "os";
  root.append(mockBar(hostname, clock));

  const desktop = el("div", "mock-desktop");
  root.append(desktop);

  switch (screen.motif) {
    case "rack": {
      const files = el("div", "mock-files mock-files--large");
      ["flac", "wav", "nix", "png", "mp3", "md", "conf", "zip", "cue", "log", "jpg", "txt"].forEach((extension) => {
        const file = el("div", "mock-file");
        file.append(el("span", "", extension));
        files.append(file);
      });
      const filesBody = el("div");
      filesBody.append(files);
      desktop.append(
        windowBox({
          className: "mock-window--rack-files",
          title: "~/music — this machine",
          body: filesBody,
        })
      );

      const playerBody = el("div", "mock-player");
      playerBody.append(el("div", "mock-album"));
      playerBody.append(el("div", "mock-track", "Midnight Canary"));
      playerBody.append(el("div", "mock-term-line", "The Velvet Static · 1967"));
      const eq = el("div", "mock-eq");
      for (let index = 0; index < 5; index += 1) eq.append(el("span"));
      playerBody.append(eq);
      desktop.append(
        windowBox({
          className: "mock-window--rack-player",
          title: "now playing",
          body: playerBody,
        })
      );
      desktop.append(el("div", "mock-clock", clock));
      desktop.append(el("div", "mock-date", "MONDAY · 05 NOVEMBER"));
      break;
    }
    case "code": {
      const fixture = [
        [["{", ""], [" config", "kw"], [", ", ""], ["pkgs", "str"], [", ... }", ""]],
        [["  # the machine", "cm"]],
        [["  ", ""], ["programs", "kw"], [".hyprland.enable = ", ""], ["true", "str"], [";", ""]],
        [["  services.pipewire = {", ""]],
        [["    enable = ", ""], ["true", "str"], [";", ""]],
        [["  };", ""]],
        [["  environment.systemPackages = [", ""]],
        [["    ", ""], ["kitty", "str"], [" waybar rofi-wayland", ""]],
        [["  ];", ""]],
        [["}", ""]],
      ];
      desktop.append(
        windowBox({
          className: "mock-window--big",
          title: `~/nixos-config/hosts/${hostname}/default.nix`,
          body: codeLines(fixture),
        })
      );
      const side = windowBox({
        className: "mock-window--side",
        title: "rebuild",
        body: termLines([
          { prompt: "> ", text: "nixos-rebuild switch", ok: true },
          { prompt: "> ", text: "building 42 paths...", ok: true },
          { prompt: "> ", text: "activation successful", ok: true },
        ]),
      });
      desktop.append(side);
      break;
    }
    case "lock": {
      const lock = el("div", "mock-lock");
      lock.append(el("div", "mock-clock", "03:12"));
      lock.append(el("div", "mock-lock-date", "SUNDAY · 05 NOVEMBER"));
      lock.append(el("div", "mock-lock-hint", "enter password to return to the room"));
      root.append(lock);
      break;
    }
    case "dawn":
    default: {
      const sun = el("div", "mock-sun");
      desktop.append(sun);
      desktop.append(
        windowBox({
          className: "mock-window--term",
          title: "~/nixos",
          body: termLines([
            { prompt: "~ ", text: "nix flake update", ok: true },
            { prompt: "~ ", text: `sudo nixos-rebuild switch --flake .#${hostname}`, ok: true },
            { prompt: "~ ", text: "now playing: Amber Receiver", ok: true },
            { prompt: "~ ", text: "", ok: false },
          ]),
        })
      );
      desktop.append(
        windowBox({
          className: "mock-window--side",
          title: "fastfetch",
          body: termLines([
            { prompt: "> ", text: `OS      ${host.os || "NixOS"}`, ok: true },
            { prompt: "> ", text: `WM      ${host.wm || "Hyprland"}`, ok: true },
            { prompt: "> ", text: `SHELL   ${host.shell || "fish"}`, ok: true },
            { prompt: "> ", text: `THEME   ${host.theme || "amber / charcoal"}`, ok: true },
          ]),
        })
      );
      desktop.append(el("div", "mock-clock", clock));
      desktop.append(el("div", "mock-date", "MONDAY · 05 NOVEMBER"));
      const dock = el("div", "mock-dock");
      for (let index = 0; index < 5; index += 1) dock.append(el("span"));
      desktop.append(dock);
      break;
    }
  }

  return root;
}

function attachMockScreen(container, screen) {
  container.replaceChildren(makeMockScreen(screen));
}

/* ------------------------------------------------------------------
   Screens + lightbox
------------------------------------------------------------------ */

function renderScreens(screens) {
  if (!dom.screenGrid) return;
  dom.screenGrid.replaceChildren();
  state.screens = screens;

  if (!screens.length) {
    dom.screenGrid.append(el("p", "panel-note", "No screens configured yet."));
    return;
  }

  screens.forEach((screen, index) => {
    const figure = el("figure", "screen-item");
    const button = el("div", "screen-tile");
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
    button.setAttribute("aria-haspopup", "dialog");
    button.dataset.index = String(index);
    const actionHint = el("span", "visually-hidden", `Preview screen: ${screen.title}`);

    const source = screen.src || screen.file;
    if (source) {
      const image = el("img", "screen-img");
      image.src = source;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      image.loading = "lazy";
      image.addEventListener("error", () => {
        const mock = makeMockScreen(screen);
        mock.setAttribute("aria-hidden", "true");
        button.replaceChildren(actionHint, mock);
        const badge = el("span", "placeholder-badge", "PLACEHOLDER");
        badge.setAttribute("aria-hidden", "true");
        button.append(badge);
        if (screen.src) showToast(`Could not load ${screen.src}. Showing a placeholder.`);
      });
      button.append(actionHint, image);
    } else {
      const mock = makeMockScreen(screen);
      mock.setAttribute("aria-hidden", "true");
      const badge = el("span", "placeholder-badge", "PLACEHOLDER");
      badge.setAttribute("aria-hidden", "true");
      button.append(actionHint, mock, badge);
    }

    const caption = el("figcaption", "screen-caption");
    caption.append(
      el("span", "screen-caption-title", screen.title),
      el("span", "screen-caption-index", `SCREEN ${padNumber(index + 1)}`)
    );
    figure.append(button, caption);
    button.addEventListener("click", () => {
      state.lastTrigger = button;
      openLightbox(index);
    });
    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      state.lastTrigger = button;
      openLightbox(index);
    });
    dom.screenGrid.append(figure);
  });
}

function renderLightbox() {
  if (!state.screens.length) return;
  const index = ((state.lightboxIndex % state.screens.length) + state.screens.length) % state.screens.length;
  state.lightboxIndex = index;
  const screen = state.screens[index];

  dom.lightboxKicker.textContent = `SCREEN ${padNumber(index + 1)} / ${padNumber(state.screens.length)}`;
  dom.lightboxTitle.textContent = screen.title;
  dom.lightboxCaption.textContent = screen.caption || "A NixOS desktop.";
  dom.lightboxCount.textContent = `${index + 1} / ${state.screens.length}`;

  const source = screen.src || screen.file;
  if (source) {
    dom.lightboxImg.hidden = false;
    dom.lightboxImg.src = source;
    dom.lightboxImg.alt = `${screen.title} — NixOS desktop`;
    dom.lightboxPlaceholder.replaceChildren();
    dom.lightboxFile.textContent = source;
    dom.lightboxImg.onerror = () => {
      dom.lightboxImg.hidden = true;
      attachMockScreen(dom.lightboxPlaceholder, screen);
      const note = el("div", "lightbox-add-note");
      note.append(
        document.createTextNode("Could not load this image. Expected: "),
        el("code", "", source)
      );
      dom.lightboxPlaceholder.append(note);
      dom.lightboxFile.textContent = `Missing: ${source}`;
    };
  } else {
    dom.lightboxImg.hidden = true;
    dom.lightboxImg.removeAttribute("src");
    attachMockScreen(dom.lightboxPlaceholder, screen);
    const note = el("div", "lightbox-add-note");
    note.append(
      document.createTextNode("Placeholder. Drop your screenshot at "),
      el("code", "", screen.file),
      document.createTextNode(".")
    );
    dom.lightboxPlaceholder.append(note);
    dom.lightboxFile.textContent = `Add: ${screen.file}`;
  }
}

function openLightbox(index) {
  if (!dom.lightbox) return;
  state.lightboxIndex = index;
  renderLightbox();
  if (!dom.lightbox.open) {
    if (typeof dom.lightbox.showModal === "function") {
      dom.lightbox.showModal();
    } else {
      dom.lightbox.setAttribute("open", "");
    }
  }
}

function closeLightbox() {
  if (!dom.lightbox) return;
  if (typeof dom.lightbox.close === "function") {
    dom.lightbox.close();
  } else {
    dom.lightbox.removeAttribute("open");
  }
}

function stepLightbox(direction) {
  if (!dom.lightbox?.open) return;
  state.lightboxIndex += direction;
  renderLightbox();
}

function bindLightbox() {
  dom.lightbox = $("#lightbox");
  dom.lightboxImg = $("#lightbox-img");
  dom.lightboxPlaceholder = $("#lightbox-placeholder");
  dom.lightboxTitle = $("#lightbox-title");
  dom.lightboxCaption = $("#lightbox-caption");
  dom.lightboxKicker = $("#lightbox-kicker");
  dom.lightboxFile = $("#lightbox-file");
  dom.lightboxCount = $("#lightbox-count");

  $("#lightbox-close")?.addEventListener("click", closeLightbox);
  $("#lightbox-prev")?.addEventListener("click", () => stepLightbox(-1));
  $("#lightbox-next")?.addEventListener("click", () => stepLightbox(1));

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
    state.lastTrigger?.focus?.();
  });
}

/* ------------------------------------------------------------------
   System card
------------------------------------------------------------------ */

function renderSystem(host = {}) {
  if (dom.sysHostname) dom.sysHostname.textContent = host.hostname || "os";

  const specs = [
    ["OS", host.os],
    ["KERNEL", host.kernel],
    ["WM", host.wm],
    ["SHELL", host.shell],
    ["TERMINAL", host.terminal],
    ["THEME", host.theme],
    ["CPU", host.cpu],
    ["GPU", host.gpu],
  ].filter(([, value]) => value);

  if (dom.sysSpecs) {
    dom.sysSpecs.replaceChildren();
    specs.forEach(([label, value]) => {
      const group = el("div");
      group.append(el("dt", "", label), el("dd", "", value));
      dom.sysSpecs.append(group);
    });
  }

  if (dom.neofetch) {
    const lines = [
      host.hostname || "os",
      "─────────────",
      `OS: ${host.os || "NixOS"}`,
      `Kernel: ${host.kernel || "linux-zen"}`,
      `WM: ${host.wm || "Hyprland"}`,
      `Shell: ${host.shell || "fish"}`,
      `Terminal: ${host.terminal || "kitty"}`,
      `CPU: ${host.cpu || "Intel"}`,
      `GPU: ${host.gpu || "Intel iGPU"}`,
    ];
    dom.neofetch.textContent = lines.join("\n");
  }
}

/* ------------------------------------------------------------------
   Nix syntax highlighting (small, state-free lexer for these files)
------------------------------------------------------------------ */

const NIX_TOKEN = /(#[^\n]*)|("(?:[^"\\]|\\.)*")|(\b(?:let|in|with|rec|inherit|if|then|else|assert|import)\b)|(\b(?:true|false|null)\b)|(\b(?:pkgs|lib|config|inputs|self|nixpkgs|home-manager)\b)|(\b\d+(?:\.\d+)?\b)|((?:\.{1,2}\/|\/)[^\s;)}\]]+)|([A-Za-z_][\w'-]*)(?=\s*=)|([{}[\]();:=@.])/g;

function tokenizeNixLine(line) {
  let result = "";
  let lastIndex = 0;
  NIX_TOKEN.lastIndex = 0;
  for (const match of line.matchAll(NIX_TOKEN)) {
    result += escapeHtml(line.slice(lastIndex, match.index));
    const [token, comment, string, keyword, boolean, builtin, number, path, attr, operator] = match;
    let className = "";
    if (comment) className = "tok-comment";
    else if (string) className = "tok-string";
    else if (keyword) className = "tok-keyword";
    else if (boolean) className = "tok-bool";
    else if (builtin) className = "tok-builtin";
    else if (number) className = "tok-number";
    else if (path) className = "tok-path";
    else if (attr) className = "tok-attr";
    else if (operator) className = "tok-op";
    result += className
      ? `<span class="${className}">${escapeHtml(token)}</span>`
      : escapeHtml(token);
    lastIndex = match.index + token.length;
  }
  result += escapeHtml(line.slice(lastIndex));
  return result || " ";
}

function renderCode(code) {
  state.activeCode = code;
  const lines = code.split("\n");
  const html = lines
    .map(
      (line, index) =>
        `<span class="code-line"><span class="ln">${index + 1}</span><span class="lc">${tokenizeNixLine(line)}</span></span>`
    )
    .join("");
  dom.codeInner.innerHTML = html;
}

async function loadConfig(config) {
  if (!config || !dom.codeInner) return;
  state.activeConfigId = config.id;
  dom.configMeta.textContent = `${config.label} · loading…`;
  dom.configRaw.href = config.path;
  dom.configRaw.textContent = `${config.label} ↗`;

  dom.configTabs.querySelectorAll("[data-config]").forEach((tab) => {
    const active = tab.dataset.config === config.id;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  if (!state.cache.has(config.id)) {
    dom.codeInner.innerHTML = `<span class="code-line"><span class="ln">…</span><span class="lc">loading ${escapeHtml(config.label)}…</span></span>`;
    try {
      const text = await fetchText(config.path);
      state.cache.set(config.id, text);
    } catch (error) {
      dom.codeInner.innerHTML = `<span class="code-line"><span class="ln">!</span><span class="lc token-error">Could not load ${escapeHtml(config.path)}. Serve the site over HTTP (not file://).</span></span>`;
      dom.configMeta.textContent = `${config.label} · unavailable`;
      dom.configStatus.textContent = `Could not load ${config.label}.`;
      showToast(`Could not load ${config.path}.`);
      // eslint-disable-next-line no-console
      console.error("[nixos]", error);
      return;
    }
  }

  if (state.activeConfigId !== config.id) return;
  const code = state.cache.get(config.id);
  renderCode(code);
  const lineCount = code.split("\n").length;
  dom.configMeta.textContent = `${config.label} · ${lineCount} lines`;
  dom.configStatus.textContent = `Loaded ${config.label}.`;
}

function renderTabs(configs) {
  if (!dom.configTabs) return;
  dom.configTabs.replaceChildren();
  state.configs = configs;
  configs.forEach((config, index) => {
    const tab = el("button", "config-tab", config.label);
    tab.type = "button";
    tab.dataset.config = config.id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("id", `config-tab-${config.id}`);
    tab.setAttribute("aria-controls", "code");
    tab.setAttribute("aria-selected", index === 0 ? "true" : "false");
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.addEventListener("click", () => {
      void loadConfig(config);
    });
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const nextIndex = (index + (event.key === "ArrowRight" ? 1 : -1) + configs.length) % configs.length;
      const next = configs[nextIndex];
      dom.configTabs.querySelectorAll("[data-config]")[nextIndex]?.focus();
      void loadConfig(next);
    });
    dom.configTabs.append(tab);
  });
}

function bindConfigActions() {
  $("#config-copy")?.addEventListener("click", async () => {
    if (!state.activeCode) return;
    try {
      await navigator.clipboard.writeText(state.activeCode);
      showToast("Nix file copied to the clipboard.");
    } catch {
      showToast("Could not copy the file.");
    }
  });
}

/* ------------------------------------------------------------------
   Init
------------------------------------------------------------------ */

export function initNixOS(data) {
  if (!data) return;
  dom.screenGrid = $("#screen-grid");
  dom.sysHostname = $("#sys-hostname");
  dom.sysSpecs = $("#sys-specs");
  dom.neofetch = $("#neofetch");
  dom.configTabs = $("#config-tabs");
  dom.configMeta = $("#config-meta");
  dom.configRaw = $("#config-raw");
  dom.configCopy = $("#config-copy");
  dom.configStatus = $("#config-status");
  dom.codeInner = $("#code-inner");

  state.host = data.host || {};
  renderSystem(data.host);
  renderScreens(Array.isArray(data.screens) ? data.screens : []);
  bindLightbox();
  bindConfigActions();

  const configs = Array.isArray(data.configs) ? data.configs : [];
  if (!configs.length) {
    if (dom.configMeta) dom.configMeta.textContent = "No config files configured.";
    return;
  }
  renderTabs(configs);
  void loadConfig(configs[0]);
}
