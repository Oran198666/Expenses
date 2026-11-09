# Milestone 6 — About, Architecture Overview & Final Production Deployment (Plan)

## Goal
- Replace the About placeholder with the real page: a description of the app, a description of the developer, and the developer photo.
- Add the **Architecture Diagram** at the bottom of the About page.
- Make sure Production is ready, then put the final version live on Vercel with the usual GitHub push.

**No database changes** in this milestone. Migrations 0001–0003 are already in Production (SETUP.md, steps 7–9), and Milestone 5 added none.

## Decisions already made with you
- **Diagram placement:** at the bottom of the About page, not a separate page. The menu keeps the four pages the PRD lists (plus Categories, as today).
- **Photo:** `public/dev.jpg` (441×419). It's shown in a square frame, centered a little left so your face is in the middle.
- **Developer text** (your text, with this project's technologies):
  > Senior QA Engineer with over 11 years of experience in backend systems and data validation. Currently expanding into full-stack development through this course, building on prior training in JavaScript, HTML, and CSS at John Bryce. Experienced with Python, REST APIs, SQL, and working across development and product teams — this project brought together Next.js (React), TypeScript, Node.js, Tailwind CSS, Supabase (PostgreSQL and authentication), and deployment on Vercel.
- **App description:** written from the PRD. **Please approve or edit it:**
  > Expense Tracker is a responsive website for recording, organizing, filtering, analyzing, and exporting your personal expenses. One account works on your phone, tablet, and computer, and your data is stored centrally so it's the same everywhere. Add expenses with a category, currency, and date; manage your own categories; find expenses with built-in filters or your own saved filters; see spending by category, year, and month — one currency at a time, never mixed; and download your records as CSV or PDF.

## Choices made where the spec is silent (you can change them)
- **No name** is shown, because none was given. The photo caption is "Developer".
- **The About page stays behind sign-in**, like the other menu pages today.
- **Diagram content** follows the wireframe and mockup exactly. Categories appear inside the Expense box, as the wireframe shows ("Expense (Category, Amount, Date, Currency)").
  - **Database Schema:** Auth User → Expense (Category, Amount, Date, Currency) → Saved Filter.
  - **Architecture Diagram:** Centralized Supabase Data Store → Vercel Backend.
  - A dashed divider links the two sides, as in the wireframe.
- **How the diagram is drawn:** with the page's own boxes and arrows, not an image. The text stays sharp, readable and selectable.
  - Desktop: the two diagrams side by side, as in the wireframe.
  - Phones: stacked, with arrows pointing down. No sideways scrolling.
  - Boxes use the neon-outlined card style from the mockup (cyan and pink borders, glow).

## Screen — About (`/about`)
Layout follows the wireframe and mockup:
1. **Heading** "About" with a short subtitle.
2. **Top card:**
   - Desktop: photo frame on the left; on the right, two text blocks, "Application Description" and "About the Developer".
   - Phones: photo on top, then the two text blocks.
3. **"System Architecture" card:** the two diagrams described above, with a one-line caption under each, e.g. "Each user's expenses and saved filters belong to their account."

## Code structure
**New**
- `src/components/about/architecture-diagram.tsx`: the boxes and arrows (static, no data).

**Changed**
- `src/app/(app)/about/page.tsx`: replaces the placeholder. A static page; the photo uses Next.js `Image` from `/dev.jpg` with alt text "Photo of the developer".
- `src/app/globals.css`: a few small styles for the diagram boxes and arrows.
- `spec/ARCHITECTURE.md`: ADR-19 (below).
- `spec/MILESTONES.md`: 🟡 at the end of the build.

**No new packages.**

## ADR to add
- **ADR-19:** The Architecture Diagram is part of the About page and built from HTML/CSS boxes, not a separate menu page or an image file. It follows the wireframe's three schema entities (categories shown inside Expense).

## Production deployment (at push time, after your approval)
Deployment works the way ARCHITECTURE.md defines it: pushing to GitHub makes Vercel build and publish the site.
1. **Before the push** I confirm with you:
   - There are no new database changes, so nothing to run in Production.
   - Vercel has all 4 settings (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_ENV` = `production`, `SUPABASE_SECRET_KEY`) with the **Production** values. I'll give you click-by-click steps to check this in Vercel; I don't touch Vercel myself.
2. **Push** (your "Push changes to GitHub" also approves the milestone). This also publishes Milestones 5 and 6 on the live site.
3. **After the push:**
   - I'll guide you to watch Vercel → Deployments until it says **Ready**.
   - I'll open https://expenses-mauve-ten.vercel.app/ in the browser pane and check the public pages load (Login, Register) with no errors.
   - **You** then do the signed-in checks on the live site. I won't sign in or create accounts there, because it holds real data. I'll give you a short checklist: register or log in, add, update and delete an expense, use a filter, see reports, export CSV and PDF, and open About.

## How I'll check it during the build (Development only)
1. `npm run lint` and `npm run build` pass.
2. In the built-in browser, signed in as `testpilot1`:
   - The About page shows the photo, both text blocks and the diagram, matching the wireframe.
   - Desktop and phone sizes: readable, no sideways scrolling, photo not stretched.
   - The rest of the app is unchanged: the menu works on all pages.

## Definition of Done (from MILESTONES.md)
- The About page shows the static application description, developer description and developer photograph, in the design style, on phone and desktop.
- The Architecture Diagram shows the schema entities and infrastructure relationships, readable on phone and desktop.
- All database migrations are in Production (none new), and Vercel has the Production settings.
- The app is deployed to Vercel, the live site uses the Production database, and the main flows work on the live site (you check the signed-in ones).

## What you'll need to do
- **Now:** approve or edit the app description above.
- **During the build:** nothing.
- **At push time:**
  - check the Vercel settings with my steps;
  - approve the push;
  - do the signed-in checks on the live site.
