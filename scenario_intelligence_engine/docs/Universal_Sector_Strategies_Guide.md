# Universal Sector Strategies Implementation Guide

## Overview

This document describes the universal sector strategies feature that enables the system to provide strategic recommendations for companies that don't have specific peer competitors in the dataset. The system now uses general sector-wide patterns and strategies instead of relying solely on peer-specific data.

## Problem Statement

Out of 50 datasets, not all companies have identifiable peer competitors. For example:
- An institute providing a unique dataset may have no direct competitors
- Companies in niche sectors may lack peer data
- Institutes or organizations with specialized focus may not have comparable peers

Previously, the system would either:
1. Fail to provide recommendations when no peers were found
2. Provide incomplete analysis

## Solution

The universal sector strategies system provides:

1. **Sector Classification**: Automatically classifies companies into sectors (teaching, industry, corporate, arts, racing, healthcare, retail, technology, finance, etc.)

2. **Universal Sector Strategies**: Pre-defined strategic patterns for each sector based on general industry knowledge and best practices

3. **Strategy Extraction**: Ability to extract strategic patterns from datasets when available

4. **Fallback Mechanism**: When peer-specific data is unavailable, the system uses universal sector strategies as a fallback

5. **General Approach**: Strategies are presented as general sector patterns rather than specific competitor names, avoiding the need to identify individual peer companies

## Architecture

### New Files

1. **`data/universal_sector_strategies.json`**
   - Configuration file containing sector definitions and strategies
   - Includes 10 sectors: teaching, industry, corporate, arts, racing, healthcare, retail, technology, finance, and general
   - Each sector has:
     - Common strategies with typical magnitude ranges
     - Sector trends
     - Competitive factors
     - Risk levels and implementation timeframes

2. **`algorithm/sector_strategies.py`**
   - Core module for universal sector strategies
   - Classes:
     - `SectorClassifier`: Classifies companies into sectors based on niche/industry descriptions
     - `UniversalSectorStrategies`: Manages universal sector strategies and provides strategy recommendations
     - `SectorStrategy` and `SectorInfo`: Data classes for strategy information
   - Functions:
     - `get_universal_recommendations()`: Generates universal strategy recommendations for a company

3. **`tests/test_universal_sector_strategies.py`**
   - Comprehensive test suite for the universal sector strategies system
   - Tests sector classification, strategy retrieval, and integration

### Modified Files

1. **`algorithm/decision_engine.py`**
   - Added `evaluate_universal_strategy()` method
   - Evaluates universal sector strategies when peer data is unavailable
   - Supports all strategy types: hiring, layoffs, capex_change, acquisition, product_launch, price_change, cost_cut, buyback

2. **`main.py`**
   - Updated `/api/company/{company_id}/recommendations` endpoint
   - Now integrates universal sector strategies when company-specific or peer evidence is insufficient
   - Updated `/api/company/{company_id}/strengths` endpoint
   - Uses sector context when no peers are available
   - Added evidence status indicators:
     - `universal_sector_strategies`: Only universal strategies available
     - `mixed_evidence_and_universal`: Mix of specific and universal evidence

## How It Works

### 1. Sector Classification

When a company is analyzed, the system:
1. Examines the company's niche/industry description
2. Uses keyword matching to classify into a sector
3. Falls back to "general" sector if no match is found

Example:
```python
from algorithm.sector_strategies import SectorClassifier

sector = SectorClassifier.classify("teaching institute", "ABC University")
# Returns: "teaching"

sector = SectorClassifier.classify("software technology", "Tech Startup")
# Returns: "technology"
```

### 2. Universal Strategy Recommendations

When peer data is unavailable:
1. System retrieves universal strategies for the company's sector
2. Strategies are ranked by estimated growth impact
3. Each strategy includes:
   - Description and risk level
   - Implementation timeframe
   - Key success factors
   - Sector trends and competitive factors
   - Typical magnitude ranges

