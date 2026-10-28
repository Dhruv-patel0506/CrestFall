"""Small, CPU-only time-series forecaster for monthly company market data.

The model forecasts log returns from a monthly close series. Candidate models are
compared with expanding-window, one-step-ahead validation; the selected model and
its validation error are returned with the forecast so the UI can explain the
result. No external ML package or GPU is required.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Sequence, Tuple


def _mean(values: Sequence[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _ar1_next(values: Sequence[float]) -> float:
    """One-step AR(1) estimate with a stationary coefficient."""
    if len(values) < 3:
        return _mean(values)
    center = _mean(values)
    pairs = list(zip(values[:-1], values[1:]))
    denominator = sum((x - center) ** 2 for x, _ in pairs)
    phi = (sum((x - center) * (y - center) for x, y in pairs) / denominator) if denominator else 0.0
    phi = max(-0.95, min(0.95, phi))
    return center + phi * (values[-1] - center)


def _seasonal_next(values: Sequence[float], months: Sequence[int], next_month: int) -> float:
    recent = list(values[-36:])
    recent_months = list(months[-36:])
    overall = _mean(recent)
    same_month = [v for v, m in zip(recent, recent_months) if m == next_month]
    # Shrink the month-of-year estimate toward the recent mean when evidence is thin.
    weight = len(same_month) / (len(same_month) + 6.0)
    return weight * _mean(same_month) + (1.0 - weight) * overall


def _candidate_predictions(values: Sequence[float], months: Sequence[int], next_month: int) -> Dict[str, float]:
    recent = list(values[-12:])
    return {
        "Recent mean (12 months)": _mean(recent),
        "Autoregressive (AR1)": _ar1_next(values[-60:]),
        "Calendar-seasonal mean": _seasonal_next(values, months, next_month),
    }


def _solve_linear_system(matrix: List[List[float]], target: List[float]) -> List[float]:
    """Gaussian elimination with partial pivoting for a small ridge system."""
    size = len(target)
    augmented = [row[:] + [target[i]] for i, row in enumerate(matrix)]
    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        divisor = augmented[column][column]
        if abs(divisor) < 1e-12:
            continue
        for j in range(column, size + 1):
            augmented[column][j] /= divisor
        for row in range(size):
            if row == column:
                continue
            factor = augmented[row][column]
            for j in range(column, size + 1):
                augmented[row][j] -= factor * augmented[column][j]
    return [augmented[i][size] for i in range(size)]


def _ridge_fit_predict(train_x: Sequence[Sequence[float]], train_y: Sequence[float], test_x: Sequence[float]) -> float:
    if not train_x or not train_y:
        return 0.0
    width = len(test_x)
    means = [_mean([row[i] for row in train_x]) for i in range(width)]
    scales = []
    for i in range(width):
        variance = _mean([(row[i] - means[i]) ** 2 for row in train_x])
        scales.append(math.sqrt(variance) or 1.0)
    design = [[1.0] + [(row[i] - means[i]) / scales[i] for i in range(width)] for row in train_x]
    test = [1.0] + [(test_x[i] - means[i]) / scales[i] for i in range(width)]
    size = width + 1
    matrix = [[0.0] * size for _ in range(size)]
    target = [0.0] * size
    for row, y in zip(design, train_y):
        for i in range(size):
            target[i] += row[i] * y
            for j in range(size):
                matrix[i][j] += row[i] * row[j]
    # The intercept is unpenalized; the coefficient penalty stabilizes small samples.
    for i in range(1, size):
        matrix[i][i] += 1.0
    coefficients = _solve_linear_system(matrix, target)
    return sum(coefficient * value for coefficient, value in zip(coefficients, test))


def _market_macro_features(
    prior_returns: Sequence[float], target_month: int, source_point: Dict[str, Any],
    scenario_rate_change_pct: float = 0.0,
    scenario_primitives: Dict[str, float] | None = None,
) -> List[float]:
    recent = list(prior_returns[-6:])
    avg = _mean(recent)
    vol = math.sqrt(_mean([(value - avg) ** 2 for value in recent])) if recent else 0.0
    features = [
        prior_returns[-1] if prior_returns else 0.0,
        prior_returns[-2] if len(prior_returns) > 1 else 0.0,
        prior_returns[-12] if len(prior_returns) >= 12 else _mean(prior_returns),
        _mean(prior_returns[-3:]),
        float(source_point.get("sector_return_pct") or 0.0),
        float(source_point.get("home_index_return_pct") or 0.0),
        float(source_point.get("policy_rate_change_pct") or 0.0) + scenario_rate_change_pct,
        vol,
    ]
    features.extend(1.0 if target_month == month else 0.0 for month in range(1, 13))
    primitive_values = source_point.get("primitive_values", {}) or {}
    for key in ("demand", "supply", "cost", "competition", "regulation", "technology", "macro", "pandemic"):
        base = float(primitive_values.get(key) or 0.0)
        delta = float((scenario_primitives or {}).get(key) or 0.0)
        features.append(max(-1.0, min(1.0, base + delta)))
    return features


def forecast_monthly_close(
    points: Sequence[Dict[str, Any]],
    horizon: int = 12,
    scenario_terms: Sequence[str] = (),
    rate_shock_bps: float = 0.0,
    scenario_effects: Dict[str, Dict[str, Any]] | None = None,
    scenario_primitives: Dict[str, float] | None = None,
    scenario_start_month: str | None = None,
    scenario_end_month: str | None = None,
    metric: str = "close",
) -> Dict[str, Any]:
    """Forecast close prices from ordered monthly observations.

    `points` must contain YYYY-MM `date` and positive `close` values. Backtesting
    selects among a recent-drift, AR(1), and calendar-seasonal return model.
    """
    def target_value(point: Dict[str, Any]) -> float:
        values = point.get("metric_values", {}) or {}
        if metric in values:
            return float(values[metric] or 0.0)
        if metric == "revenue_run_rate":
            return float(point.get("monthly_revenue_run_rate_usd_m") or 0.0)
        if metric.startswith("product_metrics."):
            return float((point.get("product_metrics", {}) or {}).get(metric.split(".", 1)[1]) or 0.0)
        return float(point.get(metric) or point.get("adjusted_close") or point.get("close") or 0.0)

    usable: List[Tuple[str, float]] = []
    point_by_date = {str(point.get("date", ""))[:7]: point for point in points}
    for point in points:
        try:
            date = str(point["date"])
            close = target_value(point)
            if len(date) >= 7 and close > 0 and math.isfinite(close):
                usable.append((date[:7], close))
        except (KeyError, TypeError, ValueError):
            continue
    usable.sort(key=lambda item: item[0])
    # Keep the final observation for a duplicate month.
    monthly: Dict[str, float] = {}
    for date, close in usable:
        monthly[date] = close
    dates = sorted(monthly)
    closes = [monthly[d] for d in dates]
    model_points = [point_by_date.get(date, {}) for date in dates]
    if not closes:
        return {"status": "insufficient_data", "reason": f"No positive monthly observations for {metric}.", "forecast": [], "metric": metric}

    log_returns = [math.log(closes[i] / closes[i - 1]) for i in range(1, len(closes))]
    return_dates = dates[1:]
    month_numbers = [int(d[5:7]) for d in return_dates]
    selected = "Recent mean (12 months)"
    validation_errors: List[float] = []
    candidate_scores: Dict[str, float] = {}

    # Expanding-window backtest avoids training on future observations.
    start = max(36, len(log_returns) - 36)
    if len(log_returns) >= 48:
        errors: Dict[str, List[float]] = {name: [] for name in (
            "Recent mean (12 months)", "Autoregressive (AR1)", "Calendar-seasonal mean",
            "Market and macro ridge",
        )}
        residuals: Dict[str, List[float]] = {name: [] for name in errors}
        for target_idx in range(start, len(log_returns)):
            train_values = log_returns[:target_idx]
            train_months = month_numbers[:target_idx]
            target_month = month_numbers[target_idx]
            candidates = _candidate_predictions(train_values, train_months, target_month)
            ridge_x, ridge_y = [], []
            for train_idx in range(12, target_idx):
                ridge_x.append(_market_macro_features(log_returns[:train_idx], month_numbers[train_idx], model_points[train_idx]))
                ridge_y.append(log_returns[train_idx])
            if len(ridge_y) >= 24:
                test_x = _market_macro_features(train_values, target_month, model_points[target_idx])
                candidates["Market and macro ridge"] = _ridge_fit_predict(ridge_x, ridge_y, test_x)
            for name, prediction in candidates.items():
                errors[name].append(abs(log_returns[target_idx] - prediction))
                residuals[name].append(log_returns[target_idx] - prediction)
        candidate_scores = {name: _mean(items) for name, items in errors.items() if items}
        if candidate_scores:
            selected = min(candidate_scores, key=candidate_scores.get)
            validation_errors = errors[selected]
            validation_residuals = residuals[selected]
        else:
            validation_residuals = []
    else:
        validation_residuals = []

    history_returns = log_returns[-60:]
    history_months = month_numbers[-60:]
    ridge_train_x, ridge_train_y = [], []
    for train_idx in range(12, len(log_returns)):
        ridge_train_x.append(_market_macro_features(log_returns[:train_idx], month_numbers[train_idx], model_points[train_idx]))
        ridge_train_y.append(log_returns[train_idx])
    scenario_effect = {"matched": False, "terms": list(scenario_terms), "observations": 0, "estimated_excess_return_pct": None}
    calendar_effects = [
        item for item in (scenario_effects or {}).values()
        if item.get("kind") == "calendar" and item.get("estimated_effect_pct") is not None and int(item.get("observations") or 0) >= 2
    ]
    matching_indices = []
    if scenario_terms:
        normalized_terms = [
            term.lower().replace("_", " ").replace("(", " ").replace(")", " ").replace("enable ", "").replace("macro ", "").replace("decision ", "").strip()
            for term in scenario_terms if term
        ]
        for idx, date in enumerate(return_dates):
            point = point_by_date.get(date, {})
            text = " ".join(
                [f"{event.get('name', '')} {event.get('category', '')}" for event in point.get("event_records", [])]
                + [f"{decision.get('type', '')} {decision.get('description', '')}" for decision in point.get("decision_records", [])]
            ).lower().replace("(", " ").replace(")", " ")
            if text and any(term in text for term in normalized_terms):
                matching_indices.append(idx)
        if matching_indices:
            matched_returns = [log_returns[idx] for idx in matching_indices]
            matched_months = [month_numbers[idx] for idx in matching_indices]
            seasonal_baselines = [
                _mean([r for r, m in zip(log_returns, month_numbers) if m == matched_month])
                for matched_month in matched_months
            ]
            raw_effect = _mean([r - baseline for r, baseline in zip(matched_returns, seasonal_baselines)])
            shrinkage = len(matching_indices) / (len(matching_indices) + 6.0)
            scenario_effect = {
                "matched": True,
                "terms": list(scenario_terms),
                "observations": len(matching_indices),
                "estimated_excess_return_pct": round((math.exp(raw_effect * shrinkage) - 1.0) * 100.0, 3),
                "application": "Applied once to the first forecast month; estimated from matching dated source records.",
            }
        else:
            peer_cases = [
                option for term in scenario_terms
                for option in [(scenario_effects or {}).get(term, {})]
                if option.get("kind") != "calendar" and option.get("estimated_effect_pct") is not None and int(option.get("observations") or 0) >= 2
            ]
            if peer_cases:
                # Avoid summing overlapping company/peer studies as if they were
                # independent causal effects. Use their evidence-weighted mean.
                weights = [max(1, min(int(item["observations"]), 20)) for item in peer_cases]
                estimate = sum(float(item["estimated_effect_pct"]) * weight for item, weight in zip(peer_cases, weights)) / sum(weights)
                scenario_effect = {
                    "matched": True,
                    "terms": list(scenario_terms),
                    "observations": sum(int(item["observations"]) for item in peer_cases),
                    "estimated_excess_return_pct": round(estimate, 3),
                    "source": "Cross-company historical analogs from the supplied dataset",
                    "application": "Applied in the first forecast month; cross-company association, not a company-specific causal estimate.",
                }
    rate_shock_effect = {
        "matched": False,
        "requested_bps": float(rate_shock_bps),
        "observations": len(ridge_train_y),
        "estimated_first_month_excess_return_pct": None,
    }
    ridge_error = candidate_scores.get("Market and macro ridge")
    selected_error = candidate_scores.get(selected)
    ridge_supported = len(ridge_train_y) >= 24 and ridge_error is not None and selected_error is not None and ridge_error <= selected_error * 1.25
    if rate_shock_bps and ridge_supported and model_points:
        rate_point = model_points[-1]
        baseline_rate_features = _market_macro_features(history_returns, (last_month := int(dates[-1][5:7]) % 12) + 1, rate_point)
        shocked_rate_features = baseline_rate_features[:]
        # Dataset rate changes are stored in percentage points; bps convert directly.
        shocked_rate_features[6] += float(rate_shock_bps) / 100.0
        baseline_rate_prediction = _ridge_fit_predict(ridge_train_x, ridge_train_y, baseline_rate_features)
        shocked_rate_prediction = _ridge_fit_predict(ridge_train_x, ridge_train_y, shocked_rate_features)
        rate_shock_effect = {
            "matched": True,
            "requested_bps": float(rate_shock_bps),
            "observations": len(ridge_train_y),
            "estimated_first_month_excess_return_pct": round((math.exp(shocked_rate_prediction - baseline_rate_prediction) - 1.0) * 100.0, 3),
            "application": "Applied once using the fitted macro ridge coefficient; the ridge model met the configured walk-forward error tolerance.",
        }
    primitive_effect = {
        "matched": bool(scenario_primitives) and ridge_supported,
        "requested_deltas": scenario_primitives or {},
        "validation_mae_log_return": ridge_error,
        "applied_to_selected_baseline": bool(scenario_primitives) and ridge_supported and selected != "Market and macro ridge",
    }
    forecast = []
    last_close = closes[-1]
    last_year, last_month = int(dates[-1][:4]), int(dates[-1][5:7])
    origin = last_close
    cumulative_log_return = 0.0
    for step in range(1, max(1, int(horizon)) + 1):
        month_number = last_month + step
        year = last_year + (month_number - 1) // 12
        month_number = ((month_number - 1) % 12) + 1
        forecast_month = f"{year:04d}-{month_number:02d}"
        scenario_in_range = (not scenario_start_month or forecast_month >= scenario_start_month) and (not scenario_end_month or forecast_month <= scenario_end_month)
        event_anchor = scenario_start_month or (f"{last_year + (last_month // 12):04d}-{(last_month % 12) + 1:02d}")
        apply_event_here = scenario_effect["matched"] and forecast_month == event_anchor
        apply_rate_here = rate_shock_effect["matched"] and forecast_month == event_anchor
        predictions = _candidate_predictions(history_returns, history_months, month_number)
        if selected == "Market and macro ridge" and len(ridge_train_y) >= 24:
            exogenous = dict(model_points[-1]) if model_points else {}
            if step > 1 and model_points:
                exogenous["sector_return_pct"] = _mean([float(point.get("sector_return_pct") or 0.0) for point in model_points[-12:]])
                exogenous["home_index_return_pct"] = _mean([float(point.get("home_index_return_pct") or 0.0) for point in model_points[-12:]])
                exogenous["policy_rate_change_pct"] = 0.0
            ridge_features = _market_macro_features(history_returns, month_number, exogenous, scenario_rate_change_pct=rate_shock_bps / 100.0 if apply_rate_here else 0.0, scenario_primitives=scenario_primitives if scenario_in_range and primitive_effect["matched"] else None)
            predicted_return = _ridge_fit_predict(ridge_train_x, ridge_train_y, ridge_features)
        else:
            predicted_return = predictions[selected]
            if ridge_supported and ((scenario_primitives and scenario_in_range) or (rate_shock_bps and apply_rate_here)):
                exogenous = dict(model_points[-1]) if model_points else {}
                base_features = _market_macro_features(history_returns, month_number, exogenous)
                changed_features = _market_macro_features(
                    history_returns, month_number, exogenous,
                    scenario_rate_change_pct=rate_shock_bps / 100.0 if apply_rate_here else 0.0,
                    scenario_primitives=scenario_primitives if scenario_in_range and primitive_effect["matched"] else None,
                )
                predicted_return += _ridge_fit_predict(ridge_train_x, ridge_train_y, changed_features) - _ridge_fit_predict(ridge_train_x, ridge_train_y, base_features)
        if apply_event_here:
            predicted_return += math.log1p(scenario_effect["estimated_excess_return_pct"] / 100.0)
        selected_calendar = [item for item in calendar_effects if int(item.get("month") or 0) == month_number]
        if scenario_in_range and selected_calendar:
            weights = [max(1, min(int(item.get("observations") or 1), 20)) for item in selected_calendar]
            calendar_effect_pct = sum(float(item["estimated_effect_pct"]) * weight for item, weight in zip(selected_calendar, weights)) / sum(weights)
            predicted_return += math.log1p(calendar_effect_pct / 100.0)
        cumulative_log_return += predicted_return
        last_close *= math.exp(predicted_return)
        if validation_errors:
            sigma = math.sqrt(sum(error * error for error in validation_errors) / len(validation_errors))
        elif len(history_returns) > 1:
            avg = _mean(history_returns)
            sigma = math.sqrt(sum((value - avg) ** 2 for value in history_returns) / (len(history_returns) - 1))
        else:
            sigma = 0.0
        width = 1.645 * sigma * math.sqrt(step)
        forecast.append({
            "date": f"{year:04d}-{month_number:02d}",
            "close": round(last_close, 4),
            "value": round(last_close, 4),
            "predicted_return_pct": round((math.exp(predicted_return) - 1.0) * 100.0, 3),
            "predicted_log_return": predicted_return,
            "lower": round(origin * math.exp(cumulative_log_return - width), 4),
            "upper": round(origin * math.exp(cumulative_log_return + width), 4),
        })
        history_returns.append(predicted_return)
        history_months.append(month_number)

    # Empirical path resampling uses only walk-forward forecast residuals. This
    # yields time-of-peak and downside-event frequencies without fixed calendar years.
    peak_counts: Dict[int, int] = {}
    crash_counts: Dict[int, int] = {}
    positive_paths = 0
    selected_range_positive_paths = 0
    simulated_final_returns: List[float] = []
    selected_range_returns: List[float] = []
    crash_threshold = sorted(log_returns)[max(0, int((len(log_returns) - 1) * 0.05))] if log_returns else None
    simulation_count = 256 if validation_residuals else 0
    if simulation_count:
        for path_index in range(simulation_count):
            path_close = origin
            path_by_year: Dict[int, float] = {}
            path_had_crash: Dict[int, bool] = {}
            path_by_month: Dict[str, float] = {}
            for step, point in enumerate(forecast):
                residual = validation_residuals[(path_index * 17 + step * 29) % len(validation_residuals)]
                path_return = point["predicted_log_return"] + residual
                path_close *= math.exp(path_return)
                year = int(point["date"][:4])
                path_by_year[year] = path_close
                path_by_month[point["date"]] = path_close
                path_had_crash[year] = path_had_crash.get(year, False) or (crash_threshold is not None and path_return <= crash_threshold)
            if path_close >= origin:
                positive_paths += 1
            simulated_final_returns.append((path_close / origin - 1.0) * 100.0)
            selected_dates = [point["date"] for point in forecast if (not scenario_start_month or point["date"] >= scenario_start_month) and (not scenario_end_month or point["date"] <= scenario_end_month)]
            if selected_dates:
                selected_start_idx = next(i for i, point in enumerate(forecast) if point["date"] == selected_dates[0])
                start_level = origin if selected_start_idx == 0 else path_by_month[forecast[selected_start_idx - 1]["date"]]
                end_level = path_by_month[selected_dates[-1]]
                selected_range_returns.append((end_level / start_level - 1.0) * 100.0)
                if end_level >= start_level:
                    selected_range_positive_paths += 1
            if path_by_year:
                peak_year = max(path_by_year, key=path_by_year.get)
                peak_counts[peak_year] = peak_counts.get(peak_year, 0) + 1
            for year, occurred in path_had_crash.items():
                if occurred:
                    crash_counts[year] = crash_counts.get(year, 0) + 1

    return {
        "status": "ok",
        "metric": metric,
        "observations": len(closes),
        "last_observation_date": model_points[-1].get("last_observation_date", dates[-1]),
        "model": selected,
        "validation_mae_log_return": round(candidate_scores.get(selected, 0.0), 6),
        "validation_models": {name: round(score, 6) for name, score in candidate_scores.items()},
        "validation_residuals": validation_residuals,
        "peak_timing_probabilities": [
            {"year": year, "probability_pct": round(count / simulation_count * 100.0, 2)}
            for year, count in sorted(peak_counts.items())
        ] if simulation_count else [],
        "downside_event_probabilities": [
            {"year": year, "probability_pct": round(count / simulation_count * 100.0, 2)}
            for year, count in sorted(crash_counts.items())
        ] if simulation_count else [],
        "downside_threshold_log_return": crash_threshold,
        "positive_horizon_probability_pct": round(positive_paths / simulation_count * 100.0, 2) if simulation_count else None,
        "selected_range_positive_probability_pct": round(selected_range_positive_paths / simulation_count * 100.0, 2) if simulation_count and selected_range_returns else None,
        "selected_range_return_p10_pct": round(sorted(selected_range_returns)[max(0, int((len(selected_range_returns) - 1) * 0.10))], 2) if selected_range_returns else None,
        "selected_range_return_p90_pct": round(sorted(selected_range_returns)[min(len(selected_range_returns) - 1, int((len(selected_range_returns) - 1) * 0.90))], 2) if selected_range_returns else None,
        "simulated_horizon_return_p10_pct": round(sorted(simulated_final_returns)[max(0, int((len(simulated_final_returns) - 1) * 0.10))], 2) if simulated_final_returns else None,
        "simulated_horizon_return_p90_pct": round(sorted(simulated_final_returns)[min(len(simulated_final_returns) - 1, int((len(simulated_final_returns) - 1) * 0.90))], 2) if simulated_final_returns else None,
        "scenario_effect": scenario_effect,
        "calendar_scenario_effect": {
            "matched": bool(calendar_effects),
            "months": sorted({int(item.get("month") or 0) for item in calendar_effects}),
            "source": "Company calendar-month return history; not festival-specific or causal",
            "observations": sum(int(item.get("observations") or 0) for item in calendar_effects),
        },
        "rate_shock_effect": rate_shock_effect,
        "primitive_scenario_effect": primitive_effect,
        "exogenous_forecast_assumption": "For the first step, uses the latest observed sector, broad-index, and rate changes. Later steps use trailing 12-month average index returns and zero incremental rate change; no live feed is connected.",
        "forecast": forecast,
    }
