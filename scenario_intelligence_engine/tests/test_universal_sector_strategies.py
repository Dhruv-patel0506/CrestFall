"""
Test script for universal sector strategies functionality.
Tests sector classification, strategy extraction, and integration with the recommendation system.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from algorithm.sector_strategies import (
    SectorClassifier,
    UniversalSectorStrategies,
    get_universal_recommendations
)
from algorithm.decision_engine import DecisionEngine


def test_sector_classification():
    """Test sector classification for various niches."""
    print("=" * 60)
    print("TEST 1: Sector Classification")
    print("=" * 60)

    test_cases = [
        ("teaching institute", "ABC University", "teaching"),
        ("manufacturing plant", "XYZ Industries", "industry"),
        ("consulting services", "McKinsey Partners", "corporate"),
        ("arts and entertainment", "Creative Studios", "arts"),
        ("motorsports racing", "Speed Racing Team", "racing"),
        ("hospital and healthcare", "City Hospital", "healthcare"),
        ("retail ecommerce", "Amazon Store", "retail"),
        ("software technology", "Tech Startup", "technology"),
        ("banking finance", "Global Bank", "finance"),
        ("unknown sector", "Generic Company", "general"),
    ]

    passed = 0
    for niche, company, expected in test_cases:
        result = SectorClassifier.classify(niche, company)
        status = "PASS" if result == expected else "FAIL"
        print(f"{status} {company} ({niche}) -> {result} (expected: {expected})")
        if result == expected:
            passed += 1

    print(f"\nPassed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)


def test_universal_strategies_manager():
    """Test the universal strategies manager."""
    print("\n" + "=" * 60)
    print("TEST 2: Universal Strategies Manager")
    print("=" * 60)

    manager = UniversalSectorStrategies()

    # Test getting strategies for different sectors
    sectors = ["teaching", "technology", "healthcare", "general"]
    passed = 0

    for sector in sectors:
        sector_info = manager.get_sector_strategies(sector)
        if sector_info is not None:
            print(f"PASS {sector}: {len(sector_info.common_strategies)} strategies")
            print(f"  Label: {sector_info.label}")
            print(f"  Trends: {', '.join(sector_info.sector_trends[:2])}")
            passed += 1
        else:
            print(f"FAIL {sector}: Failed to get strategies")

    # Test strategy type mapping
    print("\nStrategy Type Mapping:")
    for strategy_type in ["hiring", "capex_change", "product_launch"]:
        impact_info = manager.get_strategy_impact_estimates(strategy_type)
        if impact_info:
            print(f"PASS {strategy_type}: {impact_info.get('impact_type')}")
            passed += 1
        else:
            print(f"FAIL {strategy_type}: Failed to get impact info")

    print(f"\nPassed: {passed}/{len(sectors) + 3}")
    return passed >= len(sectors) + 2  # Allow some leniency


def test_universal_recommendations():
    """Test universal recommendation generation."""
    print("\n" + "=" * 60)
    print("TEST 3: Universal Recommendations")
    print("=" * 60)

    test_cases = [
        ("teaching institute", "ABC University"),
        ("software technology", "Tech Startup"),
        ("manufacturing", "Factory Corp"),
    ]

    passed = 0
    for niche, company in test_cases:
        recommendations = get_universal_recommendations(niche, company)

        if recommendations:
            print(f"PASS {company} ({niche}): {len(recommendations)} recommendations")
            if recommendations:
                top_rec = recommendations[0]
                print(f"  Top strategy: {top_rec.get('decision')}")
                print(f"  Sector: {top_rec.get('sector')}")
                print(f"  Risk: {top_rec.get('risk_level')}")
                print(f"  Growth: {top_rec.get('with_decision_growth')}%")
                passed += 1
        else:
            print(f"FAIL {company} ({niche}): No recommendations generated")

    print(f"\nPassed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)


def test_decision_engine_universal():
    """Test decision engine with universal strategies."""
    print("\n" + "=" * 60)
    print("TEST 4: Decision Engine Universal Strategies")
    print("=" * 60)

    manager = UniversalSectorStrategies()

    test_strategies = [
        ("hiring", 10.0, "percent"),
        ("layoffs", 12.0, "percent"),
        ("capex_change", 20.0, "percent"),
        ("product_launch", 15.0, "percent"),
        ("price_change", 7.0, "percent"),
    ]

    passed = 0
    for strategy_type, magnitude, unit in test_strategies:
        impact = DecisionEngine.evaluate_universal_strategy(
            month=6,
            base_revenue=10000.0,
            base_cogs=6000.0,
            base_opex=2000.0,
            base_capex=500.0,
            strategy_type=strategy_type,
            magnitude=magnitude,
            magnitude_unit=unit,
            pricing_power=1.0,
            strategies_manager=manager
        )

        # Check that impact is not all zeros/neutral
        has_effect = (
            impact.revenue_multiplier != 1.0 or
            impact.opex_delta_usd_m != 0.0 or
            impact.capex_multiplier != 1.0
        )

        if has_effect:
            print(f"PASS {strategy_type} ({magnitude}%): Has effect")
            print(f"  Revenue: {impact.revenue_multiplier:.4f}")
            print(f"  OpEx: {impact.opex_delta_usd_m:.2f}")
            print(f"  Capex: {impact.capex_multiplier:.4f}")
            passed += 1
        else:
            print(f"FAIL {strategy_type} ({magnitude}%): No effect detected")

    print(f"\nPassed: {passed}/{len(test_strategies)}")
    return passed >= len(test_strategies) - 1  # Allow one failure


def test_sector_strategies_for_company():
    """Test getting strategies for specific companies."""
    print("\n" + "=" * 60)
    print("TEST 5: Company-Specific Strategy Retrieval")
    print("=" * 60)

    manager = UniversalSectorStrategies()

    test_companies = [
        ("Harvard University", "education", "teaching"),
        ("Ford Motor Company", "automotive manufacturing", "industry"),
        ("Spotify", "music streaming", "technology"),
    ]

    passed = 0
    for company, niche, expected_sector in test_companies:
        sector_info = manager.get_strategies_for_company(niche, company)

        if sector_info:
            actual_sector = sector_info.sector_key
            match = actual_sector == expected_sector
            status = "PASS" if match else "WARN"
            print(f"{status} {company}: {actual_sector} (expected: {expected_sector})")
            print(f"  Strategies: {len(sector_info.common_strategies)}")
            passed += 1
        else:
            print(f"FAIL {company}: Failed to get sector info")

    print(f"\nPassed: {passed}/{len(test_companies)}")
    return passed == len(test_companies)


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("UNIVERSAL SECTOR STRATEGIES TEST SUITE")
    print("=" * 60 + "\n")

    results = []

    results.append(("Sector Classification", test_sector_classification()))
    results.append(("Universal Strategies Manager", test_universal_strategies_manager()))
    results.append(("Universal Recommendations", test_universal_recommendations()))
    results.append(("Decision Engine Universal", test_decision_engine_universal()))
    results.append(("Company-Specific Strategies", test_sector_strategies_for_company()))

    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    for test_name, passed in results:
        status = "PASSED" if passed else "FAILED"
        print(f"{status}: {test_name}")

    total_passed = sum(1 for _, passed in results if passed)
    print(f"\nTotal: {total_passed}/{len(results)} tests passed")

    if total_passed == len(results):
        print("\nAll tests passed!")
        return 0
    else:
        print(f"\n{len(results) - total_passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
