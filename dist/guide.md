# National Health Supply Control Tower — operating guide

This offline prototype preserves the five-tab format of the supplied dashboard. It contains deterministic simulated data for 120 fictional facilities, 30 fictional districts, 10 Zambia provinces, 8 commodities, and November 2025–October 2026. It is not an official Ministry of Health product or a live reporting system.

## Using the dashboard

Open index.html in a modern browser, including offline. Use Province, District and Facility to drill down; province maps reset lower location filters. Category filters stock and availability metrics; the disease/commodity pair controls linked trends, correlation and forecast. Disease checkboxes control the disease charts, district rankings and weekly table. The time filter selects the latest 3, 6 or 12 months. Inventory and reporting KPIs always reflect October 2026. Province maps retain national context. Search in Commodity stock filters the commodity table, ranking and critical facility list. CSV exports the filtered commodity table. Print / save PDF prints all five tabs. Light / dark changes the current page theme.

## Data dictionary and integration schema

Use separate fact tables for consumption, stock and cases. Keep stable IDs and validate referential integrity before loading.

| Table | Grain and fields |
| --- | --- |
| dim_commodity | commodity_id, item_code, name, category, unit_of_measure, tracer_flag |
| dim_location | facility_id, facility_name, district_id, district_name, province_id, province_name, catchment_population |
| dim_time | date_id, date, ISO_week, month, year |
| dim_disease | disease_id, disease_name |
| fact_consumption | facility_id, commodity_id, date_id, issued_quantity, forecast_quantity (optional) |
| fact_stock | facility_id, commodity_id, date_id, stock_on_hand, stockout_days, report_received_at, report_due_at |
| fact_cases | facility_id, disease_id, date_id, aggregate_cases |

The prototype's F, DI, CM, MO and DATA structures provide matching sample dimensions and facts in dashboard.js. Replace the generator through a validated adapter when real extracts are available. Do not copy the sample catchment populations or fabricated district/facility names into production. All eight sample commodities are treated as tracers.

## KPI definitions

- Stockout share: zero-stock facility–commodity records / all selected facility–commodity records. This is not the percentage of facilities with any stockout.
- Availability index: positive-stock facility–tracer records / all selected facility–tracer records × 100. Thus availability and stockout share sum to 100 in this complete sample inventory dataset.
- All tracers available: facilities with positive stock for every selected tracer / selected facilities.
- Average monthly consumption: average issued quantity in August–October 2026. Commodity months of stock = total stock / total average monthly consumption; facility months of stock uses its own denominator.
- Critical: under 1 month, including zero stock. Low: positive stock under 2 months. Adequate: 2 or more months. Sample stockout days are independently generated monthly observations and do not imply current stock status.
- Consumption: sum of quantities in each commodity's own units; totals across different commodities are not comparable measures of treatment coverage. Last-three-month columns stay fixed to August–October.
- Reporting completeness: facilities with a received October report / expected facilities. On-time rate: received and not late / expected facilities. Inventory remains available in this sample even when the separate HMIS reporting flag is missing; a real integration must expose source-specific completeness and observation dates.
- Disease incidence: selected-period aggregate cases / sample catchment population × 100,000. It is not annualized. Weekly counts use four sample October reporting buckets; they are not ISO weeks.
- Stockout heatmap: percentage of the latest six monthly snapshots with zero stock, not daily stockout prevalence. Shows up to 20 facilities; filter to narrow.
- Average months of stock trend: unweighted mean of facility months of stock by commodity, distinct from aggregate commodity MOS.
- Correlation: ordinary least squares on selected facility-month cases and commodity units, with R²; undefined with zero variance. Association is not causation.
- Forecast: least-squares straight line from up to six most recent selected monthly consumption totals, projected three months and bounded at zero. No seasonality, uncertainty interval or predictive validation is modelled.
- Anomalies: consumption per case exceeds its annual facility mean by more than 2 population standard deviations; zero case denominators use 1. Alerts also flag <1 month of stock, missing reports and latest-month disease rises >50%.

## Refresh, access and deployment

The snapshot is fixed and the deterministic dataset rebuilds locally on page load. No live refresh, email/SMS sending, authentication or role enforcement is implemented in the static app. Hosted preview access is owner-private through Sites. Before production: connect validated aggregate extracts, enforce analyst/viewer access on the server, restrict uploads to analysts, and configure real notification delivery with audit logs and deduplication.

Proposed operational schedule: stock/consumption ingest daily at 06:00 Africa/Lusaka; HMIS ingest weekly following the reporting cutoff; monthly completeness reconciliation on the 15th. These are documented targets, not active jobs. Display actual source timestamps and data lags when connected. Reject negative cases/stock, duplicate fact keys, missing location references and unknown units; represent missing observations explicitly rather than as zero.

## Validation and limitations

Run `node build.mjs` after changing dashboard.js, then `node verify.mjs`. Checks cover KPI complements, the stock denominator, known regression results, all province filters, district and facility drill-down, category filtering, empty disease selection and finite chart output. Province maps use generalized geoBoundaries 2020 province boundaries with visible CC BY 4.0 attribution. District choropleths remain outside this prototype. The prototype uses a fixed latest period and supplies no arbitrary daily date-range picker or editable forecast baseline.


## Connected availability tabs

Tracer drug availability and National eLMIS drug availability use dummy data only. Tracer reuses the prototype inventory records and selected location/category. The eLMIS stream uses a separate deterministic generator, excludes missing reports from its availability denominator, and remains national when location filters change. Both trends follow the selected period and stock KPIs reflect October 2026. The Executive overview links to both tabs and repeats their current availability figures. Source links open the existing Tracer Executive Summary and National Stock Status pages; they do not supply these dummy metrics. The eLMIS source URL is not configured. No live data fetch is performed. Edit connected-availability.js to replace these sample adapters with validated data.

## Imported Tracer data — replaces dummy Tracer metrics

Tracer drug availability and the in-page Tracer Executive Summary now use an imported aggregate October 2026 snapshot from the public PharmZanga/tracer repository. Reporting weeks: 11, 18 and 25 October 2026. The latest week is selected initially; choose another week inside Tracer drug availability. National and province availability, stock bands and commodity rollups retain the source values. The imported national executive figure remains national; the Tracer availability KPI follows the global Province selector. Prototype district/facility/category and monthly period filters do not apply to imported data. Commodity search is independent; commodity tables and weekly trends remain national. Data is a saved snapshot, not an automatic/live sync. No named facilities or patient data are copied. Source provenance, import timestamp and SHA-256 are bundled in tracer-import.json. To refresh, download the source URL to outputs/tracer-oct-published.json, run node import-tracer.mjs, node build.mjs and node verify.mjs. National eLMIS remains dummy data. Tracer Executive Summary buttons navigate within this page.
