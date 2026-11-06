# Antoine KRAUS — work / tastes / NixOS

A static portfolio for **Antoine KRAUS**, AI engineer in Pau, France. Work comes first; the NixOS appendix and the record shelf are personal rooms after it.

Three sections, in page order:

1. **Selected work** — computer vision demos and embedded tests, SPIE stock handling, and LLVM IR vulnerability detection. All three projects now carry real captures.
2. **NixOS** — a screen gallery and a tabbed reader for the actual configuration files in `nixos/`.
3. **My tastes** — a small, browsable record shelf. Some covers are yours, some sleeves are generated; the audio is yours to add.

One typeface throughout: **Fira Mono Nerd Font**. The visual language is a warm black-and-gold 1970s dossier: typewritten labels, thin gold rules, smoke, and restrained colour.

No framework. No build step. Static files, vanilla JavaScript, local fonts, and no third-party runtime requests.

---

## Quick start

The page loads its manifests with `fetch`, so serve it over HTTP. Do not open `index.html` with `file://`.

```bash
cd needle-and-noise
node scripts/serve.mjs
# → http://127.0.0.1:4173/
```

Any static server will do:

```bash
python3 -m http.server 4173
```

All paths are relative, so the site works at a project URL such as `https://username.github.io/needle-and-noise/` and at a custom domain.

---

## Your identity and CV

Edit **`data/site.json`**:

```json
{
  "brand": "Antoine KRAUS",
  "name": "Antoine KRAUS",
  "role": "AI engineer, computer vision and systems",
  "location": "Pau, France",
  "email": "antoinep.kraus@gmail.com",
  "links": [
    { "label": "LinkedIn", "href": "https://www.linkedin.com/in/antoinepkraus/" },
    { "label": "Email", "href": "mailto:antoinep.kraus@gmail.com" },
    { "label": "Résumé", "href": "assets/Antoine-KRAUS-Resume.pdf", "download": true }
  ],
  "footer": "Built by hand. Served by GitHub Pages."
}
```

The name, role, location, email and links are populated at runtime. The footer and outro link to the CV.

The CV is at **`assets/Antoine-KRAUS-Resume.pdf`**. Replace that file when the CV changes; keep the path in `site.json` or update both.

The large header wordmark is defined directly in `index.html`. `brand` in `site.json` controls the browser title.

The hero detection card (webcam frame, enlarged title, timings, always-visible raw JSON) is static markup in `index.html`; the frame is `assets/vision/webcam-frame.jpg`.

---

## Selected work

The section is driven by **`data/work.json`**.

```json
{
  "projects": [
    {
      "id": "computer-vision",
      "featured": true,
      "title": "Computer Vision",
      "org": "Maison de l'Intelligence Artificielle",
      "place": "Oujda, Morocco",
      "period": "2025",
      "role": "AI Engineer",
      "summary": "Object detection on industrial datasets, pushed to embedded hardware.",
      "description": "Longer project note.",
      "highlights": ["...", "..."],
      "stack": ["YOLOv8", "OpenCV", "OpenVINO"],
      "motif": "vision",
      "screens": [
        {
          "file": "assets/work/vision5.jpg",
          "caption": "Embedded test rig",
          "type": "image"
        },
        {
          "file": "assets/work/vision1.mp4",
          "caption": "Drone test / Oujda",
          "type": "video",
          "poster": "assets/work/vision1-poster.jpg"
        }
      ]
    }
  ]
}
```

### Adding screenshots and videos

Put the captures in **`assets/work/`**, then list the file in the project. If `src` is omitted, the `file` path is used directly; if the file is missing, the generated plate comes back. That means dropping the media into `assets/work/` is enough when the manifest already names it.

```json
{
  "file": "assets/work/vision5.jpg",
  "caption": "Embedded test rig",
  "type": "image"
}
```

For a video, add a poster frame (a still extracted from the video) so the card and inline stage have a proper preview:

```json
{
  "file": "assets/work/vision1.mp4",
  "caption": "Drone test / Oujda",
  "type": "video",
  "poster": "assets/work/vision1-poster.jpg"
}
```

- **`src`** — optional override. If missing, `file` is used.
- **`file`** — the asset path. The placeholder and inline stage use it as the drop-in instruction.
- **`type`** — `image` or `video`. If omitted, the extension decides.
- **`poster`** — a still for a video. Without it, the browser shows the first frame (or black).
- **`caption`** — shown in the inline stage, card labels and alt text.
- **`motif`** — controls the fallback drawing: `logistics`, `vision`, `code`, or `graph`.

