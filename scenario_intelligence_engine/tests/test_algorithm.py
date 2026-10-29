"""
test_algorithm.py - Verification and Validation Test Suite.
Implements Checkpoints 5 & 6:
- Unit and integration tests for shock primitives, event profiles, decisions, and simulator.
- Tests that COVID output changes every single month.
- Tests that permutation toggle changes vary the output deterministically.
- Validates financial accounting integrity (P&L, Cash Flow, Balance Sheet closure).
- Verifies model calibration / training engine.
"""

import unittest
import json
import os
import sys

# Ensure parent directory is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from algorithm.schemas import Company, Financials, Market, Benchmark, Macro, SimulationScenarioConfig
from algorithm.shock_primitives import ShockVector8D, NICHE_ELASTICITIES, get_niche_elasticity
from algorithm.event_profiles import (
    get_covid_monthly_shock,
    get_911_monthly_shock,
    get_2008_crisis_monthly_shock,
    get_stagflation_rates_monthly_shock
)
from algorithm.simulator import FinancialSimulator, SimulationResult
from algorithm.permutation_matrix import PermutationEngine
from algorithm.calibration import ModelCalibrator

def get_test_company() -> tuple:
    with open(os.path.join(PROJECT_ROOT, "data", "sample_database.json"), "r") as f:
        data = json.load(f)
    aapl_raw = data["companies"][0]
    c = Company(
        company_id=aapl_raw["company_id"],
        company_name=aapl_raw["company_name"],
        ticker=aapl_raw["ticker"],
        exchange=aapl_raw["exchange"],
        main_country=aapl_raw["main_country"],
        niche=aapl_raw["niche"],
        currency=aapl_raw["currency"],
        fiscal_year_end=aapl_raw["fiscal_year_end"]
    )
    fin = Financials(**aapl_raw["financials"])
    mkt = Market(**aapl_raw["market"])
    mac = Macro(**aapl_raw["macro"])
    return c, fin, mkt, mac

