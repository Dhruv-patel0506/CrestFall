# RoCast Data Requirements: Addendum for Crash and Peak Timing

Draft, 25 October 2026. Read together with RoCast_Data_Requirements.md and RoCast_Data_Dictionary.csv. This addendum adds what is needed to predict when a company will peak and when it may fall, by year, with probabilities.

## 1. Why more history is needed

Crash and peak timing depends on full business cycles. A model that has seen one cycle cannot estimate a probability of a downfall in a given year. Each company needs as much monthly history as is available, and at least 15 years where possible. Companies with shorter history should be flagged, so the dashboard can show a wider uncertainty range.

## 2. Mandatory additions

A. Full monthly history for every company, from its first listing, with the report_date field from the main requirements.

B. Cycle markers per country:
- Official recession start and end dates (for the US, UK, India, China, and Australia, from the national statistics or central bank source).
- Bear market dates for the home index: the peak date, the trough date, and the drop percentage.
- Bull market dates for the same index.

C. Macro cycle indicators, monthly, per country:
- Yield curve spread (10-year minus 2-year government yield).
- Credit spread for corporate bonds, where published.
- Unemployment rate and GDP growth (already mandatory in the main requirements).

D. Company peak and trough dates, derived from the company's own price history. Store the raw prices. We will compute the labels, so do not hand-enter them.

E. Distress events, one row per event, from public records only:
- company_id, event_date, event_type (credit rating downgrade to junk, default, restructuring, bankruptcy filing, rescue merger, delisting), source_name, source_url, source_retrieved_date.

F. Downfall and recovery labels are computed from the data. Do not enter them manually.

## 3. Recommended additions

- Index drawdown history, monthly, for each home index.
- Earnings announcement dates per company, so the model can tell when results became known.
- Company credit rating history, with dates, which the main requirements list as recommended.
- Industry-level indicators for the niche (for example, bank deposit growth, retail sales, or e-commerce transaction growth) with start and end dates.

## 4. Rules specific to timing

1. Do not fill gaps in cycle markers with estimates. Leave them empty and record the reason.
2. Do not include any distress event that is not publicly recorded.
3. Use the same date format and the first day of the month for all monthly tables.
4. For companies that were not listed for the whole period, record the listing date in the identity table.
5. Keep every new row's source and retrieval date, as in the main requirements.

## 5. Minimum set for the first run

For each of the 10 to 15 companies in the first batch:
- At least 10 years of monthly financials, if the company is older than that.
- Index history for its home index.
- Festival calendar for its country for the same years.
- Macro series for its country for the same years.
- At least one recession period per country in the data, if one exists in the window.

If a company has less history than this, list it in its notes file. The model will still run, with wider uncertainty.
