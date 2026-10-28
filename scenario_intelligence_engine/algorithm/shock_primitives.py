"""
shock_primitives.py - 8-Dimensional Shock Vector Engine & Elasticities.
Models the transformation of macro, event, and calendar shocks into 
firm-level microeconomic multipliers across:
1. Demand Shock (Delta D)
2. Supply Shock (Delta S)
3. Credit & Liquidity Shock (Delta C)
4. Rate Shock (Delta R)
5. Sentiment & Volatility Shock (Delta V)
6. Calendar & Seasonality Shock (Delta Cal)
7. Geopolitical Shock (Delta Geo)
8. Pandemic Shock (Delta Pan)
"""

import math
from dataclasses import dataclass
from typing import Dict, List, Tuple

@dataclass
class ShockVector8D:
    demand: float = 0.0       # -1.0 to +1.0 (negative = contraction)
    supply: float = 0.0       # 0.0 to +1.0 (cost inflation / shortage)
    credit: float = 0.0       # 0.0 to +1.0 (spread widening, illiquidity)
    rates: float = 0.0        # -1.0 to +1.0 (percentage points change, e.g. +0.03 = +300bps)
    sentiment: float = 0.0    # -1.0 to +1.0 (VIX elevation, multiple compression)
    calendar: float = 0.0     # -1.0 to +1.0 (seasonal festival lift or holiday freeze)
    geopolitical: float = 0.0 # 0.0 to +1.0 (friction, tariff, disruption)
    pandemic: float = 0.0     # 0.0 to +1.0 (lockdown intensity, mobility loss)

    def add(self, other: 'ShockVector8D') -> 'ShockVector8D':
        """Superposition of shock vectors with diminishing marginal saturation."""
        def saturate(v1: float, v2: float, min_val: float = -1.0, max_val: float = 1.0) -> float:
            combined = v1 + v2
            # Apply smooth soft-clipping to prevent non-physical infinite blowups
            if combined > max_val:
                return max_val - 0.2 * math.exp(-(combined - max_val))
            if combined < min_val:
                return min_val + 0.2 * math.exp(-(min_val - combined))
            return combined

        return ShockVector8D(
            demand=saturate(self.demand, other.demand, -0.90, 0.80),
            supply=saturate(self.supply, other.supply, 0.0, 1.0),
            credit=saturate(self.credit, other.credit, 0.0, 1.0),
            rates=self.rates + other.rates,
            sentiment=saturate(self.sentiment, other.sentiment, -1.0, 1.0),
            calendar=saturate(self.calendar, other.calendar, -0.5, 0.8),
            geopolitical=saturate(self.geopolitical, other.geopolitical, 0.0, 1.0),
            pandemic=saturate(self.pandemic, other.pandemic, 0.0, 1.0)
        )

    def scale(self, factor: float) -> 'ShockVector8D':
        return ShockVector8D(
            demand=self.demand * factor,
            supply=self.supply * factor,
            credit=self.credit * factor,
            rates=self.rates * factor,
            sentiment=self.sentiment * factor,
            calendar=self.calendar * factor,
            geopolitical=self.geopolitical * factor,
            pandemic=self.pandemic * factor
        )

