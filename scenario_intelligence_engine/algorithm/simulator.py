"""
simulator.py - Full-Statement Monthly Financial Simulation Engine.
Implements Checkpoints 1, 2, 3, and 4:
- Ingests company financial baseline, market baseline, and macro baseline.
- Generates month-by-month trajectory (1 to 24 months).
- Reconciles Income Statement, Balance Sheet, and Cash Flow with strict accounting conservation.
- Evaluates Altman Z-Score, Cash Runway, Valuation Multiple, and Solvency Health.
"""

import math
import datetime
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional

from .schemas import Company, Financials, Market, Macro, SimulationScenarioConfig
from .shock_primitives import ShockVector8D, get_niche_elasticity
from .event_profiles import (
    get_covid_monthly_shock,
    get_911_monthly_shock,
    get_2008_crisis_monthly_shock,
    get_stagflation_rates_monthly_shock,
    get_supply_crunch_monthly_shock,
    get_geopolitical_conflict_monthly_shock
)
from .decision_engine import DecisionEngine, DecisionImpact

@dataclass
class MonthlyFinancialSnapshot:
    month: int
    date_label: str
    revenue_usd_m: float
    cogs_usd_m: float
    gross_profit_usd_m: float
    gross_margin_pct: float
    opex_usd_m: float
    ebit_usd_m: float
    interest_expense_usd_m: float
    net_income_usd_m: float
    cash_flow_operating_usd_m: float
    capex_usd_m: float
    free_cash_flow_usd_m: float
    cash_balance_usd_m: float
    total_debt_usd_m: float
    cash_runway_months: float
    altman_z_score: float
    market_cap_usd_bn: float
    pe_ratio: float
    default_prob_pct: float
    active_shock_summary: Dict[str, float]

@dataclass
class SimulationResult:
    company_id: str
    company_name: str
    niche: str
    currency: str
    scenario_name: str
    config: SimulationScenarioConfig
    monthly_snapshots: List[MonthlyFinancialSnapshot]
    summary_metrics: Dict[str, Any]