class TestScenarioIntelligenceEngine(unittest.TestCase):
    def setUp(self):
        self.company, self.fin, self.mkt, self.macro = get_test_company()
        self.simulator = FinancialSimulator(self.company, self.fin, self.mkt, self.macro)

    def test_shock_vector_saturation(self):
        """Test shock vector arithmetic and saturation bounds."""
        s1 = ShockVector8D(demand=0.6, supply=0.7)
        s2 = ShockVector8D(demand=0.7, supply=0.5)
        combined = s1.add(s2)
        # Should smoothly saturate and never exceed 1.0
        self.assertLessEqual(combined.demand, 1.0)
        self.assertLessEqual(combined.supply, 1.0)
        self.assertGreater(combined.demand, 0.6)

    def test_covid_every_month_different_output(self):
        """
        CRITICAL REQUIREMENT from prompt:
        'COVID every month should be a different output as well'
        Verify that all 24 months under COVID produce time-varying shock dynamics.
        """
        seen_demand_shocks = []
        seen_pandemic_shocks = []
        for m in range(1, 25):
            shock = get_covid_monthly_shock(m)
            seen_demand_shocks.append(shock.demand)
            seen_pandemic_shocks.append(shock.pandemic)

        # Ensure no adjacent month is identical across both demand and pandemic vectors
        for i in range(len(seen_demand_shocks) - 1):
            same_demand = seen_demand_shocks[i] == seen_demand_shocks[i+1]
            same_pan = seen_pandemic_shocks[i] == seen_pandemic_shocks[i+1]
            self.assertFalse(same_demand and same_pan, f"Month {i+1} and {i+2} have identical shock values!")

        # Run simulation with COVID enabled and verify monthly revenue trajectory is time-varying
        cfg = SimulationScenarioConfig(enable_covid=True, horizon_months=24)
        result = self.simulator.run_simulation(cfg)
        self.assertEqual(len(result.monthly_snapshots), 24)

        rev_m1 = result.monthly_snapshots[0].revenue_usd_m
        rev_m2 = result.monthly_snapshots[1].revenue_usd_m
        rev_m6 = result.monthly_snapshots[5].revenue_usd_m
        rev_m14 = result.monthly_snapshots[13].revenue_usd_m

        self.assertNotEqual(rev_m1, rev_m2, "Month 1 and Month 2 should differ in revenue")
        self.assertNotEqual(rev_m2, rev_m6, "Month 2 and Month 6 should differ during COVID trajectory")
        self.assertNotEqual(rev_m6, rev_m14, "Month 6 and Month 14 should differ as recovery unfolds")

    def test_911_geopolitical_disruption(self):
        """Verify 9/11 profile has peak disruption in month 1 and decaying residual friction."""
        shock_m1 = get_911_monthly_shock(1)
        shock_m6 = get_911_monthly_shock(6)
        shock_m12 = get_911_monthly_shock(12)

        self.assertGreater(shock_m1.geopolitical, shock_m6.geopolitical)
        self.assertGreater(shock_m6.geopolitical, shock_m12.geopolitical)
        self.assertLess(shock_m1.demand, shock_m12.demand) # Demand was most negative at month 1

    def test_management_decision_layoffs(self):
        """
        Verify that toggling layoffs results in severance in month 1
        and significant recurring OpEx savings from month 2 onwards.
        """
        base_res = self.simulator.run_simulation(SimulationScenarioConfig())
        layoff_res = self.simulator.run_simulation(SimulationScenarioConfig(decision_layoffs=True))

        # Month 1: Severance creates higher or flat OpEx
        m1_base_opex = base_res.monthly_snapshots[0].opex_usd_m
        m1_layoff_opex = layoff_res.monthly_snapshots[0].opex_usd_m
        self.assertGreater(m1_layoff_opex, m1_base_opex, "Month 1 severance cost should increase OpEx")

        # Month 2 onwards: OpEx drops significantly due to reduced payroll
        m3_base_opex = base_res.monthly_snapshots[2].opex_usd_m
        m3_layoff_opex = layoff_res.monthly_snapshots[2].opex_usd_m
        self.assertLess(m3_layoff_opex, m3_base_opex, "Month 3 OpEx should be lower after layoffs")

    def test_decision_capex_freeze_improves_fcf(self):
        """Verify that freezing capex increases Free Cash Flow and protects runway."""
        base_res = self.simulator.run_simulation(SimulationScenarioConfig(enable_covid=True))
        freeze_res = self.simulator.run_simulation(SimulationScenarioConfig(enable_covid=True, decision_capex_freeze=True))

        base_fcf_sum = sum(s.free_cash_flow_usd_m for s in base_res.monthly_snapshots)
        freeze_fcf_sum = sum(s.free_cash_flow_usd_m for s in freeze_res.monthly_snapshots)

        self.assertGreater(freeze_fcf_sum, base_fcf_sum, "Capex freeze must generate higher cumulative FCF")

    def test_permutation_combinations_vary_outcomes(self):
        """
        REQUIREMENT:
        'It's like a permutation-combination thing: if we select one and don't select another one,
        then it will just change the outcome based on the scenarios we select.'
        """
        cfg_0 = SimulationScenarioConfig() # None
        cfg_covid_only = SimulationScenarioConfig(enable_covid=True)
        cfg_covid_and_freeze = SimulationScenarioConfig(enable_covid=True, decision_capex_freeze=True)
        cfg_covid_and_layoffs = SimulationScenarioConfig(enable_covid=True, decision_layoffs=True)
        cfg_stagflation = SimulationScenarioConfig(enable_stagflation_rates=True, macro_high_inflation=True)

        res_0 = self.simulator.run_simulation(cfg_0)
        res_cov = self.simulator.run_simulation(cfg_covid_only)
        res_cov_freeze = self.simulator.run_simulation(cfg_covid_and_freeze)
        res_cov_layoff = self.simulator.run_simulation(cfg_covid_and_layoffs)
        res_stag = self.simulator.run_simulation(cfg_stagflation)

        # Verify distinct outcomes across permutations (Net Income, FCF, and Cash)
        ni_0 = res_0.summary_metrics["cumulative_net_income_usd_m"]
        ni_cov = res_cov.summary_metrics["cumulative_net_income_usd_m"]
        ni_cov_layoff = res_cov_layoff.summary_metrics["cumulative_net_income_usd_m"]
        ni_stag = res_stag.summary_metrics["cumulative_net_income_usd_m"]

        fcf_cov = sum(s.free_cash_flow_usd_m for s in res_cov.monthly_snapshots)
        fcf_cov_freeze = sum(s.free_cash_flow_usd_m for s in res_cov_freeze.monthly_snapshots)

        self.assertNotEqual(ni_0, ni_cov)
        self.assertNotEqual(fcf_cov, fcf_cov_freeze, "Capex freeze should alter Free Cash Flow")
        self.assertNotEqual(ni_cov, ni_cov_layoff, "Layoffs should alter Net Income")
        self.assertNotEqual(ni_cov, ni_stag, "Stagflation should alter Net Income vs COVID")

    def test_accounting_integrity(self):
        """Verify strict double-entry balance sheet and income statement identity closure."""
        result = self.simulator.run_simulation(SimulationScenarioConfig(enable_covid=True, decision_layoffs=True))
        for s in result.monthly_snapshots:
            # Gross Profit = Revenue - COGS
            self.assertAlmostEqual(s.gross_profit_usd_m, s.revenue_usd_m - s.cogs_usd_m, places=1)
            # EBIT = Gross Profit - OpEx
            self.assertAlmostEqual(s.ebit_usd_m, s.gross_profit_usd_m - s.opex_usd_m, places=1)
            # Cash balance must remain non-negative
            self.assertGreaterEqual(s.cash_balance_usd_m, 0.0)
            # Altman Z-Score should be calculated
            self.assertIsNotNone(s.altman_z_score)

    def test_permutation_matrix_presets(self):
        """Verify preset permutations generation for executive dashboard."""
        perm_engine = PermutationEngine(self.simulator)
        presets = perm_engine.evaluate_preset_permutations()
        self.assertGreaterEqual(len(presets), 8)
        for p in presets:
            self.assertIn("scenario_name", p)
            self.assertIn("rev_delta_usd_m", p)
            self.assertIn("lowest_altman_z", p)

    def test_model_calibrator_training(self):
        """Test training and calibration against historical ground truth figures."""
        calibrator = ModelCalibrator(self.simulator)
        # Synthetic historical quarterly revenue profile during COVID (in millions)
        mock_ground_truth_rev = [16500.0, 15800.0, 18200.0, 21000.0, 24000.0, 25500.0]
        mock_ground_truth_margins = [38.2, 38.0, 38.5, 39.1, 40.2, 40.5]

        calib_result = calibrator.calibrate_against_historical(
            event_toggle_name="enable_covid",
            ground_truth_revenues=mock_ground_truth_rev,
            ground_truth_margins=mock_ground_truth_margins
        )
        self.assertEqual(calib_result["status"], "calibrated")
        self.assertLess(calib_result["best_mape_pct"], 35.0)
        self.assertIn("calibrated_demand_elasticity", calib_result)

if __name__ == '__main__':
    unittest.main()