# Industry / Niche Elasticity Profiles
# Defines how different sectors respond to the 8 shock primitives
NICHE_ELASTICITIES: Dict[str, Dict[str, float]] = {
    "Consumer technology": {
        "demand_elasticity": 0.85,      # Moderately discretionary but high brand loyalty
        "supply_sensitivity": 0.95,     # Highly sensitive to chip & Asian supply chains
        "credit_sensitivity": 0.25,     # Large cash reserves shield balance sheet
        "rate_sensitivity": 0.40,       # Valuation multiple sensitive to 10Y discount rate
        "sentiment_sensitivity": 0.75,  # High retail/institutional sentiment beta
        "calendar_lift": 0.35,          # Strong Q4 holiday seasonality
        "geopolitical_risk": 0.80,      # Sensitive to Taiwan/China trade relations
        "pandemic_remote_boost": 0.45,  # Stay-at-home digital demand tailwind
        "pricing_power": 0.80,          # Can pass through some inflation
    },
    "Banking / Financial": {
        "demand_elasticity": 0.60,      # Loan demand drops in recession
        "supply_sensitivity": 0.10,     # Zero physical inventory
        "credit_sensitivity": 1.00,     # Extreme vulnerability to non-performing loans & spreads
        "rate_sensitivity": 0.90,       # Net Interest Margin (NIM) directly tied to yield curve
        "sentiment_sensitivity": 0.85,  # Bank run / deposit flight risk
        "calendar_lift": 0.05,          # Flat calendar
        "geopolitical_risk": 0.40,      # Cross-border capital flow risk
        "pandemic_remote_boost": -0.20, # Initial provisioning surge
        "pricing_power": 0.50,
    },
    "Apparel & Retail": {
        "demand_elasticity": 1.25,      # Highly discretionary; consumers delay purchases
        "supply_sensitivity": 0.80,     # Port bottlenecks & cotton/freight costs
        "credit_sensitivity": 0.60,     # Working capital financing reliant
        "rate_sensitivity": 0.50,       # Consumer credit card borrowing cost impact
        "sentiment_sensitivity": 0.70,  # High sensitivity to consumer confidence
        "calendar_lift": 0.75,          # Massive Diwali / Black Friday / Christmas dependency
        "geopolitical_risk": 0.65,      # Manufacturing in SE Asia / shipping lanes
        "pandemic_remote_boost": -0.60, # Brick & mortar closures hit revenue hard
        "pricing_power": 0.35,          # Heavy discount risk if demand softens
    },
    "Automotive & Industrial": {
        "demand_elasticity": 1.10,      # Big-ticket cyclical purchase
        "supply_sensitivity": 1.00,     # Complex multi-tier supply chain (semiconductors, steel)
        "credit_sensitivity": 0.80,     # High debt load & auto financing rates
        "rate_sensitivity": 0.95,       # Financing rates directly deter car buyers
        "sentiment_sensitivity": 0.65,  # Consumer big-ticket confidence
        "calendar_lift": 0.20,          # Year-end model year sales
        "geopolitical_risk": 0.75,      # Critical mineral supply, tariffs
        "pandemic_remote_boost": -0.50, # Factory shutdowns
        "pricing_power": 0.45,
    },
    "Healthcare & Pharma": {
        "demand_elasticity": 0.20,      # Inelastic, non-cyclical demand
        "supply_sensitivity": 0.50,     # API active pharmaceutical ingredient sourcing
        "credit_sensitivity": 0.30,     # Stable cash flows
        "rate_sensitivity": 0.35,       # M&A debt sensitivity
        "sentiment_sensitivity": 0.30,  # Defensive safe-haven
        "calendar_lift": 0.10,          # Insurance deductible resets
        "geopolitical_risk": 0.30,
        "pandemic_remote_boost": 0.70,  # Vaccines, diagnostics, emergency treatments
        "pricing_power": 0.90,          # Strong patent protection
    }
}

def get_niche_elasticity(niche: str) -> Dict[str, float]:
    """Retrieve elasticity dict for niche or fallback to default balanced profile."""
    for key in NICHE_ELASTICITIES:
        if key.lower() in niche.lower() or niche.lower() in key.lower():
            return NICHE_ELASTICITIES[key]
    # Default balanced industrial profile
    return {
        "demand_elasticity": 0.80,
        "supply_sensitivity": 0.60,
        "credit_sensitivity": 0.50,
        "rate_sensitivity": 0.50,
        "sentiment_sensitivity": 0.60,
        "calendar_lift": 0.25,
        "geopolitical_risk": 0.50,
        "pandemic_remote_boost": 0.0,
        "pricing_power": 0.50,
    }
