# Design and Styles Guide - Kristoff Kriollo Webpage

This document details the visual identity, design system, and aesthetic conventions of the official **Kristoff Kriollo** website. Developers and AI agents must follow these guidelines to maintain user interface consistency.

---

## 🎨 Color Palette

The color palette reflects the dynamism, Cuban roots, and humorous tone of the content creator. It is defined in `tailwind.config.mjs` under `theme.extend.colors`:

| Name | Hex Color | Primary Use | Description |
| :--- | :--- | :--- | :--- |
| `primary` | `#FF3B3B` | Main buttons, section titles, prominent visual accents. | Vibrant red, full of energy and passion. |
| `secondary` | `#111111` | Dark backgrounds, main text, secondary buttons. | Black / Very dark gray, provides sobriety and high contrast. |
| `accent` | `#FFD600` | Subtitles, highlighted text in dark sections, special details. | Bright yellow, used to draw attention to key elements. |
| `background` | `#FFFFFF` | General page background in the light version. | Pure white, a clean base for content and media. |

---

## 🔤 Typography

Fonts are sourced from Google Fonts and are preconnected and loaded in [Layout.astro](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/src/layouts/Layout.astro).

1. **Headings and Titles (`font-heading`)**:
   - **Fonts**: `Anton`, `Bebas Neue`, `sans-serif`
   - **Tailwind Class**: `font-heading`
   - **Convention**: Always written in **uppercase** (`uppercase`) with expanded letter-spacing (`tracking-wide` or `tracking-widest`).

2. **Body Text (`font-body`)**:
   - **Fonts**: `Poppins`, `Inter`, `sans-serif`
   - **Tailwind Class**: `font-body`
   - **Convention**: Legible style, normal to semi-bold weights for paragraphs and descriptions.

---

## 🧱 Global Components and CSS Classes

Defined in [global.css](file:///Users/albertolicea00/Develop/cuban_influencer_projects/kristoff/src/styles/global.css) using Tailwind CSS `@apply` directives.

### 1. Buttons (`.btn-*`)
All buttons have smooth transitions, dynamic shadows, and a scale-down effect when clicked (`active:scale-95`).

* **Primary Button (`.btn-primary`)**:
  * **Classes**: `bg-primary text-white font-heading text-xl md:text-2xl uppercase tracking-wider px-8 py-3 rounded hover:bg-red-700 transition-all shadow-lg active:scale-95`
  * **Usage**: Most important calls to action (e.g. "Watch my videos", "Send proposal").

* **Secondary Button (`.btn-secondary`)**:
  * **Classes**: `bg-background text-secondary border-2 border-secondary font-heading text-xl md:text-2xl uppercase tracking-wider px-8 py-3 rounded hover:bg-secondary hover:text-white transition-all shadow-lg active:scale-95`
  * **Usage**: Secondary actions or actions placed on light backgrounds.

* **Accent Button (`.btn-accent`)**:
  * **Classes**: `bg-accent text-secondary font-heading text-xl md:text-2xl uppercase tracking-wider px-8 py-3 rounded hover:bg-yellow-500 transition-all shadow-lg active:scale-95`
  * **Usage**: Actions inside dark blocks or specific promotions.

### 2. Section Title (`.section-title`)
* **Classes**: `text-5xl md:text-7xl font-bold mb-8 md:mb-12 text-center text-primary`
* **Usage**: Main header to delimit new sections (Videos, About Me, Community, etc.).

### 3. Scrollbar
A customized modern scrollbar is defined for webkit browsers:
* Track: `#f1f1f1` (Light gray)
* Thumb: `#ff3b3b` (Primary red)
* Thumb Hover: `#cc0000` (Dark red)

---

## 🎬 Animations and Micro-interactions

The project uses dynamic visual effects to engage the user:

* **Floating Animation (`float`)**:
  * Vertically shifts the element from `translateY(0px)` to `translateY(-20px)`.
  * Useful for simulating elements flying or hovering in the background (e.g., emojis, floating photos).
* **Marquee Effect (`marquee`)**:
  * Infinite horizontal scrolling from right to left (`translateX(100%)` to `translateX(-100%)`).
  * Ideal for dynamic banners, rolling text, or quick reviews.
* **Card Hover**:
  * Project/video cards should lift slightly on cursor hover (`hover:-translate-y-2`) and feature scale transitions or opacity changes on their internal images.