Example response:
```json
{
  "decision": "Universal strategy: partnership_expansion",
  "tier": "Universal sector pattern",
  "tier_color": "#6B7280",
  "icon": "universal-strategy",
  "strategy_type": "acquisition",
  "description": "Form partnerships with industry leaders or other institutions",
  "risk_level": "medium",
  "implementation_timeframe": "6-9 months",
  "key_success_factors": ["alignment of goals", "resource sharing", "reputation"],
  "sector": "Education & Teaching",
  "sector_trends": ["online learning", "skill-based education", "industry partnerships"],
  "with_decision_growth": 13.0,
  "evidence_scope": "universal sector patterns"
}
```

### 3. Decision Engine Integration

The decision engine can now evaluate universal strategies:
```python
from algorithm.decision_engine import DecisionEngine
from algorithm.sector_strategies import UniversalSectorStrategies

manager = UniversalSectorStrategies()

impact = DecisionEngine.evaluate_universal_strategy(
    month=6,
    base_revenue=10000.0,
    base_cogs=6000.0,
    base_opex=2000.0,
    base_capex=500.0,
    strategy_type='hiring',
    magnitude=10.0,
    magnitude_unit='percent',
    pricing_power=1.0,
    strategies_manager=manager
)
```

### 4. API Integration

The recommendations endpoint now:
1. First tries to use company-specific decision evidence
2. Then tries peer decision evidence from the scenario catalog
3. Falls back to universal sector strategies if insufficient evidence (< 3 recommendations)
4. Provides clear evidence status in the response

## Sectors Supported

### 1. Teaching (Education & Teaching)
- Strategies: curriculum_innovation, digital_transformation, partnership_expansion, faculty_optimization
- Trends: online learning, skill-based education, industry partnerships, continuous learning
- Competitive factors: curriculum quality, placement rates, faculty expertise, infrastructure

### 2. Industry (Industrial & Manufacturing)
- Strategies: automation_investment, supply_chain_optimization, quality_certification, capacity_expansion
- Trends: Industry 4.0, sustainable manufacturing, reshoring, smart factories
- Competitive factors: production efficiency, quality, cost structure, delivery speed

### 3. Corporate (Corporate Services)
- Strategies: service_expansion, digital_service_enablement, strategic_partnerships, talent_development
- Trends: digital transformation, remote services, specialized consulting, AI integration
- Competitive factors: service quality, client relationships, expertise, innovation

### 4. Arts (Arts & Entertainment)
- Strategies: digital_presence, diversification, venue_upgrade, collaborative_programs
- Trends: digital distribution, hybrid events, community engagement, content monetization
- Competitive factors: creativity, audience engagement, brand reputation, production quality

### 5. Racing (Racing & Motorsports)
- Strategies: technology_upgrade, talent_acquisition, sponsorship_expansion, data_analytics
- Trends: electric racing, data-driven performance, sustainability, global expansion
- Competitive factors: performance, innovation, team chemistry, financial backing

### 6. Healthcare (Healthcare & Medical)
- Strategies: technology_adoption, specialization, telemedicine_expansion, staff_optimization
- Trends: telemedicine, personalized medicine, AI diagnostics, preventive care
- Competitive factors: quality of care, patient outcomes, accessibility, cost efficiency

### 7. Retail (Retail & E-commerce)
- Strategies: omnichannel_expansion, personalization, supply_chain_optimization, customer_loyalty
- Trends: omnichannel retail, sustainability, direct-to-consumer, AI-powered recommendations
- Competitive factors: price, selection, convenience, customer experience

### 8. Technology (Technology & Software)
- Strategies: product_innovation, talent_acquisition, strategic_partnerships, infrastructure_scaling
- Trends: AI/ML, cloud computing, cybersecurity, developer tools
- Competitive factors: innovation, time-to-market, user experience, scalability

### 9. Finance (Financial Services)
- Strategies: digital_banking, risk_management, product_diversification, customer_experience
- Trends: digital transformation, fintech, personalization, sustainable finance
- Competitive factors: trust, rates/fees, service quality, convenience