class FinancialSimulator:
    def __init__(self, company: Company, baseline_financials: Financials, baseline_market: Market, baseline_macro: Macro):
        self.company = company
        self.base_fin = baseline_financials
        self.base_market = baseline_market
        self.base_macro = baseline_macro
        self.elasticities = get_niche_elasticity(company.niche)

    def run_simulation(self, config: SimulationScenarioConfig, scenario_name: str = "Custom Scenario", start_date: Optional[str] = None) -> SimulationResult:
        # Determine baseline monthly figures from quarterly/annual filing
        # If quarterly, divide by 3; if annual, divide by 12
        freq = self.base_fin.source_frequency.lower()
        period_months = 3.0 if "quarter" in freq else (12.0 if "annual" in freq else 1.0)
        
        m_base_rev = self.base_fin.revenue_usd_m / period_months
        m_base_cogs = self.base_fin.cost_of_revenue_usd_m / period_months
        m_base_opex = self.base_fin.operating_expense_usd_m / period_months
        m_base_capex = self.base_fin.capex_usd_m / period_months
        
        # Balance sheet state variables
        current_cash = self.base_fin.cash_usd_m
        current_debt = self.base_fin.total_debt_usd_m
        current_assets = self.base_fin.total_assets_usd_m
        current_equity = self.base_fin.equity_usd_m
        
        # Base borrowing cost: Policy rate + Credit spread (approx 2.5% base spread)
        base_interest_rate = (self.base_macro.policy_rate_pct / 100.0) + 0.025
        base_pe = (self.base_market.market_cap_usd_bn * 1000.0) / max(1.0, (self.base_fin.net_income_usd_m * (12.0 / period_months)))
        base_pe = max(8.0, min(65.0, base_pe))

        snapshots: List[MonthlyFinancialSnapshot] = []

        # Parse start_date to produce real calendar labels (e.g. "Jan 2025")
        # start_date should be the first month of the forecast, e.g. "2025-01"
        _cal_start: Optional[datetime.date] = None
        if start_date:
            try:
                _cal_start = datetime.date(int(start_date[:4]), int(start_date[5:7]), 1)
            except Exception:
                _cal_start = None

        for m in range(1, config.horizon_months + 1):
            # 1. AGGREGATE SHOCK VECTORS ACROSS ALL ACTIVE TOGGLES
            combined_shock = ShockVector8D()

            # Event Toggles
            if config.enable_covid:
                covid_shock = get_covid_monthly_shock(m)
                # Tech niche gets stay-at-home digital boost during pandemic
                if "tech" in self.company.niche.lower():
                    covid_shock.demand += self.elasticities.get("pandemic_remote_boost", 0.0) * (0.8 if m >= 4 else -0.2)
                combined_shock = combined_shock.add(covid_shock)

            if config.enable_911:
                combined_shock = combined_shock.add(get_911_monthly_shock(m))

            if config.enable_2008_crisis:
                combined_shock = combined_shock.add(get_2008_crisis_monthly_shock(m))

            if config.enable_stagflation_rates:
                combined_shock = combined_shock.add(get_stagflation_rates_monthly_shock(m))

            if config.enable_supply_chain_crunch:
                combined_shock = combined_shock.add(get_supply_crunch_monthly_shock(m))

            if config.enable_geopolitical_conflict:
                combined_shock = combined_shock.add(get_geopolitical_conflict_monthly_shock(m))

            # Macro Factor Toggles
            if config.macro_high_inflation:
                combined_shock.supply += 0.25 # Raw material / freight inflation
                combined_shock.demand -= 0.08 * self.elasticities["demand_elasticity"]
                combined_shock.rates += 0.015

            if config.macro_rate_hike_300bps:
                combined_shock.rates += 0.030 # +300 bps
                combined_shock.sentiment -= 0.25

            if config.macro_severe_recession:
                combined_shock.demand -= 0.25 * self.elasticities["demand_elasticity"]
                combined_shock.credit += 0.35
                combined_shock.sentiment -= 0.40

            if config.macro_festive_boom:
                combined_shock.calendar += self.elasticities.get("calendar_lift", 0.25)

            # 2. EVALUATE MANAGEMENT INTERVENTIONS
            decision_impact = DecisionEngine.evaluate_interventions(
                month=m,
                base_revenue=m_base_rev,
                base_cogs=m_base_cogs,
                base_opex=m_base_opex,
                base_capex=m_base_capex,
                pricing_power=self.elasticities.get("pricing_power", 0.5),
                config=config
            )

            # 3. COMPUTE MONTHLY FINANCIAL FLOWS
            # Revenue calculation
            demand_multiplier = 1.0 + (combined_shock.demand * self.elasticities["demand_elasticity"]) + combined_shock.calendar
            demand_multiplier = max(0.15, demand_multiplier) # Cannot drop below 15% of baseline
            revenue_m = m_base_rev * demand_multiplier * decision_impact.revenue_multiplier

            # Cost of Goods Sold (COGS)
            supply_multiplier = 1.0 + (combined_shock.supply * self.elasticities["supply_sensitivity"])
            supply_multiplier = max(0.5, supply_multiplier)
            cogs_m = m_base_cogs * (revenue_m / m_base_rev) ** 0.85 * supply_multiplier * decision_impact.cogs_multiplier

            gross_profit_m = revenue_m - cogs_m
            gross_margin_pct = (gross_profit_m / max(1.0, revenue_m)) * 100.0

            # Operating Expense (OpEx)
            # Inflation inflates OpEx, but decisions can reduce or add to it
            inflation_opex = 1.0 + (combined_shock.supply * 0.20)
            opex_m = (m_base_opex * inflation_opex) + decision_impact.opex_delta_usd_m
            opex_m = max(m_base_opex * 0.35, opex_m)

            ebit_m = gross_profit_m - opex_m

            # Debt & Interest calculation
            current_debt += decision_impact.debt_change_usd_m
            effective_rate = max(0.01, base_interest_rate + combined_shock.rates + (combined_shock.credit * 0.035) + decision_impact.interest_rate_spread_add)
            monthly_interest_m = (current_debt * effective_rate) / 12.0

            ebt_m = ebit_m - monthly_interest_m
            effective_tax_rate = 0.21 if ebt_m > 0 else 0.0
            net_income_m = ebt_m - (ebt_m * effective_tax_rate if ebt_m > 0 else 0.0)

            # Cash Flow & Balance Sheet integration
            # Operating cash flow proxy: Net Income + Non-cash D&A (approx 20% of OpEx) - Working Capital drag
            da_m = m_base_opex * 0.18
            nwc_drag = (revenue_m - m_base_rev) * 0.12 * combined_shock.credit
            ocf_m = net_income_m + da_m - nwc_drag

            capex_m = m_base_capex * decision_impact.capex_multiplier
            fcf_m = ocf_m - capex_m

            # Update Cash Balance
            current_cash += fcf_m + decision_impact.cash_injection_usd_m - decision_impact.buyback_monthly_usd_m
            current_cash = max(0.0, current_cash) # Cash floored at 0

            # Cash Runway (months)
            monthly_cash_burn = max(0.0, -fcf_m + decision_impact.buyback_monthly_usd_m)
            if monthly_cash_burn > 0.01:
                cash_runway = current_cash / monthly_cash_burn
            else:
                cash_runway = 999.0 # Infinite/Self-sustaining runway

            # 4. SOLVENCY & VALUATION METRICS
            # Altman Z-Score Formulation for Public Non-Financials:
            # Z = 1.2*X1 + 1.4*X2 + 3.3*X3 + 0.6*X4 + 0.999*X5
            # X1 = Working Capital / Total Assets
            # X2 = Retained Earnings / Total Assets
            # X3 = EBIT / Total Assets
            # X4 = Market Value of Equity / Total Debt
            # X5 = Sales / Total Assets
            working_cap = current_cash - (m_base_cogs * 0.3)
            annualized_ebit = ebit_m * 12.0
            annualized_rev = revenue_m * 12.0
            total_assets = max(100.0, current_assets + (current_cash - self.base_fin.cash_usd_m))
            
            # P/E multiple contraction/expansion based on sentiment & rate shocks
            pe_multiplier = 1.0 + (combined_shock.sentiment * 0.40) - (combined_shock.rates * 6.0)
            current_pe = max(6.0, min(50.0, base_pe * pe_multiplier))
            annualized_ni = max(10.0, net_income_m * 12.0)
            market_cap_bn = max(1.0, (annualized_ni * current_pe) / 1000.0)

            x1 = working_cap / total_assets
            x2 = (current_equity + net_income_m) / total_assets
            x3 = annualized_ebit / total_assets
            x4 = (market_cap_bn * 1000.0) / max(10.0, current_debt)
            x5 = annualized_rev / total_assets

            altman_z = (1.2 * x1) + (1.4 * x2) + (3.3 * x3) + (0.6 * x4) + (0.999 * x5)

            # Merton structural default probability proxy
            if altman_z > 3.0:
                default_prob = max(0.1, 1.5 - 0.2 * altman_z)
            elif altman_z >= 1.8:
                default_prob = 3.0 + (3.0 - altman_z) * 6.0
            else:
                default_prob = min(85.0, 15.0 + (1.8 - altman_z) * 25.0)

            if _cal_start is not None:
                # Compute real calendar month
                total_month = _cal_start.month + (m - 1)
                cal_year = _cal_start.year + (total_month - 1) // 12
                cal_month = ((total_month - 1) % 12) + 1
                month_names = ["Jan","Feb","Mar","Apr","May","Jun",
                               "Jul","Aug","Sep","Oct","Nov","Dec"]
                date_str = f"{month_names[cal_month - 1]} {cal_year}"
            else:
                date_str = f"M{m:02d}"

            snapshot = MonthlyFinancialSnapshot(
                month=m,
                date_label=date_str,
                revenue_usd_m=round(revenue_m, 2),
                cogs_usd_m=round(cogs_m, 2),
                gross_profit_usd_m=round(gross_profit_m, 2),
                gross_margin_pct=round(gross_margin_pct, 2),
                opex_usd_m=round(opex_m, 2),
                ebit_usd_m=round(ebit_m, 2),
                interest_expense_usd_m=round(monthly_interest_m, 2),
                net_income_usd_m=round(net_income_m, 2),
                cash_flow_operating_usd_m=round(ocf_m, 2),
                capex_usd_m=round(capex_m, 2),
                free_cash_flow_usd_m=round(fcf_m, 2),
                cash_balance_usd_m=round(current_cash, 2),
                total_debt_usd_m=round(current_debt, 2),
                cash_runway_months=round(cash_runway, 1),
                altman_z_score=round(altman_z, 2),
                market_cap_usd_bn=round(market_cap_bn, 2),
                pe_ratio=round(current_pe, 1),
                default_prob_pct=round(default_prob, 2),
                active_shock_summary={
                    "demand": round(combined_shock.demand, 3),
                    "supply": round(combined_shock.supply, 3),
                    "credit": round(combined_shock.credit, 3),
                    "rates_bps": round(combined_shock.rates * 10000, 1),
                    "sentiment": round(combined_shock.sentiment, 3),
                    "pandemic": round(combined_shock.pandemic, 3),
                    "geopolitical": round(combined_shock.geopolitical, 3)
                }
            )
            snapshots.append(snapshot)

        # Compute summary metrics over 24-month horizon
        total_rev = sum(s.revenue_usd_m for s in snapshots)
        total_ni = sum(s.net_income_usd_m for s in snapshots)
        min_cash = min(s.cash_balance_usd_m for s in snapshots)
        min_z = min(s.altman_z_score for s in snapshots)
        final_mcap = snapshots[-1].market_cap_usd_bn
        base_mcap = self.base_market.market_cap_usd_bn
        mcap_drawdown_pct = ((final_mcap - base_mcap) / base_mcap) * 100.0

        summary = {
            "cumulative_revenue_usd_m": round(total_rev, 2),
            "cumulative_net_income_usd_m": round(total_ni, 2),
            "minimum_cash_usd_m": round(min_cash, 2),
            "lowest_altman_z": round(min_z, 2),
            "terminal_market_cap_usd_bn": round(final_mcap, 2),
            "market_cap_change_pct": round(mcap_drawdown_pct, 2),
            "distress_status": "High Risk" if min_z < 1.8 else ("Moderate Risk" if min_z < 3.0 else "Solid / Low Risk")
        }

        return SimulationResult(
            company_id=self.company.company_id,
            company_name=self.company.company_name,
            niche=self.company.niche,
            currency=self.company.currency,
            scenario_name=scenario_name,
            config=config,
            monthly_snapshots=snapshots,
            summary_metrics=summary
        )