The slots currently used by `data/work.json`:

```text
assets/work/vision5.jpg              # featured still
assets/work/vision4.jpg              # OpenCV detection still
assets/work/vision1.mp4              # drone test
assets/work/vision2.mp4              # workshop flight
assets/work/vision3.mp4              # ground robot test
assets/work/vision1-poster.jpg
assets/work/vision2-poster.jpg
assets/work/vision3-poster.jpg
assets/work/SPIE.png                 # stock-handler example
assets/work/llvm_example.png         # LLVM IR example
assets/work/CodePropertyGraph.png    # code property graph
```

Replace a poster with a new frame when the video changes:

```bash
ffmpeg -ss 2 -i assets/work/vision1.mp4 -frames:v 1 -q:v 3 assets/work/vision1-poster.jpg
```

Recommended stills: roughly 1600×1000 or 1440×900. Video: H.264/MP4 is the safest format. Clicking a video thumbnail swaps it into the large inline stage and starts playback with native controls; no popup.

The featured project is marked with `"featured": true`. The remaining projects appear in the grid with all of their screens visible: a single screen fills the card, multiple screens become a two-column gallery inside the card. The featured project keeps its other screens as thumbnails below the large stage. Clicking a thumbnail replaces the stage and starts a video if needed — there is no work popup.

The placeholder plates are deliberately diagrams, not fake product screenshots. They now only appear if a listed file is missing.

---

## NixOS