### 10. General (General/Other)
- Strategies: operational_efficiency, market_expansion, strategic_investment, partnership_collaboration
- Trends: digitalization, sustainability, customer-centricity, innovation
- Competitive factors: quality, price, service, innovation

## Usage Examples

### Example 1: Teaching Institute with No Peers

```python
# Upload a dataset for a teaching institute
POST /api/upload
{
  "company_name": "ABC University",
  "niche": "teaching institute",
  "main_country": "USA",
  "csv_text": "..."
}

# Get recommendations (will use universal sector strategies)
POST /api/company/{company_id}/recommendations
{
  "toggles": {}
}

# Response will include:
# - Universal strategies for the "teaching" sector
# - Evidence status: "universal_sector_strategies"
# - Sector-specific context and trends
```

### Example 2: Mixed Evidence Scenario

If a company has some decision evidence but not enough:
- System provides company-specific recommendations first
- Adds peer recommendations if available
- Supplements with universal sector strategies if total < 3
- Evidence status: "mixed_evidence_and_universal"

### Example 3: Strengths Analysis with Sector Context

```python
GET /api/company/{company_id}/strengths?peer_group=niche

# When no peers available:
{
  "use_sector_context": true,
  "total_peers": 0,
  "pros": [
    {
      "title": "Aligned with Education & Teaching Sector Trends",
      "desc": "Company operates in the Education & Teaching sector where key trends include: online learning, skill-based education, industry partnerships.",
      "linked_to": "Sector Analysis",
      "type": "sector"
    }
  ],
  "cons": [
    {
      "title": "No Direct Peer Comparisons Available",
      "desc": "Specific peer competitors were not found in the dataset. Analysis uses universal sector patterns instead of direct peer benchmarking.",
      "linked_to": "Data Limitation",
      "type": "limitation"
    }
  ]
}
```

## Benefits

1. **Universal Coverage**: Works for any company, regardless of peer availability
2. **Sector Intelligence**: Provides sector-specific insights and trends
3. **No Web Scraping Required**: Uses pre-defined sector knowledge instead of web scraping
4. **Scalable**: Easy to add new sectors or update existing strategies
5. **Transparent**: Clear indication when using universal vs. specific evidence
6. **Actionable**: Provides implementation steps and key success factors

## Limitations

1. **General Patterns**: Universal strategies are general patterns, not tailored to specific company contexts
2. **No Causality**: Like peer evidence, universal strategies show associations, not causal effects
3. **Requires Adaptation**: Users must adapt strategies to their specific context and scale
4. **Static Knowledge**: Sector trends and strategies need periodic updates

## Future Enhancements

1. **Dynamic Sector Updates**: Mechanism to update sector strategies from external sources
2. **Learning from Datasets**: Extract and learn new strategies from datasets over time
3. **Sector Performance Tracking**: Track which universal strategies perform best in practice
4. **Custom Sector Definitions**: Allow users to define custom sectors and strategies
5. **Strategy Effectiveness Scoring**: Score strategies based on observed outcomes

## Testing

Run the test suite to verify the implementation:

```bash
cd scenario_intelligence_engine
python tests/test_universal_sector_strategies.py
```

Expected output:
- All 5 tests should pass
- Tests cover: sector classification, strategy management, recommendations, decision engine integration, and company-specific retrieval

## Configuration

To add or modify sector strategies:

1. Edit `data/universal_sector_strategies.json`
2. Add new sector entry or modify existing strategies
3. Update `SectorClassifier.SECTOR_KEYWORDS` in `algorithm/sector_strategies.py` if adding new sectors
4. Restart the server to load changes

## Conclusion

The universal sector strategies system ensures that the platform can provide valuable strategic insights for any company, even when peer-specific data is unavailable. By using general sector patterns and industry knowledge, the system maintains its analytical capability while being transparent about the source and limitations of its recommendations.
