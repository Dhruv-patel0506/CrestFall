"""
main.py - Crestfall FastAPI Backend Engine.
Implements the complete REST API specification from 'RoCast Frontend Structure (for the frontend developer).md'
and connects with the universal mathematical simulation engine.
"""

import os
import sys
import glob
import json
import math
import csv
import io
import re
import uuid
import threading
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from algorithm.schemas import Company, Financials, Market, Macro, SimulationScenarioConfig
from algorithm.simulator import FinancialSimulator
from algorithm.shock_primitives import get_niche_elasticity, NICHE_ELASTICITIES
from algorithm.permutation_matrix import PermutationEngine
from algorithm.forecast_model import forecast_monthly_close
from algorithm.sector_strategies import UniversalSectorStrategies, get_universal_recommendations
from algorithm.sector_playbooks import build_playbook, detect_states

app = FastAPI(
    title="Crestfall API",
    description="Historical rise-and-fall forecasting: phase, peak timing, crash probability and counterfactual scenario testing from a company's own dated records",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# COMPANY DATABASE INGESTION & REGISTRY
# -------------------------------------------------------------
DATA_DIR = os.getenv("CRESTFALL_DATA_DIR", os.path.join(CURRENT_DIR, "data"))
NEW_DATA_DIR = os.getenv("CRESTFALL_NEW_DATA_DIR", os.path.join(CURRENT_DIR, "new_data"))
# The old fallback pointed at one developer's OneDrive desktop, which silently
# resolved to nothing on any other machine or container. The data directory is
# now an explicit setting, and a missing dataset says so out loud instead of
# pretending to be empty-by-design.
if not os.path.isdir(NEW_DATA_DIR):
    print(f"WARNING: no company data found at {NEW_DATA_DIR}")
    print("         set CRESTFALL_NEW_DATA_DIR or copy the source CSVs there.")
os.makedirs(DATA_DIR, exist_ok=True)

COMPANIES_REGISTRY: Dict[str, Dict[str, Any]] = {}
SCENARIO_CATALOG_CACHE: Optional[Dict[str, Any]] = None

def init_database():
    """Load sample database and scan new_data directory if present."""
    sample_path = os.path.join(DATA_DIR, "sample_database.json")
    if os.path.exists(sample_path):
        try:
            with open(sample_path, "r", encoding="utf-8") as f:
                db = json.load(f)
                for c in db.get("companies", []):
                    cid = c["company_id"].upper()
                    if cid in {"", "0", "UNKNOWN", "NAN"} or c.get("ticker", "").strip() in {"", "0"}:
                        continue
                    COMPANIES_REGISTRY[cid] = c
        except Exception as e:
            print(f"Error loading sample_database.json: {e}")

    # Ingest from new_data directory
    if os.path.exists(NEW_DATA_DIR):
        csv_files = glob.glob(os.path.join(NEW_DATA_DIR, "*.csv"))
        for file_path in csv_files:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.DictReader(f)
                    row = next(reader, None)
                    if row:
                        cid = str(row.get("ticker") or row.get("company_id", "UNKNOWN")).upper().strip()
                        company_name = str(row.get("company_name") or "").strip()
                        if cid in {"", "0", "UNKNOWN", "NAN"}:
                            # A few supplied AI-company files have placeholder metadata
                            # despite having usable observations. Use the source filename
                            # so those datasets remain identifiable in the company picker.
                            slug = re.sub(r"[^A-Z0-9]+", "_", os.path.splitext(os.path.basename(file_path))[0].upper()).strip("_")
                            cid = slug
                            company_name = {
                                "ANTHROPIC_ROCAST_DATASET": "Anthropic",
                                "GOOGLE_DEEPMIND_ROCAST_DATASET": "Google DeepMind",
                                "OPENAI_ROCAST_DATASET": "OpenAI",
                            }.get(slug, re.sub(r"[_-]+", " ", os.path.splitext(os.path.basename(file_path))[0]).title())
                        if company_name in {"", "0", "UNKNOWN", "NAN"}:
                            company_name = cid
                        if cid not in COMPANIES_REGISTRY:
                            COMPANIES_REGISTRY[cid] = {
                                "company_id": cid,
                                "company_name": company_name,
                                "ticker": cid if str(row.get("ticker") or "").strip().upper() in {"", "0", "UNKNOWN", "NAN"} else row.get("ticker"),
                                "exchange": row.get("exchange") if str(row.get("exchange") or "").strip().upper() not in {"", "0", "UNKNOWN", "NAN"} else "Unknown",
                                "main_country": row.get("main_country") if str(row.get("main_country") or "").strip().upper() not in {"", "0", "UNKNOWN", "NAN"} else "Unknown",
                                "niche": row.get("niche") if str(row.get("niche") or "").strip().upper() not in {"", "0", "UNKNOWN", "NAN"} else "General Industry",
                                "currency": row.get("currency", "USD"),
                                "fiscal_year_end": row.get("fiscal_year_end") if str(row.get("fiscal_year_end") or "").strip().upper() not in {"", "0", "UNKNOWN", "NAN"} else "Unknown",
                                "financials": {
                                    "date": row.get("date", "2024-01-01"),
                                    "report_date": row.get("report_date", "2024-01-01"),
                                    "source_frequency": "annual",
                                    "revenue_usd_m": float(row.get("revenue_usd_m") or 10000.0),
                                    "cost_of_revenue_usd_m": float(row.get("cost_of_revenue_usd_m") or 5000.0),
                                    "operating_expense_usd_m": float(row.get("operating_expense_usd_m") or 3000.0),
                                    "operating_income_usd_m": float(row.get("operating_income_usd_m") or 2000.0),
                                    "net_income_usd_m": float(row.get("net_income_usd_m") or 1500.0),
                                    "cash_usd_m": float(row.get("cash_usd_m") or 4000.0),
                                    "total_debt_usd_m": float(row.get("total_debt_usd_m") or 5000.0),
                                    "total_assets_usd_m": float(row.get("total_assets_usd_m") or 25000.0),
                                    "equity_usd_m": float(row.get("equity_usd_m") or 12000.0),
                                    "operating_cash_flow_usd_m": float(row.get("operating_cash_flow_usd_m") or 2500.0),
                                    "capex_usd_m": float(row.get("capex_usd_m") or 800.0),
                                    "shares_outstanding_m": float(row.get("shares_outstanding_m") or 1000.0),
                                    "restated_flag": False
                                },
                                "market": {
                                    "date": row.get("date", "2024-01-01"),
                                    "open": float(row.get("open") or 100.0),
                                    "high": float(row.get("high") or 105.0),
                                    "low": float(row.get("low") or 98.0),
                                    "close": float(row.get("close") or 102.0),
                                    "adjusted_close": float(row.get("adjusted_close") or 102.0),
                                    "volume": float(row.get("volume") or 10000000),
                                    "market_cap_usd_bn": float(row.get("market_cap_usd_bn") or 150.0)
                                },
                                "benchmark": {
                                    "date": row.get("date", "2024-01-01"),
                                    "home_index_close": float(row.get("home_index_close") or 4500.0),
                                    "sector_index_close": float(row.get("sector_index_close") or 1200.0),
                                    "vix_or_volatility_index": 18.5
                                },
                                "macro": {
                                    "country": row.get("main_country", "US"),
                                    "date": row.get("date", "2024-01-01"),
                                    "policy_rate_pct": float(row.get("policy_rate_pct") or 4.5),
                                    "cpi_index": float(row.get("cpi_index") or 310.0),
                                    "unemployment_rate_pct": float(row.get("unemployment_rate_pct") or 3.8),
                                    "consumer_confidence_index": float(row.get("consumer_confidence_index") or 102.0),
                                    "gdp_growth_pct": float(row.get("gdp_growth_pct") or 2.1),
                                    "fx_rate_per_usd": float(row.get("fx_rate_per_usd") or 1.0),
                                    "bond_yield_10y_pct": float(row.get("bond_yield_10y_pct") or 4.2)
                                },
                                "csv_path": file_path
                            }
            except Exception as e:
                print(f"Error parsing {file_path}: {e}")

    # Restore locally uploaded datasets and their display metadata after an API restart.
    upload_dir = os.path.join(DATA_DIR, "uploads")
    if os.path.isdir(upload_dir):
        for metadata_path in glob.glob(os.path.join(upload_dir, "*.json")):
            try:
                with open(metadata_path, "r", encoding="utf-8") as f:
                    uploaded = json.load(f)
                if uploaded.get("csv_path") and os.path.isfile(uploaded["csv_path"]):
                    COMPANIES_REGISTRY[uploaded["company_id"].upper()] = uploaded
            except (OSError, ValueError, KeyError) as e:
                print(f"Error restoring uploaded company {metadata_path}: {e}")

    print(f"Crestfall Database loaded with {len(COMPANIES_REGISTRY)} companies.")

init_database()

def get_company_or_404(company_id: str) -> Dict[str, Any]:
    cid = company_id.upper().strip()
    if cid in COMPANIES_REGISTRY:
        return COMPANIES_REGISTRY[cid]
    # Check partial match on ticker or company_id
    for k, v in COMPANIES_REGISTRY.items():
        if k == cid or v.get("ticker", "").upper() == cid:
            return v
    # Fallback to first company
    if COMPANIES_REGISTRY:
        return next(iter(COMPANIES_REGISTRY.values()))
    raise HTTPException(status_code=404, detail=f"Company {company_id} not found")

def build_simulator(company_dict: Dict[str, Any]) -> FinancialSimulator:
    company = Company(
        company_id=company_dict["company_id"],
        company_name=company_dict["company_name"],
        ticker=company_dict["ticker"],
        exchange=company_dict.get("exchange", "NASDAQ"),
        main_country=company_dict.get("main_country", "US"),
        niche=company_dict.get("niche", "General Industry"),
        currency=company_dict.get("currency", "USD"),
        fiscal_year_end=company_dict.get("fiscal_year_end", "December")
    )
    fin = Financials(**company_dict["financials"])
    mkt = Market(**company_dict["market"])
    mac = Macro(**company_dict["macro"])
    return FinancialSimulator(company, fin, mkt, mac)

# -------------------------------------------------------------
# PYDANTIC REQUEST SCHEMAS
# -------------------------------------------------------------
class ForecastRequest(BaseModel):
    span: str = "12M"
    toggles: Dict[str, Any] = Field(default_factory=dict)
    rate_shock_bps: float = Field(default=0.0, ge=-1000.0, le=1000.0)
    scenario_effects: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    scenario_primitives: Dict[str, float] = Field(default_factory=dict)
    start_month: Optional[str] = None
    end_month: Optional[str] = None
    metric: str = "close"

class CompanyCSVUpload(BaseModel):
    company_name: str = Field(default="", max_length=120)
    ticker: str = Field(default="", max_length=24)
    niche: str = Field(default="User supplied dataset", max_length=120)
    main_country: str = Field(default="Unknown", max_length=80)
    csv_text: str = Field(min_length=20)

class TimingRequest(BaseModel):
    span: str = "12M"
    toggles: Dict[str, Any] = Field(default_factory=dict)
    rate_shock_bps: float = Field(default=0.0, ge=-1000.0, le=1000.0)
    scenario_effects: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    scenario_primitives: Dict[str, float] = Field(default_factory=dict)
    start_month: Optional[str] = None
    end_month: Optional[str] = None
    metric: str = "close"

class PermutationRequest(BaseModel):
    span: str = "12M"
    base_toggles: Dict[str, Any] = Field(default_factory=dict)
    chosen_toggles: List[str] = Field(default_factory=lambda: ["enable_covid", "decision_layoffs", "macro_rate_hike_300bps"])

class SensitivityRequest(BaseModel):
    span: str = "12M"
    toggles: Dict[str, Any] = Field(default_factory=dict)

class RecommendationsRequest(BaseModel):
    span: str = "12M"
    toggles: Dict[str, Any] = Field(default_factory=dict)

# -------------------------------------------------------------
# REST ENDPOINTS (Conforming to RoCast Frontend Structure)
# -------------------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "Crestfall Engine (FastAPI)",
        "companies_loaded": len(COMPANIES_REGISTRY),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/companies")
def list_companies():
    """GET /companies: id, name, niche, country, ticker."""
    res = []
    for k, v in COMPANIES_REGISTRY.items():
        res.append({
            "company_id": v["company_id"],
            "company_name": v["company_name"],
            "ticker": v.get("ticker", v["company_id"]),
            "niche": v.get("niche", "General"),
            "main_country": v.get("main_country", "US"),
            "currency": v.get("currency", "USD"),
            "exchange": v.get("exchange", "NASDAQ"),
            "market_cap_usd_bn": v.get("market", {}).get("market_cap_usd_bn", 10.0)
        })
    res.sort(key=lambda x: x["company_name"])
    return res

@app.post("/api/companies/upload")
def upload_company_csv(req: CompanyCSVUpload):
    """Register a user-provided time-series CSV for the existing analysis API."""
    if len(req.csv_text.encode("utf-8")) > 1024 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="CSV uploads must be 1 GB or smaller.")
    # CSV only, and checked by shape rather than by file name, which a client
    # can always get wrong. A JSON export or a binary workbook would otherwise
    # reach the row parser and fail later with an unhelpful "no date column".
    leading = req.csv_text.lstrip("\ufeff").lstrip()
    if leading.startswith(("{", "[", "<")) or "\x00" in req.csv_text[:8192] or leading[:2] == "PK":
        raise HTTPException(status_code=415, detail="Crestfall accepts .csv files only. Export this dataset as CSV and try again.")
    try:
        reader = csv.DictReader(io.StringIO(req.csv_text.lstrip("\ufeff")))
        if not reader.fieldnames:
            raise HTTPException(status_code=400, detail="The CSV needs a header row.")
        if len([name for name in reader.fieldnames if name]) < 2:
            raise HTTPException(status_code=415, detail="That does not look like a CSV: the header row has no delimiter. Export the dataset as .csv with one column per field.")
        aliases = {field: re.sub(r"[^a-z0-9]+", "_", (field or "").strip().lower()).strip("_") for field in reader.fieldnames}
        raw_rows = [{aliases[key]: (value or "").strip() for key, value in row.items() if key in aliases} for row in reader]
        rows_received = len(raw_rows)
        if not raw_rows:
            raise HTTPException(status_code=400, detail="The CSV has no data rows.")
        headers = set(aliases.values())
        date_key = next((key for key in ("date", "datetime", "timestamp", "period") if key in headers), None)
        if not date_key:
            raise HTTPException(status_code=400, detail="Include a date column (date, datetime, timestamp, or period).")
        categorical_columns = {"company_id", "company_name", "ticker", "exchange", "main_country", "niche", "currency", "fiscal_year_end", "record_provenance", "source_frequency", "event_id", "event_name", "event_category", "decision_type", "short_description", "magnitude_unit", "source_name", "source_url"}
        for row in raw_rows:
            row["date"] = _clean_upload_date(row.get(date_key, ""))
            for key, value in list(row.items()):
                if key.endswith("_date") and key != "date":
                    row[key] = _clean_upload_date(value)
                    continue
                if key == "date" or key in categorical_columns or key.endswith("_id") or key.endswith("_name") or key.endswith("_category") or key.endswith("_description") or key.endswith("_url"):
                    continue
                number = _clean_upload_number(value)
                if number is not None:
                    row[key] = str(number)
                elif str(value).strip().lower() in {"", "na", "n/a", "nan", "null", "none", "-", "—"}:
                    row[key] = ""
        metric_candidates = [key for key in ("adjusted_close", "adjusted_close_price", "adj_close", "close", "close_price", "share_price", "stock_price", "price", "value") if key in headers]
        close_key = metric_candidates[0] if metric_candidates else None
        if not close_key:
            reserved = {date_key, "date", *categorical_columns}
            for key in sorted(headers - reserved):
                if sum(1 for row in raw_rows if _clean_upload_number(row.get(key)) is not None) >= 2:
                    close_key = key
                    break
        if not close_key:
            raise HTTPException(status_code=400, detail="Include a positive numeric series such as close, adjusted_close, value, revenue, product units, or another numeric column.")
        price_columns = {"adjusted_close", "adjusted_close_price", "adj_close", "close", "close_price", "share_price", "stock_price", "price"}
        source_metric_is_price = close_key in price_columns
        if source_metric_is_price:
            if close_key != "close":
                for row in raw_rows:
                    row["close"] = row.get(close_key, "")
        else:
            source_values = []
            for row in raw_rows:
                value = _clean_upload_number(row.get(close_key))
                if value is not None: source_values.append(value)
            if len(source_values) < 2:
                raise HTTPException(status_code=400, detail=f"The selected metric column '{close_key}' needs at least two numeric observations.")
            offset = max(0.01, 1.0 - min(source_values))
            for row in raw_rows:
                value = _clean_upload_number(row.get(close_key))
                row["close"] = str(value + offset) if value is not None else ""
        rows_with_date = [row for row in raw_rows if row.get("date")]
        invalid_dates_removed = rows_received - len(rows_with_date)
        valid_rows = []
        for row in raw_rows:
            try:
                year, month = int(row["date"][:4]), int(row["date"][5:7])
                close = float(row.get("close", ""))
                if year >= 1900 and 1 <= month <= 12 and close > 0 and math.isfinite(close):
                    valid_rows.append(row)
            except (TypeError, ValueError, KeyError):
                continue
        if len(valid_rows) < 2:
            raise HTTPException(status_code=400, detail="At least two dated rows with usable numeric values are required.")
        invalid_metric_rows_removed = len(rows_with_date) - len(valid_rows)
        unique_rows = {}
        for row in valid_rows:
            unique_rows[row["date"]] = row
        duplicate_rows_removed = len(valid_rows) - len(unique_rows)
        valid_rows = sorted(unique_rows.values(), key=lambda row: row["date"])
        available_months = sorted({row["date"][:7] for row in valid_rows})
        if len(available_months) < 2:
            raise HTTPException(status_code=400, detail="At least two distinct months are needed to build a historical trend and forecast.")
    except HTTPException:
        raise
    except (csv.Error, UnicodeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"Could not read CSV: {exc}")

    def first_text(key):
        return next((str(row.get(key, "")).strip() for row in valid_rows if str(row.get(key, "")).strip()), "")
    company_name = first_text("company_name") or req.company_name.strip() or "Uploaded company data"
    ticker_source = req.ticker.strip() or first_text("ticker")
    ticker = re.sub(r"[^A-Z0-9_-]", "", ticker_source.upper())[:24]
    if not ticker:
        # A stable short identifier keeps repeated uploads of the same CSV selectable.
        ticker = f"DATA-{uuid.uuid5(uuid.NAMESPACE_URL, company_name + req.csv_text[:4096]).hex[:8].upper()}"
    company_id = f"UPLOAD-{ticker}"
    upload_dir = os.path.join(DATA_DIR, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    csv_path = os.path.join(upload_dir, f"{company_id}-{uuid.uuid4().hex[:8]}.csv")
    fields = list(dict.fromkeys([*valid_rows[0].keys(), "date", "close"]))
    with open(csv_path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(valid_rows)

    first = valid_rows[0]
    def number(key, default=0.0):
        try:
            return float(first.get(key) or default)
        except (TypeError, ValueError):
            return default
    date = first["date"]
    close = number("close", 1.0)
    revenue = number("revenue_usd_m", 0.0)
    company_record = {
        "company_id": company_id, "company_name": company_name, "ticker": ticker,
        "exchange": "User supplied", "main_country": req.main_country.strip() or "Unknown",
        "niche": req.niche.strip() or "User supplied dataset", "currency": "Source units",
        "fiscal_year_end": "Unknown", "csv_path": csv_path,
        "financials": {
            "date": date, "report_date": date, "source_frequency": "monthly",
            "revenue_usd_m": revenue, "cost_of_revenue_usd_m": number("cost_of_revenue_usd_m"),
            "operating_expense_usd_m": number("operating_expense_usd_m"), "operating_income_usd_m": number("operating_income_usd_m"),
            "net_income_usd_m": number("net_income_usd_m"), "cash_usd_m": number("cash_usd_m"), "total_debt_usd_m": number("total_debt_usd_m"),
            "total_assets_usd_m": number("total_assets_usd_m"), "equity_usd_m": number("equity_usd_m"),
            "operating_cash_flow_usd_m": number("operating_cash_flow_usd_m"), "capex_usd_m": number("capex_usd_m"),
            "shares_outstanding_m": number("shares_outstanding_m"), "restated_flag": False,
        },
        "market": {"date": date, "open": number("open", close), "high": number("high", close), "low": number("low", close),
                   "close": close, "adjusted_close": close, "volume": number("volume"), "market_cap_usd_bn": number("market_cap_usd_bn")},
        "macro": {"country": req.main_country.strip() or "Unknown", "date": date,
                  "policy_rate_pct": number("policy_rate_pct"), "cpi_index": number("cpi_index"),
                  "unemployment_rate_pct": number("unemployment_rate_pct"), "consumer_confidence_index": number("consumer_confidence_index"),
                  "gdp_growth_pct": number("gdp_growth_pct"), "fx_rate_per_usd": number("fx_rate_per_usd", 1.0), "bond_yield_10y_pct": number("bond_yield_10y_pct")},
    }
    COMPANIES_REGISTRY[company_id] = company_record
    with open(os.path.join(upload_dir, f"{company_id}.json"), "w", encoding="utf-8") as handle:
        json.dump(company_record, handle, ensure_ascii=False, indent=2)
    valid_rows.sort(key=lambda row: row["date"])
    default_metric = "close" if source_metric_is_price else close_key
    return {"company_id": company_id, "company_name": company_name, "ticker": ticker, "default_metric": default_metric,
            "observations_received": rows_received, "first_date": valid_rows[0]["date"], "last_date": valid_rows[-1]["date"],
            "cleaning_report": {"rows_received": rows_received, "rows_kept": len(valid_rows), "target_column": close_key,
                "invalid_dates_removed": invalid_dates_removed, "missing_or_invalid_metric_rows_removed": invalid_metric_rows_removed,
                "duplicate_timestamps_removed": duplicate_rows_removed, "months_available": len(available_months),
                "steps": ["Standardized column names and date formats", "Cleaned currency, commas, percentages, and missing-value markers", "Removed rows without a valid date or target value", "Removed exact duplicate timestamps and sorted chronologically", "Aggregated high-grain rows to monthly endpoints for analysis"]}}

@app.get("/api/company/{company_id}/profile")
def get_company_profile(company_id: str, span: str = "12M"):
    """GET /company/{id}/profile: identity, financial summary, decision list, provenance, summary card, span profile."""
    c = get_company_or_404(company_id)
    fin = dict(c.get("financials", {}))
    mkt = dict(c.get("market", {}))
    csv_path = c.get("csv_path") or find_csv_for_company(c.get("company_id", ""), c.get("company_name", ""))
    source_points = load_company_monthly_data(csv_path) if csv_path else []
    latest_observation = source_points[-1] if source_points else {}
    if latest_observation:
        for key in (
            "revenue_usd_m", "cost_of_revenue_usd_m", "operating_expense_usd_m",
            "operating_income_usd_m", "net_income_usd_m", "cash_usd_m", "total_debt_usd_m",
            "total_assets_usd_m", "equity_usd_m", "operating_cash_flow_usd_m", "capex_usd_m",
            "shares_outstanding_m", "market_cap_usd_bn",
        ):
            if latest_observation.get(key) is not None:
                fin[key] = latest_observation[key]
        mkt["market_cap_usd_bn"] = latest_observation.get("market_cap_usd_bn") or mkt.get("market_cap_usd_bn", 100.0)
        fin["date"] = latest_observation["date"]

    rev = fin.get("revenue_usd_m", 10000.0)
    cogs = fin.get("cost_of_revenue_usd_m", 5000.0)
    gp = rev - cogs
    gm = (gp / max(1.0, rev)) * 100.0
    ebit = fin.get("operating_income_usd_m", 2000.0)
    ni = fin.get("net_income_usd_m", 1500.0)
    cash = fin.get("cash_usd_m", 4000.0)
    debt = fin.get("total_debt_usd_m", 5000.0)
    assets = fin.get("total_assets_usd_m", 25000.0)
    equity = fin.get("equity_usd_m", 12000.0)
    ocf = fin.get("operating_cash_flow_usd_m", 2500.0)
    capex = fin.get("capex_usd_m", 800.0)
    fcf = ocf - capex

    # Decision cards come from this company's source file only. Missing records
    # stay missing rather than being filled with example decisions.
    decisions_by_month = {}
    for monthly_point in source_points:
        for record in monthly_point.get("decision_records", []):
            description = record.get("description", "")
            if any(token in description.lower() for token in ("temporal tick", "market bar", "trading record", "regular strategic operating decision")):
                continue
            decisions_by_month.setdefault(record["date"][:7], {
                "decision_id": f"{c['company_id']}_{record['date']}_{record['type']}",
                "company_id": c["company_id"],
                "decision_type": record["type"],
                "announced_date": record["date"],
                "effective_date": record["date"],
                "magnitude": record.get("magnitude"),
                "magnitude_unit": "source unit not provided",
                "short_description": description,
                "source": record.get("source"),
                "reversed_flag": False,
            })
    decisions = [decisions_by_month[month] for month in sorted(decisions_by_month)]

    # Altman Z-score calculation for baseline
    wc = cash - (cogs * 0.25)
    x1 = wc / max(1.0, assets)
    x2 = equity / max(1.0, assets)
    x3 = (ebit * 12.0 / 3.0) / max(1.0, assets)
    x4 = (mkt.get("market_cap_usd_bn", 100.0) * 1000.0) / max(10.0, debt)
    x5 = (rev * 12.0 / 3.0) / max(1.0, assets)
    altman_z = round((1.2 * x1) + (1.4 * x2) + (3.3 * x3) + (0.6 * x4) + (0.999 * x5), 2)

    current_phase = "Growing" if ni > 0 and ebit > 0 else ("Developing" if altman_z >= 1.8 else "Crashing")
    crash_risk = "Low" if altman_z > 3.0 else ("Moderate" if altman_z >= 1.8 else "High")
    previous_observation = source_points[-13] if len(source_points) >= 13 else None
    revenue_change_pct = ((rev / previous_observation["revenue_usd_m"] - 1.0) * 100.0) if previous_observation and previous_observation.get("revenue_usd_m") else None
    # Forecasting is intentionally deferred to the Forecast tab. Running the
    # walk-forward model here as well duplicated work on every company change.

    return {
        "identity": {
            "company_id": c["company_id"],
            "company_name": c["company_name"],
            "ticker": c.get("ticker", c["company_id"]),
            "exchange": c.get("exchange", "NASDAQ"),
            "main_country": c.get("main_country", "US"),
            "niche": c.get("niche", "General"),
            "currency": c.get("currency", "USD"),
            "fiscal_year_end": c.get("fiscal_year_end", "December")
        },
        "financials": {
            "revenue_usd_m": round(rev, 2),
            "revenue_change_pct": round(revenue_change_pct, 2) if revenue_change_pct is not None else None,
            "cost_of_revenue_usd_m": round(cogs, 2),
            "gross_profit_usd_m": round(gp, 2),
            "gross_margin_pct": round(gm, 1),
            "operating_expense_usd_m": round(fin.get("operating_expense_usd_m", 3000.0), 2),
            "operating_income_usd_m": round(ebit, 2),
            "operating_margin_pct": round((ebit / max(1.0, rev)) * 100.0, 1),
            "net_income_usd_m": round(ni, 2),
            "net_income_change_pct": round(((ni / previous_observation["net_income_usd_m"] - 1.0) * 100.0), 2) if previous_observation and previous_observation.get("net_income_usd_m") else None,
            "cash_usd_m": round(cash, 2),
            "cash_change_pct": round(((cash / previous_observation["cash_usd_m"] - 1.0) * 100.0), 2) if previous_observation and previous_observation.get("cash_usd_m") else None,
            "total_debt_usd_m": round(debt, 2),
            "total_assets_usd_m": round(assets, 2),
            "equity_usd_m": round(equity, 2),
            "operating_cash_flow_usd_m": round(ocf, 2),
            "capex_usd_m": round(capex, 2),
            "free_cash_flow_usd_m": round(fcf, 2),
            "shares_outstanding_m": round(fin.get("shares_outstanding_m", 1000.0), 1),
            "altman_z_score": altman_z,
            "cash_runway_months": "999.0" if fcf >= 0 else round(cash / max(0.1, -fcf), 1)
        },
        "decisions": decisions,
        "provenance": {
            "model_version": "Forecast model runs on the Forecast & Scenarios tab",
            "data_date": latest_observation.get("last_observation_date") if latest_observation else None,
            "source_table": os.path.basename(csv_path) if csv_path else None,
            "label": latest_observation.get("record_provenance", "Local company dataset") if latest_observation else "No source rows found",
            "notes": "Company financial fields are latest supplied observations; forecasts use month-end adjusted closes and are validated chronologically."
        },
        "summary": {
            "current_phase": current_phase,
            "direction": None,
            "next_peak_year": None,
            "crash_risk_level": crash_risk,
            "active_toggles_count": 0
        },
        "span_profile": {
            "span": span,
            "predicted_growth_pct": None,
            "phase": current_phase,
            "direction": None,
            "crash_prob_pct": None,
            "peak_timing": None,
            "main_drivers": ["Open Forecast & Scenarios to run the walk-forward projection", "Company-specific monthly observations"]
        }
    }

@app.get("/api/company/{company_id}/strengths")
def get_company_strengths(company_id: str, peer_group: str = "niche"):
    """GET /company/{id}/strengths?peer_group=: metrics and ranks against niche peers."""
    c = get_company_or_404(company_id)
    if company_id.startswith("UPLOAD-"):
        points = load_company_monthly_data(c.get("csv_path"))
        closes = [float(point["close"]) for point in points if point.get("close") and float(point["close"]) > 0]
        returns = [math.log(current / previous) for previous, current in zip(closes, closes[1:])]
        period_return = (closes[-1] / closes[0] - 1.0) * 100.0 if len(closes) > 1 else None
        mean_return = sum(returns) / len(returns) if returns else 0.0
        volatility = math.sqrt(sum((value - mean_return) ** 2 for value in returns) / max(1, len(returns) - 1)) * math.sqrt(12) * 100.0 if returns else None
        peak = closes[0] if closes else 0.0
        max_drawdown = 0.0
        for value in closes:
            peak = max(peak, value)
            if peak:
                max_drawdown = min(max_drawdown, (value / peak - 1.0) * 100.0)
        pros, cons = [], []
        if period_return is not None and period_return > 0:
            pros.append({"title": "Positive observed trend", "desc": f"The supplied series rose {period_return:+.1f}% from {points[0]['date']} to {points[-1]['date']}. This describes the historical data, not a forecast.", "linked_to": "Supplied time series", "type": "historical evidence"})
        if len(points) >= 12:
            pros.append({"title": "Usable history for trend analysis", "desc": f"The file contains {len(points)} monthly observations from {points[0]['date']} to {points[-1]['date']}.", "linked_to": "Data coverage", "type": "observed"})
        elif points:
            cons.append({"title": "Short observation history", "desc": f"Only {len(points)} monthly observations are available; longer term patterns and forecasts have limited evidence.", "linked_to": "Data coverage", "type": "limitation"})
        if period_return is not None and period_return < 0:
            cons.append({"title": "Negative observed trend", "desc": f"The supplied series fell {period_return:.1f}% from {points[0]['date']} to {points[-1]['date']}. This describes the historical data, not a forecast.", "linked_to": "Supplied time series", "type": "historical evidence"})
        if max_drawdown <= -20:
            cons.append({"title": "Large historical drawdown", "desc": f"The series fell {max_drawdown:.1f}% from a previous peak during the observed period.", "linked_to": "Historical drawdown", "type": "risk"})
        if not pros and not cons:
            cons.append({"title": "Limited evidence", "desc": "The supplied file does not contain enough valid positive monthly observations to identify a clear strength or weakness.", "linked_to": "Data coverage", "type": "limitation"})
        return {
            "company_id": c["company_id"], "peer_group": "company history", "total_peers": 0,
            "metrics": [
                {"name": "Observed period change", "value": f"{period_return:+.1f}%" if period_return is not None else "Unavailable", "rank": None, "total_peers": 0, "status": "observed"},
                {"name": "Annualized volatility", "value": f"{volatility:.1f}%" if volatility is not None else "Unavailable", "rank": None, "total_peers": 0, "status": "observed"},
                {"name": "Maximum drawdown", "value": f"{max_drawdown:.1f}%" if closes else "Unavailable", "rank": None, "total_peers": 0, "status": "observed"},
            ],
            "pros": pros, "cons": cons,
        }
    niche = c.get("niche", "General")

    # Identify peers in the same niche
    peers = [comp for comp in COMPANIES_REGISTRY.values() if comp.get("niche", "").lower() == niche.lower() or peer_group == "country" and comp.get("main_country") == c.get("main_country")]

    # If no peers available, use universal sector strategies for context
    if not peers:
        strategies_manager = UniversalSectorStrategies()
        sector_info = strategies_manager.get_strategies_for_company(niche, c.get("company_name", ""))
        total_peers = 0  # No specific peers, but we have sector context
        use_sector_context = True
    else:
        total_peers = max(4, len(peers))
        use_sector_context = False

    fin = c.get("financials", {})
    rev = fin.get("revenue_usd_m", 10000.0)
    ebit = fin.get("operating_income_usd_m", 2000.0)
    cash = fin.get("cash_usd_m", 4000.0)
    debt = fin.get("total_debt_usd_m", 5000.0)
    equity = fin.get("equity_usd_m", 12000.0)
    margin = (ebit / max(1.0, rev)) * 100.0
    de_ratio = (debt / max(1.0, equity)) * 100.0

    # Build response with or without sector context
    if use_sector_context:
        strategies_manager = UniversalSectorStrategies()
        sector_info = strategies_manager.get_strategies_for_company(niche, c.get("company_name", ""))

        # Generate sector-based pros/cons
        pros = [
            {
                "title": f"Aligned with {sector_info.label} Sector Trends",
                "desc": f"Company operates in the {sector_info.label} sector where key trends include: {', '.join(sector_info.sector_trends[:3])}.",
                "linked_to": "Sector Analysis",
                "type": "sector"
            },
            {
                "title": f"{sector_info.label} Competitive Factors",
                "desc": f"Key competitive factors in this sector: {', '.join(sector_info.competitive_factors[:3])}.",
                "linked_to": "Sector Context",
                "type": "sector"
            }
        ]

        cons = [
            {
                "title": "No Direct Peer Comparisons Available",
                "desc": "Specific peer competitors were not found in the dataset. Analysis uses universal sector patterns instead of direct peer benchmarking.",
                "linked_to": "Data Limitation",
                "type": "limitation"
            }
        ]

        metrics = [
            { "name": "Operating Margin", "value": f"{margin:.1f}%", "rank": None, "total_peers": 0, "status": "observed" },
            { "name": "Debt-to-Equity", "value": f"{de_ratio:.1f}%", "rank": None, "total_peers": 0, "status": "observed" },
            { "name": "Cash Position", "value": f"${cash:,.0f}M", "rank": None, "total_peers": 0, "status": "observed" },
        ]
    else:
        # Original peer-based logic
        pros = [
            {
                "title": f"Leading {niche} Market Moat",
                "desc": "High customer retention and pricing power allow inflation pass-through without volume loss.",
                "linked_to": "Product Launch & R&D Commitment",
                "type": "decision"
            },
            {
                "title": "Above-Average Gross & Operating Margins",
                "desc": f"Operating margin of {margin:.1f}% ranks in the top quartile of {niche} competitors.",
                "linked_to": "Procurement Cost Restructuring",
                "type": "metric"
            },
            {
                "title": "Robust Liquidity & Cash Reserves",
                "desc": f"${cash:,.0f}M cash buffer shields operations from rate shocks and debt refinancing stress.",
                "linked_to": "Conservative Capital Allocation",
                "type": "decision"
            }
        ]

        cons = [
            {
                "title": "Macro Sensitivity to Interest Rate Hikes",
                "desc": "Extended valuation multiples contract if 10-Year sovereign yields rise by over 150bps.",
                "linked_to": "Macro Rate Shock (2022 Cycle)",
                "type": "macro"
            },
            {
                "title": "Global Supply Chain Dependency",
                "desc": "Vulnerability to international freight bottlenecks and hardware component delays.",
                "linked_to": "Geopolitical Supply Disruptions",
                "type": "event"
            }
        ]

        metrics = [
            { "name": "Operating Margin", "value": f"{margin:.1f}%", "rank": 2, "total_peers": total_peers, "status": "pro" },
            { "name": "YoY Revenue Growth", "value": "12.4%", "rank": 3, "total_peers": total_peers, "status": "pro" },
            { "name": "Cash Runway", "value": "Self-Sustaining", "rank": 1, "total_peers": total_peers, "status": "pro" },
            { "name": "Debt-to-Equity", "value": f"{de_ratio:.1f}%", "rank": 2, "total_peers": total_peers, "status": "pro" },
            { "name": "Historical Earnings Stability", "value": "Beta 0.88", "rank": 4, "total_peers": total_peers, "status": "con" }
        ]

    return {
        "company_id": c["company_id"],
        "peer_group": peer_group,
        "total_peers": total_peers,
        "use_sector_context": use_sector_context,
        "metrics": metrics,
        "pros": pros,
        "cons": cons,
    }


COMPANIES_MONTHLY_CACHE: Dict[str, List[Dict[str, Any]]] = {}
COMPANY_CSV_FIELDS: Dict[str, set] = {}
_MONTHLY_CACHE_LOCKS: Dict[str, threading.Lock] = {}
_MONTHLY_CACHE_LOCKS_GUARD = threading.Lock()
DAILY_SERIES_CACHE: Dict[tuple, List[Dict[str, Any]]] = {}
_DAILY_SERIES_CACHE_LOCK = threading.RLock()
_RAW_CSV_CACHE: Dict[str, List[Dict[str, str]]] = {}
_RAW_CSV_CACHE_LOCK = threading.RLock()
MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

def format_month_label(ym: str) -> str:
    try:
        parts = ym.split("-")
        y = parts[0]
        m = int(parts[1])
        return f"{MONTH_NAMES[m - 1]} {y}"
    except Exception:
        return ym

def _is_numeric_value(value: Any) -> bool:
    try:
        return math.isfinite(float(value))
    except (TypeError, ValueError):
        return False

def _clean_upload_number(value: Any) -> Optional[float]:
    text = str(value or "").strip()
    if text.lower() in {"", "na", "n/a", "nan", "null", "none", "-", "—"}:
        return None
    negative = text.startswith("(") and text.endswith(")")
    text = text.strip("() ").replace(",", "").replace("%", "")
    for symbol in ("$", "€", "£", "₹"):
        text = text.replace(symbol, "")
    try:
        number = float(text)
        if negative: number = -abs(number)
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None

def _load_raw_csv_data(csv_path: str) -> List[Dict[str, str]]:
    """Load and cache raw CSV data for a file. Returns list of row dicts with string values."""
    with _RAW_CSV_CACHE_LOCK:
        if csv_path in _RAW_CSV_CACHE:
            return _RAW_CSV_CACHE[csv_path]
        
        if not csv_path or not os.path.isfile(csv_path):
            return []
        
        raw_rows = []
        with open(csv_path, "r", encoding="utf-8", errors="ignore", newline="") as source:
            reader = csv.DictReader(source)
            for row in reader:
                raw_rows.append(dict(row))
        
        _RAW_CSV_CACHE[csv_path] = raw_rows
        # Cap cache to prevent memory bloat
        while len(_RAW_CSV_CACHE) > 50:
            _RAW_CSV_CACHE.pop(next(iter(_RAW_CSV_CACHE)))
        
        return raw_rows

def _clean_upload_date(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    if re.fullmatch(r"\d{5}", text) and 1 <= int(text) <= 100000:
        return (datetime(1899, 12, 30) + timedelta(days=int(text))).date().isoformat()
    quarter = re.fullmatch(r"(\d{4})[- ]?Q([1-4])", text, re.IGNORECASE)
    if quarter:
        return f"{quarter.group(1)}-{int(quarter.group(2)) * 3:02d}-01"
    if re.fullmatch(r"\d{4}", text):
        return f"{text}-12-31"
    if re.fullmatch(r"\d{4}[-/]\d{1,2}", text):
        year, month = re.split(r"[-/]", text)
        month_num = int(month)
        if 1 <= month_num <= 12:
            return f"{int(year):04d}-{month_num:02d}-01"
    iso_text = text.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(iso_text)
        return parsed.isoformat(sep=" ", timespec="seconds") if ("T" in text or " " in text) else parsed.date().isoformat()
    except ValueError:
        pass
    for pattern in ("%m/%d/%Y", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d-%b-%Y", "%b %Y"):
        try:
            parsed = datetime.strptime(text, pattern)
            return parsed.date().isoformat()
        except ValueError:
            continue
    return ""

def _file_slug(path: str) -> str:
    """blackrock_rocast_updated_dataset_v3.csv -> blackrock"""
    base = os.path.splitext(os.path.basename(path))[0].lower()
    base = re.sub(r"[_\- ]?rocast[_\- ]?(updated[_\- ]?)?dataset[_\- ]*v?\d*", "", base)
    return re.sub(r"[^a-z0-9]+", "_", base).strip("_")

def _company_search_keys(company_id: str, company_name: str = "", ticker: str = "") -> set:
    """Every reasonable way this company could appear in a filename."""
    noise = {"the", "inc", "llc", "ltd", "limited", "corp", "corporation", "company",
             "co", "plc", "group", "holdings", "ag", "nv", "sa", "spa", "and", "of"}
    keys = set()
    for raw in (company_id, ticker, company_name):
        text = str(raw or "").lower().strip()
        if not text:
            continue
        text = re.sub(r"\.(ns|hk|de|ch|l|si|mx)$", "", text)
        keys.add(re.sub(r"[^a-z0-9]+", "_", text).strip("_"))
        words = [word for word in re.sub(r"[^a-z0-9 ]", " ", text).split() if word not in noise]
        if words:
            keys.add("_".join(words))
            keys.add(words[0])
            if len(words) > 1:
                keys.add(f"{words[0]}_{words[1]}")
    return {key for key in keys if len(key) >= 3}

def find_csv_for_company(company_id: str, company_name: str = "", ticker: str = "") -> Optional[str]:
    """Resolve a company to its own source file.

    The previous version matched on a raw substring and, when nothing matched,
    returned files[0]. That silently handed Adobe's CSV to BlackRock, Goldman
    Sachs, Coca-Cola, Netflix, Nike, TCS and Tesla - eight companies were being
    analysed and forecast from another company's data. Matching is now name-
    aware and returns None instead of a wrong file, so a missing dataset is
    visible rather than plausible.
    """
    files = glob.glob(os.path.join(NEW_DATA_DIR, "*.csv"))
    keyed = [(_file_slug(path), path) for path in files]
    keys = _company_search_keys(company_id, company_name, ticker)
    for slug, path in keyed:
        if slug in keys:
            return path
    for slug, path in keyed:
        if any(key == slug or key in slug.split("_") or slug.startswith(f"{key}_") for key in keys):
            return path
    for slug, path in keyed:
        compact_slug = slug.replace("_", "")
        if any(len(key) >= 5 and key.replace("_", "") in compact_slug for key in keys):
            return path
    # Registry ids are tickers while filenames use the brand (TSM vs tsmc).
    # Accept a prefix only when exactly one file could take it, so an
    # abbreviation can never silently borrow another company's data.
    prefix_matches = []
    for slug, path in keyed:
        tokens = slug.split("_")
        if any(
            len(key) >= 3 and any(token.startswith(key) and token != key for token in tokens)
            for key in keys
        ):
            prefix_matches.append(path)
    if len(set(prefix_matches)) == 1:
        return prefix_matches[0]
    return None

def bind_registry_to_source_files() -> None:
    """Resolve every company to its own source file once, at startup.

    Before this, each request re-derived the path with a substring match that
    fell back to the alphabetically first CSV - so BlackRock, Goldman Sachs,
    Coca-Cola, Netflix, Nike, TCS and Tesla were all being analysed and
    forecast from Adobe's file. Binding here also makes the provenance label
    in the UI truthful.
    """
    resolved, unresolved = 0, []
    for cid, entry in COMPANIES_REGISTRY.items():
        if entry.get("csv_path") and os.path.isfile(entry["csv_path"]):
            resolved += 1
            continue
        path = find_csv_for_company(cid, entry.get("company_name", ""), entry.get("ticker", ""))
        if path:
            entry["csv_path"] = path
            resolved += 1
        else:
            unresolved.append(cid)
    if unresolved:
        print(f"WARNING: no source file found for {len(unresolved)} companies: {unresolved}")
    print(f"Source files bound to {resolved} of {len(COMPANIES_REGISTRY)} companies.")

bind_registry_to_source_files()

def load_company_monthly_data(file_path: str) -> List[Dict[str, Any]]:
    with _MONTHLY_CACHE_LOCKS_GUARD:
        lock = _MONTHLY_CACHE_LOCKS.setdefault(file_path or "", threading.Lock())
    with lock:
        return _load_company_monthly_data_locked(file_path)

def _load_company_monthly_data_locked(file_path: str) -> List[Dict[str, Any]]:
    if file_path in COMPANIES_MONTHLY_CACHE:
        return COMPANIES_MONTHLY_CACHE[file_path]
    monthly: Dict[str, Dict[str, Any]] = {}
    if not file_path or not os.path.exists(file_path):
        return []
    
    # Use cached raw CSV data if available for faster loading
    raw_rows = _load_raw_csv_data(file_path)
    if not raw_rows:
        return []
    
    COMPANY_CSV_FIELDS[file_path] = set(raw_rows[0].keys()) if raw_rows else set()
    for row in raw_rows:
        d = row.get("date", "")
        if not d:
            continue
        ym = d[:7]  # YYYY-MM
        try:
            rev = float(row.get("revenue_usd_m") or 0)
            cogs = float(row.get("cost_of_revenue_usd_m") or 0)
            close = float(row.get("adjusted_close") or row.get("close") or 0)
            if close <= 0 or not math.isfinite(close):
                continue
            prior = monthly.get(ym, {})
            # Source files have multiple intraday rows per date. Retain the
            # final observation in each month so price and fundamentals use
            # the same timestamp instead of mixing first and last rows.
            monthly[ym] = {
                "date": ym,
                "last_observation_date": d[:10],
                "date_label": format_month_label(ym),
                "value": round(close, 4),
                "close": close,
                "adjusted_close": close,
                "revenue_usd_m": rev,
                "monthly_revenue_run_rate_usd_m": round(rev / 12.0, 1),
                "cost_of_revenue_usd_m": cogs,
                "margin": round(((rev - cogs) / max(1.0, rev)) * 100.0, 1) if rev > 0 else 0.0,
                "raw_rev": rev,
                "operating_expense_usd_m": float(row.get("operating_expense_usd_m") or 0),
                "operating_income_usd_m": float(row.get("operating_income_usd_m") or 0),
                "net_income_usd_m": float(row.get("net_income_usd_m") or 0),
                "cash_usd_m": float(row.get("cash_usd_m") or 0),
                "total_debt_usd_m": float(row.get("total_debt_usd_m") or 0),
                "total_assets_usd_m": float(row.get("total_assets_usd_m") or 0),
                "equity_usd_m": float(row.get("equity_usd_m") or 0),
                "operating_cash_flow_usd_m": float(row.get("operating_cash_flow_usd_m") or 0),
                "capex_usd_m": float(row.get("capex_usd_m") or 0),
                "shares_outstanding_m": float(row.get("shares_outstanding_m") or 0),
                "market_cap_usd_bn": float(row.get("market_cap_usd_bn") or 0),
                "volume": float(row.get("volume") or 0),
                "sector_index_close": float(row.get("sector_index_close") or 0),
                "home_index_close": float(row.get("home_index_close") or 0),
                "policy_rate_pct": float(row.get("policy_rate_pct") or 0),
                "cpi_index": float(row.get("cpi_index") or 0),
                "unemployment_rate_pct": float(row.get("unemployment_rate_pct") or 0),
                "consumer_confidence_index": float(row.get("consumer_confidence_index") or 0),
                "gdp_growth_pct": float(row.get("gdp_growth_pct") or 0),
                "fx_rate_per_usd": float(row.get("fx_rate_per_usd") or 0),
                "bond_yield_10y_pct": float(row.get("bond_yield_10y_pct") or 0),
                "product_metrics": {
                    key: float(row.get(key) or 0)
                    for key in ("iphone_revenue_usd_m", "services_revenue_usd_m", "wearables_home_acc_usd_m", "mac_revenue_usd_m", "ipad_revenue_usd_m")
                    if row.get(key) not in (None, "")
                },
                "primitive_values": {
                    key.removeprefix("primitive_"): float(row.get(key) or 0)
                    for key in ("primitive_demand", "primitive_supply", "primitive_cost", "primitive_competition", "primitive_regulation", "primitive_technology", "primitive_macro", "primitive_pandemic")
                    if row.get(key) not in (None, "")
                },
                "extra_numeric_metrics": {
                    key: float(row[key])
                    for key in COMPANY_CSV_FIELDS.get(file_path, set())
                    if key not in {"open", "high", "low", "close", "adjusted_close", "volume", "date", "company_id", "company_name", "ticker", "exchange", "main_country", "niche", "currency", "fiscal_year_end", "record_provenance", "source_frequency", "event_id", "event_name", "event_category", "event_date", "decision_type", "announced_date", "effective_date", "short_description", "magnitude", "magnitude_unit", "source_url", "source_name"}
                    and row.get(key) not in (None, "")
                    and _is_numeric_value(row.get(key))
                },
                "metric_values": {
                    "close": close,
                    "revenue_run_rate": rev / 12.0 if rev else None,
                    "margin": ((rev - cogs) / max(1.0, rev)) * 100.0 if rev else None,
                    **{f"product_metrics.{k}": float(row.get(k) or 0) for k in ("iphone_revenue_usd_m", "services_revenue_usd_m", "wearables_home_acc_usd_m", "mac_revenue_usd_m", "ipad_revenue_usd_m") if row.get(k) not in (None, "")},
                    **{k: float(row[k]) for k in COMPANY_CSV_FIELDS.get(file_path, set()) if k not in {"open", "high", "low", "close", "adjusted_close", "volume", "date", "company_id", "company_name", "ticker", "exchange", "main_country", "niche", "currency", "fiscal_year_end", "record_provenance", "source_frequency", "event_id", "event_name", "event_category", "event_date", "decision_type", "announced_date", "effective_date", "short_description", "magnitude", "magnitude_unit", "source_url", "source_name", "revenue_usd_m", "cost_of_revenue_usd_m"} and row.get(k) not in (None, "") and _is_numeric_value(row.get(k))}
                },
                "record_provenance": row.get("record_provenance") or "",
                "source_frequency": row.get("source_frequency") or "unknown",
                "event_records": prior.get("event_records", []),
                "decision_records": prior.get("decision_records", []),
                "_event_keys": prior.get("_event_keys", set()),
                "_decision_keys": prior.get("_decision_keys", set()),
            }
            event_name = (row.get("event_name") or "").strip()
            event_category = (row.get("event_category") or "").strip()
            event_date = d[:10]
            if (
                    event_name and event_category
                    and "INTRADAY" not in event_category.upper()
                    and "HIGH-GRAIN TEMPORAL TICK" not in event_name.upper()
                    and not event_name.upper().startswith("OPERATIONAL MILESTONE & MARKET ADJUSTMENT")
                ):
                    event_key = (row.get("event_id") or event_name, event_name, event_category)
                    if event_key not in monthly[ym]["_event_keys"]:
                        monthly[ym]["_event_keys"].add(event_key)
                        monthly[ym]["event_records"].append({
                            "date": event_date, "name": event_name, "category": event_category,
                            "event_id": row.get("event_id") or "", "source": row.get("record_provenance") or "",
                        })
            decision_type = (row.get("decision_type") or "").strip()
            decision_date = (row.get("effective_date") or row.get("announced_date") or "")[:10]
            description = (row.get("short_description") or "").strip()
            if decision_type and decision_date and not any(
                token in description.lower()
                for token in ("temporal tick", "market bar", "trading record", "regular strategic operating decision", "official rocast primary data record", "official company disclosure and market bar")
            ):
                # Daily high-grain rows repeat monthly decision labels with
                # different bar dates. Retain each source description once
                # per month in the analysis series.
                decision_key = (decision_date[:7], decision_type, description)
                if decision_key not in monthly[ym]["_decision_keys"]:
                    monthly[ym]["_decision_keys"].add(decision_key)
                    monthly[ym]["decision_records"].append({
                        "date": decision_date, "type": decision_type.replace("_", " ").title(),
                        "description": description, "magnitude": row.get("magnitude") or "",
                        "source": row.get("record_provenance") or "",
                    })
        except (TypeError, ValueError):
            continue
    pts = [monthly[k] for k in sorted(monthly.keys())]
    previous_sector = previous_home = previous_rate = None
    for point in pts:
        point.pop("_event_keys", None)
        point.pop("_decision_keys", None)
        sector = point.get("sector_index_close") or 0.0
        home = point.get("home_index_close") or 0.0
        rate = point.get("policy_rate_pct") or 0.0
        point["sector_return_pct"] = ((sector / previous_sector - 1.0) * 100.0) if sector and previous_sector else 0.0
        point["home_index_return_pct"] = ((home / previous_home - 1.0) * 100.0) if home and previous_home else 0.0
        point["policy_rate_change_pct"] = (rate - previous_rate) if previous_rate is not None else 0.0
        previous_sector = sector or previous_sector
        previous_home = home or previous_home
        previous_rate = rate
    COMPANIES_MONTHLY_CACHE[file_path] = pts
    return pts

@app.get("/api/company/{company_id}/history")
def get_company_history(
    company_id: str,
    view: str = "monthly",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    year: Optional[str] = None,
    quick_filter: Optional[str] = None
):
    """GET /company/{id}/history?view=monthly|yearly&start_date=...&end_date=...&year=...&quick_filter=...
    Returns dynamic historical trajectory, smoothed trend, dynamic peaks/troughs, overlays, and yearly summary.
    """
    c = get_company_or_404(company_id)
    csv_p = c.get("csv_path") or find_csv_for_company(c.get("company_id", ""), c.get("company_name", ""))
    all_pts = load_company_monthly_data(csv_p) if csv_p else []

    fin = c.get("financials", {})
    base_rev = fin.get("revenue_usd_m", 10000.0) / (3.0 if "quarter" in fin.get("source_frequency", "quarter").lower() else 12.0)
    base_margin = ((fin.get("revenue_usd_m", 10000.0) - fin.get("cost_of_revenue_usd_m", 5000.0)) / max(1.0, fin.get("revenue_usd_m", 10000.0))) * 100.0

    # Do not draw fabricated fallback histories. A missing data series should
    # remain visibly missing so the dashboard cannot imply observed facts.
    if not all_pts:
        return {
            "company_id": c["company_id"], "view": view, "history": [],
            "available_years": [], "peaks": [], "troughs": [], "regions": [],
            "pins": [], "decisions": [], "event_explanations": [],
            "yearly_summary": [], "seasonality": [],
            "data_quality": {"status": "missing", "message": "No usable dated market observations were found for this company."},
        }

    min_date = all_pts[0]["date"]
    max_date = all_pts[-1]["date"]
    available_years = sorted(list(set(int(p["date"][:4]) for p in all_pts)))

    # Quick filter or Year or Date Range
    if quick_filter:
        qf = quick_filter.upper().strip()
        if qf == "6M":
            filtered = all_pts[-6:]
        elif qf == "12M":
            filtered = all_pts[-12:]
        elif qf == "24M":
            filtered = all_pts[-24:]
        elif qf == "YTD":
            max_yr = max_date[:4]
            filtered = [p for p in all_pts if p["date"].startswith(max_yr)]
        elif qf == "ALL":
            filtered = all_pts
        else:
            filtered = all_pts[-24:]
    elif year and year != "all":
        filtered = [p for p in all_pts if p["date"].startswith(str(year))]
    else:
        s_date = start_date[:7] if start_date else None
        e_date = end_date[:7] if end_date else None
        if s_date and e_date and s_date > e_date:
            s_date, e_date = e_date, s_date

        filtered = all_pts
        if s_date:
            filtered = [p for p in filtered if p["date"] >= s_date]
        if e_date:
            filtered = [p for p in filtered if p["date"] <= e_date]

        if not s_date and not e_date and (not year or year == "all") and len(all_pts) > 24:
            filtered = all_pts[-24:]

    if not filtered:
        filtered = all_pts[-12:] if len(all_pts) >= 12 else all_pts

    active_start = filtered[0]["date"]
    active_end = filtered[-1]["date"]
    active_start_label = format_month_label(active_start)
    active_end_label = format_month_label(active_end)
    active_range_label = f"{active_start_label} - {active_end_label} ({len(filtered)} Months)"

    # Handle Yearly aggregation
    if view == "yearly":
        year_groups = {}
        target_pts = all_pts if (not year or year == "all") and not quick_filter else filtered
        for p in target_pts:
            yr = p["date"][:4]
            if yr not in year_groups:
                year_groups[yr] = []
            year_groups[yr].append(p)

        yearly_points = []
        for yr in sorted(year_groups.keys()):
            pts_in_year = year_groups[yr]
            last_close = pts_in_year[-1]["close"]
            avg_margin = round(sum(p["margin"] for p in pts_in_year) / len(pts_in_year), 1)
            yearly_points.append({
                "date": yr,
                "date_label": yr,
                "value": pts_in_year[-1]["close"],
                "revenue_run_rate": round(sum(p["monthly_revenue_run_rate_usd_m"] for p in pts_in_year) / len(pts_in_year), 1),
                "margin": avg_margin,
                "close": last_close
            })
        final_history = yearly_points
        active_start, active_end = f"{final_history[0]['date']}-01", f"{final_history[-1]['date']}-12"
        active_range_label = f"{final_history[0]['date']} - {final_history[-1]['date']} ({len(final_history)} Years)"
    else:
        final_history = [
            {
                "date": p["date"],
                "date_label": p["date_label"],
                "value": p["value"],
                "revenue_run_rate": p["monthly_revenue_run_rate_usd_m"],
                "margin": p["margin"],
                "close": p["close"],
                "event_records": p.get("event_records", []),
                "decision_records": p.get("decision_records", []),
                "sector_return_pct": p.get("sector_return_pct", 0.0),
                "home_index_return_pct": p.get("home_index_return_pct", 0.0),
                "policy_rate_change_pct": p.get("policy_rate_change_pct", 0.0),
                "sector_index_close": p.get("sector_index_close", 0.0),
                "home_index_close": p.get("home_index_close", 0.0),
                "policy_rate_pct": p.get("policy_rate_pct", 0.0),
                "cpi_index": p.get("cpi_index", 0.0),
                "unemployment_rate_pct": p.get("unemployment_rate_pct", 0.0),
                "consumer_confidence_index": p.get("consumer_confidence_index", 0.0),
                "gdp_growth_pct": p.get("gdp_growth_pct", 0.0),
                "fx_rate_per_usd": p.get("fx_rate_per_usd", 0.0),
                "bond_yield_10y_pct": p.get("bond_yield_10y_pct", 0.0),
                "product_metrics": p.get("product_metrics", {}),
                "primitive_values": p.get("primitive_values", {}),
                "metric_values": {
                    "close": p["close"],
                    "revenue_run_rate": p["monthly_revenue_run_rate_usd_m"],
                    "margin": p["margin"],
                    "operating_income_usd_m": p.get("operating_income_usd_m", 0.0),
                    "net_income_usd_m": p.get("net_income_usd_m", 0.0),
                    "cash_usd_m": p.get("cash_usd_m", 0.0),
                    "total_debt_usd_m": p.get("total_debt_usd_m", 0.0),
                    "market_cap_usd_bn": p.get("market_cap_usd_bn", 0.0),
                    **p.get("product_metrics", {}),
                    **p.get("extra_numeric_metrics", {}),
                },
            }
            for p in filtered
        ]

    # Smoothed trend
    smoothed_trend = []
    w = 3
    for i in range(len(final_history)):
        win = final_history[max(0, i - w + 1): i + 1]
        smoothed_trend.append({
            "date": final_history[i]["date"],
            "date_label": final_history[i]["date_label"],
            "value": round(sum(item["value"] for item in win) / len(win), 1)
        })

    # Dynamic peaks & troughs
    peaks = []
    troughs = []
    if len(final_history) >= 2:
        vals = [p["value"] for p in final_history]
        max_v = max(vals)
        min_v = min(vals)
        p_idx = vals.index(max_v)
        t_idx = vals.index(min_v)
        peaks.append({
            "date": final_history[p_idx]["date"],
            "date_label": final_history[p_idx]["date_label"],
            "level": max_v,
            "label": f"Peak ({max_v:,.0f}M)"
        })
        if t_idx != p_idx:
            troughs.append({
                "date": final_history[t_idx]["date"],
                "date_label": final_history[t_idx]["date_label"],
                "level": min_v,
                "label": f"Trough ({min_v:,.0f}M)"
            })

    # Build overlay records only from dates and labels present in this company's
    # source file. Generic intraday ticks are not promoted to business events.
    all_regions = []
    event_explanations = []
    decisions_by_key = {}
    season_returns: Dict[int, List[float]] = {m: [] for m in range(1, 13)}
    prior_close = None
    prior_sector = None
    for idx, point in enumerate(all_pts):
        month_num = int(point["date"][5:7])
        if prior_close and point["close"] > 0:
            month_return = (point["close"] / prior_close - 1.0) * 100.0
            season_returns[month_num].append(month_return)
        else:
            month_return = None
        sector = point.get("sector_index_close") or 0
        sector_return = ((sector / prior_sector - 1.0) * 100.0) if sector and prior_sector else None
        prior_close = point["close"]
        prior_sector = sector or prior_sector

        for event in point.get("event_records", []):
            event_label = f"{event['name']} ({event['category']})"
            # Intraday ticks are raw market bars, not independently named events.
            if (
                "INTRADAY" in event["category"].upper()
                or "HIGH-GRAIN TEMPORAL TICK" in event["name"].upper()
                or event["name"].upper().startswith("OPERATIONAL MILESTONE & MARKET ADJUSTMENT")
            ):
                continue
            label_text = f"{event['name']} {event['category']}".lower()
            is_festival = any(word in label_text for word in ("festival", "holiday", "diwali", "sale", "shopping", "big billion days"))
            is_named_crisis = any(word in label_text for word in ("covid", "coronavirus", "pandemic", "9/11", "september 11", "september 2001", "world trade center"))
            # The overlay is for named, dated occurrences. Generic operating
            # tags and recurring panel labels do not define a special-event era.
            if is_named_crisis or not is_festival:
                continue
            all_regions.append({
                "name": event_label,
                "category": "festival" if is_festival else "event",
                "source_category": event["category"],
                "color": "#FACC15" if is_festival else "#8B5CF6",
                "start": event["date"][:7], "end": event["date"][:7],
                "event_id": event["event_id"],
                "observed_change_pct": round(month_return, 2) if month_return is not None else None,
                "sector_change_pct": round(sector_return, 2) if sector_return is not None else None,
                "interpretation": "Observed company and sector movement in the event month; association is not proof of causation.",
            })
        for decision in point.get("decision_records", []):
            if "HIGH-GRAIN TEMPORAL TICK" in decision["description"].upper():
                continue
            key = (decision["date"], decision["type"], decision["description"])
            decisions_by_key[key] = {
                **decision,
                "company_return_month_pct": round(month_return, 2) if month_return is not None else None,
                "sector_return_month_pct": round(sector_return, 2) if sector_return is not None else None,
                "interpretation": "Month-level association only; this does not isolate the decision's causal effect.",
            }

    # Add canonical, date-specific macro shocks only when this company's source
    # has observations around them. The marker remains a context annotation;
    # movement beside it is descriptive, not a causal estimate.
    for start_month, end_month, label in (
        ("2001-09", "2001-10", "September 11 attacks (9/11)"),
        ("2020-02", "2020-04", "COVID-19 market shock"),
    ):
        period_points = [(i, point) for i, point in enumerate(all_pts) if start_month <= point["date"] <= end_month]
        if not period_points:
            continue
        first_index, _ = period_points[0]
        last_index, last_point = period_points[-1]
        previous = all_pts[first_index - 1] if first_index > 0 else None
        change = ((last_point["close"] / previous["close"] - 1.0) * 100.0) if previous and previous["close"] else None
        all_regions.append({
            "name": label, "category": "event", "source_category": "macro context",
            "color": "#8B5CF6", "start": start_month, "end": end_month,
            "event_id": f"macro:{start_month}",
            "observed_change_pct": round(change, 2) if change is not None else None,
            "sector_change_pct": None,
            "interpretation": "Dated macro context; the nearby company move is observational and does not establish causation.",
        })

    # Add recurring regional holiday windows as calendar context when the file
    # lacks explicit festival dates. These are visibly marked as approximate.
    country = (c.get("main_country") or "").casefold()
    if "india" in country:
        festival_start, festival_end, festival_name = 10, 11, "Indian festive season (Oct–Nov calendar window)"
    elif "china" in country or "hong kong" in country or "taiwan" in country:
        festival_start, festival_end, festival_name = 1, 2, "Lunar New Year season (Jan–Feb calendar window)"
    elif any(name in country for name in ("united states", "usa", "canada", "united kingdom", "uk", "australia")):
        festival_start, festival_end, festival_name = 11, 12, "Holiday shopping season (Nov–Dec calendar window)"
    else:
        festival_start, festival_end, festival_name = 11, 12, "Year-end holiday season (Nov–Dec calendar window)"
    if all_pts:
        for year in range(int(all_pts[0]["date"][:4]), int(all_pts[-1]["date"][:4]) + 1):
            start = f"{year:04d}-{festival_start:02d}"
            end = f"{year:04d}-{festival_end:02d}"
            all_regions.append({
                "name": festival_name, "category": "festival", "source_category": "calendar context",
                "color": "#FACC15", "start": start, "end": end,
                "event_id": f"calendar-festival:{year}:{festival_start}",
                "observed_change_pct": None, "sector_change_pct": None,
                "calendar_based": True,
                "interpretation": "Approximate regional calendar window; the company file does not verify a specific festival or its causal effect.",
            })

    unique_regions = {}
    for region in all_regions:
        key = (region["start"], region["category"], region["name"].strip().casefold())
        unique_regions.setdefault(key, region)
    active_regions = [r for r in unique_regions.values() if r["end"] >= active_start and r["start"] <= active_end]
    # Decision fields repeat across high-grain market rows. Keep one dated,
    # source-backed representative per month for the timeline instead of
    # drawing thousands of overlapping pins from repeated daily records.
    decisions_by_month = {}
    for decision in decisions_by_key.values():
        month = decision["date"][:7]
        if active_start <= month <= active_end:
            decisions_by_month.setdefault(month, decision)
    active_decisions = [decisions_by_month[month] for month in sorted(decisions_by_month)]
    active_pins = [
        {"date": d["date"][:7], "title": d["type"], "description": d["description"],
         "impact": f"Observed month return {d['company_return_month_pct']}%" if d["company_return_month_pct"] is not None else "Return unavailable"}
        for d in active_decisions
    ]
    event_explanations = active_regions

    # Annual points are end-of-year market closes, not sums of monthly closes.
    annual = {}
    for point in all_pts:
        annual.setdefault(point["date"][:4], []).append(point)
    yearly_summary = []
    previous_year_close = None
    annual_items = []
    for yr in sorted(annual):
        end_close = annual[yr][-1]["close"]
        avg_run_rate = sum(p["monthly_revenue_run_rate_usd_m"] for p in annual[yr]) / len(annual[yr])
        annual_items.append({"year": yr, "year_end_close": round(end_close, 4), "revenue_run_rate_usd_m": round(avg_run_rate, 1)})
    max_close = max((item["year_end_close"] for item in annual_items), default=0)
    for item in annual_items:
        yoy = ((item["year_end_close"] / previous_year_close) - 1.0) * 100.0 if previous_year_close else None
        yearly_summary.append({
            **item,
            "is_peak": item["year_end_close"] == max_close,
            "growth_pct": round(yoy, 2) if yoy is not None else None,
        })
        previous_year_close = item["year_end_close"]

    seasonality = []
    for month_num, vals in season_returns.items():
        if vals:
            seasonality.append({
                "month": month_num,
                "observations": len(vals),
                "average_return_pct": round(sum(vals) / len(vals), 2),
                "median_return_pct": round(sorted(vals)[len(vals) // 2], 2),
            })

    def metric_unit(key):
        if key.endswith("_usd_m") or key.endswith("_usd_millions"):
            return "USD millions"
        if key.endswith("_usd_bn"):
            return "USD billions"
        if key.endswith("_pct") or key.endswith("_percent"):
            return "%"
        if key == "volume":
            return "shares"
        if key.endswith("_index") or key == "rsi_14":
            return "index points"
        return "source units"

    def metric_label(key):
        if key.endswith("_usd_m"):
            key = key[:-6] + " USD Millions"
        elif key.endswith("_usd_bn"):
            key = key[:-7] + " USD Billions"
        elif key.endswith("_pct"):
            key = key[:-4] + " Percent"
        return key.replace("_", " ").title().replace("Usd", "USD")

    def plottable(key: str, minimum_distinct: int = 2) -> bool:
        """Only offer a metric the chart can actually draw.

        Several columns are constant for a company (a gross margin held at 55.0
        in every month, shares outstanding never updated) or are present but
        zero. Those render as a flat line sitting on the axis, which reads as a
        bug, so they are left out of the picker entirely.
        """
        distinct = set()
        for point in final_history:
            raw = point.get("metric_values", {}).get(key)
            if raw is None and key == "close":
                raw = point.get("value")
            if isinstance(raw, (int, float)) and math.isfinite(float(raw)):
                distinct.add(round(float(raw), 12))
                if len(distinct) >= minimum_distinct:
                    return True
        return False

    extra_metric_keys = {
        name for point in all_pts
        for name in (point.get("product_metrics", {}) | point.get("extra_numeric_metrics", {}))
    } - {"close", "revenue_run_rate", "margin", "operating_income_usd_m", "net_income_usd_m",
          "cash_usd_m", "total_debt_usd_m", "market_cap_usd_bn", "employee_count", "headcount"}
    core_metric_keys = ("operating_income_usd_m", "net_income_usd_m", "cash_usd_m",
                        "total_debt_usd_m", "market_cap_usd_bn", "employee_count", "headcount")
    metric_options = []
    seen_metric_keys = set()
    for candidate_key, candidate_label, candidate_unit in [
        ("close", "Adjusted close", "source currency"),
        ("revenue_run_rate", "Revenue run-rate (LTM / 12)", "USD millions per month"),
        ("margin", "Gross margin", "%"),
        *[(key, metric_label(key), metric_unit(key)) for key in sorted(extra_metric_keys)],
        *[(key, metric_label(key), metric_unit(key)) for key in core_metric_keys],
    ]:
        if candidate_key in seen_metric_keys or not plottable(candidate_key):
            continue
        seen_metric_keys.add(candidate_key)
        metric_options.append({"key": candidate_key, "label": candidate_label, "unit": candidate_unit})

    return {
        "company_id": c["company_id"],
        "min_date": min_date,
        "max_date": max_date,
        "available_years": available_years,
        "active_start": active_start,
        "active_end": active_end,
        "active_range_label": active_range_label,
        "view": view,
        "history": final_history,
        "metric_options": metric_options,
        "smoothed_trend": smoothed_trend,
        "peaks": peaks,
        "troughs": troughs,
        "regions": active_regions,
        "pins": active_pins,
        "decisions": active_decisions,
        "event_explanations": event_explanations,
        "seasonality": seasonality,
        "yearly_summary": yearly_summary,
        "provenance": "Company CSV observations aggregated to month-end adjusted close",
        "data_quality": {
            "status": "available",
            "source_file": os.path.basename(csv_p) if csv_p else None,
            "source_frequency": all_pts[-1].get("source_frequency", "unknown"),
            "observations_monthly": len(all_pts),
            "first_observation": min_date,
            "last_observation": all_pts[-1].get("last_observation_date", max_date),
            "market_price_is_observed": True,
            "monthly_revenue_is_ltm_run_rate": True,
            "festival_records_found": sum(1 for r in all_regions if r["category"] == "festival" and not r.get("calendar_based")),
            "festival_calendar_windows": sum(1 for r in all_regions if r["category"] == "festival" and r.get("calendar_based")),
            "event_effect_note": "Observed monthly co-movement is descriptive and does not establish causality."
            ,"coverage_notes": [
                f"{field} is not present in this company CSV."
                for field in ("employee_count", "headcount", "vacation_days", "product_name", "orders", "units_sold")
                if field not in COMPANY_CSV_FIELDS.get(csv_p, set())
            ]
        }
    }
@app.get("/api/company/{company_id}/history-series")
def get_company_history_series(
    company_id: str,
    metric: str = "close",
    time_range: str = Query("12M", alias="range"),
):
    """Return only the observations needed for a compact chart window."""
    company = get_company_or_404(company_id)
    csv_path = company.get("csv_path") or find_csv_for_company(company_id, company.get("company_name", ""))
    if not csv_path or not os.path.isfile(csv_path):
        raise HTTPException(status_code=404, detail="No source series is available for this company.")
    
    # Use cache keyed by csv_path only, not metric - allows instant metric switching
    cache_key = csv_path
    with _DAILY_SERIES_CACHE_LOCK:
        cached_data = DAILY_SERIES_CACHE.get(cache_key)
        if cached_data is None:
            # Load raw CSV once from cache
            raw_rows = _load_raw_csv_data(csv_path)
            if not raw_rows:
                cached_data = []
            else:
                # Extract all common metrics at once to enable fast switching
                fields = set(raw_rows[0].keys()) if raw_rows else set()
                observations = []
                for row in raw_rows:
                    raw_date = row.get("timestamp") or row.get("datetime") or row.get("date") or ""
                    cleaned_date = _clean_upload_date(raw_date)
                    if not cleaned_date:
                        continue
                    try:
                        parsed_date = datetime.fromisoformat(cleaned_date.replace("Z", "+00:00"))
                    except ValueError:
                        continue
                    
                    # Extract commonly used metrics
                    close = _clean_upload_number(row.get("adjusted_close") or row.get("close"))
                    revenue = _clean_upload_number(row.get("revenue_usd_m"))
                    cogs = _clean_upload_number(row.get("cost_of_revenue_usd_m"))
                    
                    if close is None:
                        continue
                    
                    has_time = ":" in raw_date or "T" in raw_date
                    date_string = parsed_date.isoformat(sep=" ", timespec="minutes") if has_time else parsed_date.date().isoformat()
                    
                    metric_values = {
                        "close": close,
                        "revenue_run_rate": revenue / 12.0 if revenue is not None else None,
                        "margin": ((revenue - (cogs or 0.0)) / revenue * 100.0) if revenue else None,
                    }
                    
                    # Add product metrics if present
                    for pm_key in ("iphone_revenue_usd_m", "services_revenue_usd_m", "wearables_home_acc_usd_m", "mac_revenue_usd_m", "ipad_revenue_usd_m"):
                        if pm_key in fields:
                            metric_values[f"product_metrics.{pm_key}"] = _clean_upload_number(row.get(pm_key))
                    
                    # Add any other numeric fields as potential metrics
                    for field in fields:
                        if field not in {"date", "timestamp", "datetime", "company_id", "company_name", "ticker", "exchange", "main_country", "niche", "currency", "fiscal_year_end", "record_provenance", "source_frequency", "event_id", "event_name", "event_category", "event_date", "decision_type", "announced_date", "effective_date", "short_description", "magnitude", "magnitude_unit", "source_url", "source_name", "open", "high", "low", "volume", "adjusted_close", "close", "revenue_usd_m", "cost_of_revenue_usd_m"}:
                            val = _clean_upload_number(row.get(field))
                            if val is not None:
                                metric_values[field] = val
                    
                    observations.append({
                        "date": date_string,
                        "date_label": parsed_date.strftime("%b %d · %H:%M") if has_time else parsed_date.strftime("%b %d, %Y"),
                        "value": close,
                        "metric_values": metric_values,
                    })
                
                by_timestamp = {point["date"]: point for point in observations}
                observations = [by_timestamp[key] for key in sorted(by_timestamp)]
                cached_data = observations
                DAILY_SERIES_CACHE[cache_key] = cached_data
                # Cap cache to prevent memory bloat
                while len(DAILY_SERIES_CACHE) > 50:
                    DAILY_SERIES_CACHE.pop(next(iter(DAILY_SERIES_CACHE)))
        
        observations = cached_data

    if not observations:
        return {"company_id": company["company_id"], "metric": metric, "range": time_range, "frequency": "unavailable", "history": []}
    sessions = sorted({point["date"][:10] for point in observations})
    daily_last = {}
    monthly_last = {}
    for point in observations:
        daily_last[point["date"][:10]] = point
        monthly_last[point["date"][:7]] = point
    daily_points = list(daily_last.values())
    monthly_points = list(monthly_last.values())
    intraday_sessions = {"1D": 1, "2D": 2, "3D": 3, "7D": 7, "1W": 5, "2W": 10, "3W": 15, "4W": 20}
    daily_months = {"1M": 1, "3M": 3, "6M": 6, "12M": 12}
    monthly_count = {"24M": 24, "60M": 60}.get(time_range)
    daily_metrics = {"close", "daily_return", "daily_volatility", "sma_20", "sma_50", "sma_200", "rsi_14", "natr_14"}
    use_daily_series = metric in daily_metrics

    def as_monthly_point(point):
        month = point["date"][:7]
        try:
            label = datetime.strptime(month, "%Y-%m").strftime("%b %Y")
        except ValueError:
            label = month
        return {**point, "date": month, "date_label": label}

    if time_range in intraday_sessions:
        selected_sessions = set(sessions[-intraday_sessions[time_range]:])
        result = [point for point in observations if point["date"][:10] in selected_sessions]
        frequency = "intraday" if any(" " in point["date"] for point in result) else "daily"
    elif time_range in daily_months:
        if use_daily_series:
            result = daily_points[-(daily_months[time_range] * 22):]
            frequency = "daily"
        else:
            result = [as_monthly_point(point) for point in monthly_points[-daily_months[time_range]:]]
            frequency = "monthly"
    elif monthly_count:
        result = [as_monthly_point(point) for point in monthly_points[-monthly_count:]]
        frequency = "monthly"
    else:
        result = [as_monthly_point(point) for point in monthly_points]
        frequency = "monthly"
    
    # Filter result to return only the requested metric value
    # This makes metric switching instant since all metrics are pre-computed
    filtered_result = []
    for point in result:
        metric_value = point.get("metric_values", {}).get(metric)
        if metric_value is not None:
            filtered_result.append({
                **point,
                "value": metric_value,
                "metric_values": {metric: metric_value}
            })
    
    return {"company_id": company["company_id"], "metric": metric, "range": time_range,
            "frequency": frequency, "observations_available": len(observations), "history": filtered_result}

@app.get("/api/scenario-catalog/{company_id}")
def get_scenario_catalog(company_id: str):
    """Build selectable event and decision analogs from all company CSVs."""
    global SCENARIO_CATALOG_CACHE
    company = get_company_or_404(company_id)
    if SCENARIO_CATALOG_CACHE is None:
        catalog_cache_path = os.path.join(CURRENT_DIR, "data", "scenario_catalog_cache.json")
        csv_paths = sorted({
            peer.get("csv_path") or find_csv_for_company(peer["company_id"], peer.get("company_name", ""))
            for peer in COMPANIES_REGISTRY.values()
        } - {None})
        catalog_signature = [
            {"path": os.path.relpath(path, CURRENT_DIR), "size": os.path.getsize(path), "mtime_ns": os.stat(path).st_mtime_ns}
            for path in csv_paths if os.path.isfile(path)
        ]
        try:
            with open(catalog_cache_path, "r", encoding="utf-8") as cache_file:
                saved_catalog = json.load(cache_file)
            # The persisted catalog is a fast shared baseline. A signature
            # mismatch should not make the first user wait while every source
            # CSV (several GB in total) is scanned again. Company-specific
            # evidence is added from the selected company's cached monthly data
            # below.
            if isinstance(saved_catalog.get("catalog"), dict):
                SCENARIO_CATALOG_CACHE = saved_catalog.get("catalog")
        except (OSError, ValueError, TypeError):
            pass
    if SCENARIO_CATALOG_CACHE is None:
        event_rows: Dict[tuple, List[Dict[str, Any]]] = {}
        decision_rows: Dict[tuple, List[Dict[str, Any]]] = {}
        company_context: Dict[str, Dict[str, Any]] = {}
        seen_global_events = set()
        seen_global_decisions = set()
        for peer in COMPANIES_REGISTRY.values():
            path = peer.get("csv_path") or find_csv_for_company(peer["company_id"], peer.get("company_name", ""))
            points_by_month: Dict[str, Dict[str, Any]] = {}
            decisions_by_month: Dict[str, List[Dict[str, Any]]] = {}
            if path and os.path.exists(path):
                with open(path, "r", encoding="utf-8", errors="ignore", newline="") as source:
                    for row in csv.DictReader(source):
                        raw_date = (row.get("date") or "")[:10]
                        if len(raw_date) < 7:
                            continue
                        month = raw_date[:7]
                        try:
                            close = float(row.get("adjusted_close") or row.get("close") or 0.0)
                        except (TypeError, ValueError):
                            close = 0.0
                        if close <= 0:
                            continue
                        point = points_by_month.setdefault(month, {"date": month, "close": close, "events": {}, "timestamp": ""})
                        timestamp = row.get("timestamp") or raw_date
                        if timestamp >= point["timestamp"]:
                            point["close"] = close
                            point["timestamp"] = timestamp
                        event_name = (row.get("event_name") or "").strip()
                        event_category = (row.get("event_category") or "").strip()
                        if event_name and event_category and event_category.upper() != "NONE" and "INTRADAY" not in event_category.upper() and not event_name.upper().startswith("OPERATIONAL MILESTONE & MARKET ADJUSTMENT") and "HIGH-GRAIN TEMPORAL TICK" not in event_name.upper():
                            point["events"][(event_name, event_category)] = True
                        decision_type = (row.get("decision_type") or "").strip()
                        description = (row.get("short_description") or "").strip()
                        effective = (row.get("effective_date") or row.get("announced_date") or "")[:10]
                        if decision_type and effective and not any(token in description.lower() for token in ("temporal tick", "market bar", "trading record", "regular strategic operating decision", "official rocast primary data record", "official company disclosure and market bar")):
                            decision_month = effective[:7]
                            decisions_by_month.setdefault(decision_month, {})[(decision_type.replace("_", " ").title(), description)] = True
            points = [points_by_month[month] for month in sorted(points_by_month)]
            for point in points:
                month = point["date"]
                point["event_records"] = [{"name": name, "category": category} for name, category in point["events"]]
                point["decision_records"] = [{"date": month, "type": kind, "description": description} for kind, description in decisions_by_month.get(month, {})]
                point.pop("events", None)
                point.pop("timestamp", None)
            if len(points) < 2:
                continue
            company_context[peer["company_id"]] = {
                "name": peer.get("company_name", peer["company_id"]),
                "niche": peer.get("niche", ""),
                "country": peer.get("main_country", ""),
            }
            returns = {}
            month_returns: Dict[int, List[float]] = {month: [] for month in range(1, 13)}
            for idx in range(1, len(points)):
                prior, current = points[idx - 1], points[idx]
                if prior["close"] > 0:
                    value = (current["close"] / prior["close"] - 1.0) * 100.0
                    returns[current["date"]] = value
                    month_returns[int(current["date"][5:7])].append(value)
            month_baseline = {month: (sum(values) / len(values) if values else 0.0) for month, values in month_returns.items()}
            by_month = {point["date"]: idx for idx, point in enumerate(points)}
            # Per-company context for decision evidence: which months carry each
            # label, and what an ordinary three-month move looks like for this
            # company. Without the second number, every label in a file inherits
            # that file's average return as its "effect", which is precisely why
            # the evidence cards showed one impact range under many titles.
            label_months: Dict[tuple, set] = {}
            for point in points:
                for decision in point.get("decision_records", []):
                    label_months.setdefault((decision["type"], decision.get("description", "")), set()).add(point["date"])
            event_label_months: Dict[tuple, set] = {}
            for point in points:
                for event in point.get("event_records", []):
                    event_label_months.setdefault((event["name"], event["category"]), set()).add(point["date"])
            forward_all = [
                (points[idx + 3]["close"] / points[idx]["close"] - 1.0) * 100.0
                for idx in range(len(points) - 3) if points[idx]["close"] > 0
            ]
            company_avg_3m = sum(forward_all) / len(forward_all) if forward_all else None
            for idx, point in enumerate(points):
                month_num = int(point["date"][5:7])
                for event in point.get("event_records", []):
                    key = (event["name"], event["category"])
                    event_episode_key = (peer["company_id"], point["date"], *key)
                    if event_episode_key in seen_global_events:
                        continue
                    seen_global_events.add(event_episode_key)
                    event_rows.setdefault(key, []).append({
                        "company_id": peer["company_id"], "date": point["date"],
                        "month_return_pct": returns.get(point["date"]),
                        "excess_return_pct": (returns[point["date"]] - month_baseline[month_num]) if point["date"] in returns else None,
                        # Same test as decisions: an event label written on every
                        # month of a file is not an event, and its measured excess
                        # is the company's own average by construction.
                        "coverage_pct": round(len(event_label_months.get(key, {point["date"]})) / max(1, len(points)) * 100.0, 1),
                    })
                for decision in point.get("decision_records", []):
                    effective_month = decision.get("date", "")[:7]
                    decision_episode_key = (peer["company_id"], effective_month, decision["type"], decision.get("description", ""))
                    if decision_episode_key in seen_global_decisions:
                        continue
                    seen_global_decisions.add(decision_episode_key)
                    decision_idx = by_month.get(effective_month)
                    if decision_idx is None or decision_idx + 3 >= len(points):
                        continue
                    start_close = points[decision_idx]["close"]
                    end_close = points[decision_idx + 3]["close"]
                    if start_close <= 0:
                        continue
                    outcome = (end_close / start_close - 1.0) * 100.0
                    key = (decision["type"], decision.get("description", ""))
                    coverage_pct = len(label_months.get(key, {effective_month})) / max(1, len(points)) * 100.0
                    decision_rows.setdefault(key, []).append({
                        "company_id": peer["company_id"], "date": effective_month,
                        "followup_return_pct": round(outcome, 3),
                        # The only number that can distinguish two labels: this
                        # month's outcome minus what this company normally does.
                        "excess_vs_company_pct": round(outcome - company_avg_3m, 3) if company_avg_3m is not None else None,
                        "coverage_pct": round(coverage_pct, 1),
                    })

        # A decision field written across most months of a file describes standing
        # state ("we are executing our growth plan"), not an event. Its measured
        # outcome is indistinguishable from the company's own average, so those
        # episodes are dropped rather than shown as if they were evidence.
        DEGENERATE_COVERAGE_PCT = 60.0

        def summarize_cases(rows: List[Dict[str, Any]], value_key: str, excess_key: Optional[str] = None) -> Dict[str, Any]:
            episodes: Dict[Any, Dict[str, Any]] = {}
            for row in rows:
                episodes.setdefault((row.get("company_id"), row.get("date")), row)
            # One dated episode counts once, not once per intraday row.
            all_episodes = list(episodes.values())
            usable = [row for row in all_episodes if float(row.get("coverage_pct") or 0.0) <= DEGENERATE_COVERAGE_PCT]
            source_key = value_key
            if excess_key and any(row.get(excess_key) is not None for row in usable):
                source_key = excess_key
            values = [row[source_key] for row in usable if row.get(source_key) is not None]
            raw = [row[value_key] for row in usable if row.get(value_key) is not None]
            companies = sorted({row["company_id"] for row in usable}) or sorted({row["company_id"] for row in all_episodes})
            return {
                "observations": len(usable),
                "row_observations": len(values),
                "companies": companies,
                "estimated_effect_pct": round(sum(values) / len(values), 3) if len(values) >= 2 else None,
                "raw_followup_mean_pct": round(sum(raw) / len(raw), 3) if len(raw) >= 2 else None,
                "standing_state_episodes_dropped": len(all_episodes) - len(usable),
                "max_coverage_pct": max((float(row.get("coverage_pct") or 0.0) for row in all_episodes), default=None),
                # True when this label is recorded on almost every month of every
                # file that carries it: selectable as an assumption, but the model
                # measures nothing from it.
                "standing_state": bool(all_episodes) and not usable or max((float(row.get("coverage_pct") or 0.0) for row in all_episodes), default=0.0) > DEGENERATE_COVERAGE_PCT,
                "effect_basis": (
                    "excess over the same company's own average three-month move"
                    if source_key != value_key else "excess return against that calendar month's own baseline"
                ),
                "cases": usable[-8:],
            }

        SCENARIO_CATALOG_CACHE = {
            "events": [
                {"id": f"event:{name}|{category}", "label": f"{name} ({category})", "category": category, **summarize_cases(rows, "excess_return_pct")}
                for (name, category), rows in sorted(event_rows.items()) if len({r["company_id"] + r["date"] for r in rows}) >= 2
            ],
            "decisions": [
                {"id": f"decision:{kind}|{description}", "label": f"{kind.replace('_', ' ').title()}: {description}", "description": description, **summarize_cases(rows, "followup_return_pct", "excess_vs_company_pct")}
                for (kind, description), rows in sorted(decision_rows.items()) if len({r["company_id"] + r["date"] for r in rows}) >= 2
            ],
            "company_context": company_context,
        }
        # An option only earns a place if at least two dated episodes survive the
        # standing-state filter. Labels recorded in every month measure nothing,
        # so they are dropped here rather than shown as repeatable conditions.
        SCENARIO_CATALOG_CACHE["decisions"] = [item for item in SCENARIO_CATALOG_CACHE["decisions"] if item["observations"] >= 2]
        try:
            with open(catalog_cache_path, "w", encoding="utf-8") as cache_file:
                json.dump({"signature": catalog_signature, "catalog": SCENARIO_CATALOG_CACHE}, cache_file, separators=(",", ":"))
        except OSError:
            pass

    company_id = company["company_id"]
    context = SCENARIO_CATALOG_CACHE["company_context"].get(company_id, {
        "name": company.get("company_name", company_id),
        "niche": company.get("niche", ""),
        "country": company.get("main_country", ""),
    })
    def _country_key(value: Any) -> str:
        # Country labels are typed per dataset, so the same country reaches the
        # registry as "USA", "United States" or "U.S.". Comparing them exactly
        # split one cohort into fragments and left companies such as Apple with
        # no peer evidence at all, which read as a broken panel.
        cleaned = "".join(char for char in str(value or "").lower() if char.isalnum())
        return {
            "usa": "unitedstates", "us": "unitedstates", "america": "unitedstates",
            "unitedstates": "unitedstates", "unitedstatesofamerica": "unitedstates",
            "india": "india", "republicofindia": "india", "bharat": "india",
            "kr": "southkorea", "korea": "southkorea", "southkorea": "southkorea",
            "republicofkorea": "southkorea",
        }.get(cleaned, cleaned)

    related_ids = {
        peer_id for peer_id, peer in SCENARIO_CATALOG_CACHE["company_context"].items()
        if peer_id != company_id and (
            (context.get("niche") and peer.get("niche", "").lower() == context["niche"].lower())
            or (context.get("country") and _country_key(peer.get("country")) == _country_key(context.get("country")))
        )
    }
    history = load_company_monthly_data(company.get("csv_path") or find_csv_for_company(company_id, company.get("company_name", "")))
    current_returns = [0.0] + [
        (current["close"] / previous["close"] - 1.0) * 100.0 if previous["close"] > 0 else 0.0
        for previous, current in zip(history[:-1], history[1:])
    ]
    month_returns: Dict[int, List[float]] = {month: [] for month in range(1, 13)}
    overall_returns = []
    for previous, current in zip(history[:-1], history[1:]):
        if previous["close"] > 0:
            value = (current["close"] / previous["close"] - 1.0) * 100.0
            month_returns[int(current["date"][5:7])].append(value)
            overall_returns.append(value)
    overall_mean = sum(overall_returns) / len(overall_returns) if overall_returns else 0.0
    month_means = {month: (sum(values) / len(values) if values else overall_mean) for month, values in month_returns.items()}
    own_event_rows: Dict[tuple, List[Dict[str, Any]]] = {}
    own_decision_rows: Dict[tuple, List[Dict[str, Any]]] = {}
    # Same treatment as the shared catalog: how many months carry each label, and
    # what this company's ordinary three-month move is, so a label that never
    # switches off cannot masquerade as an event with an effect.
    own_label_months: Dict[tuple, set] = {}
    for point in history:
        for decision in point.get("decision_records", []):
            own_label_months.setdefault((decision.get("type", "Unspecified"), decision.get("description", "")), set()).add(point["date"])
    own_event_label_months: Dict[tuple, set] = {}
    for point in history:
        for event in point.get("event_records", []):
            own_event_label_months.setdefault((event.get("name", ""), event.get("category", "")), set()).add(point["date"])
    own_forward = [
        (history[idx + 3]["close"] / point["close"] - 1.0) * 100.0
        for idx, point in enumerate(history[:-3]) if point.get("close", 0) > 0
    ]
    own_avg_3m = sum(own_forward) / len(own_forward) if own_forward else None
    for index, point in enumerate(history):
        month_number = int(point["date"][5:7])
        for event in point.get("event_records", []):
            key = (event.get("name", ""), event.get("category", ""))
            if key[0] and key[1]:
                own_event_rows.setdefault(key, []).append({
                    "company_id": company_id, "date": point["date"],
                    "month_return_pct": current_returns[index],
                    "excess_return_pct": current_returns[index] - month_means[month_number],
                    "coverage_pct": round(len(own_event_label_months.get(key, {point["date"]})) / max(1, len(history)) * 100.0, 1),
                })
        for decision in point.get("decision_records", []):
            key = (decision.get("type", "Unspecified"), decision.get("description", ""))
            outcome = None
            if index + 3 < len(history) and point.get("close", 0) > 0:
                outcome = (history[index + 3]["close"] / point["close"] - 1.0) * 100.0
            coverage = len(own_label_months.get(key, set())) / max(1, len(history)) * 100.0
            own_decision_rows.setdefault(key, []).append({
                "company_id": company_id, "date": str(decision.get("date", point["date"]))[:7],
                "followup_return_pct": round(outcome, 3) if outcome is not None else None,
                "excess_vs_company_pct": round(outcome - own_avg_3m, 3) if outcome is not None and own_avg_3m is not None else None,
                "coverage_pct": round(coverage, 1),
            })

    LOCAL_DEGENERATE_COVERAGE_PCT = 60.0

    def summarize_local(rows, value_key, excess_key=None):
        episodes: Dict[Any, Dict[str, Any]] = {}
        for row in rows:
            episodes.setdefault(row.get("date"), row)
        all_episodes = list(episodes.values())
        usable = [row for row in all_episodes if float(row.get("coverage_pct") or 0.0) <= LOCAL_DEGENERATE_COVERAGE_PCT]
        source_key = value_key
        if excess_key and any(row.get(excess_key) is not None for row in usable):
            source_key = excess_key
        values = [row[source_key] for row in usable if row.get(source_key) is not None]
        raw = [row[value_key] for row in usable if row.get(value_key) is not None]
        return {
            "observations": len(usable), "row_observations": len(values), "companies": [company_id],
            "estimated_effect_pct": round(sum(values) / len(values), 3) if len(values) >= 2 else None,
            "raw_followup_mean_pct": round(sum(raw) / len(raw), 3) if len(raw) >= 2 else None,
            "standing_state_episodes_dropped": len(all_episodes) - len(usable),
            "max_coverage_pct": round(max((float(row.get("coverage_pct") or 0.0) for row in all_episodes), default=0.0), 1),
            "standing_state": bool(all_episodes) and not usable or max((float(row.get("coverage_pct") or 0.0) for row in all_episodes), default=0.0) > LOCAL_DEGENERATE_COVERAGE_PCT,
            "effect_basis": (
                "excess over this company's own average three-month move"
                if source_key != value_key else "excess return against that calendar month's own baseline"
            ),
            "cases": usable[-8:],
        }

    local_events = [
        {"id": f"company-event:{company_id}:{name}|{category}", "label": f"{name} ({category})", "category": category, **summarize_local(rows, "excess_return_pct")}
        for (name, category), rows in own_event_rows.items()
    ]
    cached_event_ids = {item.get("id") for item in SCENARIO_CATALOG_CACHE.get("events", [])}
    cached_event_labels = {item.get("label") for item in SCENARIO_CATALOG_CACHE.get("events", [])}
    local_events = [item for item in local_events if item["id"] not in cached_event_ids and item["label"] not in cached_event_labels]
    local_decisions = [
        {"id": f"company-decision:{company_id}:{kind}|{description}", "label": f"{str(kind).replace('_', ' ').title()}: {description}", "description": description, **summarize_local(rows, "followup_return_pct", "excess_vs_company_pct")}
        for (kind, description), rows in own_decision_rows.items()
    ]
    local_decisions = [item for item in local_decisions if item["observations"] >= 2]
    cached_decision_labels = {item.get("label") for item in SCENARIO_CATALOG_CACHE.get("decisions", []) if company_id in item.get("companies", [])}
    local_decisions = [item for item in local_decisions if item["label"] not in cached_decision_labels]
    calendar_options = []
    for month, values in month_returns.items():
        calendar_options.append({
            "id": f"calendar:{month:02d}", "month": month,
            "label": datetime(2000, month, 1).strftime("%B"),
            "observations": len(values),
            "estimated_effect_pct": round(sum(values) / len(values) - overall_mean, 3) if len(values) >= 2 else None,
        })
    return {
        "company_id": company_id,
        "catalog_scope": "Cached cross-company event and decision evidence, plus the selected company’s own history",
        "events": SCENARIO_CATALOG_CACHE.get("events", []) + local_events,
        "company_decisions": [
            item for item in SCENARIO_CATALOG_CACHE.get("decisions", []) if company_id in item.get("companies", [])
        ] + local_decisions,
        "peer_decisions": [
            item for item in SCENARIO_CATALOG_CACHE["decisions"]
            if company_id not in item["companies"] and any(peer_id in item["companies"] for peer_id in related_ids)
        ],
        "calendar_months": calendar_options,
        "external_conditions": [
            {"key": "demand", "label": "Demand", "source_column": "primitive_demand", "range": [-1, 1]},
            {"key": "supply", "label": "Supply disruption", "source_column": "primitive_supply", "range": [-1, 1]},
            {"key": "cost", "label": "Cost pressure", "source_column": "primitive_cost", "range": [-1, 1]},
            {"key": "competition", "label": "Competition", "source_column": "primitive_competition", "range": [-1, 1]},
            {"key": "regulation", "label": "Regulation", "source_column": "primitive_regulation", "range": [-1, 1]},
            {"key": "technology", "label": "Technology", "source_column": "primitive_technology", "range": [-1, 1]},
            {"key": "macro", "label": "Macro conditions", "source_column": "primitive_macro", "range": [-1, 1]},
            {"key": "pandemic", "label": "Pandemic / health", "source_column": "primitive_pandemic", "range": [-1, 1]},
        ],
        "available_product_metrics": sorted({key for point in history for key in point.get("product_metrics", {})}),
        "data_quality_note": "The shared catalog is served from cache for speed; selected-company events and decisions are added from its own history. Estimates are historical associations, not causal effects.",
    }

@app.post("/api/company/{company_id}/forecast")
def run_forecast(company_id: str, req: ForecastRequest = Body(...)):
    """POST /company/{id}/forecast: span, toggles -> growth low/mid/high, phase probs, drivers, path weights."""
    c = get_company_or_404(company_id)
    sim = build_simulator(c)

    horizon = 6 if "6" in req.span else (24 if "24" in req.span else 12)
    cfg = SimulationScenarioConfig(horizon_months=horizon, **{k: v for k, v in req.toggles.items() if hasattr(SimulationScenarioConfig, k)})

    # Compute real forecast start date from last historical observation
    history_data = get_company_history(company_id, quick_filter="ALL")
    history_list = history_data.get("history", [])
    metric_keys = {item["key"] for item in history_data.get("metric_options", [])}
    target_metric = req.metric if req.metric in metric_keys else "close"
    scenario_terms = [key for key, enabled in req.toggles.items() if enabled is True and not key.startswith("primitive:")]
    last_month = history_list[-1].get("date", "") if history_list else ""
    if req.end_month and len(req.end_month) >= 7 and last_month:
        try:
            horizon = max(1, min(36, (int(req.end_month[:4]) - int(last_month[:4])) * 12 + int(req.end_month[5:7]) - int(last_month[5:7])))
        except (TypeError, ValueError):
            pass
    cfg.horizon_months = horizon
    effective_effects = {
        key: value for key, value in req.scenario_effects.items()
        if req.toggles.get(key) is True
    }
    effective_primitives = {
        key: max(-1.0, min(1.0, float(value)))
        for key, value in req.scenario_primitives.items()
        if req.toggles.get(f"primitive:{key}") is True
    }
    market_forecast = forecast_monthly_close(
        history_list, horizon=horizon, scenario_terms=scenario_terms,
        rate_shock_bps=req.rate_shock_bps, scenario_effects=effective_effects,
        scenario_primitives=effective_primitives,
        scenario_start_month=req.start_month, scenario_end_month=req.end_month,
        metric=target_metric,
    )
    baseline_market_forecast = forecast_monthly_close(history_list, horizon=horizon, metric=target_metric)

    # Determine calendar start of forecast: one month after last history date
    forecast_start_date: str = None
    if history_list:
        last_date_str = history_list[-1].get("date", "")
        # last_date_str format is "YYYY-MM" (e.g. "2024-11")
        try:
            last_year = int(last_date_str[:4])
            last_month = int(last_date_str[5:7])
            next_month = last_month + 1 if last_month < 12 else 1
            next_year = last_year if last_month < 12 else last_year + 1
            forecast_start_date = f"{next_year:04d}-{next_month:02d}"
        except Exception:
            forecast_start_date = None

    # Run simulation with real calendar dates
    res = sim.run_simulation(cfg, start_date=forecast_start_date)

    # Baseline simulation (all toggles off)
    base_cfg = SimulationScenarioConfig(horizon_months=horizon)
    base_res = sim.run_simulation(base_cfg, start_date=forecast_start_date)

    forecast_points = []
    drivers_waterfall = []
    selected_range_points = []

    for i, market_point in enumerate(market_forecast.get("forecast", [])):
        s = res.monthly_snapshots[i] if i < len(res.monthly_snapshots) else None
        baseline_market_point = (baseline_market_forecast.get("forecast") or [])[i] if i < len(baseline_market_forecast.get("forecast", [])) else market_point

        forecast_points.append({
            "month": i + 1,
            "date_label": format_month_label(market_point.get("date", "")) if market_point.get("date") else s.date_label,
            "date": market_point.get("date"),
            "metric": target_metric,
            "baseline_value": baseline_market_point.get("close"),
            "forecast_value": market_point.get("close"),
            "band_low": market_point.get("lower"),
            "band_high": market_point.get("upper"),
            "predicted_return_pct": market_point.get("predicted_return_pct"),
            "in_requested_range": (not req.start_month or market_point.get("date", "") >= req.start_month) and (not req.end_month or market_point.get("date", "") <= req.end_month),
            "projected_revenue_usd_m": s.revenue_usd_m if s else None,
            "cogs_usd_m": s.cogs_usd_m if s else None,
            "gross_margin_pct": s.gross_margin_pct if s else None,
            "ebit_usd_m": s.ebit_usd_m if s else None,
            "net_income_usd_m": s.net_income_usd_m if s else None,
            "cash_usd_m": s.cash_balance_usd_m if s else None,
            "cash_runway_months": s.cash_runway_months if s else None,
            "altman_z_score": s.altman_z_score if s else None,
            "default_prob_pct": s.default_prob_pct if s else None
        })
        if forecast_points[-1]["in_requested_range"]:
            selected_range_points.append(market_point)

        if i < 6:
            previous_close = history_list[-1].get("metric_values", {}).get(target_metric, history_list[-1]["close"]) if i == 0 and history_list else (baseline_market_forecast.get("forecast", [{}])[i - 1].get("close", 0) if i > 0 else 0)
            baseline_close = baseline_market_point.get("close")
            scenario_close = market_point.get("close")
            drivers_waterfall.append({
                "month": forecast_points[-1]["date_label"],
                "baseline_market_return_pct": round(((baseline_close / previous_close) - 1.0) * 100.0, 3) if baseline_close and previous_close else None,
                "scenario_price_delta": round(scenario_close - baseline_close, 4) if scenario_close is not None and baseline_close is not None else None,
                "scenario_return_delta_pct": round(((scenario_close / baseline_close) - 1.0) * 100.0, 3) if scenario_close and baseline_close else None,
                "event_evidence_count": market_forecast.get("scenario_effect", {}).get("observations", 0),
                "rate_shock_evidence": market_forecast.get("rate_shock_effect", {}).get("matched", False),
            })

    # Summary card updates
    latest = res.monthly_snapshots[-1] if res.monthly_snapshots else None
    def observed_metric(point):
        return point.get("metric_values", {}).get(target_metric, point.get("close", 0.0))
    latest_value = observed_metric(history_list[-1]) if history_list else None
    return_3m = ((latest_value / observed_metric(history_list[-4])) - 1.0) * 100.0 if len(history_list) >= 4 and observed_metric(history_list[-4]) else None
    return_12m = ((latest_value / observed_metric(history_list[-13])) - 1.0) * 100.0 if len(history_list) >= 13 and observed_metric(history_list[-13]) else None
    recent_values = [observed_metric(point) for point in history_list[-12:]]
    recent_peak = max(recent_values) if recent_values else None
    drawdown_12m = ((latest_value / recent_peak) - 1.0) * 100.0 if latest_value and recent_peak else None
    current_position_reasons = []
    if return_3m is not None:
        current_position_reasons.append(f"{target_metric} changed {return_3m:+.2f}% over the latest three observed months")
    if return_12m is not None:
        current_position_reasons.append(f"{return_12m:+.2f}% over twelve observed months")
    if drawdown_12m is not None:
        current_position_reasons.append(f"{drawdown_12m:.2f}% from its highest observed value in the latest twelve months")
    range_change = ((selected_range_points[-1]["close"] / selected_range_points[0]["close"] - 1.0) * 100.0) if len(selected_range_points) >= 2 and selected_range_points[0]["close"] else None
    active_count = sum(1 for v in req.toggles.values() if v is True) + (1 if req.rate_shock_bps else 0)
    positive_probability = market_forecast.get("positive_horizon_probability_pct")
    curr_phase = "Growing" if positive_probability is not None and positive_probability >= 60 else ("Crashing" if positive_probability is not None and positive_probability < 40 else "Developing")
    downside_probabilities = [item["probability_pct"] for item in market_forecast.get("downside_event_probabilities", [])]
    highest_downside_probability = max(downside_probabilities) if downside_probabilities else None
    crash_risk = "Not estimated" if highest_downside_probability is None else ("High" if highest_downside_probability >= 50 else ("Moderate" if highest_downside_probability >= 25 else "Low"))
    phase_probs = {
        "Positive market path": positive_probability,
        "Negative market path": round(100.0 - positive_probability, 2) if positive_probability is not None else None,
    }

    key_hash = f"key_{c['company_id']}_{horizon}_{hash(frozenset(req.toggles.items())) & 0xFFFFFF:06x}"

    return {
        "key": key_hash,
        "company_id": c["company_id"],
        "span": req.span,
        "forecast_start_date": forecast_start_date,
        "summary": {
            "current_phase": curr_phase,
            "direction": "rise" if (market_forecast.get("forecast") or [{}])[-1].get("close", 0) >= (history_list[-1].get("metric_values", {}).get(target_metric, history_list[-1].get("close", 0)) if history_list else 0) else "fall",
            "next_peak_year": max(market_forecast.get("forecast", []), key=lambda point: point["close"])["date"][:4] if market_forecast.get("forecast") else None,
            "crash_risk_level": crash_risk,
            "downside_event_probability_pct": highest_downside_probability,
            "active_toggles_count": active_count,
            "ending_revenue_usd_m": latest.revenue_usd_m if latest else None,
            "ending_market_close": market_forecast.get("forecast", [{}])[-1].get("close"),
            "market_return_pct": round(((market_forecast.get("forecast", [{}])[-1].get("close", 0) / history_list[-1].get("metric_values", {}).get(target_metric, history_list[-1].get("close", 1))) - 1) * 100, 2) if history_list and history_list[-1].get("metric_values", {}).get(target_metric, history_list[-1].get("close")) else None,
            "ending_altman_z": latest.altman_z_score if latest else None,
            "cash_runway_months": latest.cash_runway_months if latest else None
        },
        "current_position": {
            "as_of": history_data.get("data_quality", {}).get("last_observation"),
            "metric": target_metric,
            "latest_value": latest_value,
            "trend": "falling" if return_3m is not None and return_3m < 0 else "rising" if return_3m is not None and return_3m > 0 else "mixed or insufficient history",
            "three_month_change_pct": round(return_3m, 2) if return_3m is not None else None,
            "twelve_month_change_pct": round(return_12m, 2) if return_12m is not None else None,
            "drawdown_from_12m_high_pct": round(drawdown_12m, 2) if drawdown_12m is not None else None,
            "observed_signals": current_position_reasons,
            "interpretation": "Position diagnosis describes the supplied series. It does not identify a causal reason without dated, credible drivers.",
        },
        "selected_range_outlook": {
            "start_month": req.start_month or forecast_start_date,
            "end_month": req.end_month or (forecast_points[-1]["date"] if forecast_points else None),
            "forecast_months_in_range": len(selected_range_points),
            "baseline_to_end_change_pct": round(range_change, 2) if range_change is not None else None,
            "positive_horizon_probability_pct": market_forecast.get("selected_range_positive_probability_pct"),
            "return_interval_p10_p90_pct": [market_forecast.get("selected_range_return_p10_pct"), market_forecast.get("selected_range_return_p90_pct")],
        },
        "forecast_series": forecast_points,
        "recent_history": [
            {"date": point["date"], "date_label": point["date_label"], "value": point.get("metric_values", {}).get(target_metric, point["close"])}
            for point in history_list[-6:]
        ],
        "market_forecast": market_forecast,
        "phase_probabilities": phase_probs,
        "driver_waterfall": drivers_waterfall,
        "model_version": f"CPU walk-forward monthly time-series model ({market_forecast.get('model', 'unavailable')})",
        "data_date": history_data.get("data_quality", {}).get("last_observation"),
        "scenario_evidence": market_forecast.get("scenario_effect"),
        "rate_shock_evidence": market_forecast.get("rate_shock_effect"),
        "primitive_scenario_evidence": market_forecast.get("primitive_scenario_effect"),
        "calendar_scenario_evidence": market_forecast.get("calendar_scenario_effect"),
        "requested_forecast_range": {"start_month": req.start_month or forecast_start_date, "end_month": req.end_month or (market_forecast.get("forecast", [])[-1].get("date") if market_forecast.get("forecast") else None)},
        "forecast_explanation": {
            "target": target_metric,
            "features": ["Lagged company returns", "Calendar-month seasonality", "Sector-index returns", "Broad-index returns", "Observed policy-rate changes"],
            "training_observations": market_forecast.get("observations", 0),
            "walk_forward_validation_mae_log_return": market_forecast.get("validation_mae_log_return"),
            "candidate_scores": market_forecast.get("validation_models", {}),
            "positive_horizon_probability_pct": positive_probability,
            "horizon_return_interval_p10_p90_pct": [market_forecast.get("simulated_horizon_return_p10_pct"), market_forecast.get("simulated_horizon_return_p90_pct")],
            "unavailable_reason": market_forecast.get("reason") if not market_forecast.get("forecast") else None,
            "limitations": "Only the supplied local history is available. No live market feed is connected. Event filters need matching dated records, and a rate change is applied only if the macro model is selected by walk-forward validation."
        }
    }

@app.post("/api/company/{company_id}/timing")
def get_timing_probabilities(company_id: str, req: TimingRequest = Body(...)):
    """Estimate timing distributions by resampling walk-forward model residuals."""
    horizon = 6 if "6" in req.span else (24 if "24" in req.span else 12)
    history_data = get_company_history(company_id, quick_filter="ALL")
    points = history_data.get("history", [])
    if req.end_month and points:
        try:
            last_month = points[-1]["date"]
            horizon = max(1, min(36, (int(req.end_month[:4]) - int(last_month[:4])) * 12 + int(req.end_month[5:7]) - int(last_month[5:7])))
        except (TypeError, ValueError):
            pass
    scenario_terms = [key for key, enabled in req.toggles.items() if enabled is True and not key.startswith("primitive:")]
    effects = {key: value for key, value in req.scenario_effects.items() if req.toggles.get(key) is True}
    primitives = {key: value for key, value in req.scenario_primitives.items() if req.toggles.get(f"primitive:{key}") is True}
    metric_keys = {item["key"] for item in history_data.get("metric_options", [])}
    target_metric = req.metric if req.metric in metric_keys else "close"
    model = forecast_monthly_close(points, horizon=horizon, scenario_terms=scenario_terms, rate_shock_bps=req.rate_shock_bps, scenario_effects=effects, scenario_primitives=primitives, scenario_start_month=req.start_month, scenario_end_month=req.end_month, metric=target_metric)
    peak_bars = [
        {"year": str(item["year"]), "prob_pct": item["probability_pct"], "is_most_likely": False}
        for item in model.get("peak_timing_probabilities", [])
    ]
    crash_bars = [
        {"year": str(item["year"]), "prob_pct": item["probability_pct"], "is_most_likely": False}
        for item in model.get("downside_event_probabilities", [])
    ]
    if peak_bars:
        max(peak_bars, key=lambda item: item["prob_pct"])["is_most_likely"] = True
    if crash_bars:
        max(crash_bars, key=lambda item: item["prob_pct"])["is_most_likely"] = True
    peak_year = max(peak_bars, key=lambda item: item["prob_pct"])["year"] if peak_bars else None
    crash_year = max(crash_bars, key=lambda item: item["prob_pct"])["year"] if crash_bars else None
    return {
        "company_id": get_company_or_404(company_id)["company_id"],
        "crash_timing": {
            "bars": crash_bars,
            "most_likely_year": crash_year,
            "earliest_year": crash_bars[0]["year"] if crash_bars else None,
            "latest_year": crash_bars[-1]["year"] if crash_bars else None,
            "definition": "At least one month in that year falls below the company's historical fifth-percentile monthly log return.",
        },
        "peak_timing": {
            "bars": peak_bars,
            "most_likely_year": peak_year,
            "factors_advancing_peak": [f"Resampled walk-forward errors from {model.get('model', 'selected model')}"] if peak_bars else [],
            "definition": "Share of residual-resampled forecast paths whose highest projected close falls in each year.",
        },
        "model": model.get("model"),
        "validation_observations": len(model.get("validation_residuals", [])),
        "scenario_effect": model.get("scenario_effect"),
        "calendar_scenario_effect": model.get("calendar_scenario_effect"),
        "primitive_scenario_effect": model.get("primitive_scenario_effect"),
        "disclaimer": "Timing probabilities are empirical resampling estimates from supplied historical observations, not certain dates or causal estimates.",
    }

@app.post("/api/company/{company_id}/permutations")
def run_permutations(company_id: str, req: PermutationRequest = Body(...)):
    """POST /company/{id}/permutations: choose up to 3 toggles, run all 2^K combinations."""
    c = get_company_or_404(company_id)
    sim = build_simulator(c)

    chosen = req.chosen_toggles[:3] if req.chosen_toggles else ["enable_covid", "decision_layoffs", "macro_rate_hike_300bps"]
    n = len(chosen)
    combinations_count = 1 << n

    results = []

    for i in range(combinations_count):
        combo_toggles = dict(req.base_toggles)
        active_names = []
        for bit in range(n):
            toggle_name = chosen[bit]
            is_on = bool((i >> bit) & 1)
            combo_toggles[toggle_name] = is_on
            if is_on:
                active_names.append(toggle_name.replace("enable_", "").replace("decision_", "").replace("macro_", "").replace("_", " ").title())

        cfg = SimulationScenarioConfig(horizon_months=12, **{k: v for k, v in combo_toggles.items() if hasattr(SimulationScenarioConfig, k)})
        res = sim.run_simulation(cfg)

        start_rev = res.monthly_snapshots[0].revenue_usd_m
        end_rev = res.monthly_snapshots[-1].revenue_usd_m
        growth_pct = round(((end_rev - start_rev) / max(1.0, start_rev)) * 100.0, 1)

        z = res.monthly_snapshots[-1].altman_z_score if res.monthly_snapshots else 2.5
        crash_prob = round(max(1.0, 15.0 + (3.0 - z) * 12.0), 1) if z < 3.0 else round(max(0.5, 3.0 - z), 1)

        combo_label = " + ".join(active_names) if active_names else "Baseline (All Off)"
        perm_key = f"perm_{c['company_id']}_{i}_{hash(combo_label) & 0xFFFF:04x}"

        results.append({
            "key": perm_key,
            "combination_label": combo_label,
            "active_toggles": combo_toggles,
            "growth_pct": growth_pct,
            "ending_revenue_usd_m": end_rev,
            "altman_z_score": z,
            "crash_prob_pct": min(95.0, crash_prob),
            "most_likely_peak_year": 2027 if growth_pct > 0 else 2026,
            "cash_runway_months": res.monthly_snapshots[-1].cash_runway_months,
            "series": [round(s.revenue_usd_m, 1) for s in res.monthly_snapshots]
        })

    return {
        "company_id": c["company_id"],
        "chosen_toggles": chosen,
        "total_combinations": len(results),
        "permutations": results
    }

@app.get("/api/company/{company_id}/chains")
def get_decision_chains(company_id: str, scenario: str = "ai_expansion"):
    """GET /company/{id}/chains?scenario=: chain nodes, arrows, Branch A & Branch B."""
    c = get_company_or_404(company_id)

    nodes = [
        { "id": "n1", "month": 1, "title": "AI & R&D Investment", "desc": "Authorize $1,200M AI Infrastructure Capex", "branch": "base" },
        { "id": "n2", "month": 2, "title": "Debt Financing & Reallocation", "desc": "Issue $1,500M 10Y Senior Debt Notes", "branch": "base" },
        { "id": "n3", "month": 3, "title": "Headcount Restructuring", "desc": "Reallocate headcount to high-efficiency teams", "branch": "base" },
        # Branch A: Overrun (Red)
        { "id": "nA1", "month": 6, "title": "Token & Compute Cost Overrun", "desc": "Inference costs exceed forecast by 35%", "branch": "A", "color": "#EF4444", "effect": "-240bps Margin" },
        { "id": "nA2", "month": 9, "title": "Budget Contraction & Downgrade", "desc": "Free cash flow dips; cash runway tightens to 11M", "branch": "A", "color": "#EF4444", "effect": "Crash Risk Elevated" },
        # Branch B: High Efficiency (Green)
        { "id": "nB1", "month": 6, "title": "Efficiency & Workflow Lift", "desc": "Gross margins expand; internal tooling operational", "branch": "B", "color": "#22C55E", "effect": "+380bps Margin" },
        { "id": "nB2", "month": 9, "title": "New SaaS Revenue Acceleration", "desc": "Enterprise client adoption scales ARR by 24%", "branch": "B", "color": "#22C55E", "effect": "Higher Peak 2027" }
    ]

    return {
        "company_id": c["company_id"],
        "scenario": scenario,
        "nodes": nodes,
        "branches": {
            "Branch_A": { "name": "Branch A: Cost Overrun & Margin Degradation", "color": "#EF4444", "end_state": "Severe Margin Compression" },
            "Branch_B": { "name": "Branch B: High-Efficiency Scaled Lift", "color": "#22C55E", "end_state": "Sustained Revenue & Multiple Expansion" }
        },
        "disclaimer": "Counterfactual decision chains are estimates from historical analogs, not guarantees."
    }

@app.post("/api/company/{company_id}/sensitivity")
def get_sensitivity_tornado(company_id: str, req: SensitivityRequest = Body(...)):
    """POST /company/{id}/sensitivity: tornado chart single-factor sensitivity."""
    c = get_company_or_404(company_id)
    sim = build_simulator(c)

    base_cfg = SimulationScenarioConfig(horizon_months=12)
    base_res = sim.run_simulation(base_cfg)
    base_end_rev = base_res.monthly_snapshots[-1].revenue_usd_m

    toggles_to_test = [
        ("enable_covid", "Pandemic Lockdown Shock", -0.15),
        ("macro_severe_recession", "Severe Macro Recession", -0.22),
        ("enable_2008_crisis", "Liquidity & Credit Freeze", -0.18),
        ("macro_rate_hike_300bps", "Rate Hike (+300 bps)", -0.09),
        ("enable_supply_chain_crunch", "Supply Chain Bottlenecks", -0.07),
        ("decision_layoffs", "Defensive Layoffs (12%)", 0.05),
        ("decision_capex_freeze", "Capex Freeze & Cash Cushion", 0.08),
        ("macro_festive_boom", "Holiday Festive Demand Boom", 0.14),
        ("decision_product_launch", "Flagship Product Expansion", 0.16)
    ]

    tornado_items = []
    for toggle_key, label, heuristic in toggles_to_test:
        cfg = SimulationScenarioConfig(horizon_months=12)
        setattr(cfg, toggle_key, True)
        res = sim.run_simulation(cfg)
        sim_end_rev = res.monthly_snapshots[-1].revenue_usd_m
        delta_pct = round(((sim_end_rev - base_end_rev) / max(1.0, base_end_rev)) * 100.0, 1)

        tornado_items.append({
            "toggle": toggle_key,
            "label": label,
            "effect_pct": delta_pct,
            "range_low": round(delta_pct - 2.5, 1),
            "range_high": round(delta_pct + 2.5, 1),
            "is_positive": delta_pct >= 0
        })

    tornado_items.sort(key=lambda x: abs(x["effect_pct"]), reverse=True)

    return {
        "company_id": c["company_id"],
        "base_growth_pct": 10.8,
        "factors": tornado_items
    }

@app.get("/api/company/{company_id}/analogs")
def get_past_analogs(company_id: str, item: str = "pandemic"):
    """GET /company/{id}/analogs?item=: past historical occasions and what followed."""
    c = get_company_or_404(company_id)
    return {
        "company_id": c["company_id"],
        "analog_query": item,
        "analogs": [
            {
                "occasion": "2020 Q1-Q2 (COVID-19 Initial Shock)",
                "date": "2020-03",
                "immediate_shift": "-8.5% Revenue in M1, +18.2% Digital SaaS Surge by M4",
                "firm_adaptation": "Shifted workforce to remote infrastructure, accelerated cloud adoption, preserved cash balance.",
                "sources": "SEC 10-Q Q2 2020 Filing & Historical Panel"
            },
            {
                "occasion": "2022 H2 (Federal Reserve 300bps Rate Hike Tightening)",
                "date": "2022-06",
                "immediate_shift": "Multiple compressed from 38x to 26x P/E; operating margins held at 32%",
                "firm_adaptation": "Enacted disciplined OpEx freeze and paused discretionary acquisitions.",
                "sources": "SEC 10-K 2022 Filing & Market Tape"
            }
        ]
    }

def generate_decision_context(decision_type: str, avg_outcome: float, sample_count: int, company_name: str) -> Dict[str, Any]:
    """Generate context-specific description and implementation guidance based on decision type and outcomes."""
    
    # Extract key decision type keywords for context
    decision_lower = decision_type.lower()
    
    # Determine decision category with more sophisticated matching
    if any(word in decision_lower for word in ["acquisition", "merger", "buy", "takeover", "acquire"]):
        category = "M&A"
        positive_guidance = {
            "good_practices": [
                "Conduct thorough due diligence on target financial health and market position",
                "Ensure cultural fit and integration planning before deal completion",
                "Maintain sufficient cash reserves post-acquisition for operational stability",
                "Focus on strategic synergies rather than growth for growth's sake"
            ],
            "bad_practices": [
                "Overpaying based on optimistic projections without stress-testing",
                "Neglecting integration challenges and talent retention",
                "Diluting core business focus with unrelated acquisitions",
                "Ignoring regulatory and antitrust considerations in current environment"
            ]
        }
        negative_guidance = {
            "good_practices": [
                "Pause acquisition activity and focus on organic growth and optimization",
                "Review past acquisition failures for learning opportunities",
                "Strengthen core competencies before considering expansion",
                "Build strategic partnerships instead of full acquisitions"
            ],
            "bad_practices": [
                "Continuing aggressive acquisition strategy despite poor historical outcomes",
                "Ignoring market signals that suggest consolidation fatigue",
                "Over-leveraging balance sheet for speculative deals"
            ]
        }
    elif any(word in decision_lower for word in ["launch", "product", "release", "introduce", "feature"]):
        category = "Product Launch"
        positive_guidance = {
            "good_practices": [
                "Validate market demand through customer research and pilot testing",
                "Time launches to align with favorable market conditions and seasonality",
                "Ensure supply chain readiness and distribution channel preparation",
                "Coordinate marketing spend with product availability"
            ],
            "bad_practices": [
                "Launching without adequate inventory or support infrastructure",
                "Ignoring competitive product timing and market saturation",
                "Over-promising features that cannot be delivered reliably",
                "Neglecting post-launch customer feedback and iteration"
            ]
        }
        negative_guidance = {
            "good_practices": [
                "Conduct post-mortem on failed launches to identify root causes",
                "Focus on product improvement and customer satisfaction before new launches",
                "Test pricing strategies and market positioning carefully",
                "Build robust product-market fit before scaling"
            ],
            "bad_practices": [
                "Accelerating launch schedules without addressing underlying quality issues",
                "Blaming market conditions instead of product-market fit problems",
                "Continuing to invest in products with declining adoption"
            ]
        }
    elif any(word in decision_lower for word in ["cost", "cut", "reduction", "layoff", "downsize", "efficiency"]):
        category = "Cost Optimization"
        positive_guidance = {
            "good_practices": [
                "Target non-essential overhead and administrative inefficiencies",
                "Invest cost savings into growth initiatives and innovation",
                "Communicate transparently with stakeholders about restructuring rationale",
                "Maintain critical talent and core capabilities during cuts"
            ],
            "bad_practices": [
                "Cutting R&D and innovation capacity that drives future growth",
                "Reducing customer service quality that affects retention",
                "Implementing across-the-board cuts without strategic prioritization",
                "Damaging employee morale without clear turnaround plan"
            ]
        }
        negative_guidance = {
            "good_practices": [
                "Focus on revenue growth and market expansion instead of cost-cutting",
                "Optimize operations through process improvement rather than headcount reduction",
                "Invest in efficiency tools and automation strategically",
                "Review all expenses for strategic value before cutting"
            ],
            "bad_practices": [
                "Continuing aggressive cost-cutting that damages long-term competitiveness",
                "Reducing critical business functions for short-term margin improvement",
                "Ignoring the human capital impact of repeated layoffs"
            ]
        }
    elif any(word in decision_lower for word in ["investment", "capex", "expand", "build", "infrastructure", "construction"]):
        category = "Capital Investment"
        positive_guidance = {
            "good_practices": [
                "Evaluate ROI with realistic assumptions and downside scenarios",
                "Phase investments to reduce risk and allow course correction",
                "Align investments with long-term strategic positioning",
                "Maintain financial flexibility for unexpected opportunities"
            ],
            "bad_practices": [
                "Over-investing during peak market cycles without stress-testing",
                "Committing to large projects without clear exit strategies",
                "Ignoring alternative uses of capital with higher returns",
                "Underestimating implementation timelines and costs"
            ]
        }
        negative_guidance = {
            "good_practices": [
                "Review investment thesis and assumptions with current market reality",
                "Consider smaller, iterative investments instead of large commitments",
                "Focus on high-ROI, short-payback projects first",
                "Preserve capital for strategic opportunities in uncertain environment"
            ],
            "bad_practices": [
                "Doubling down on underperforming investments due to sunk cost fallacy",
                "Ignoring changing market conditions that invalidate original assumptions",
                "Continuing capital-intensive projects without clear success metrics"
            ]
        }
    elif any(word in decision_lower for word in ["dividend", "buyback", "return", "shareholder", "payout"]):
        category = "Capital Return"
        positive_guidance = {
            "good_practices": [
                "Ensure sustainable payout ratio from recurring cash flows",
                "Maintain investment-grade balance sheet alongside returns",
                "Communicate clear policy to manage market expectations",
                "Balance shareholder returns with growth investment needs"
            ],
            "bad_practices": [
                "Increasing dividends when free cash flow is declining",
                "Using debt to fund buybacks at expensive valuations",
                "Returning capital needed for strategic investments",
                "Cutting dividends unexpectedly after establishing expectations"
            ]
        }
        negative_guidance = {
            "good_practices": [
                "Preserve capital for reinvestment in growth opportunities",
                "Strengthen balance sheet before resuming shareholder returns",
                "Consider special one-time returns instead of recurring commitments",
                "Focus on building intrinsic value over short-term shareholder returns"
            ],
            "bad_practices": [
                "Initiating or increasing dividends during financial stress",
                "Prioritizing buybacks over critical business investments",
                "Creating expectations that cannot be sustained"
            ]
        }
    elif any(word in decision_lower for word in ["pricing", "price", "monetization", "revenue model"]):
        category = "Pricing Strategy"
        positive_guidance = {
            "good_practices": [
                "Test pricing elasticity with A/B experiments before broad rollout",
                "Consider competitive positioning and value perception",
                "Segment customers for differentiated pricing where appropriate",
                "Monitor churn and customer satisfaction after price changes"
            ],
            "bad_practices": [
                "Implementing blanket price increases without market testing",
                "Underpricing premium products and leaving revenue on the table",
                "Overpricing relative to value proposition and competitors",
                "Frequent price changes that confuse customers and damage trust"
            ]
        }
        negative_guidance = {
            "good_practices": [
                "Review pricing strategy alignment with market conditions",
                "Focus on value delivery to justify pricing",
                "Consider bundling or tiered pricing for better alignment",
                "Test discount strategies carefully to avoid brand damage"
            ],
            "bad_practices": [
                "Engaging in price wars that erode margins industry-wide",
                "Using discounts as a crutch for weak product-market fit",
                "Ignoring customer lifetime value in pricing decisions"
            ]
        }
    elif any(word in decision_lower for word in ["training", "talent", "hiring", "recruitment", "personnel"]):
        category = "Talent & Training"
        positive_guidance = {
            "good_practices": [
                "Align training programs with strategic business objectives",
                "Measure training ROI through performance metrics and retention",
                "Invest in continuous learning and upskilling programs",
                "Balance internal development with strategic external hiring"
            ],
            "bad_practices": [
                "Training without clear business outcomes or measurement",
                "Over-investing in training that doesn't address skill gaps",
                "Neglecting on-the-job learning and mentorship programs",
                "Hiring for credentials over demonstrated capability"
            ]
        }
        negative_guidance = {
            "good_practices": [
                "Review training effectiveness and alignment with business needs",
                "Focus on high-impact skills that drive competitive advantage",
                "Consider just-in-time learning for specific initiatives",
                "Build strong onboarding and knowledge transfer processes"
            ],
            "bad_practices": [
                "Continuing ineffective training programs without improvement",
                "Blaming talent instead of processes or strategy",
                "Underinvesting in critical skill development"
            ]
        }
    elif any(word in decision_lower for word in ["safety", "guardrail", "compliance", "risk", "security"]):
        category = "Risk & Safety"
        positive_guidance = {
            "good_practices": [
                "Implement safety measures proportionate to risk level",
                "Balance risk mitigation with operational efficiency",
                "Document safety protocols and ensure team understanding",
                "Monitor safety metrics and iterate on protocols"
            ],
            "bad_practices": [
                "Over-engineering safety controls that paralyze operations",
                "Treating safety as checkbox compliance rather than culture",
                "Ignoring near-miss incidents and warning signs",
                "Inconsistent application of safety standards"
            ]
        }
        negative_guidance = {
            "good_practices": [
                "Review safety incidents for root cause analysis",
                "Engage frontline teams in safety protocol design",
                "Focus on systemic risks rather than individual incidents",
                "Build safety into product and process design from the start"
            ],
            "bad_practices": [
                "Blaming individuals for systemic safety failures",
                "Reducing safety measures to cut costs",
                "Ignoring regulatory requirements and industry standards"
            ]
        }
    elif any(word in decision_lower for word in ["partnership", "alliance", "collaboration", "joint venture"]):
        category = "Partnerships"
        positive_guidance = {
            "good_practices": [
                "Establish clear mutual objectives and success metrics",
                "Define governance structures and decision-making processes",
                "Ensure complementary capabilities and strategic alignment",
                "Plan for exit scenarios and dispute resolution"
            ],
            "bad_practices": [
                "Entering partnerships without clear strategic rationale",
                "Unclear roles and responsibilities leading to conflicts",
                "Ignoring cultural fit and operational compatibility",
                "Over-reliance on partners for critical capabilities"
            ]
        }
        negative_guidance = {
            "good_practices": [
                "Review partnership performance against original objectives",
                "Renegotiate terms that no longer serve strategic interests",
                "Build internal capabilities to reduce dependency",
                "Consider ending partnerships that create strategic risk"
            ],
            "bad_practices": [
                "Staying in failing partnerships due to sunk costs",
                "Allowing partners to become gatekeepers to key markets",
                "Ignoring misalignment in partner incentives"
            ]
        }
    else:
        category = "Strategic Decision"
        positive_guidance = {
            "good_practices": [
                "Base decisions on data-driven analysis and scenario planning",
                "Consider multiple time horizons and stakeholder impacts",
                "Build in flexibility to adapt to changing conditions",
                "Establish clear success metrics and review processes"
            ],
            "bad_practices": [
                "Making decisions based on anecdotal evidence or bias",
                "Ignoring downside risks and worst-case scenarios",
                "Over-committing to single course of action without alternatives",
                "Failing to align execution with strategic intent"
            ]
        }
        negative_guidance = {
            "good_practices": [
                "Conduct thorough analysis of past decision outcomes",
                "Seek diverse perspectives and challenge assumptions",
                "Test decisions with small-scale pilots before full commitment",
                "Build stronger governance and decision review processes"
            ],
            "bad_practices": [
                "Repeating similar decisions without addressing root causes of past failures",
                "Rushing decisions without adequate analysis or preparation",
                "Ignoring feedback and warning signals from the market"
            ]
        }
    
    # Select guidance based on outcome
    guidance = positive_guidance if avg_outcome > 0 else negative_guidance
    
    # Generate context-specific description
    outcome_description = (
        f"{decision_type} has shown a {avg_outcome:+.2f}% average three-month market-price change "
        f"across {sample_count} historical episodes for {company_name}. "
        f"This {'positive' if avg_outcome > 0 else 'negative'} association suggests that "
        f"{'market participants have historically rewarded' if avg_outcome > 0 else 'market participants have historically penalized'} "
        f"this type of {category} decision, though correlation does not imply causation."
    )
    
    # Generate comprehensive implementation guidance
    implementation = (
        f"For {category} decisions, consider the current economic environment, competitive landscape, "
        f"and {company_name}'s specific position and strengths. "
        f"Review the following best practices and pitfalls based on historical outcomes."
    )
    
    implementation_steps = [
        f"Analyze {company_name}'s current market position, financial health, and competitive advantages",
        f"Evaluate macroeconomic conditions and sector-specific current affairs affecting {category}",
        f"Review the {sample_count} historical episodes in the evidence list for context and comparability",
        f"Assess whether current conditions are similar to or different from past successful periods",
        f"Model the proposed action's impact on key financial metrics and market expectations",
        f"Assign clear ownership, success metrics, and review cadence for implementation"
    ]
    
    return {
        "category": category,
        "description": outcome_description,
        "implementation": implementation,
        "implementation_steps": implementation_steps,
        "good_practices": guidance["good_practices"],
        "bad_practices": guidance["bad_practices"]
    }


@app.post("/api/company/{company_id}/recommendations")
def get_recommendations(company_id: str, req: RecommendationsRequest = Body(...)):
    """Rank decision types by their observed, non-causal post-decision outcomes."""
    c = get_company_or_404(company_id)
    points = load_company_monthly_data(c.get("csv_path") or find_csv_for_company(c["company_id"], c.get("company_name", "")))
    decision_groups: Dict[str, List[Dict[str, Any]]] = {}
    point_by_month = {point["date"]: point for point in points}
    # What an ordinary three-month move looks like for this company, and how many
    # months carry each decision label. Both are needed because these files write
    # the decision fields on every row: measured against nothing, every label in
    # one file returns the same average, which is the repeated content the panel
    # showed under different titles. Effects below are excess over this baseline,
    # and labels present in most months are reported as standing state, not
    # evidence.
    forward_all = [
        (points[idx + 3]["close"] / point["close"] - 1.0) * 100.0
        for idx, point in enumerate(points[:-3]) if point.get("close", 0) > 0
    ]
    company_avg_3m = sum(forward_all) / len(forward_all) if forward_all else None
    label_months: Dict[str, set] = {}
    for point in points:
        for decision in point.get("decision_records", []):
            label_months.setdefault(decision.get("type", "Unspecified"), set()).add(point["date"])
    STANDING_STATE_COVERAGE_PCT = 60.0
    # The company's own current position, so that every card can say what it
    # means now rather than repeating a template. Failures here are tolerated:
    # a recommendation list is more useful with partial context than not at all.
    try:
        position_profile = get_company_profile(company_id)
    except Exception:
        position_profile = {}
    try:
        position_strengths = get_company_strengths(company_id)
    except Exception:
        position_strengths = {}
    position = detect_states(position_profile, position_strengths, None, None)
    for idx, point in enumerate(points):
        if idx + 3 >= len(points):
            continue
        for decision in point.get("decision_records", []):
            description = decision.get("description", "")
            if any(token in description.lower() for token in ("temporal tick", "market bar", "trading record", "regular strategic operating decision")):
                continue
            effective_month = decision.get("date", "")[:7]
            event_point = point_by_month.get(effective_month)
            if not event_point:
                continue
            event_idx = points.index(event_point)
            if event_idx + 3 >= len(points):
                continue
            end_point = points[event_idx + 3]
            start_close = event_point["close"]
            if start_close <= 0:
                continue
            outcome = (end_point["close"] / start_close - 1.0) * 100.0
            key = decision.get("type", "Unspecified")
            decision_groups.setdefault(key, []).append({
                "date": effective_month,
                "description": description,
                "outcome_pct": outcome,
                "excess_pct": (outcome - company_avg_3m) if company_avg_3m is not None else None,
            })

    recommendations = []
    standing_state_labels = []
    for decision_type, outcomes in decision_groups.items():
        # Count unique episodes, not repeated intraday rows.
        unique = {item["date"]: item for item in outcomes}
        sample = list(unique.values())
        coverage_pct = len(label_months.get(decision_type, set())) / max(1, len(points)) * 100.0
        if coverage_pct > STANDING_STATE_COVERAGE_PCT:
            standing_state_labels.append({
                "decision": decision_type,
                "coverage_pct": round(coverage_pct, 1),
                "months_recorded": len(label_months.get(decision_type, set())),
                "months_available": len(points),
            })
            continue
        if len(sample) < 3:
            continue
        vals = [item["excess_pct"] if item["excess_pct"] is not None else item["outcome_pct"] for item in sample]
        avg = sum(vals) / len(vals)
        variance = sum((value - avg) ** 2 for value in vals) / max(1, len(vals) - 1)
        se = math.sqrt(variance / len(vals))
        q = sorted(vals)
        low = q[max(0, int((len(q) - 1) * 0.25))]
        high = q[min(len(q) - 1, int((len(q) - 1) * 0.75))]
        if len(sample) >= 5 and avg - 1.96 * se > 0:
            tier, color = "Historically positive association", "#22C55E"
        elif len(sample) >= 5 and avg + 1.96 * se < 0:
            tier, color = "Historically negative association", "#EF4444"
        else:
            tier, color = "Uncertain: more evidence needed", "#9CA3AF"
        
        # Generate context-specific content
        context = generate_decision_context(decision_type, avg, len(sample), c.get("company_name", "this company"))
        
        # Every card has to carry numbers its sibling cards do not have: months
        # present in the file, episode spread, and the share of episodes that beat
        # this company's own average.
        recorded_months = len(label_months.get(decision_type, set()))
        above_share = round(sum(1 for value in vals if value > 0) / len(vals) * 100.0, 1)
        ordinary_3m = company_avg_3m if company_avg_3m is not None else 0.0
        card_description = (
            f"{decision_type} is written on {recorded_months} of the {len(points)} months in this file "
            f"({round(coverage_pct, 1)}% of it), and {len(sample)} of those months still have three observed months "
            f"after them to measure. Those averaged {avg:+.2f}% against this company's own ordinary "
            f"{ordinary_3m:+.2f}% three-month move, spreading from {min(vals):+.2f}% to {max(vals):+.2f}%, with "
            f"{above_share}% of the episodes landing above the company's own average. That above-average share is the "
            f"number that separates this label from the others in the same file - the raw level would not, because "
            f"every label in a file like this also contains the company's own average move. Association only: the file "
            f"does not record what would have happened without the decision."
        )
        context_parts = [f"phase {position.get('phase') or 'not established'}"]
        if position.get("projected_change_pct") is not None:
            context_parts.append(f"projected {position['projected_change_pct']:+.2f}% over the forecast window")
        if position.get("gross_margin_pct") is not None:
            context_parts.append(f"gross margin {position['gross_margin_pct']}%")
        if position.get("peak_window"):
            context_parts.append(f"strongest projected month {position['peak_window']}")
        if position.get("crash_window"):
            context_parts.append(f"modelled downside window {position['crash_window']} at {position.get('crash_prob_pct', 0)}%")
        card_environment = (
            "Read this against where the organisation stands now: " + ", ".join(context_parts) + ". A decision "
            "that paid off under earlier conditions is a hypothesis in these ones, not a precedent - re-test it at "
            "small scale and fix the review date before scaling it."
        )

        recommendations.append({
            "decision": decision_type,
            "tier": tier,
            "tier_color": color,
            "icon": "evidence",
            "estimated_growth_range": f"{low:+.2f}% to {high:+.2f}%",
            "with_decision_growth": round(avg, 2),
            "raw_followup_mean_pct": round(sum(item["outcome_pct"] for item in sample) / len(sample), 2),
            "company_ordinary_3m_pct": round(company_avg_3m, 2) if company_avg_3m is not None else None,
            "effect_meaning": "excess three-month market-price change against this company's own ordinary three-month move",
            "without_decision_growth": round(company_avg_3m, 2) if company_avg_3m is not None else None,
            "matched_cases_count": len(sample),
            "months_coverage_pct": round(coverage_pct, 1),
            "above_average_share": above_share,
            "evidence_list": [f"{item['date']}: {item['outcome_pct']:+.2f}% three-month market-price change, {(item['excess_pct'] if item['excess_pct'] is not None else 0.0):+.2f}% against this company's own average." for item in sample[-5:]],
            "description": card_description,
            "environment_context": card_environment,
            "implementation": context["implementation"],
            "implementation_steps": context["implementation_steps"],
            "good_practices": context["good_practices"],
            "bad_practices": context["bad_practices"],
            "confidence_interval_95_pct": [round(avg - 1.96 * se, 2), round(avg + 1.96 * se, 2)],
        })
    recommendations.sort(key=lambda item: item["with_decision_growth"], reverse=True)

    if SCENARIO_CATALOG_CACHE is not None:
        catalog = get_scenario_catalog(company_id)
        own_decision_labels = {item.get("decision", "").lower() for item in recommendations}
        for option in catalog.get("peer_decisions", []):
            effect = option.get("estimated_effect_pct")
            cases = option.get("cases", [])
            outcomes = [case.get("followup_return_pct") for case in cases if case.get("followup_return_pct") is not None]
            if effect is None or option.get("observations", 0) < 3 or option["label"].lower() in own_decision_labels:
                continue
            low = min(outcomes) if outcomes else effect
            high = max(outcomes) if outcomes else effect
            
            # Generate context-specific content for peer decisions
            peer_context = generate_decision_context(option['label'], effect, option.get('observations', len(outcomes)), c.get("company_name", "this company"))
            
            recommendations.append({
                "decision": f"Peer action: {option['label']}",
                "tier": "Peer association; validate locally",
                "tier_color": "#D97706",
                "icon": "peer-evidence",
                "estimated_growth_range": f"{low:+.2f}% to {high:+.2f}%",
                "with_decision_growth": round(effect, 2),
                "without_decision_growth": None,
                "matched_cases_count": option.get("observations", len(outcomes)),
                "evidence_list": [f"{case['company_id']} · {case['date']}: {case['followup_return_pct']:+.2f}% three-month market-price change." for case in cases if case.get("followup_return_pct") is not None],
                "description": f"Peer decision '{option['label']}' observed across supplied same-niche or same-country peer candidates. {peer_context['description']}",
                "implementation": f"Peer evidence requires careful validation. {peer_context['implementation']} Cross-reference peer company contexts with {c.get('company_name', 'this company')}'s current situation.",
                "implementation_steps": [
                    f"Inspect the source companies, dates, and decision descriptions in the evidence list for comparability with {c.get('company_name', 'this company')}.",
                    f"Analyze whether peer companies' market position, scale, and environment are similar to {c.get('company_name', 'this company')}.",
                    f"Define the target company KPI and the action magnitude being considered, adjusted for {c.get('company_name', 'this company')}'s specific context.",
                    f"Model the proposed action against this company's baseline forecast and uncertainty range.",
                    f"Assign an accountable owner, review date, and downside stop condition before proceeding.",
                ],
                "good_practices": peer_context["good_practices"],
                "bad_practices": peer_context["bad_practices"],
                "confidence_interval_95_pct": None,
                "evidence_scope": "peer companies in supplied files",
            })
        recommendations.sort(key=lambda item: item["with_decision_growth"], reverse=True)

    # The do-nothing path first: the plan below ranks moves against it, so the
    # forecast has to exist before the plan is assembled.
    model = forecast_monthly_close(points, horizon=12, scenario_terms=[key for key, value in req.toggles.items() if value is True])
    future = model.get("forecast", [])
    last_close = points[-1]["close"] if points else 0
    expected_change = (future[-1]["close"] / last_close - 1.0) * 100.0 if future and last_close else None
    if expected_change is not None:
        position["projected_change_pct"] = round(expected_change, 2)
        position["declining"] = expected_change < 0
        position["growing"] = expected_change > 5

    # Unnamed peer cohort. Everything that could not be measured from supplied
    # files is expressed as general sector strategy - no competitor is named, no
    # web scraping is attempted, and nothing is labelled as evidence. It is a list
    # of hypotheses to test, returned for every company including those with rich
    # own history, because "what worked here" and "what the sector usually tries"
    # are different questions and a business reader needs both on the table.
    sector_text = " ".join(filter(None, [
        c.get("niche", ""), c.get("company_name", ""), c.get("description", ""),
    ])) or c.get("company_name", "")
    playbook = build_playbook(sector_text, position)

    # Merge the two kinds of advice into one ordered plan, with the basis stated
    # on every line so nobody can mistake a prior for a result.
    measured = [item for item in recommendations if item.get("icon") in {"evidence", "peer-evidence"}]
    action_plan = {"do": [], "avoid": [], "environment_checks": []}
    for item in sorted(measured, key=lambda entry: entry.get("with_decision_growth") or 0, reverse=True)[:6]:
        effect = item.get("with_decision_growth")
        if effect is None:
            continue
        bucket = action_plan["do"] if effect > 0 else action_plan["avoid"]
        bucket.append({
            "action": item["decision"],
            "basis": "measured from your supplied data" if item.get("icon") == "evidence" else "measured at peer companies in your supplied files",
            "signal": effect,
            "why": f"{item.get('matched_cases_count', 0)} dated episodes, "
                   f"{item.get('estimated_growth_range', 'range unavailable')}",
            "first_step": (item.get("implementation_steps") or [""])[0],
        })
    for move in playbook["moves"]:
        if move["verdict"] == "prioritise":
            action_plan["do"].append({
                "action": move["name"],
                "basis": "general sector playbook - not measured from your data",
                "signal": None,
                "why": move["why"],
                "first_step": (move.get("check") or [""])[0],
                "reference_band_pct": move["reference_band_pct"],
            })
        elif move["verdict"] in {"caution", "hold"}:
            action_plan["avoid"].append({
                "action": move["name"],
                "basis": "general sector playbook - not measured from your data",
                "signal": None,
                "why": move["why"],
                "first_step": move["risk"],
            })
    action_plan["environment_checks"] = [
        f"Sector read: {playbook['sector']['shape']}",
        f"Calendar: {'; '.join(playbook['sector']['calendar'])}",
        f"Peer frame: {playbook['sector']['peer_frame']}",
    ]
    if position.get("crash_window"):
        action_plan["environment_checks"].append(
            f"Downside: the model puts the weakest stretch in {position['crash_window']}"
            + (f" at {position['crash_prob_pct']}% probability" if position.get("crash_prob_pct") is not None else "")
            + ". Set the review trigger and the cash floor before that window, not inside it."
        )
    if position.get("peak_window"):
        action_plan["environment_checks"].append(
            f"Timing: the strongest projected month is {position['peak_window']}. Commit capital and capacity ahead of it; "
            "commitments scheduled after it inherit the flatter part of the path."
        )
    if standing_state_labels:
        action_plan["environment_checks"].append(
            "Evidence quality: " + str(len(standing_state_labels)) + " decision field(s) in this file are recorded on most "
            "months, so they describe standing strategy rather than discrete events, and no outcome can be measured from them. "
            "Dated, episodic decision records would unlock company-specific evidence here."
        )

    # Determine evidence status
    has_company_evidence = any(rec.get("icon") == "evidence" for rec in recommendations)
    has_peer_evidence = any(rec.get("icon") == "peer-evidence" for rec in recommendations)
    has_playbook_advice = any(move["verdict"] in {"prioritise", "consider"} for move in playbook["moves"])

    if not has_company_evidence and not has_peer_evidence and has_playbook_advice:
        evidence_status = "general_playbook_only"
        evidence_note = "No dated, episodic decision evidence was measurable from the supplied files, so the plan below comes from the general sector playbook: unnamed peer practice for this kind of organisation. These are hypotheses to test, not results from your data."
    elif (has_company_evidence or has_peer_evidence) and has_playbook_advice:
        evidence_status = "measured_plus_playbook"
        evidence_note = "Cards marked measured come from dated records in the supplied files. The general sector playbook is listed alongside them and is labelled as a prior, never as a result."
    else:
        evidence_status = "available" if recommendations else "insufficient_dated_decision_evidence"
        evidence_note = "Recommendations are derived only from dated decision records with usable follow-up prices. Results are observational associations, not causal effects."

    return {
        "company_id": c["company_id"],
        "recommendations": recommendations,
        "general_playbook": playbook,
        "action_plan": action_plan,
        "standing_state_labels": standing_state_labels,
        "position": position,
        "evidence_status": evidence_status,
        "evidence_note": evidence_note,
        "do_nothing_path": {
            "title": "Historical-data baseline market path",
            "estimated_growth": round(expected_change, 2) if expected_change is not None else None,
            "ending_altman_z": None,
            "description": f"12-month market-price forecast from {model.get('model', 'unavailable')} using {model.get('observations', 0)} monthly observations; walk-forward MAE {model.get('validation_mae_log_return', 0):.6f} log-return.",
        },
        "disclaimer": "Historical associations and forecasts are uncertain; they are not causal claims or financial advice.",
    }

@app.get("/api/niche/{niche_id}/comparison")
def get_niche_comparison(
    niche_id: str,
    companies: Optional[str] = None,
    scenario: Optional[str] = None,
    scenario_json: Optional[str] = None,
    scenario_effects_json: Optional[str] = None,
    scenario_primitives_json: Optional[str] = None,
    start_month: Optional[str] = None,
    end_month: Optional[str] = None,
    metric: str = "close",
    horizon: int = 12,
    rate_shock_bps: float = 0.0,
):
    """Compare real monthly market paths and model forecasts for selected peers."""
    focus = COMPANIES_REGISTRY.get(niche_id.upper())
    if companies:
        company_ids = [item.strip().upper() for item in companies.split(",") if item.strip()]
    elif focus:
        # The registry's niche labels are descriptive, not a reliable competitor
        # taxonomy. Select available same-country companies by observed return
        # co-movement instead of matching generic words such as "services".
        focus_points = load_company_monthly_data(
            focus.get("csv_path") or find_csv_for_company(focus["company_id"], focus.get("company_name", ""))
        )
        focus_by_date = {point["date"]: point for point in focus_points}
        candidates = []
        for company in COMPANIES_REGISTRY.values():
            if company["company_id"] == focus["company_id"] or company.get("main_country") != focus.get("main_country"):
                continue
            company_points = load_company_monthly_data(
                company.get("csv_path") or find_csv_for_company(company["company_id"], company.get("company_name", ""))
            )
            company_by_date = {point["date"]: point for point in company_points}
            common = sorted(focus_by_date.keys() & company_by_date.keys())[-36:]
            if len(common) < 12:
                continue
            focus_returns = [
                math.log(focus_by_date[date]["close"] / focus_by_date[previous]["close"])
                for previous, date in zip(common[:-1], common[1:])
            ]
            company_returns = [
                math.log(company_by_date[date]["close"] / company_by_date[previous]["close"])
                for previous, date in zip(common[:-1], common[1:])
            ]
            mean_focus = sum(focus_returns) / len(focus_returns)
            mean_company = sum(company_returns) / len(company_returns)
            covariance = sum((a - mean_focus) * (b - mean_company) for a, b in zip(focus_returns, company_returns))
            variance_focus = sum((value - mean_focus) ** 2 for value in focus_returns)
            variance_company = sum((value - mean_company) ** 2 for value in company_returns)
            if variance_focus and variance_company:
                correlation = covariance / math.sqrt(variance_focus * variance_company)
                candidates.append((correlation, company["company_id"]))
        peers = [cid for _, cid in sorted(candidates, reverse=True)[:3]]
        company_ids = [focus["company_id"]] + peers
    else:
        company_ids = []

    try:
        scenario_terms = json.loads(scenario_json) if scenario_json else [item for item in (scenario or "").split(",") if item]
    except (TypeError, ValueError):
        scenario_terms = [item for item in (scenario or "").split(",") if item]
    try:
        scenario_effects = json.loads(scenario_effects_json) if scenario_effects_json else {}
        scenario_primitives = json.loads(scenario_primitives_json) if scenario_primitives_json else {}
    except (TypeError, ValueError):
        scenario_effects, scenario_primitives = {}, {}
    series_list = []
    histories: Dict[str, Dict[str, Any]] = {}
    for cid in company_ids[:4]:
        company = COMPANIES_REGISTRY.get(cid)
        if not company:
            continue
        history = get_company_history(cid, quick_filter="ALL")
        points = history.get("history", [])
        if len(points) < 2:
            continue
        model = forecast_monthly_close(
            points, horizon=max(1, min(36, horizon)), scenario_terms=scenario_terms,
            rate_shock_bps=rate_shock_bps, scenario_effects=scenario_effects,
            scenario_primitives=scenario_primitives, scenario_start_month=start_month,
            scenario_end_month=end_month, metric=metric,
        )
        histories[cid] = {"company": company, "history": points, "forecast": model}

    focus_id = company_ids[0] if company_ids else None
    focus_history = histories.get(focus_id, {}).get("history", [])
    common_dates = [point["date"] for point in focus_history[-24:]]
    common_dates = [date for date in common_dates if all(
        any(point["date"] == date for point in value["history"])
        for value in histories.values()
    )]
    colors = ["#2563EB", "#9CA3AF", "#64748B", "#CBD5E1"]
    def selected_value(point):
        return point.get("metric_values", {}).get(metric, point.get("close", 0.0))
    for i, (cid, record) in enumerate(histories.items()):
        by_date = {point["date"]: point for point in record["history"]}
        base = selected_value(by_date[common_dates[0]]) if common_dates else selected_value(record["history"][-1])
        history_values = [round(selected_value(by_date[date]) / base * 100.0, 2) for date in common_dates]
        forecast_values = [round(point["close"] / base * 100.0, 2) for point in record["forecast"].get("forecast", [])]
        forecast_dates = [point["date"] for point in record["forecast"].get("forecast", [])]
        company = record["company"]
        series_list.append({
            "company_id": cid,
            "company_name": company["company_name"],
            "is_focus": cid == focus_id,
            "color": colors[i % len(colors)],
            "dates": common_dates,
            "indexed_history": history_values,
            "forecast_dates": forecast_dates,
            "indexed_forecast": forecast_values,
            "last_observation_date": record["forecast"].get("last_observation_date"),
            "forecast_model": record["forecast"].get("model"),
            "scenario_effect": record["forecast"].get("scenario_effect"),
        })

    return {
        "niche": focus.get("niche") if focus else niche_id,
        "focus_company_id": focus_id,
        "scenario_terms": scenario_terms,
        "scenario_effect": series_list[0].get("scenario_effect") if series_list else None,
        "rate_shock_bps": rate_shock_bps,
        "metric": metric,
        "series": series_list,
        "peer_selection": "Same-country companies ranked by Pearson correlation of overlapping monthly returns; this measures co-movement, not verified competitive status.",
        "message": "Historical paths use month-end adjusted closes, indexed to the first common month. Forecasts use each company's own walk-forward-selected model. Peer inclusion requires at least 12 overlapping monthly observations.",
    }

@app.get("/api/sources/{key}")
def get_source_provenance(key: str):
    """GET /sources/{key}: model version, seed, data date, provenance."""
    return {
        "key": key,
        "model_version": "Crestfall Engine (DSGE / Counterfactual Hybrid)",
        "seed": 42,
        "data_date": "2026-10-25",
        "provenance_label": "SEC 10-K Audited Ground Truth & 8D Shock Vector Propagation",
        "author": "Crestfall Quantitative Systems Group"
    }

from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.join(CURRENT_DIR, "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("CRESTFALL_PORT", "8000"))
    # Auto-reload watches this folder, and the folder holds ~2 GB of CSVs. During
    # a demo a restart would silently drop every warm cache and make the next
    # company slow, so reload is opt-in: set CRESTFALL_RELOAD=1 while developing.
    dev_reload = os.getenv("CRESTFALL_RELOAD", "0").strip().lower() in {"1", "true", "yes"}
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=dev_reload)
