"""
schemas.py - Data schemas and models for the Scenario Intelligence Engine.
Directly implements the 16 tables defined in the corporate stress-testing data dictionary:
company, financials, market, benchmark, macro, calendar, events, decisions, 
peer_decisions, operating, layoffs, ratings, guidance, news, provenance, optional.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from datetime import datetime

@dataclass
class Company:
    company_id: str
    company_name: str
    ticker: str
    exchange: str
    main_country: str
    niche: str
    currency: str
    fiscal_year_end: str

@dataclass
class Financials:
    date: str
    report_date: str
    source_frequency: str  # monthly / quarterly / annual
    revenue_usd_m: float
    cost_of_revenue_usd_m: float
    operating_expense_usd_m: float
    operating_income_usd_m: float
    net_income_usd_m: float
    cash_usd_m: float
    total_debt_usd_m: float
    total_assets_usd_m: float
    equity_usd_m: float
    operating_cash_flow_usd_m: float
    capex_usd_m: float
    shares_outstanding_m: float
    restated_flag: bool = False

@dataclass
class Market:
    date: str
    open: float
    high: float
    low: float
    close: float
    adjusted_close: float
    volume: float
    market_cap_usd_bn: float

@dataclass
class Benchmark:
    date: str
    home_index_close: float
    sector_index_close: float
    vix_or_volatility_index: float

@dataclass
class Macro:
    country: str
    date: str
    policy_rate_pct: float
    cpi_index: float
    unemployment_rate_pct: float
    consumer_confidence_index: float
    gdp_growth_pct: float
    fx_rate_per_usd: float
    bond_yield_10y_pct: float

@dataclass
class Calendar:
    country: str
    month: str
    festival_name: str
    festival_days: int
    festival_category: str  # religious / national / shopping / financial year end
    major_sale_flag: bool

@dataclass
class EventShockPrimitives:
    primitive_demand: float        # Demand shock magnitude 0 to 1
    primitive_supply: float        # Supply shock magnitude 0 to 1
    primitive_credit: float        # Credit and liquidity magnitude 0 to 1
    primitive_rates: float         # Rate shock magnitude 0 to 1
    primitive_sentiment: float     # Sentiment and volatility magnitude 0 to 1
    primitive_calendar: float      # Calendar shock magnitude 0 to 1
    primitive_geopolitical: float  # Geopolitical magnitude 0 to 1
    primitive_pandemic: float      # Pandemic magnitude 0 to 1

@dataclass
class Event:
    event_id: str
    event_name: str
    start_date: str
    end_date: str
    event_category: str
    primitives: EventShockPrimitives
    half_life_months: float
    source: str

@dataclass
class Decision:
    decision_id: str
    company_id: str
    decision_type: str  # hiring, layoffs, debt_issued, capex_change, acquisition, buyback, price_change, cost_cut, product_launch, guidance_change
    announced_date: str
    effective_date: str
    magnitude: float
    magnitude_unit: str  # percent / amount / headcount / count
    currency: str
    public_or_private: str
    confidence: str
    source_name: str
    source_url: str
    source_retrieved_date: str
    short_description: str
    reversed_flag: bool = False
    reversal_date: Optional[str] = None
    outcome_window_start: Optional[str] = None
    outcome_window_end: Optional[str] = None
    peer_company_id: Optional[str] = None
    niche_match: Optional[bool] = None

@dataclass
class LayoffRecord:
    company_id: str
    announced_date: str
    headcount_cut: int
    stated_reason: str

@dataclass
class RatingRecord:
    company_id: str
    date: str
    agency: str
    from_rating: str
    to_rating: str

@dataclass
class GuidanceRecord:
    company_id: str
    issue_date: str
    guided_low: float
    guided_high: float
    actual_result: Optional[float] = None

@dataclass
class NewsRecord:
    date: str
    headline: str
    source: str
    url: str
    linked_company_id: Optional[str] = None
    linked_event_id: Optional[str] = None
    topic_tags: str = ""

@dataclass
class OptionalCompanyMetrics:
    company_id: str
    market_share_pct: Optional[float] = None
    consensus_estimate_revenue_usd_m: Optional[float] = None
    insider_transaction_amount_usd_m: Optional[float] = None
    search_interest_index: Optional[float] = None
    commodity_price: Optional[float] = None

@dataclass
class SimulationScenarioConfig:
    """Represents a permutation of toggle settings chosen by the user."""
    # Special Events Toggles
    enable_covid: bool = False
    enable_911: bool = False
    enable_2008_crisis: bool = False
    enable_stagflation_rates: bool = False
    enable_geopolitical_conflict: bool = False
    enable_supply_chain_crunch: bool = False

    # Macro Factor Toggles
    macro_high_inflation: bool = False        # CPI +5%
    macro_rate_hike_300bps: bool = False      # Rate +300 bps
    macro_severe_recession: bool = False       # GDP -3.5%
    macro_festive_boom: bool = False           # Calendar seasonal lift

    # Management Decision Toggles
    decision_layoffs: bool = False             # 12% headcount reduction
    decision_capex_freeze: bool = False        # 50% Capex cut
    decision_emergency_credit_line: bool = False # $5,000M debt facility
    decision_price_increase: bool = False      # +7% price hike
    decision_cost_restructure: bool = False    # -8% vendor/COGS renegotiation
    decision_halt_buybacks: bool = False       # Stop share repurchases
    decision_product_launch: bool = False      # R&D rollout boost at month 4

    # Peer / Industry Spillover Toggles
    peer_price_war: bool = False               # Competitor drops price by 10%
    credit_rating_downgrade: bool = False      # Credit downgrade spreads +150bps

    # Simulation Horizon
    horizon_months: int = 24
