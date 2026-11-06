/* Small shared helpers. No dependencies. */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export async function fetchJSON(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Could not load ${path} (${response.status} ${response.statusText})`);
  }
  return response.json();
}

export async function fetchText(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Could not load ${path} (${response.status} ${response.statusText})`);
  }
  return response.text();
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

export function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function padNumber(value, width = 2) {
  return String(value).padStart(width, "0");
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function debounce(fn, wait = 150) {
  let timeout = null;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), wait);
  };
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function createElement(tag, className = "", text = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

export function setText(selector, value, root = document) {
  const element = typeof selector === "string" ? $(selector, root) : selector;
  if (element && value !== undefined && value !== null) {
    element.textContent = String(value);
  }
  return element;
}

export function readStored(key, fallback = null) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* storage can be unavailable in private mode; ignore */
  }
}

let toastTimer = null;
export function showToast(message, duration = 4200) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, duration);
}

export function humanize(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function setRangeFill(input, percent) {
  if (!input) return;
  input.style.setProperty("--fill", `${clamp(percent, 0, 100)}%`);
}

export function on(element, event, handler, options) {
  if (!element) return () => {};
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}
