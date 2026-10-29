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
from typing import Dict, Any, Optional
from .sector_strategies import UniversalSectorStrategies, SectorClassifier

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

    @staticmethod
    def evaluate_universal_strategy(
        month: int,
        base_revenue: float,
        base_cogs: float,
        base_opex: float,
        base_capex: float,
        strategy_type: str,
        magnitude: float,
        magnitude_unit: str,
        pricing_power: float = 1.0,
        strategies_manager: Optional[UniversalSectorStrategies] = None
    ) -> DecisionImpact:
        """
        Evaluate a universal sector strategy when peer-specific data is unavailable.

        Args:
            month: Current simulation month
            base_revenue: Base revenue for the period
            base_cogs: Base cost of goods sold
            base_opex: Base operating expenses
            base_capex: Base capital expenditures
            strategy_type: Type of strategy (hiring, capex_change, product_launch, etc.)
            magnitude: Magnitude of the strategy implementation
            magnitude_unit: Unit of magnitude (percent, amount, etc.)
            pricing_power: Company's pricing power (affects revenue impact)
            strategies_manager: Optional universal strategies manager

        Returns:
            DecisionImpact object with estimated effects
        """
        impact = DecisionImpact()

        if strategies_manager is None:
            strategies_manager = UniversalSectorStrategies()

        # Get impact estimates for this strategy type
        impact_info = strategies_manager.get_strategy_impact_estimates(strategy_type)

        # Convert magnitude to a multiplier if needed
        if magnitude_unit == "percent":
            magnitude_factor = magnitude / 100.0
        else:
            magnitude_factor = magnitude / max(1.0, base_revenue)  # Normalize by revenue

        # Apply strategy-specific impacts
        if strategy_type == "hiring":
            # Hiring increases OpEx but can boost revenue
            impact.opex_delta_usd_m += base_opex * magnitude_factor
            impact.revenue_multiplier *= (1.0 + magnitude_factor * 0.5 * pricing_power)

        elif strategy_type == "layoffs":
            # Layoffs reduce OpEx but may slightly reduce revenue
            if month == 1:
                # One-time severance cost
                impact.opex_delta_usd_m += base_opex * magnitude_factor * 0.5
            else:
                # Recurring OpEx savings
                impact.opex_delta_usd_m -= base_opex * magnitude_factor
                impact.revenue_multiplier *= (1.0 - magnitude_factor * 0.15)

        elif strategy_type == "capex_change":
            # Capex changes affect investment and future capacity
            impact.capex_multiplier *= (1.0 + magnitude_factor)
            # Revenue impact is delayed (minimal in first 3 months)
            if month > 3:
                ramp = min(1.0, (month - 3) / 6.0)
                impact.revenue_multiplier *= (1.0 + magnitude_factor * 0.3 * ramp)

        elif strategy_type == "acquisition":
            # Acquisitions combine investment and operational changes
            impact.capex_multiplier *= (1.0 + magnitude_factor * 0.5)
            impact.opex_delta_usd_m += base_opex * magnitude_factor * 0.3
            # Revenue boost from synergy (delayed)
            if month > 6:
                ramp = min(1.0, (month - 6) / 12.0)
                impact.revenue_multiplier *= (1.0 + magnitude_factor * 0.4 * ramp)

        elif strategy_type == "product_launch":
            # Product launches have upfront costs and delayed revenue
            if month <= 3:
                impact.opex_delta_usd_m += base_opex * magnitude_factor * 0.5
            else:
                # S-curve adoption
                ramp = min(1.0, (month - 3) / 6.0)
                impact.revenue_multiplier *= (1.0 + magnitude_factor * 0.8 * ramp)

        elif strategy_type == "price_change":
            # Price changes directly affect revenue with volume trade-off
            effective_price_change = magnitude_factor * pricing_power
            impact.revenue_multiplier *= (1.0 + effective_price_change)

        elif strategy_type == "cost_cut":
            # Cost cutting improves margins
            impact.cogs_multiplier *= (1.0 - magnitude_factor)
            impact.opex_delta_usd_m -= base_opex * magnitude_factor * 0.5

        elif strategy_type == "buyback":
            # Buybacks return capital to shareholders
            impact.buyback_monthly_usd_m = base_revenue * magnitude_factor * 0.1

        else:
            # Unknown strategy type - use general estimates from config
            impact_range = impact_info.get("typical_impact_range", [0.0, 0.0])
            if impact_range:
                avg_impact = sum(impact_range) / 2
                normalized_impact = avg_impact * magnitude_factor

                impact_type = impact_info.get("impact_type", "unknown")
                if "opex" in impact_type.lower() or "cost" in impact_type.lower():
                    impact.opex_delta_usd_m += base_opex * normalized_impact
                elif "revenue" in impact_type.lower():
                    impact.revenue_multiplier *= (1.0 + normalized_impact)
                elif "investment" in impact_type.lower():
                    impact.capex_multiplier *= (1.0 + normalized_impact)

        return impact
