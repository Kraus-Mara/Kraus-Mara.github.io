import {
  $,
  $$,
  fetchJSON,
  prefersReducedMotion,
  setText,
} from "./utils.js";
import { initWork } from "./work.js";
import { initMusic } from "./music.js";
import { initNixOS } from "./nixos.js";

/* ------------------------------------------------------------------
   Site metadata
------------------------------------------------------------------ */

function renderOutroLinks(site) {
  const container = $("#outro-links");
  if (!container) return;
  const links = Array.isArray(site.links) ? [...site.links] : [];
  if (
    site.email &&
    !links.some((link) => typeof link?.href === "string" && link.href.startsWith("mailto:"))
  ) {
    links.push({ label: "Email", href: `mailto:${site.email}` });
  }
  if (!links.length) return;
  container.replaceChildren();
  links.forEach((link) => {
    if (!link || !link.href || !link.label) return;
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.textContent = link.label;
    if (/^https?:/i.test(link.href)) {
      anchor.target = "_blank";
      anchor.rel = "noopener";
      anchor.textContent = `${link.label} ↗`;
    }
    if (link.download) {
      anchor.download = link.href.split("/").pop() || "resume.pdf";
    }
    container.append(anchor);
  });
}

function applySite(site) {
  if (!site) return;
  $$("[data-site]").forEach((element) => {
    const field = element.dataset.site;
    if (field && site[field] !== undefined) {
      element.textContent = site[field];
    }
  });
  renderOutroLinks(site);
  if (site.brand) {
    document.title = `${site.brand} — AI Engineer`;
  }
}

async function initSite() {
  try {
    const site = await fetchJSON("data/site.json");
    applySite(site);
  } catch (error) {
    // The HTML already contains readable fallbacks; do not break the page.
    // eslint-disable-next-line no-console
    console.warn("[site] using inline identity:", error);
  }
}

/* ------------------------------------------------------------------
   Header / progress / active section
------------------------------------------------------------------ */

function initHeader() {
  const header = $("#site-header");
  const progress = $("#scroll-progress-bar");
  const navLinks = $$(".site-nav a");
  const sections = ["work", "nixos", "my-tastes"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const linkById = new Map(
    navLinks.map((link) => [link.getAttribute("href")?.replace("#", ""), link])
  );

  let ticking = false;
  const update = () => {
    ticking = false;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    header?.classList.toggle("is-scrolled", scrollTop > 10);
    if (scrollTop < 80) {
      navLinks.forEach((link) => {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      });
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();

  if (!("IntersectionObserver" in window) || !sections.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.remove("is-active");
          link.removeAttribute("aria-current");
        });
        const link = linkById.get(entry.target.id);
        if (link) {
          link.classList.add("is-active");
          link.setAttribute("aria-current", "true");
        }
      });
    },
    { rootMargin: "-38% 0px -55% 0px", threshold: 0 }
  );
  sections.forEach((section) => observer.observe(section));
}

/* ------------------------------------------------------------------
   Reveal on scroll
------------------------------------------------------------------ */

function initReveal() {
  const targets = $$(
    ".hero-copy, .section-head, .work-feature, .work-grid, .shelf-toolbar, .listening-layout, .nix-layout, .config-explorer, .outro-inner, .outro-art"
  );
  if (!targets.length) return;

  targets.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.transitionDelay = `${Math.min(index * 45, 180)}ms`;
  });

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    targets.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
  );

  targets.forEach((element) => observer.observe(element));
}

/* ------------------------------------------------------------------
   Section boot with independent failure handling
------------------------------------------------------------------ */

async function initWorkSection() {
  try {
    const data = await fetchJSON("data/work.json");
    if (!Array.isArray(data.projects) || !data.projects.length) {
      throw new Error("work.json has no projects.");
    }
    initWork(data);
  } catch (error) {
    const feature = $("#work-feature");
    if (feature) {
      feature.textContent =
        "The work file could not be loaded. Serve the site over HTTP and check data/work.json.";
    }
    // eslint-disable-next-line no-console
    console.error("[work]", error);
  }
}

async function initMusicSection() {
  try {
    const data = await fetchJSON("data/music.json");
    if (!Array.isArray(data.records)) throw new Error("music.json has no records array.");
    initMusic(data.records);
  } catch (error) {
    const shelf = $("#shelf");
    if (shelf) {
      shelf.textContent =
        "The record shelf could not be loaded. Serve the site over HTTP and check data/music.json.";
    }
    // eslint-disable-next-line no-console
    console.error("[music]", error);
  }
}

async function initNixosSection() {
  try {
    const data = await fetchJSON("data/nixos.json");
    initNixOS(data);
  } catch (error) {
    const grid = $("#screen-grid");
    if (grid) {
      grid.textContent = "The screen gallery could not load data/nixos.json.";
    }
    setText("#config-meta", "config unavailable");
    // eslint-disable-next-line no-console
    console.error("[nixos]", error);
  }
}

function setYear() {
  const year = String(new Date().getFullYear());
  const element = $("#year");
  if (element) element.textContent = year;
}

/* ------------------------------------------------------------------
   Main
------------------------------------------------------------------ */

function boot() {
  setYear();
  initHeader();
  initReveal();

  // Every room can fail without taking the rest of the file down.
  void Promise.allSettled([
    initSite(),
    initWorkSection(),
    initMusicSection(),
    initNixosSection(),
  ]);

  // A small signature for the devtools crowd.
  // eslint-disable-next-line no-console
  console.log(
    "%cANTOINE KRAUS%c  work · tastes · nixos\n%cFira Mono Nerd Font / no framework / no tracking%c",
    "background:#c6a15b;color:#100b08;padding:2px 6px;font-weight:700",
    "color:#c6a15b",
    "color:#8e7d68",
    "color:#5f5544"
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
