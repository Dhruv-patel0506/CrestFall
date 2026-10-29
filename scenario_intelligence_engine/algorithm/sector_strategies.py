"""
sector_strategies.py - Universal sector strategy extraction and classification.

This module provides:
1. Sector classification for companies based on niche/industry descriptions
2. Extraction of strategic patterns from datasets
3. Universal sector strategies when peer-specific data is unavailable
4. General strategy recommendations across diverse sectors
"""

import json
import os
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import re

@dataclass
class SectorStrategy:
    """Represents a universal strategy for a specific sector."""
    strategy_name: str
    type: str
    description: str
    typical_magnitude_range: Tuple[float, float]
    magnitude_unit: str
    expected_revenue_impact_months: Tuple[int, int]
    risk_level: str
    implementation_timeframe: str
    key_success_factors: List[str]

@dataclass
class SectorInfo:
    """Information about a sector."""
    sector_key: str
    label: str
    description: str
    common_strategies: List[SectorStrategy]
    sector_trends: List[str]
    competitive_factors: List[str]

class SectorClassifier:
    """Classifies companies into sectors based on their descriptions."""

    SECTOR_KEYWORDS = {
        "teaching": ["education", "school", "university", "college", "teaching", "training", "academic", "learning", "institute", "course", "curriculum"],
        "industry": ["manufacturing", "production", "factory", "industrial", "plant", "assembly", "fabrication", "machinery", "automation"],
        "corporate": ["consulting", "services", "professional", "b2b", "enterprise", "corporate", "business services", "advisory"],
        "arts": ["arts", "entertainment", "creative", "media", "music", "film", "theater", "museum", "gallery", "cultural"],
        "racing": ["racing", "motorsport", "automotive racing", "formula", "nascar", "motorcycle", "speed", "competition"],
        "healthcare": ["healthcare", "medical", "hospital", "clinic", "pharmaceutical", "biotech", "health", "medicine", "doctor"],
        "retail": ["retail", "ecommerce", "e-commerce", "store", "shop", "consumer", "shopping", "merchandise", "fashion"],
        "technology": ["technology", "software", "tech", "startup", "platform", "saas", "cloud", "computing", "digital", "ai", "ml"],
        "finance": ["finance", "banking", "investment", "insurance", "financial", "fintech", "asset", "wealth", "capital"]
    }

    @classmethod
    def classify(cls, niche: str, company_name: str = "") -> str:
        """
        Classify a company into a sector based on its niche/industry description.

        Args:
            niche: The company's niche or industry description
            company_name: Optional company name for additional context

        Returns:
            Sector key (e.g., 'teaching', 'industry', 'technology')
        """
        if not niche:
            return "general"

        text = f"{niche} {company_name}".lower()
        scores = {}

        for sector, keywords in cls.SECTOR_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                scores[sector] = score

        if not scores:
            return "general"

        # Return the sector with the highest keyword match
        return max(scores, key=scores.get)

