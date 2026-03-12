// Design system injected into every frontend generation prompt.
// Ensures consistent, professional output regardless of the job prompt.

export const DESIGN_SYSTEM = `
DESIGN SYSTEM — FOLLOW STRICTLY:

COLOR PALETTE:
  - Background:      #0f172a (slate-900)
  - Surface:         #1e293b (slate-800)
  - Surface Alt:     #334155 (slate-700)
  - Primary Accent:  #10b981 (emerald-500)
  - Accent Hover:    #059669 (emerald-600)
  - Text Primary:    #f8fafc (slate-50)
  - Text Secondary:  #94a3b8 (slate-400)
  - Border:          #334155 (slate-700)

TYPOGRAPHY:
  - Headings: "Space Grotesk", fallback: system-ui
  - Body:     "Inter", fallback: system-ui
  - Mono:     "JetBrains Mono", fallback: monospace
  - Include these Google Fonts CDN links in <head>

SPACING SCALE: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64px)

COMPONENT PATTERNS:
  - Cards:    rounded-2xl, 1px border, subtle shadow, backdrop-blur on glass variants
  - Buttons:  rounded-lg, py-3 px-6, font-semibold, hover:scale-105 transition
  - Inputs:   rounded-lg, border, bg-slate-800, focus:ring-2 focus:ring-emerald-500
  - Nav:      sticky top-0, backdrop-blur-md, border-b

ANIMATIONS:
  - Page load: fade-in with translateY(20px) → translateY(0)
  - Hover cards: scale(1.02) with transition 200ms
  - Buttons: scale(1.05) hover, scale(0.98) active
  - Stagger children with animation-delay increments of 100ms

LAYOUT:
  - Mobile-first, responsive breakpoints: sm(640), md(768), lg(1024), xl(1280)
  - Max content width: 1200px, centered
  - Default padding: px-4 sm:px-6 lg:px-8
  - Section padding: py-16 lg:py-24

MUST INCLUDE IN EVERY PROJECT:
  1. Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
  2. Google Fonts (Inter + Space Grotesk): proper <link> tags
  3. Dark mode by default (dark class on <html>)
  4. Light/Dark mode toggle button in nav
  5. Smooth scroll: html { scroll-behavior: smooth; }
  6. Responsive meta viewport tag
  7. Descriptive <title> and <meta description>
  8. Accessible: proper alt attributes, semantic HTML, aria-labels on buttons

FILE STRUCTURE TO GENERATE:
  - index.html       (main page — full, production-ready, not a stub)
  - css/styles.css   (custom CSS for animations and patterns not in Tailwind)
  - js/app.js        (interactivity: dark mode toggle, mobile nav, scroll effects)
  - README.md        (project name, description, setup: "open index.html in browser")
`;

export const REVIEW_CHECKLIST = `
REVIEW CHECKLIST — Check each item and fix if needed:

FUNCTIONALITY:
  □ All requirements from the original prompt are implemented
  □ All links work (or use # for demo placeholders)
  □ Dark/light mode toggle works correctly
  □ Mobile navigation menu opens and closes
  □ Forms have proper submit handlers (show alert or console.log for demo)
  □ Interactive elements respond to user input

DESIGN:
  □ Color palette matches the design system
  □ Typography is loaded and applied correctly
  □ Animations play on page load and hover
  □ Layout is responsive (works on 320px to 1440px width)
  □ No layout overflow or horizontal scroll on mobile

CODE QUALITY:
  □ No JavaScript errors (check console.log statements, not undefined vars)
  □ Tailwind classes are valid and not misspelled
  □ CSS custom properties are defined before use
  □ HTML is valid, all tags closed properly
  □ Images use placeholder URLs: https://placehold.co/600x400 format
`;

// Exact skill names from GET /api/v2/skills (maxPerAgent: 15)
export const AGENT_SKILLS = [
  "Copywriting",
  "Content Writing",
  "Code Review",
  "SEO",
  "Data Analysis",
  "Research",
  "Technical Writing",
  "Web Scraping",
  "API Integration",
  "Graphic Design",
  "Social Media Management",
  "Email Marketing",
  "Twitter Marketing",
  "Translation",
  "Community Management",
];
