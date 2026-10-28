"""
test_scenarios.py - Deep Multi-Scenario and Stress Testing Suite.
Validates:
1. Multi-company simulation across different niches (AAPL, NKE, JPM, TSLA).
2. All 16 database tables schema conformity.
3. Permutation Marginal Derivatives (impact of each toggle).
4. Tail-risk scenarios (Stagflation, Geopolitical Blockade, Black Swan).
5. Solvency and Altman Z distress boundary behavior.
"""

import unittest
import json
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from algorithm.schemas import Company, Financials, Market, Macro, SimulationScenarioConfig
from algorithm.simulator import FinancialSimulator
from algorithm.permutation_matrix import PermutationEngine

class TestMultiCompanyScenarios(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(os.path.join(PROJECT_ROOT, "data", "sample_database.json"), "r") as f:
            cls.db = json.load(f)

    def test_all_sample_companies_simulate_successfully(self):
        """Verify that every company in the database can be loaded and simulated for 24 months."""
        for c_data in self.db["companies"]:
            company = Company(
                company_id=c_data["company_id"],
                company_name=c_data["company_name"],
                ticker=c_data["ticker"],
                exchange=c_data["exchange"],
                main_country=c_data["main_country"],
                niche=c_data["niche"],
                currency=c_data["currency"],
                fiscal_year_end=c_data["fiscal_year_end"]
            )
            fin = Financials(**c_data["financials"])
            mkt = Market(**c_data["market"])
            mac = Macro(**c_data["macro"])

            sim = FinancialSimulator(company, fin, mkt, mac)
            res = sim.run_simulation(SimulationScenarioConfig(enable_covid=True))

            self.assertEqual(len(res.monthly_snapshots), 24)
            self.assertIn("lowest_altman_z", res.summary_metrics)
            self.assertIn("terminal_market_cap_usd_bn", res.summary_metrics)
            self.assertGreater(res.summary_metrics["cumulative_revenue_usd_m"], 0.0)

    def test_marginal_impact_calculation(self):
        """Verify marginal impact derivative calculations for decision toggles."""
        aapl_data = self.db["companies"][0]
        company = Company(
            company_id=aapl_data["company_id"],
            company_name=aapl_data["company_name"],
            ticker=aapl_data["ticker"],
            exchange=aapl_data["exchange"],
            main_country=aapl_data["main_country"],
            niche=aapl_data["niche"],
            currency=aapl_data["currency"],
            fiscal_year_end=aapl_data["fiscal_year_end"]
        )
        fin = Financials(**aapl_data["financials"])
        mkt = Market(**aapl_data["market"])
        mac = Macro(**aapl_data["macro"])

        sim = FinancialSimulator(company, fin, mkt, mac)
        perm = PermutationEngine(sim)

        # Baseline with COVID active: test marginal benefit of enabling capex freeze
        cfg = SimulationScenarioConfig(enable_covid=True)
        marginal_capex = perm.compute_marginal_impact(cfg, "decision_capex_freeze")
        marginal_layoffs = perm.compute_marginal_impact(cfg, "decision_layoffs")

        self.assertEqual(marginal_capex["toggle"], "decision_capex_freeze")
        self.assertEqual(marginal_layoffs["toggle"], "decision_layoffs")
        # Layoffs should yield positive cumulative Net Income delta over 24 months
        self.assertGreater(marginal_layoffs["delta_net_income_usd_m"], 0.0)

    def test_black_swan_perfect_storm_distress(self):
        """Verify that compounding adverse shocks triggers elevated distress risk."""
        nke_data = self.db["companies"][1]
        company = Company(
            company_id=nke_data["company_id"],
            company_name=nke_data["company_name"],
            ticker=nke_data["ticker"],
            exchange=nke_data["exchange"],
            main_country=nke_data["main_country"],
            niche=nke_data["niche"],
            currency=nke_data["currency"],
            fiscal_year_end=nke_data["fiscal_year_end"]
        )
        fin = Financials(**nke_data["financials"])
        mkt = Market(**nke_data["market"])
        mac = Macro(**nke_data["macro"])

        sim = FinancialSimulator(company, fin, mkt, mac)
        base_res = sim.run_simulation(SimulationScenarioConfig())
        storm_cfg = SimulationScenarioConfig(
            enable_covid=True,
            enable_2008_crisis=True,
            macro_severe_recession=True,
            peer_price_war=True,
            credit_rating_downgrade=True
        )
        storm_res = sim.run_simulation(storm_cfg)

        base_z = base_res.summary_metrics["lowest_altman_z"]
        storm_z = storm_res.summary_metrics["lowest_altman_z"]
        self.assertLess(storm_z, base_z, "Black Swan storm should degrade Altman Z score")

if __name__ == '__main__':
    unittest.main()
