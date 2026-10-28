# RoCast: Project Plan

Draft, 25 October 2026. Owners: you and Ridham (both own everything; task split decided later).

## 1. What RoCast is

RoCast forecasts how companies will perform over the next months, under a chosen scenario. It answers questions such as: what will this company's growth look like from June to December, what phase is it likely to be in, and what changes the forecast most.

The working name is RoCast. A name check is still needed before the pitch.

## 2. Goals for the hackathon

1. Forecast monthly growth for each company in the dataset over a user-chosen span.
2. Label each forecast month with one of the nine phases.
3. Let the user change the scenario (an event, a festival calendar, a rate change) and see how the forecast moves.
4. Show results per company in a dashboard, plus a master view.
5. Report honest accuracy: compared against simple baselines, and tested on events the model did not see in training.

## 3. Scope

In scope: five companies to start (Goldman Sachs, JPMorgan, Knight, Flipkart, Apple), growing to the full set as data arrives. Five country markets for calendars: India, United States, United Kingdom, China, Australia. Monthly forecasts up to 12 months ahead.

Out of scope for the hackathon: trading advice, real-time market prediction, and any claim of certainty. Every output carries a disclaimer.

## 4. Timeline (4 days)

| Day | Focus | Done when |
| --- | --- | --- |
| 1 | Receive the datasets. Audit the columns. Clean the data (empty rows and columns, missing values with flags). Build the company metadata table (niche and country). Build the monthly panel. | Clean panel for the first 5 companies, with a data report |
| 2 | Build the windows and the phase rules. Build the calendars for the five countries. Build the baseline forecasts (last-growth and same-month-last-year). Train the first LightGBM model. | Model beats the baselines on the time-ordered check |
| 3 | Add scenario inputs and the event library. Run the shuffled 70/30 episode split with several seeds. Run leave-one-event-out. Build the forecast-over-span function. | Accuracy table per company and per event, plus one scenario run end to end |
| 4 | Dashboard (per-company and master view). Question answering with the RAG and the local language model. Packaging and the demo. | One command starts the app; a scenario question returns a forecast with explanation |

Day 4 is also the presentation and recording. Leave the final 3 hours for slides, the README, and a backup recording.

## 5. Cut list if time runs short

Cut in this order: voice output, then news integration, then peer comparison, then the lever recommender. Keep the forecaster, the phase labels, one scenario, the baselines, and the leave-one-event-out result. These carry the central claim.

## 6. Ownership

Both of you own every component. The split of tasks will be decided later, and the ownership list will be filtered by contribution at the end. The architecture and technical guide docs describe what each component does.

## 7. Demo flow (for the presentation)

1. Problem: companies need to see where they are heading and what would change it.
2. Data: five companies across banking, brokerage, e-commerce, and consumer, plus five country calendars.
3. Method: monthly windows, one shared model, and per-company results.
4. Live question: a voice or typed question such as 'what happens to Flipkart from June to December with a festival season and a rate rise?'
5. Output: a month-by-month forecast, phases, drivers, and a disclaimer.
6. Evidence: accuracy against baselines, and the leave-one-event-out result.
7. Limits and next steps: more companies, a neural model on a GPU, and the causal test.

## 8. Risks

- Data arrives late or with mismatched columns. Mitigation: the canonical schema and the data report on Day 1.
- Too few companies for the event tests. Mitigation: use monthly windows, which multiply the number of examples, and report the limits honestly.
- Forecasts look good but do not beat the baseline. Mitigation: report that result as it stands.
- Time pressure on the dashboard. Mitigation: the cut list above.
- Laptop limits (16 GB and 32 GB RAM, no GPU). Mitigation: CPU-friendly models and monthly data.

## 9. Deliverables

- Working demo (live or recorded).
- Slides.
- README and the technical guide.
- Accuracy report.
- Recording as a fallback.
