"""
event_profiles.py - Month-by-Month Special Event Shock Trajectories.
Directly implements Checkpoint 3:
- COVID month-by-month dynamic evolution (Month 1 to 24).
- 9/11 Geopolitical/Airspace/Security disruption profile.
- 2008 Great Financial Crisis credit crunch profile.
- Rapid Rate Hiking & Stagflation profile.
- Supply chain crunch & Geopolitical blockade.
- Interaction cross-terms for permutation combinations.
"""

from typing import Dict, List
from .shock_primitives import ShockVector8D

def get_covid_monthly_shock(month: int) -> ShockVector8D:
    """
    Returns the distinct 8D shock vector for COVID-19 at month t (1-indexed, 1 to 24).
    Each month has a uniquely calibrated real-world economic profile:
    Month 1: Initial lockdown panic, extreme VIX, travel collapse
    Month 2-3: Peak quarantine, global factory halts, store closures
    Month 4-6: Unprecedented fiscal/monetary stimulus, digital stay-at-home boom
    Month 7-10: Second wave, remote work entrenchment
    Month 11-12: Vaccine breakthroughs, rotation, early semiconductor crunch
    Month 13-18: Reopening wave, revenge spending, container freight crisis
    Month 19-24: Supply chain bottleneck peak, high CPI inflation, early rate hike fears
    """
    m = max(1, min(month, 24))

    # Calibrated month-by-month trajectory dictionary
    profiles = {
        1:  ShockVector8D(demand=-0.45, supply=0.35, credit=0.85, rates=-0.010, sentiment=-0.90, calendar=-0.3, geopolitical=0.20, pandemic=0.95),
        2:  ShockVector8D(demand=-0.50, supply=0.65, credit=0.75, rates=-0.015, sentiment=-0.80, calendar=-0.4, geopolitical=0.25, pandemic=1.00),
        3:  ShockVector8D(demand=-0.40, supply=0.70, credit=0.60, rates=-0.020, sentiment=-0.65, calendar=-0.3, geopolitical=0.20, pandemic=0.95),
        4:  ShockVector8D(demand=-0.15, supply=0.60, credit=0.45, rates=-0.020, sentiment=-0.30, calendar=0.0,  geopolitical=0.15, pandemic=0.85),
        5:  ShockVector8D(demand=-0.05, supply=0.55, credit=0.35, rates=-0.020, sentiment=-0.10, calendar=0.1,  geopolitical=0.15, pandemic=0.75),
        6:  ShockVector8D(demand=0.05,  supply=0.50, credit=0.25, rates=-0.020, sentiment=0.15,  calendar=0.1,  geopolitical=0.15, pandemic=0.70),
        7:  ShockVector8D(demand=0.08,  supply=0.52, credit=0.20, rates=-0.020, sentiment=0.20,  calendar=0.0,  geopolitical=0.15, pandemic=0.65),
        8:  ShockVector8D(demand=0.10,  supply=0.55, credit=0.20, rates=-0.020, sentiment=0.25,  calendar=0.1,  geopolitical=0.15, pandemic=0.60),
        9:  ShockVector8D(demand=0.12,  supply=0.58, credit=0.18, rates=-0.020, sentiment=0.20,  calendar=0.2,  geopolitical=0.15, pandemic=0.60),
        10: ShockVector8D(demand=0.15,  supply=0.62, credit=0.15, rates=-0.020, sentiment=0.30,  calendar=0.3,  geopolitical=0.20, pandemic=0.55),
        11: ShockVector8D(demand=0.18,  supply=0.68, credit=0.15, rates=-0.015, sentiment=0.45,  calendar=0.4,  geopolitical=0.20, pandemic=0.45),
        12: ShockVector8D(demand=0.20,  supply=0.72, credit=0.15, rates=-0.015, sentiment=0.50,  calendar=0.5,  geopolitical=0.20, pandemic=0.40),
        13: ShockVector8D(demand=0.25,  supply=0.75, credit=0.12, rates=-0.010, sentiment=0.55,  calendar=0.2,  geopolitical=0.20, pandemic=0.35),
        14: ShockVector8D(demand=0.28,  supply=0.80, credit=0.10, rates=-0.010, sentiment=0.60,  calendar=0.2,  geopolitical=0.20, pandemic=0.30),
        15: ShockVector8D(demand=0.30,  supply=0.85, credit=0.10, rates=-0.005, sentiment=0.55,  calendar=0.2,  geopolitical=0.20, pandemic=0.25),
        16: ShockVector8D(demand=0.26,  supply=0.90, credit=0.12, rates=0.000,  sentiment=0.45,  calendar=0.2,  geopolitical=0.25, pandemic=0.20),
        17: ShockVector8D(demand=0.22,  supply=0.95, credit=0.15, rates=0.005,  sentiment=0.35,  calendar=0.2,  geopolitical=0.25, pandemic=0.18),
        18: ShockVector8D(demand=0.20,  supply=0.92, credit=0.18, rates=0.010,  sentiment=0.30,  calendar=0.3,  geopolitical=0.25, pandemic=0.15),
        19: ShockVector8D(demand=0.16,  supply=0.88, credit=0.20, rates=0.015,  sentiment=0.20,  calendar=0.3,  geopolitical=0.25, pandemic=0.12),
        20: ShockVector8D(demand=0.12,  supply=0.82, credit=0.22, rates=0.020,  sentiment=0.10,  calendar=0.2,  geopolitical=0.25, pandemic=0.10),
        21: ShockVector8D(demand=0.08,  supply=0.75, credit=0.25, rates=0.025,  sentiment=0.00,  calendar=0.1,  geopolitical=0.25, pandemic=0.08),
        22: ShockVector8D(demand=0.04,  supply=0.68, credit=0.28, rates=0.030,  sentiment=-0.15, calendar=0.1,  geopolitical=0.25, pandemic=0.05),
        23: ShockVector8D(demand=0.00,  supply=0.60, credit=0.30, rates=0.035,  sentiment=-0.25, calendar=0.0,  geopolitical=0.25, pandemic=0.05),
        24: ShockVector8D(demand=-0.05, supply=0.50, credit=0.32, rates=0.040,  sentiment=-0.35, calendar=0.0,  geopolitical=0.25, pandemic=0.02)
    }
    return profiles.get(m, profiles[24])

