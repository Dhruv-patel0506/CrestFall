"""
decision_engine.py - Counterfactual Management Interventions & Strategic Decision Layer.
Directly implements the decisions and peer_decisions tables from the schema:
- hiring / layoffs (headcount adjustments, severance timing vs recurring OpEx savings)
- capex_change (freeze or expansion, FCF cash cushion vs capacity drag)
- debt_issued (liquidity facility vs interest burden and leverage)
- price_change (pricing elasticity vs volume trade-off)
- cost_cut (vendor renegotiation, COGS compression)
- buyback (share repurchases vs liquidity preservation)
- product_launch (R&D launch expense upfront, revenue uplift from month 4+)
- peer_decisions & rating changes (competitive spillover)
"""

from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class DecisionImpact:
    revenue_multiplier: float = 1.0       # Direct revenue impact (1.0 = neutral)
    cogs_multiplier: float = 1.0          # Cost of goods sold multiplier
    opex_delta_usd_m: float = 0.0         # Monthly OpEx additive adjustment ($M)
    capex_multiplier: float = 1.0         # Capex multiplier
    cash_injection_usd_m: float = 0.0     # One-off or tranche cash injection ($M)
    debt_change_usd_m: float = 0.0        # Change in principal debt balance ($M)
    interest_rate_spread_add: float = 0.0 # Spread added to borrowing rate (e.g. +0.015 = +150bps)
    buyback_monthly_usd_m: float = 0.0    # Monthly share repurchases ($M)

class DecisionEngine:
    @staticmethod
    def evaluate_interventions(
        month: int,
        base_revenue: float,
        base_cogs: float,
        base_opex: float,
        base_capex: float,
        pricing_power: float,
        config: Any
    ) -> DecisionImpact:
        impact = DecisionImpact()

        # 1. LAYOFFS INTERVENTION
        # 12% headcount reduction: severance in month 1, sustained OpEx savings thereafter
        if getattr(config, 'decision_layoffs', False):
            if month == 1:
                # One-time severance penalty (approx 1.5 months extra OpEx for departing staff)
                impact.opex_delta_usd_m += base_opex * 0.10
            else:
                # 12% recurring reduction in operating expense
                impact.opex_delta_usd_m -= base_opex * 0.12
                # Minor organizational friction / productivity drag on revenue
                impact.revenue_multiplier *= 0.985

        # 2. CAPEX FREEZE
        # Slashing Capex by 50% immediately preserves cash runway
        if getattr(config, 'decision_capex_freeze', False):
            impact.capex_multiplier *= 0.50

        # 3. EMERGENCY LIQUIDITY / CREDIT LINE
        # Secures $5,000M liquidity buffer in month 1 to prevent liquidity default
        if getattr(config, 'decision_emergency_credit_line', False):
            if month == 1:
                impact.cash_injection_usd_m += 5000.0
                impact.debt_change_usd_m += 5000.0

        # 4. PRICING INCREASE (+7%)
        # Filtered through firm's pricing power elasticity
        if getattr(config, 'decision_price_increase', False):
            effective_price_gain = 0.07 * (pricing_power * 1.1)
            impact.revenue_multiplier *= (1.0 + effective_price_gain)

        # 5. COST RESTRUCTURING (Vendor / Supply contracts)
        # Lowers COGS by 7.5%
        if getattr(config, 'decision_cost_restructure', False):
            impact.cogs_multiplier *= 0.925

        # 6. HALT BUYBACKS
        # Repurposes typical monthly buyback funds towards cash preservation
        if getattr(config, 'decision_halt_buybacks', False):
            impact.buyback_monthly_usd_m = 0.0
        else:
            # Baseline buyback run-rate (e.g. 1.5% of annual net income monthly if healthy)
            impact.buyback_monthly_usd_m = max(0.0, (base_revenue - base_cogs - base_opex) * 0.08)

        # 7. NEW PRODUCT LAUNCH
        # Commercialization marketing costs in months 1-3, strong revenue boost from month 4+
        if getattr(config, 'decision_product_launch', False):
            if month <= 3:
                impact.opex_delta_usd_m += base_opex * 0.05
            else:
                # S-curve adoption ramp
                ramp = min(1.0, (month - 3) / 6.0)
                impact.revenue_multiplier *= (1.0 + 0.08 * ramp)

        # 8. PEER PRICE WAR (Spillover from peer decisions)
        if getattr(config, 'peer_price_war', False):
            impact.revenue_multiplier *= 0.92  # 8% revenue drag from competitor discounting

        # 9. CREDIT RATING DOWNGRADE
        if getattr(config, 'credit_rating_downgrade', False):
            impact.interest_rate_spread_add += 0.0175 # +175 bps borrowing cost penalty

        return impact
