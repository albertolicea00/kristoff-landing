# AI Agents Guidelines - Kristoff Kriollo Webpage

This document is designed specifically for AI agents (such as Antigravity, Claude, or GPTs) to understand the project architecture, follow established coding conventions, and modify or add code safely and consistently.

---

## 🗺️ 1. Project Map (Directory Structure)

All code modifications and additions must strictly align with the project's folder conventions:

- 📁 `src/pages/`
  - **Astro File-based Routing**.
  - **Multi-language Structure:**
    - Spanish (Primary language): Routes are placed directly in `src/pages/` (e.g., `src/pages/index.astro`, `src/pages/projects.astro`, `src/pages/developers.astro`).
    - English: Mirror routes are placed under the `en/` folder (e.g., `src/pages/en/index.astro`).
- 📁 `src/components/`
  - **Modular Astro Components**. Must be self-contained and reusable.
  - Examples: `Hero.astro`, `About.astro`, `Videos.astro`, `Community.astro`, `Projects.astro`, `Support.astro`, `Collabs.astro`, `Header.astro`, `Footer.astro`.
- 📁 `src/layouts/`
  - Contains [Layout.astro](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/src/layouts/Layout.astro), which wraps all pages. Defines the base HTML markup, loads Google Fonts (Anton + Bebas Neue + Inter + Poppins), sets SEO meta tags, and injects global styles.
- 📁 `src/i18n/`
  - Internationalization logic. Contains [ui.ts](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/src/i18n/ui.ts) translation dictionaries, and [utils.ts](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/src/i18n/utils.ts) for routing and translation helper functions.
- 📁 `src/styles/`
  - [global.css](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/src/styles/global.css): Integrates Tailwind CSS directives and defines all custom component classes (`.btn-primary`, `.btn-secondary`, `.btn-accent`, `.section-title`, custom webkit scrollbar, and `@keyframes` animations like `float` and `marquee`).
- 📁 `src/utils/`
  - Helper libraries and scrapers for external integrations (no API keys required).
  - [youtube.ts](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/src/utils/youtube.ts): Scrapes channel video grids from YouTube.
  - [twitch.ts](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/src/utils/twitch.ts): Checks Twitch livestream status using GraphQL endpoint.
  - [social.ts](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/src/utils/social.ts): Scrapes YouTube/Instagram/TikTok subscriber counts and social stats.
- 📁 `src/scripts/`
  - Contains client-side interactive scripts, such as [videos.ts](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/src/scripts/videos.ts).

---

## 🛠️ 2. Development Rules & Best Practices

### 🌐 A. Internationalization (i18n)

The project is bilingual (Spanish/English). Any component or page displaying text to the user must use the i18n translation system:

1. **Do not hardcode text strings** directly in HTML elements.
2. Add translation entries in [ui.ts](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/src/i18n/ui.ts) under both `es` and `en` keys.
3. In the Astro frontmatter of the file, retrieve translations using:
   ```astro
   ---
   import { getLangFromUrl, useTranslations } from "../i18n/utils";
   const lang = getLangFromUrl(Astro.url);
   const t = useTranslations(lang);
   ---

   <h1>{t("hero.title")}</h1>
   ```

### 🎨 B. Design System & Style Usage

1. **Tailwind Usage:** Rely on Tailwind utility classes (`flex`, `grid`, `text-*`, `bg-*`, etc.) where possible.
2. **Color Tokens:** Strictly reference the theme colors: `primary` (`#FF3B3B`), `secondary` (`#111111`), `accent` (`#FFD600`), and `background` (`#FFFFFF`). Do not use arbitrary colors unless strictly necessary.
3. **Custom Component Classes:** Reuse classes from [global.css](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/src/styles/global.css) for standard UI elements:
   - Primary Button: `class="btn-primary"`
   - Secondary Button: `class="btn-secondary"`
   - Accent Button: `class="btn-accent"`
   - Section Title: `class="section-title"`
4. **Typography Rules:**
   - Use headings (`h1` through `h6`) which apply `font-heading`, `uppercase`, and `tracking-wide`.
   - Use `font-body` (`Poppins`/`Inter`) for body paragraphs, descriptions, and standard UI elements.
5. Review [DESIGN.md](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/DESIGN.md) for full style details, custom scrollbars, and keyframe animations (`float`, `marquee`).

### 🧩 C. Astro Components and Client Interactivity

1. Properly separate frontmatter logic (TypeScript imports, translations, scraper fetches) from the template.
2. Keep components small, modular, and focused on a single task. Always declare strict interfaces for `Props` when creating reusable components.
3. For client-side interactivity, use standard client hydration directives (e.g. `client:load`, `client:visible`) or native Astro `<script>` tags inside components.

### 🛡️ D. Accessibility & SEO

1. Ensure there is only **one** `<h1>` per page.
2. Use HTML5 semantic markup (`<main>`, `<section>`, `<nav>`, `<header>`, `<footer>`).
3. Include descriptive `alt` tags on all images.
4. Ensure text contrast against backgrounds (especially red `#FF3B3B` and yellow `#FFD600`).

---

## 🤖 3. Operational Rules for AI Agents

When working inside this repository, keep in mind these environment and workflow constraints:

1. **Do not make direct Git commits (`git commit` / `git push`)** unless the user explicitly requests it in the current prompt.
2. **Code Integrity:** Maintain existing comments, type declarations, and docstrings that are unrelated to your current changes.
3. **Validation:** Before declaring a task finished, build the project locally (`npm run build`) to verify that there are no TypeScript compiler errors or routing issues.
4. **Premium UI Quality:** The user expects highly polished, stunning interfaces. When modifying or adding components, make sure they are responsive (mobile-first) and implement proper hovers, scales, and transitions.