class UniversalSectorStrategies:
    """Manages universal sector strategies."""

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the universal sector strategies manager.

        Args:
            config_path: Path to the universal sector strategies JSON file.
                        If None, uses default path.
        """
        if config_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(current_dir, "..", "data", "universal_sector_strategies.json")

        self.config_path = config_path
        self.strategies: Dict[str, SectorInfo] = {}
        self.strategy_type_mapping: Dict[str, Dict[str, Any]] = {}
        self._load_strategies()

    def _load_strategies(self):
        """Load strategies from the configuration file."""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            for sector_key, sector_data in data.get("sectors", {}).items():
                strategies = [
                    SectorStrategy(
                        strategy_name=s["strategy_name"],
                        type=s["type"],
                        description=s["description"],
                        typical_magnitude_range=tuple(s["typical_magnitude_range"]),
                        magnitude_unit=s["magnitude_unit"],
                        expected_revenue_impact_months=tuple(s["expected_revenue_impact_months"]),
                        risk_level=s["risk_level"],
                        implementation_timeframe=s["implementation_timeframe"],
                        key_success_factors=s["key_success_factors"]
                    )
                    for s in sector_data.get("common_strategies", [])
                ]

                self.strategies[sector_key] = SectorInfo(
                    sector_key=sector_key,
                    label=sector_data.get("label", sector_key),
                    description=sector_data.get("description", ""),
                    common_strategies=strategies,
                    sector_trends=sector_data.get("sector_trends", []),
                    competitive_factors=sector_data.get("competitive_factors", [])
                )

            self.strategy_type_mapping = data.get("strategy_type_mapping", {})

        except (FileNotFoundError, json.JSONDecodeError, KeyError) as e:
            print(f"Warning: Could not load universal sector strategies: {e}")
            # Initialize with empty general sector as fallback
            self.strategies["general"] = SectorInfo(
                sector_key="general",
                label="General",
                description="Default strategies for uncategorized sectors",
                common_strategies=[],
                sector_trends=[],
                competitive_factors=[]
            )

    def get_sector_strategies(self, sector_key: str) -> Optional[SectorInfo]:
        """
        Get strategies for a specific sector.

        Args:
            sector_key: The sector key (e.g., 'teaching', 'technology')

        Returns:
            SectorInfo object with strategies, or None if sector not found
        """
        return self.strategies.get(sector_key, self.strategies.get("general"))

    def get_strategies_for_company(self, niche: str, company_name: str = "") -> SectorInfo:
        """
        Get appropriate strategies for a company based on its sector classification.

        Args:
            niche: The company's niche or industry description
            company_name: Optional company name for additional context

        Returns:
            SectorInfo object with strategies for the company's sector
        """
        sector_key = SectorClassifier.classify(niche, company_name)
        return self.get_sector_strategies(sector_key)

    def get_strategy_impact_estimates(self, strategy_type: str) -> Dict[str, Any]:
        """
        Get impact estimates for a specific strategy type.

        Args:
            strategy_type: The type of strategy (e.g., 'hiring', 'capex_change')

        Returns:
            Dictionary with impact type, ranges, and description
        """
        return self.strategy_type_mapping.get(strategy_type, {
            "impact_type": "unknown",
            "typical_impact_range": [0.0, 0.0],
            "revenue_multiplier_range": [1.0, 1.0],
            "description": "Unknown strategy type"
        })

    def extract_strategies_from_dataset(
        self,
        decision_records: List[Dict[str, Any]],
        company_context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Extract strategic patterns from dataset decision records.

        Args:
            decision_records: List of decision records from the dataset
            company_context: Context about the company (niche, sector, etc.)

        Returns:
            List of extracted strategy patterns with performance data
        """
        if not decision_records:
            return []

        # Group decisions by type
        decisions_by_type: Dict[str, List[Dict[str, Any]]] = {}
        for decision in decision_records:
            decision_type = decision.get("type", "unknown")
            decisions_by_type.setdefault(decision_type, []).append(decision)

        # Extract patterns for each decision type
        patterns = []
        for decision_type, decisions in decisions_by_type.items():
            if len(decisions) < 2:
                continue  # Need at least 2 instances to establish a pattern

            # Calculate average outcomes
            outcomes = [d.get("followup_return_pct") for d in decisions if d.get("followup_return_pct") is not None]
            if not outcomes:
                continue

            avg_outcome = sum(outcomes) / len(outcomes)
            typical_magnitude = self._estimate_typical_magnitude(decisions)

            patterns.append({
                "strategy_type": decision_type,
                "observations": len(decisions),
                "companies": list(set(d.get("company_id") for d in decisions)),
                "average_outcome_pct": round(avg_outcome, 2),
                "typical_magnitude": typical_magnitude,
                "description": self._generate_description(decision_type, decisions),
                "risk_level": self._assess_risk_level(decision_type, outcomes),
                "source": "dataset_analysis"
            })

        return patterns

    def _estimate_typical_magnitude(self, decisions: List[Dict[str, Any]]) -> float:
        """Estimate typical magnitude from decision records."""
        magnitudes = []
        for decision in decisions:
            # Try to extract magnitude from description or decision record
            desc = decision.get("description", "").lower()
            # Look for percentage patterns
            matches = re.findall(r'(\d+\.?\d*)\s*%', desc)
            if matches:
                magnitudes.extend(float(m) for m in matches)

        if magnitudes:
            return sum(magnitudes) / len(magnitudes)
        return 10.0  # Default fallback

    def _generate_description(self, decision_type: str, decisions: List[Dict[str, Any]]) -> str:
        """Generate a description for a strategy pattern."""
        # Use the most recent description as a template
        if decisions:
            return decisions[-1].get("description", f"{decision_type} strategy")
        return f"{decision_type} strategy"

    def _assess_risk_level(self, decision_type: str, outcomes: List[float]) -> str:
        """Assess risk level based on outcome variability."""
        if len(outcomes) < 2:
            return "medium"

        import statistics
        try:
            std_dev = statistics.stdev(outcomes)
            mean = statistics.mean(outcomes)

            # Coefficient of variation
            cv = std_dev / abs(mean) if mean != 0 else float('inf')

            if cv < 0.5:
                return "low"
            elif cv < 1.0:
                return "medium"
            else:
                return "high"
        except:
            return "medium"

