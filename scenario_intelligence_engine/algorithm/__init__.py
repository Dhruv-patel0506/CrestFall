"""
Scenario Intelligence Engine - Core Package.
"""
from .schemas import Company, Financials, Market, Benchmark, Macro, Calendar, Event, Decision, SimulationScenarioConfig
from .shock_primitives import ShockVector8D, NICHE_ELASTICITIES, get_niche_elasticity
from .event_profiles import (
    get_covid_monthly_shock,
    get_911_monthly_shock,
    get_2008_crisis_monthly_shock,
    get_stagflation_rates_monthly_shock,
    get_supply_crunch_monthly_shock,
    get_geopolitical_conflict_monthly_shock
)
from .decision_engine import DecisionEngine, DecisionImpact
from .simulator import FinancialSimulator, SimulationResult, MonthlyFinancialSnapshot
from .permutation_matrix import PermutationEngine
from .calibration import ModelCalibrator

__all__ = [
    "Company",
    "Financials",
    "Market",
    "Benchmark",
    "Macro",
    "Calendar",
    "Event",
    "Decision",
    "SimulationScenarioConfig",
    "ShockVector8D",
    "NICHE_ELASTICITIES",
    "get_niche_elasticity",
    "get_covid_monthly_shock",
    "get_911_monthly_shock",
    "get_2008_crisis_monthly_shock",
    "get_stagflation_rates_monthly_shock",
    "get_supply_crunch_monthly_shock",
    "get_geopolitical_conflict_monthly_shock",
    "DecisionEngine",
    "DecisionImpact",
    "FinancialSimulator",
    "SimulationResult",
    "MonthlyFinancialSnapshot",
    "PermutationEngine",
    "ModelCalibrator",
]
