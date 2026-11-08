#!/usr/bin/env node
/**
 * Zero-dependency dev server for the portfolio.
 * Usage: node scripts/serve.mjs [port]
 */
import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] || process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".pl": "text/plain; charset=utf-8",
  ".nix": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};

function parseRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(String(header).trim());
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;

  let start;
  let end;
  if (rawStart === "") {
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? size - 1 : Number(rawEnd);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 0 || start >= size || end < start) return "invalid";
  return { start, end: Math.min(end, size - 1) };
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const filePath = path.resolve(root, "." + pathname);
    if (!filePath.startsWith(root + path.sep) && filePath !== root) {
      response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }
    const info = await stat(filePath);
    if (info.isDirectory()) {
      response.writeHead(301, { location: `${pathname.replace(/\/?$/, "/")}index.html` });
      response.end();
      return;
    }

    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const headers = {
      "content-type": type,
      "cache-control": "no-store",
      "accept-ranges": "bytes",
    };
    const range = parseRange(request.headers.range, info.size);
    if (range === "invalid") {
      response.writeHead(416, {
        "content-range": `bytes */${info.size}`,
        "content-type": "text/plain; charset=utf-8",
      });
      response.end("Range not satisfiable");
      return;
    }

    let status = 200;
    let start = 0;
    let end = info.size - 1;
    if (range) {
      status = 206;
      ({ start, end } = range);
      headers["content-range"] = `bytes ${start}-${end}/${info.size}`;
    }
    headers["content-length"] = String(Math.max(0, end - start + 1));

    response.writeHead(status, headers);
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    if (info.size === 0) {
      response.end();
      return;
    }

    const stream = createReadStream(filePath, { start, end });
    stream.on("error", (error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      if (!response.headersSent) {
        response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      }
      response.end("Server error");
    });
    stream.pipe(response);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end("Server error");
    // eslint-disable-next-line no-console
    console.error(error);
  }
});

server.listen(port, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`http://127.0.0.1:${port}/`);
});