def get_universal_recommendations(
    niche: str,
    company_name: str = "",
    strategies_manager: Optional[UniversalSectorStrategies] = None
) -> List[Dict[str, Any]]:
    """
    Get universal strategy recommendations for a company.

    Args:
        niche: The company's niche or industry description
        company_name: Optional company name for additional context
        strategies_manager: Optional strategies manager instance

    Returns:
        List of strategy recommendations with universal sector-based estimates
    """
    if strategies_manager is None:
        strategies_manager = UniversalSectorStrategies()

    sector_info = strategies_manager.get_strategies_for_company(niche, company_name)

    recommendations = []
    for strategy in sector_info.common_strategies:
        impact_info = strategies_manager.get_strategy_impact_estimates(strategy.type)

        # Calculate typical impact
        mid_magnitude = sum(strategy.typical_magnitude_range) / 2
        revenue_impact = sum(impact_info.get("revenue_multiplier_range", [1.0, 1.0])) / 2

        recommendations.append({
            "decision": f"Universal strategy: {strategy.strategy_name}",
            "tier": "Universal sector pattern",
            "tier_color": "#6B7280",
            "icon": "universal-strategy",
            "strategy_type": strategy.type,
            "description": strategy.description,
            "risk_level": strategy.risk_level,
            "implementation_timeframe": strategy.implementation_timeframe,
            "key_success_factors": strategy.key_success_factors,
            "typical_magnitude": mid_magnitude,
            "magnitude_unit": strategy.magnitude_unit,
            "expected_revenue_impact_months": strategy.expected_revenue_impact_months,
            "estimated_growth_range": f"{(revenue_impact - 1) * 100:.1f}% to {(revenue_impact - 1) * 100 * 1.5:.1f}%",
            "with_decision_growth": round((revenue_impact - 1) * 100, 2),
            "matched_cases_count": 0,
            "evidence_list": [],
            "sector": sector_info.label,
            "sector_trends": sector_info.sector_trends,
            "competitive_factors": sector_info.competitive_factors,
            "implementation": f"Consider this {sector_info.label.lower()} sector strategy. Adapt the magnitude and timing to your specific context.",
            "implementation_steps": [
                f"Assess alignment with {sector_info.label.lower()} sector trends: {', '.join(sector_info.sector_trends[:3])}",
                f"Evaluate key success factors: {', '.join(strategy.key_success_factors[:3])}",
                "Model the proposed action against baseline forecast",
                "Set clear KPIs and review milestones"
            ],
            "confidence_interval_95_pct": None,
            "evidence_scope": "universal sector patterns",
            "source": "universal_sector_strategies"
        })

    # Sort by estimated growth
    recommendations.sort(key=lambda x: x.get("with_decision_growth", 0), reverse=True)

    return recommendations
