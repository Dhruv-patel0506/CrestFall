"""
permutation_matrix.py - Permutation-Combination Analysis Engine.
Directly implements Checkpoints 2, 3, and 4:
- Computes multi-scenario permutations across toggle dimensions.
- Evaluates marginal contributions of each decision/event toggle.
- Compares outcomes across permutations to give companies strategic foresight.
"""

from typing import List, Dict, Any, Tuple
import copy
from .schemas import SimulationScenarioConfig
from .simulator import FinancialSimulator, SimulationResult

class PermutationEngine:
    def __init__(self, simulator: FinancialSimulator):
        self.simulator = simulator

    def evaluate_preset_permutations(self) -> List[Dict[str, Any]]:
        """
        Runs key strategic permutations illustrating how combinations of toggles 
        shift corporate outcomes from catastrophic insolvency to resilience.
        """
        presets = [
            ("Baseline (Status Quo)", SimulationScenarioConfig()),
            ("Special Event: COVID-19 Unmitigated", SimulationScenarioConfig(enable_covid=True)),
            ("COVID-19 + Defensive Cost Cuts (Layoffs & Capex Freeze)", SimulationScenarioConfig(
                enable_covid=True,
                decision_layoffs=True,
                decision_capex_freeze=True,
                decision_halt_buybacks=True
            )),
            ("COVID-19 + Emergency Liquidity & Expansion", SimulationScenarioConfig(
                enable_covid=True,
                decision_emergency_credit_line=True,
                decision_product_launch=True,
                decision_halt_buybacks=True
            )),
            ("Special Event: 9/11 Geopolitical Shock", SimulationScenarioConfig(enable_911=True)),
            ("9/11 + Price Increase & Cost Restructure", SimulationScenarioConfig(
                enable_911=True,
                decision_price_increase=True,
                decision_cost_restructure=True
            )),
            ("2008 Credit Crunch & Liquidity Freeze", SimulationScenarioConfig(enable_2008_crisis=True)),
            ("2008 Crunch + Emergency Credit Buffer", SimulationScenarioConfig(
                enable_2008_crisis=True,
                decision_emergency_credit_line=True,
                decision_capex_freeze=True
            )),
            ("Macro Stagflation (Rates + Inflation)", SimulationScenarioConfig(
                enable_stagflation_rates=True,
                macro_high_inflation=True,
                macro_rate_hike_300bps=True
            )),
            ("Perfect Storm Black Swan (All Stress Vectors)", SimulationScenarioConfig(
                enable_covid=True,
                enable_2008_crisis=True,
                macro_severe_recession=True,
                peer_price_war=True,
                credit_rating_downgrade=True
            ))
        ]

        results = []
        base_res = self.simulator.run_simulation(SimulationScenarioConfig(), scenario_name="Baseline")
        base_rev = base_res.summary_metrics["cumulative_revenue_usd_m"]
        base_ni = base_res.summary_metrics["cumulative_net_income_usd_m"]
        base_mcap = base_res.summary_metrics["terminal_market_cap_usd_bn"]

        for name, cfg in presets:
            sim_res = self.simulator.run_simulation(cfg, scenario_name=name)
            metrics = sim_res.summary_metrics
            
            # Deltas vs Baseline
            rev_delta = metrics["cumulative_revenue_usd_m"] - base_rev
            ni_delta = metrics["cumulative_net_income_usd_m"] - base_ni
            mcap_delta = metrics["terminal_market_cap_usd_bn"] - base_mcap
            
            # Find min cash runway
            min_runway = min(s.cash_runway_months for s in sim_res.monthly_snapshots)

            results.append({
                "scenario_name": name,
                "config": cfg,
                "cumulative_revenue_usd_m": metrics["cumulative_revenue_usd_m"],
                "rev_delta_usd_m": round(rev_delta, 2),
                "cumulative_net_income_usd_m": metrics["cumulative_net_income_usd_m"],
                "ni_delta_usd_m": round(ni_delta, 2),
                "terminal_market_cap_usd_bn": metrics["terminal_market_cap_usd_bn"],
                "mcap_delta_usd_bn": round(mcap_delta, 2),
                "lowest_altman_z": metrics["lowest_altman_z"],
                "distress_status": metrics["distress_status"],
                "min_cash_runway_months": "Sustained" if min_runway > 100 else f"{round(min_runway, 1)} mo"
            })

        return results

    def compute_marginal_impact(self, current_config: SimulationScenarioConfig, toggle_name: str) -> Dict[str, Any]:
        """
        Calculates the marginal derivative (impact) of flipping a single toggle
        given the current active combination of scenarios.
        """
        config_off = copy.deepcopy(current_config)
        config_on = copy.deepcopy(current_config)
        
        setattr(config_off, toggle_name, False)
        setattr(config_on, toggle_name, True)

        res_off = self.simulator.run_simulation(config_off)
        res_on = self.simulator.run_simulation(config_on)

        m_off = res_off.summary_metrics
        m_on = res_on.summary_metrics

        return {
            "toggle": toggle_name,
            "delta_revenue_usd_m": round(m_on["cumulative_revenue_usd_m"] - m_off["cumulative_revenue_usd_m"], 2),
            "delta_net_income_usd_m": round(m_on["cumulative_net_income_usd_m"] - m_off["cumulative_net_income_usd_m"], 2),
            "delta_terminal_mcap_usd_bn": round(m_on["terminal_market_cap_usd_bn"] - m_off["terminal_market_cap_usd_bn"], 2),
            "delta_altman_z": round(m_on["lowest_altman_z"] - m_off["lowest_altman_z"], 2)
        }