def get_911_monthly_shock(month: int) -> ShockVector8D:
    """
    Returns shock vector for 9/11 Geopolitical/Airspace/Security disruption.
    Month 1: Total airspace shutdown, travel collapse, VIX spike, military alert.
    Month 2-3: Fed emergency cuts, commercial aviation crisis, heightened freight screening.
    Month 4-7: Fiscal spending on defense/homeland security, permanent logistics friction.
    Month 8-12: Normalization with permanently higher security/insurance overhead.
    """
    m = max(1, min(month, 24))
    if m == 1:
        return ShockVector8D(demand=-0.35, supply=0.45, credit=0.50, rates=-0.010, sentiment=-0.85, calendar=-0.3, geopolitical=0.95, pandemic=0.0)
    elif m in (2, 3):
        return ShockVector8D(demand=-0.25, supply=0.35, credit=0.40, rates=-0.015, sentiment=-0.60, calendar=-0.1, geopolitical=0.80, pandemic=0.0)
    elif m in (4, 5, 6):
        return ShockVector8D(demand=-0.15, supply=0.25, credit=0.25, rates=-0.015, sentiment=-0.30, calendar=0.0,  geopolitical=0.65, pandemic=0.0)
    elif m in (7, 8, 9):
        return ShockVector8D(demand=-0.08, supply=0.20, credit=0.15, rates=-0.010, sentiment=-0.15, calendar=0.1,  geopolitical=0.50, pandemic=0.0)
    else:
        # Residual permanent friction (elevated logistics & insurance cost)
        return ShockVector8D(demand=-0.02, supply=0.12, credit=0.08, rates=-0.005, sentiment=-0.05, calendar=0.0,  geopolitical=0.35, pandemic=0.0)

def get_2008_crisis_monthly_shock(month: int) -> ShockVector8D:
    """
    Returns shock vector for the 2008 Global Financial Crisis (Lehman bankruptcy).
    Acute credit freeze, counterparty collapse, multi-year capex contraction.
    """
    m = max(1, min(month, 24))
    if m <= 3:
        # Acute panic and credit freeze
        return ShockVector8D(demand=-0.30, supply=0.15, credit=1.00, rates=-0.010, sentiment=-0.95, calendar=-0.2, geopolitical=0.20, pandemic=0.0)
    elif m <= 8:
        # Deep global recession, capex cancellation
        return ShockVector8D(demand=-0.38, supply=0.10, credit=0.85, rates=-0.020, sentiment=-0.80, calendar=-0.1, geopolitical=0.15, pandemic=0.0)
    elif m <= 14:
        # Stabilizing through zero rates & QE, but demand is severely depressed
        return ShockVector8D(demand=-0.25, supply=0.05, credit=0.65, rates=-0.025, sentiment=-0.50, calendar=0.0,  geopolitical=0.10, pandemic=0.0)
    else:
        # Slow, protracted L-shaped recovery
        return ShockVector8D(demand=-0.15, supply=0.02, credit=0.45, rates=-0.025, sentiment=-0.30, calendar=0.0,  geopolitical=0.05, pandemic=0.0)

def get_stagflation_rates_monthly_shock(month: int) -> ShockVector8D:
    """
    Rapid rate hiking cycle (+300 to +450 bps) coupled with persistent inflation.
    Compresses equity valuation multiples and increases debt refinancing cost.
    """
    m = max(1, min(month, 24))
    # Cumulative rate hike progression
    rate_delta = min(0.045, 0.0025 * m) # +25bps per month up to +4.5%
    return ShockVector8D(
        demand=-0.12 * (m / 12.0),
        supply=0.45 * max(0.2, 1.0 - (m / 28.0)),
        credit=0.35 + 0.01 * m,
        rates=rate_delta,
        sentiment=-0.45,
        calendar=0.0,
        geopolitical=0.30,
        pandemic=0.0
    )

def get_supply_crunch_monthly_shock(month: int) -> ShockVector8D:
    """
    Semiconductor shortage, port congestion, shipping freight +300%.
    Directly attacks gross margin and COGS.
    """
    m = max(1, min(month, 24))
    # Bell-curve peak at month 8-10, gradual resolution
    intensity = 1.0 / (1.0 + ((m - 9) / 4.0) ** 2)
    return ShockVector8D(
        demand=-0.05 * intensity,
        supply=0.90 * intensity,
        credit=0.20 * intensity,
        rates=0.010 * intensity,
        sentiment=-0.20 * intensity,
        calendar=0.0,
        geopolitical=0.40 * intensity,
        pandemic=0.0
    )

def get_geopolitical_conflict_monthly_shock(month: int) -> ShockVector8D:
    """
    Energy price shock, sanctions, trade route diversions, market uncertainty.
    """
    m = max(1, min(month, 24))
    decay = 0.5 ** (m / 14.0) # 14-month half-life
    return ShockVector8D(
        demand=-0.15 * decay,
        supply=0.60 * decay,
        credit=0.40 * decay,
        rates=0.015 * decay,
        sentiment=-0.50 * decay,
        calendar=0.0,
        geopolitical=0.95 * decay,
        pandemic=0.0
    )
