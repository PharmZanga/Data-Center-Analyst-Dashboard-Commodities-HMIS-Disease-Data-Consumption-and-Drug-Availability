# National Health Supply Control Tower

A lightweight Zambia public health dashboard for commodity stocks, HMIS disease surveillance, consumption and drug availability. It follows the five-tab control tower format with Ministry of Health branding, a Zambia coat of arms, turquoise accents and warehouse photography.

**Mixed sources:** HMIS, prototype inventory and eLMIS use simulated data. Tracer availability and the in-page Tracer Executive Summary use an imported October 2026 aggregate snapshot from the public Tracer repository. Prototype districts and facilities are fictional. Branding does not imply official endorsement.

[Hosted dashboard](https://zambia-national-control-tower-20261031.z123456.chatgpt.site/) (owner-private access) · [Data dictionary and operating guide](dist/guide.md) · [Stakeholder summary](dist/insights.html)

## Open locally

Open `dist/index.html` in a modern browser. Keep `theme.css`, `assets/`, `guide.md` and `insights.html` alongside it. The dashboard runs offline without installation or external JavaScript libraries.

For a local server with Python:

```sh
python -m http.server 8769 --directory dist
```

Then visit `http://localhost:8769`.

## Features

- Executive overview with reporting, stockouts, disease burden and availability KPIs.
- Commodity stock table, consumption trends, facility stockout heatmap and CSV export.
- HMIS disease trends, district rankings, weekly comparisons and incidence.
- Drug availability with district stock status and critical facility records.
- Disease–consumption correlation, regression, three-month outlook and anomaly alerts.
- Province → district → facility filters, commodity categories and period selection.
- Responsive layout, light/dark theme, keyboard navigation and print-to-PDF for all tabs.

## Development and checks

Node.js 20+ is sufficient; there are no npm dependencies.

```sh
node build-map.mjs
node build.mjs
node verify.mjs
node make-insights.mjs
```

Edit `dashboard.js` for data and interaction logic, `template.html` and `build.mjs` for markup, and `dist/theme.css` for visual styling. The build embeds JavaScript into `dist/index.html`; it preserves the separately maintained stylesheet and assets. `verify.mjs` validates the built script, unique control IDs, KPI calculations, known regression results and location/category filters, then creates the ignored `snapshot.json` used to regenerate the stakeholder summary.

## Structure

| Path | Purpose |
| --- | --- |
| `dist/index.html` | Ready-to-open dashboard |
| `dist/theme.css` | Control tower theme |
| `dist/assets/` | Coat of arms, control tower mark, optimized warehouse photo |
| `dist/guide.md` | Data dictionary, KPI definitions, integration schema and refresh guidance |
| `dist/insights.html` | One-page simulated-data stakeholder summary |
| `dashboard.js` | Deterministic sample data, calculations, charts and interactions |
| `template.html` | Original dashboard layout retained as the build template |
| `build.mjs` | Reproducible HTML generation |
| `verify.mjs` | Calculation and filter validation |

## Data integration and hosting

Tracer data is bundled in `dist/tracer-import.json` with source URL, import timestamp and SHA-256. The source includes weeks ending 11, 18 and 25 October 2026. The latest week is selected initially. `tracer-import.js` renders the imported national/province/commodity rollups without recomputing their definitions. The global Province filter applies to Tracer availability; prototype district/facility/category and monthly period filters do not. Executive figures and commodity tables remain national. Tracer Executive Summary opens as an internal tab. No named-facility or patient records are imported. This is a saved snapshot, not automatic synchronization. To refresh, download the source JSON to `outputs/tracer-oct-published.json`, run `node import-tracer.mjs`, then rebuild and verify. eLMIS remains dummy data.

The guide describes consumption, stock and disease fact tables and commodity, location, disease and time dimensions. Replace the sample generator with validated aggregate extracts before operational use. Interactive province maps use geoBoundaries 2020 Zambia boundaries (Zambia Data Hub, CC BY 4.0), generalized and embedded as SVG for offline use; see [map attribution](dist/map-source.md). Live refresh, email/SMS delivery, server-enforced roles and actual district choropleths are not implemented. No patient-level records are included.

Publish the contents of `dist/` to any static host. The existing private Sites deployment is maintained separately; pushing to this GitHub repository does not automatically redeploy it. This repository is the user-owned source copy of the current dashboard. No hosting credentials or private Sites configuration are included.

The branding and photo assets were supplied by the existing workspace. Confirm their usage rights before wider redistribution.