The NixOS room is a screen gallery plus a live reader for a curated subset of the public configuration at [Kraus-Mara/nixos-config](https://github.com/Kraus-Mara/nixos-config).

- Screenshots live in **`assets/screens/`** and are configured in **`data/nixos.json`**. `src` overrides the path; otherwise `file` is loaded automatically. A missing file falls back to the generated CRT placeholder.
- The system card and neofetch read the `host` object in `data/nixos.json` (currently `B550M DS3H`, NixOS 26.11, Linux 7.1.9-zen1, AMD Ryzen 5 5500, GTX 980).
- The config tabs read the files listed in `data/nixos.json`; the mirrored set includes `nixos/flake.nix`, `nixos/hosts/os/default.nix`, and the core/Home Manager modules.
- The real repository has four hosts (`desktop`, `os`, `laptop`, `vm`), a `modules/core` graph, and two Home Manager parents (`parent_home` for Hyprland, `parent_gnome_home` for GNOME).
- The site mirrors the files needed for the reader, not the hardware configurations; `hosts/*/hardware-configuration.nix` and secrets stay out of the deployed copy.

The config reader uses line numbers, a simple Nix highlighter, copy, local raw-file links, the GitHub source link and keyboard-scrollable code.

---

## My tastes

The shelf data lives in **`data/music.json`**; the section is “My tastes”.

Put assets here:

```text
assets/covers/web/ ← web-sized sleeve images (the site uses these)
assets/covers/     ← originals
assets/music/      ← audio files
```

Each record:

```json
{
  "id": "midnight-canary",
  "title": "Midnight Canary",
  "artist": "The Velvet Static",
  "year": 1967,
  "era": "60s",
  "genre": "Psychedelic soul",
  "label": "Amber Sound",
  "catalog": "MT-001",
  "note": "A basement tape with the windows open...",
  "cover": "assets/covers/web/midnight-canary.webp",
  "audio": "assets/music/midnight-canary.mp3",
  "palette": { "bg": "#d96c3b", "ink": "#f4e6c8", "accent": "#2f4a3a", "accent2": "#1b1510" },
  "motif": "sun"
}
```

- `cover: null` generates a sleeve from `palette` + `motif`.
- `cover: "assets/covers/web/..."` uses the real image; the originals in `assets/covers/` are kept. If the image fails, the generated sleeve returns.
- `audio: null` leaves the player in `MASTER PENDING`.
- `audio: "assets/music/..."` enables play, pause, seek, volume and Media Session metadata. The previous/next buttons have been removed from the player.
- `era` is used by the filter chips: `60s`, `70s`, `80s`, `90s`.
- `motif` is one of `sun`, `orbit`, `wave`, `road`, `grid`, `bloom`, `stripes`, `glitch` when the cover is generated.
- The shelf currently mixes your covers with a few generated sleeves; the remaining fictional records can be replaced or removed.

Audio is only loaded when a record is selected, so the shelf itself stays light.

---

## Project structure

```text
needle-and-noise/
├── index.html
├── .nojekyll
├── .github/workflows/pages.yml
├── assets/
│   ├── Antoine-KRAUS-Resume.pdf
│   ├── css/style.css
│   ├── fonts/
│   │   ├── FiraMonoNerdFont-Regular.woff2
│   │   ├── FiraMonoNerdFont-Bold.woff2
│   │   └── OFL-FiraMonoNerdFont.txt
│   ├── img/favicon.svg
│   ├── js/
│   │   ├── main.js            # boot, site data, nav, reveal
│   │   ├── work.js            # work stage, thumbnails, media
│   │   ├── music.js           # shelf, procedural sleeves, player
│   │   ├── nixos.js           # screens, lightbox, Nix highlighter
│   │   └── utils.js
│   ├── work/                  # stills, videos and video posters
│   ├── vision/                # hero webcam detection frame
│   ├── covers/                # original covers
│   ├── covers/web/            # web-sized covers used by the page
│   ├── music/                 # audio masters
│   └── screens/               # NixOS screenshots
├── data/
│   ├── site.json              # identity + links
│   ├── work.json              # projects + screen slots
│   ├── music.json             # records
│   └── nixos.json             # screens + host + config list
├── nixos/                     # curated mirror of Kraus-Mara/nixos-config
│   ├── flake.nix
│   ├── hosts/os/default.nix
│   └── modules/
│       ├── core/
│       │   ├── default.nix
│       │   └── user.nix
│       └── parent_home/
│           ├── default.nix
│           └── home/hyprland/default.nix
├── scripts/serve.mjs          # zero-dependency local server
└── README.md
```

---

## Deploy to GitHub Pages

The repository root should be this folder, the one containing `index.html`.

1. Create a GitHub repository and push these files to `main` (or `master`).
2. In **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**.
3. The included workflow (`.github/workflows/pages.yml`) stages a clean `dist/` copy — excluding `.git`, `.github`, `scripts/` and the README — and deploys it.
4. Push, wait for the workflow, and open the Pages URL.

Notes:

- `.nojekyll` is included.
- All URLs are relative, so project pages work without a base-path setting.
- For a custom domain, add a `CNAME` file at the root and configure it under Pages.
- There is no build step and no `node_modules` to commit.
- If this folder lives inside a larger repository, adjust the workflow paths and the upload root.

---

## Placeholder checklist

- [ ] Add more captures to `assets/work/` and list them in `data/work.json` if needed.
- [ ] Add audio in `assets/music/` and replace the remaining generated sleeves.
- [ ] Replace the NixOS screen placeholders with your real screens.
- [ ] Update the mirrored `nixos/` files when the upstream config changes.
- [ ] Update the `host` object in `data/nixos.json`.
- [ ] Update the CV PDF if your résumé changes.
- [ ] Update the LinkedIn/email links in `data/site.json` if they change.
- [ ] Run `node scripts/serve.mjs` and check the page over HTTP before pushing.

---

## Notes and credits

- **Typeface**: Fira Mono Nerd Font, subsetted to the Latin text and punctuation used here. The font is licensed under the SIL Open Font License; the license is at `assets/fonts/OFL-FiraMonoNerdFont.txt`. Source: [Nerd Fonts](https://www.nerdfonts.com/).
- **Work plates**: real stills and videos where available; generated diagrams only for the remaining empty slots. The computer-vision thumbnails use video posters with a play badge, and selecting one loads it into the inline stage and starts playback. No work modal.
- **Record sleeves**: real covers when supplied; generated from the record palette and motif when `cover` is null.
- **NixOS**: the reader mirrors a curated subset of [Kraus-Mara/nixos-config](https://github.com/Kraus-Mara/nixos-config); hardware configurations are intentionally not copied.
- **Accessibility**: keyboard-operable controls, visible focus, reduced-motion support, native dialogs, labelled work and screen plates, and a skip link. The audited desktop and mobile states report no axe-core WCAG 2.1 A/AA violations.
- **Browser support**: current Chromium, Firefox and Safari. The page uses container queries, `color-mix()`, native `<dialog>` and ES modules. Very old browsers will degrade to a static, partially styled page.
- **Privacy**: no analytics, no tracking, no third-party requests at runtime. The only external links are the ones you click (LinkedIn, email, credits).
- **Audio**: local files are recommended. If you point `audio` at a remote URL, the host must allow cross-origin playback.
