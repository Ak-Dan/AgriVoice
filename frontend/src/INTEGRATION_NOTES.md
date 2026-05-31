# Dashboard integration — what to do

## 1. Install dependencies
```
npm install react-router-dom d3
npm install -D @types/d3
```
(No topojson-client needed — geoBoundaries serves GeoJSON directly.)

## 2. File placement (in frontend/src)
```
src/
  main.tsx              <- REPLACE (now wraps <App/> in <BrowserRouter>)
  App.tsx               <- REPLACE (thin shell: Header + Routes + Footer)
  components/
    Header.tsx          <- REPLACE (router <Link> nav: Dashboard + Diagnose)
    SurveillanceDashboard.tsx  <- NEW
    GeoChoropleth.tsx          <- NEW
    Upload.tsx / Result.tsx / History.tsx / VideoSection.tsx / AppFooter.tsx  (unchanged)
  pages/                <- NEW FOLDER
    DashboardPage.tsx   <- NEW (landing page "/")
    DiagnosePage.tsx    <- NEW (your old App body, at "/diagnose")
```

## 3. Add two i18n keys (in i18n.ts) under `nav` in BOTH en and sw:
EN:
    nav: { dashboard: 'Dashboard', diagnose: 'Diagnose', home: 'Home', about: 'About', howItWorks: 'How It Works', contact: 'Contact' }
SW:
    nav: { dashboard: 'Dashibodi', diagnose: 'Chunguza', home: 'Nyumbani', about: 'Kuhusu', howItWorks: 'Jinsi Inavyofanya Kazi', contact: 'Mawasiliano' }

(Keep the old keys too — they don't hurt.)

## 4. Optional CSS (App.css) — give the dashboard page some breathing room:
.cg-dash-main {
  max-width: 1100px;
  margin: 0 auto;
  padding: clamp(20px, 4vw, 40px) clamp(12px, 3vw, 24px);
}

## 5. Routes
- `/`          -> DashboardPage (landing — what a subdomain visitor sees first)
- `/diagnose`  -> DiagnosePage (the upload tool)

## 6. Region-name reconciliation (IMPORTANT for the map)
The choropleth fetches REAL geoBoundaries ADM1 regions. The names in
SurveillanceDashboard's REGION list (e.g. "Rift Valley", "Oromia") may not match
the real ADM1 names exactly. After first run:
  - open the browser console
  - read the lines: "[GeoChoropleth] Kenya ADM1 regions (N): [...]"
  - any "no pressure for X — grey" warning = a name mismatch to fix
  - update REGION `name` fields to match the real names
NB: Kenya ADM1 may be 47 counties (not 8 provinces); Ethiopia regions were
recently reorganized. Expect to adjust the simulated region list to real units.

## 7. Deployment (later, for the subdomain)
Client-side routing needs an SPA fallback so /diagnose doesn't 404 on refresh:
  - Netlify: add `/* /index.html 200` to a _redirects file
  - Vercel: handled automatically for Vite SPAs
  - nginx: `try_files $uri $uri/ /index.html;`
