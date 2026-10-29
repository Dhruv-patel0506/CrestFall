"""General peer playbook - the layer that works when a company has no peers.

Why this exists
---------------
The panel compares a company against peers found in the supplied files. That
works for Apple or Nvidia, where several same-niche companies were provided. It
fails for everything else: a teaching institute, an arts organisation, a racing
team, a single hospital, one factory. There is no second file to compare with,
and the user cannot know who their competitors even are - so a name-based peer
search would return nothing or return the wrong names.

What this module is
-------------------
A cohort of *unnamed* peers expressed as strategy patterns. Each move is
something organisations in that sector publicly do, what it typically costs,
what it typically is meant to fix, and how the company can test it against its
own history inside Crestfall. No company is named, because the comparison that
survives is behavioural rather than reputational.

Read the honesty labels before showing any of this to a client
--------------------------------------------------------------
`reference_band_pct` is a DIRECTIONAL PRIOR taken from widely reported strategy
patterns and operating benchmarks. It is not fitted to the supplied data, not a
forecast, and not evidence. It exists so a business reader has a starting range
to argue with, and so the difference against measured evidence is visible: when
a company's own file does contain dated decisions, Crestfall uses those numbers
and labels them as measured. When it does not, this module supplies candidates
and labels them as priors. Nothing here should ever be presented as "your data
showed".
"""

from typing import Any, Dict, List, Optional

# --------------------------------------------------------------------------- #
# The move library. Families keep the UI groupable; suits/hurts let the engine
# rank the list against the company's actual state instead of showing the same
# generic list to everyone.
# --------------------------------------------------------------------------- #

FAMILIES = {
    "demand": "Grow demand",
    "margin": "Protect margin",
    "cost": "Structural cost",
    "capital": "Capital & balance sheet",
    "talent": "People & capability",
    "product": "Product & delivery",
    "risk": "Risk & resilience",
    "partner": "Partnership & channel",
}

MOVES: List[Dict[str, Any]] = [
    {
        "id": "price_reposition",
        "name": "Reprice the core offering",
        "family": "margin",
        "what": "Move the price of the main revenue line up or down deliberately, rather than letting discounting drift, and hold the new level long enough to read the demand response.",
        "reference_band_pct": [-6.0, 8.0],
        "band_meaning": "Volume loss from a rise versus margin gain from the same rise; the sign flips depending on how price-sensitive the buyer actually is.",
        "check": [
            "Take the last 24 months and split them into periods before and after any price change already in the file.",
            "Compare revenue per unit of capacity, not total revenue - a price rise that loses volume can look flat.",
            "Only repeat the move on the segment where the response was weakest.",
        ],
        "risk": "A price rise in a shrinking-demand window shows up as an acceleration of the decline, not as a pricing failure. Check the calendar before blaming the price.",
        "suits": ["thin_margin", "growing_revenue", "pricing_power"],
        "hurts": ["demand_collapsing", "high_crash_risk"],
    },
    {
        "id": "deferred_capex",
        "name": "Push capital spend to the far side of the downturn",
        "family": "capital",
        "what": "Keep the commitments that build capability, move the ones that only build capacity, and fund the difference from the balance sheet rather than new debt.",
        "reference_band_pct": [1.0, 6.0],
        "band_meaning": "Cash-flow relief over the next three to six months; almost never shows up in a three-month return window.",
        "check": [
            "Compare capex and operating cash flow month by month - the file already has both.",
            "Look at whether the projected trough lands while a large commitment is due.",
            "Test the deferral as a scenario in Crestfall before doing it on the balance sheet.",
        ],
        "risk": "Deferring maintenance or capability spend past the trough converts a cash problem into a competitive one. Name the review month when you defer.",
        "suits": ["high_crash_risk", "tight_liquidity", "declining"],
        "hurts": ["strong_balance_sheet", "capacity_constrained"],
    },
    {
        "id": "mix_shift",
        "name": "Shift the mix toward the highest-contribution line",
        "family": "product",
        "what": "Stop treating every revenue line as equal. Re-weight effort, shelf space, teaching load, or engineering time toward the lines that contribute most per unit of the constrained resource.",
        "reference_band_pct": [2.0, 10.0],
        "band_meaning": "Contribution improvement when the constrained resource is the bottleneck, not when demand is the bottleneck.",
        "check": [
            "Rank the revenue lines by contribution per unit of whatever is scarce.",
            "Move 10% of the scarce resource, hold everything else still, and read the next two months.",
            "Reverse it if volume falls faster than margin improves.",
        ],
        "risk": "Mix shifts destroy the lines that customers used to cross-buy. Watch attach rates, not just margin.",
        "suits": ["thin_margin", "capacity_constrained", "declining"],
        "hurts": ["single_product_org"],
    },
    {
        "id": "retention_programme",
        "name": "Buy back the churn you can see coming",
        "family": "demand",
        "what": "A named, funded programme aimed at the renewals, re-enrolments or reorder dates that are already visible in the data, ahead of the moment they lapse.",
        "reference_band_pct": [1.5, 7.0],
        "band_meaning": "Retention economics: keeping existing volume is usually cheaper than replacing it, which is why this is the first move in a downturn.",
        "check": [
            "Find the periodicity in the file - the months where volume steps down are the lapse windows.",
            "Count how much revenue sits in the window that lapses next.",
            "Compare the cost of the programme against the contribution it protects.",
        ],
        "risk": "Discounting to retain trains buyers to wait for the discount. Try contact and service changes before price.",
        "suits": ["declining", "volatile_earnings", "recurring_revenue"],
        "hurts": ["one_off_sales_model"],
    },
    {
        "id": "channel_partnership",
        "name": "Reach demand through someone who already has it",
        "family": "partner",
        "what": "Distribution, referral or white-labelling agreements that rent an audience instead of building one; the cheapest new-customer acquisition when paid acquisition is expensive.",
        "reference_band_pct": [-2.0, 9.0],
        "band_meaning": "Asymmetric upside: a failed partnership costs integration effort, a working one changes the growth line.",
        "check": [
            "Model the partner's contribution separately in the file so it can be measured, not assumed.",
            "Set a review date and a volume floor before signing.",
            "Watch whether the partner channel cannibalises the direct one.",
        ],
        "risk": "Partner revenue is often lower-margin and higher-churn. Do not let it dilute the reported margin without noticing.",
        "suits": ["growth_stalled", "peer_gap", "small_reach"],
        "hurts": ["channel_conflict_risk"],
    },
    {
        "id": "cost_to_serve",
        "name": "Cut cost to serve, not cost to exist",
        "family": "cost",
        "what": "Find the activities that consume resource without changing what the customer receives - rework, duplicate administration, unused licences, empty seats - and remove those first.",
        "reference_band_pct": [1.0, 6.0],
        "band_meaning": "Typical share of operating cost that is avoidable without touching capability.",
        "check": [
            "Split fixed cost from variable cost in the file before choosing what to cut.",
            "Track whether unit cost falls while output stays flat - that is the signal it worked.",
            "Re-run the forecast after the change; the band should narrow, not just the mean.",
        ],
        "risk": "Blanket cuts remove the people who knew how the work was done. Cost programmes fail on the second year, not the first.",
        "suits": ["thin_margin", "declining", "high_cost_base"],
        "hurts": ["quality_led_position"],
    },
    {
        "id": "capability_investment",
        "name": "Buy the capability competitors are already renting",
        "family": "talent",
        "what": "Hire, train or acquire the specific capability that the sector has standardised on - automation, data, compliance, digital delivery - at the point where it changes unit economics.",
        "reference_band_pct": [-8.0, 5.0],
        "band_meaning": "Usually negative first: the spend lands before the benefit. Read it over four to eight quarters, not three months.",
        "check": [
            "Identify the one process where the capability changes cost or speed materially.",
            "Put the spend in the file as a dated decision so its own outcome can be measured.",
            "Set the metric that has to move and by when, before hiring.",
        ],
        "risk": "Capability bought without a process to apply it becomes overhead with a nicer title.",
        "suits": ["growing", "strong_balance_sheet", "peer_gap", "capacity_constrained"],
        "hurts": ["tight_liquidity", "high_crash_risk"],
    },
    {
        "id": "demand_shaping",
        "name": "Move demand instead of chasing it",
        "family": "demand",
        "what": "Use calendar, scheduling, term dates, window pricing or seasonal offers to shift load from the trough into the flat part of the year.",
        "reference_band_pct": [0.5, 5.0],
        "band_meaning": "Level-loading gains, largest where capacity is fixed and utilisation swings.",
        "check": [
            "Crestfall already measures this company's calendar-month effects - open Seasonality and read the worst month.",
            "Change the start dates, intake windows or promotional calendar for that month only.",
            "Re-measure the month effect the following year before generalising.",
        ],
        "risk": "Shaping demand into a weak macro window moves the problem rather than solving it.",
        "suits": ["seasonal", "capacity_constrained", "volatile_earnings"],
        "hurts": ["flat_demand_profile"],
    },
    {
        "id": "productivity_step",
        "name": "Raise output per unit of input",
        "family": "cost",
        "what": "Tooling, process, scheduling or automation changes whose purpose is the ratio, not the absolute cost - the only move that works while prices are stuck.",
        "reference_band_pct": [1.0, 8.0],
        "band_meaning": "Depends entirely on how far the current process is from the sector's feasible frontier.",
        "check": [
            "Plot revenue (or output) per head and per asset over the file's history.",
            "Find whether the trend is flat while cost rises - that gap is the target.",
            "Hold headcount still for two months after the change and read the ratio again.",
        ],
        "risk": "Productivity measured as output per head flattens quality first and shows up two quarters later.",
        "suits": ["thin_margin", "rising_costs", "declining"],
        "hurts": ["craft_or_quality_model"],
    },
    {
        "id": "debt_reprofile",
        "name": "Reprofile debt before the refinancing window",
        "family": "capital",
        "what": "Extend maturities, convert short into long, or renegotiate covenants while the numbers still allow a conversation rather than after they do not.",
        "reference_band_pct": [-3.0, 4.0],
        "band_meaning": "Removes refinancing risk; does not create earnings. Its value shows in the crash window, not the growth line.",
        "check": [
            "Put the maturity calendar next to the projected trough month.",
            "Model the rate sensitivity: Crestfall's macro shocks move the path when you set basis points.",
            "Approach lenders while the trailing twelve is still improving.",
        ],
        "risk": "Longer debt at a worse rate is still a cost. Do the arithmetic, not the relief.",
        "suits": ["high_crash_risk", "tight_liquidity", "leveraged"],
        "hurts": ["debt_free"],
    },
    {
        "id": "reserve_buffer",
        "name": "Set a downside trigger and a cash floor",
        "family": "risk",
        "what": "Decide in advance the number that forces action - revenue per month, cash weeks, contribution floor - and what gets cut or paused when it is reached.",
        "reference_band_pct": [0.0, 2.0],
        "band_meaning": "Almost no upside on its own; the value is that the other moves get executed on time.",
        "check": [
            "Read the lower band on the Crestfall forecast - that is the pre-agreed trigger point.",
            "Write the two decisions that follow if it is reached, before it is reached.",
            "Review quarterly, on a date, not on a feeling.",
        ],
        "risk": "A trigger nobody owns is decoration. Name the person, not the committee.",
        "suits": ["high_crash_risk", "volatile_earnings", "declining", "any"],
        "hurts": [],
    },
    {
        "id": "new_segment",
        "name": "Open a segment that uses existing capability",
        "family": "demand",
        "what": "Sell the same capability to a different buyer - corporate instead of consumer, another country, another age or institution type - without building anything new.",
        "reference_band_pct": [-4.0, 12.0],
        "band_meaning": "The widest band in this library. Most attempts cost money; the ones that work change the trajectory.",
        "check": [
            "Size the segment from public figures before any spend and write the assumption down.",
            "Run a paid pilot with a named exit date.",
            "Keep the new segment's rows separate in the file so its own forecast can be read.",
        ],
        "risk": "New segments need different service costs. Revenue that arrives at the wrong cost base is worse than no revenue.",
        "suits": ["growth_stalled", "capacity_constrained", "strong_balance_sheet"],
        "hurts": ["tight_liquidity"],
    },
    {
        "id": "digital_delivery",
        "name": "Move delivery online where the sector still does it in person",
        "family": "product",
        "what": "Teaching, care, retail, consultation, rehearsal, administration - the shift that changes marginal cost, not just convenience.",
        "reference_band_pct": [-5.0, 9.0],
        "band_meaning": "Cost per served unit falls materially; satisfaction and completion rates move in either direction.",
        "check": [
            "Pilot one cohort and compare its completion and cost lines with the in-person one.",
            "Watch unit cost at twice the volume - the economics only appear at scale.",
            "Do not book the saving before the second cycle.",
        ],
        "risk": "Hybrid delivery usually costs more than both pure models until it is designed properly.",
        "suits": ["high_cost_base", "small_reach", "peer_gap"],
        "hurts": ["experience_led_position"],
    },
    {
        "id": "compliance_edge",
        "name": "Treat compliance as capacity, not as overhead",
        "family": "risk",
        "what": "Get accreditation, safety, quality or regulatory standing ahead of demand, because in most sectors the licence is what limits how much you can sell.",
        "reference_band_pct": [-3.0, 6.0],
        "band_meaning": "Costs now, unlocks volume later; in regulated sectors it is the gate on growth.",
        "check": [
            "Identify the constraint that is regulatory rather than commercial.",
            "Time the application against the demand window, not the budget window.",
            "Record the date in the file so the effect can be measured against the following months.",
        ],
        "risk": "Compliance work competes for the same people as delivery work. Resource it explicitly.",
        "suits": ["regulated", "capacity_constrained", "peer_gap"],
        "hurts": ["unregulated_light_touch_sector"],
    },
    {
        "id": "consolidate_sites",
        "name": "Fewer, larger units",
        "family": "cost",
        "what": "Merge branches, campuses, lines, stores or studios into fewer units with better utilisation instead of trimming all of them equally.",
        "reference_band_pct": [-6.0, 7.0],
        "band_meaning": "One-off exit costs and disruption, then a structurally better fixed-cost base.",
        "check": [
            "Rank units by contribution per square metre or per seat, not by revenue.",
            "Model the volume transfer explicitly - assuming customers migrate is the usual error.",
            "Keep the exit costs visible in the file's timeline.",
        ],
        "risk": "Local presence is often the reason customers came. Test in one market first.",
        "suits": ["high_cost_base", "declining", "thin_margin"],
        "hurts": ["local_presence_model"],
    },
    {
        "id": "variable_contracting",
        "name": "Convert fixed commitments into variable ones",
        "family": "capital",
        "what": "Lease instead of own, contract instead of hire, spot instead of forward - where the demand is genuinely volatile and the flexibility is worth its premium.",
        "reference_band_pct": [-4.0, 5.0],
        "band_meaning": "Improves the downside tail, worsens the average. A risk trade, not a saving.",
        "check": [
            "Compare the volatility of demand against the stiffness of cost in the file.",
            "Price the flexibility premium before assuming it is free.",
            "Keep the stable core fixed; flex the tail only.",
        ],
        "risk": "Variable cost structures leak margin in good months and are blamed for it in bad ones.",
        "suits": ["volatile_earnings", "seasonal", "high_crash_risk"],
        "hurts": ["flat_predictable_demand"],
    },
    {
        "id": "brand_and_evidence",
        "name": "Publish the proof, not the promise",
        "family": "demand",
        "what": "Outcomes data, case studies, graduate results, patient outcomes, finish rates, reliability figures - evidence that shortens the buyer's decision in credibility-driven sectors.",
        "reference_band_pct": [0.5, 6.0],
        "band_meaning": "Cheap to do, slow to work; shows up in enquiry conversion rather than volume.",
        "check": [
            "Measure enquiry-to-commitment conversion before and after.",
            "Publish numbers you can defend; an inflated claim costs more than the campaign earns.",
            "Give it two full decision cycles before judging.",
        ],
        "risk": "Publishing outcomes invites comparison. Only do it when the comparison helps.",
        "suits": ["credibility_driven_demand", "growth_stalled", "peer_gap"],
        "hurts": ["weak_outcomes_data"],
    },
    {
        "id": "supply_security",
        "name": "Secure the input that can stop everything",
        "family": "risk",
        "what": "Second sources, buffer stock, or contracted volume for the single input whose absence halts delivery - energy, chips, feedstock, clinical staff, fuel, raw material.",
        "reference_band_pct": [-3.0, 4.0],
        "band_meaning": "Small positive on average, large protection in the tail.",
        "check": [
            "List inputs by single-source exposure and lead time.",
            "Value the buffer against the cost of a lost week of delivery.",
            "Set the reorder rule in writing.",
        ],
        "risk": "Buffers tie up cash and go stale. Size them to the lead time, not to the anxiety.",
        "suits": ["single_source_dependency", "high_crash_risk", "racing_or_live_delivery"],
        "hurts": ["no_physical_inputs"],
    },
]

MOVES_BY_ID = {move["id"]: move for move in MOVES}


# --------------------------------------------------------------------------- #
# Sector overlays. `match` tokens are tested against the niche / industry text
# the user typed when importing, so a teaching institute that writes "Education
# & Skills" resolves the same as one that writes "Further Education College".
# --------------------------------------------------------------------------- #

SECTORS: List[Dict[str, Any]] = [
    {
        "key": "education",
        "label": "Education & training institutions",
        "match": ["education", "teach", "school", "college", "university", "institute", "academy", "curriculum", "student", "enrol", "e-learning", "edtech", "coaching", "upskill"],
        "prioritise": ["retention_programme", "digital_delivery", "brand_and_evidence", "capability_investment", "compliance_edge", "cost_to_serve"],
        "caution": ["new_segment", "consolidate_sites"],
        "shape": "Enrolment arrives in intakes, so revenue is step-shaped rather than smooth; cost is dominated by staff and premises. The lever with the fastest payback is usually the renewal of someone already enrolled, and the one most often mishandled is capacity expansion against a single intake window.",
        "calendar": ["Enrolment and results months dominate the profile; the teaching term ends while the academic year's cost continues.", "September/October and January intakes, spring results and summer clearance are the usual step points worldwide."],
        "peer_frame": "Comparable institutions publish enquiry-to-enrolment conversion, completion rates and cost per enrolled learner. Those four numbers are the peer comparison when no competitor file exists.",
    },
    {
        "key": "healthcare",
        "label": "Healthcare & care delivery",
        "match": ["health", "hospital", "clinic", "care", "patient", "medical", "pharma", "life science", "diagnostic", "wellness", "nursing"],
        "prioritise": ["compliance_edge", "productivity_step", "supply_security", "retention_programme", "reserve_buffer", "cost_to_serve"],
        "caution": ["price_reposition", "variable_contracting"],
        "shape": "Demand is inelastic and referral-driven; capacity is the constraint and accreditation gates it. Cost per episode and throughput per clinician are the two numbers that decide everything else.",
        "calendar": ["Winter respiratory load and elective-care backlogs create a predictable annual squeeze on capacity."],
        "peer_frame": "Benchmarks exist publicly for cost per episode, occupancy, readmission and waiting time; those replace competitor names.",
    },
    {
        "key": "financial",
        "label": "Banking, finance & insurance",
        "match": ["bank", "finance", "financial", "insurance", "lending", "nbfc", "asset manage", "payments", "credit", "fintech", "brokerage"],
        "prioritise": ["debt_reprofile", "digital_delivery", "cost_to_serve", "brand_and_evidence", "reserve_buffer", "new_segment"],
        "caution": ["deferred_capex"],
        "shape": "Earnings move with rates, credit quality and volume, not with price. Rate sensitivity is the environmental variable to test first, and the crash window usually coincides with a refinancing calendar.",
        "calendar": ["Quarter-end provisioning and fiscal-year windows shape reported results more than operations do."],
        "peer_frame": "Regulatory filings give net interest margin, cost-to-income and coverage ratios for every comparable institution - a peer cohort without naming competitors.",
    },
    {
        "key": "retail_cpg",
        "label": "Retail & consumer goods",
        "match": ["retail", "consumer", "beverage", "snack", "food", "apparel", "footwear", "grocer", "cpg", "store", "ecommerce", "e-commerce", "brand"],
        "prioritise": ["demand_shaping", "mix_shift", "channel_partnership", "price_reposition", "supply_security", "brand_and_evidence"],
        "caution": ["consolidate_sites"],
        "shape": "Short decision cycles, promotional intensity, and freight and shelf costs. Volume responds quickly to price and to calendar; margin is where the damage hides.",
        "calendar": ["Festive and gifting windows are the largest single driver, and they differ by market - Diwali, Lunar New Year, Ramadan, Thanksgiving-to-Christmas, Eid, mid-year and back-to-school."],
        "peer_frame": "Market share, like-for-like growth, promotional depth and sell-through are published for the category even when a specific rival is unknown.",
    },
    {
        "key": "technology",
        "label": "Software, platforms & digital services",
        "match": ["software", "saas", "platform", "cloud", "data", "ai", "artificial intelligence", "cyber", "security", "semiconductor", "chip", "comput", "digital", "enterprise"],
        "prioritise": ["capability_investment", "retention_programme", "channel_partnership", "mix_shift", "new_segment", "productivity_step"],
        "caution": ["variable_contracting", "deferred_capex"],
        "shape": "Fixed build cost, near-zero marginal cost, and growth that can reverse faster than a balance sheet can adjust. Retention and net expansion matter more than new logos; compute and sales capacity are the two cost cliffs.",
        "calendar": ["Enterprise budget cycles concentrate renewal and procurement into the first and last quarters of the fiscal year."],
        "peer_frame": "Net revenue retention, burn multiple, gross margin and payback period are the cohort metrics; they are public for listed comparables.",
    },
    {
        "key": "industrial",
        "label": "Industrial, manufacturing & engineering",
        "match": ["manufactur", "industrial", "factory", "machin", "steel", "cement", "automotive", "auto ", "vehicle", "engineer", "capital equipment", "tier"],
        "prioritise": ["productivity_step", "cost_to_serve", "supply_security", "deferred_capex", "consolidate_sites", "capability_investment"],
        "caution": ["new_segment"],
        "shape": "Capacity is bought years ahead of demand, so the mistake is rarely effort and usually timing. Utilisation, unit cost and input prices dominate the path.",
        "calendar": ["Order books turn with construction and vehicle-programme cycles; working capital peaks before the shutdown period."],
        "peer_frame": "Utilisation, order book cover and cost per unit are reported sector-wide, which is enough for a comparison without naming a rival plant.",
    },
    {
        "key": "energy",
        "label": "Energy, utilities & resources",
        "match": ["energy", "oil", "gas", "petrol", "power", "utility", "utilities", "renewable", "solar", "wind", "coal", "mining", "commodit"],
        "prioritise": ["supply_security", "debt_reprofile", "reserve_buffer", "cost_to_serve", "compliance_edge", "capability_investment"],
        "caution": ["price_reposition", "mix_shift"],
        "shape": "Revenue is priced by a global commodity the company does not control, so the only real levers are unit cost, project timing and balance-sheet durability through the cycle.",
        "calendar": ["Seasonal heating and cooling demand, and maintenance windows scheduled around it."],
        "peer_frame": "Cost per barrel, per megawatt-hour and per tonne are published comparables; the cohort is the sector, not a competitor.",
    },
    {
        "key": "transport_logistics",
        "label": "Transport, logistics & mobility",
        "match": ["logistic", "freight", "transport", "delivery", "courier", "supply chain", "aviation", "airline", "mobility", "ride", "shipping", "warehous"],
        "prioritise": ["productivity_step", "variable_contracting", "supply_security", "demand_shaping", "cost_to_serve", "reserve_buffer"],
        "caution": ["capability_investment"],
        "shape": "Asset-heavy or capacity-rented, with fuel and labour as the two volatile inputs. Yield per trip and empty-mileage equivalent decide the margin long before pricing does.",
        "calendar": ["Peak-season volumes and post-peak rate collapse, plus weather disruption windows."],
        "peer_frame": "Yield, cost per kilometre and on-time metrics are sector benchmarks; comparisons do not require a named rival operator.",
    },
    {
        "key": "media_entertainment",
        "label": "Media, entertainment & live events",
        "match": ["media", "entertainment", "streaming", "film", "music", "game", "gaming", "studio", "event", "broadcast", "content", "publish"],
        "prioritise": ["brand_and_evidence", "channel_partnership", "demand_shaping", "new_segment", "digital_delivery", "price_reposition"],
        "caution": ["cost_to_serve", "consolidate_sites"],
        "shape": "Hit-driven revenue with a fixed cost base underneath; attention is the scarce resource and churn is the real competitor. Distribution partnerships move the line faster than production spending does.",
        "calendar": ["Release windows, holiday viewing, awards and touring seasons create very strong month effects."],
        "peer_frame": "Audience retention, churn, cost per acquired hour and fill rates are reported for the category.",
    },
    {
        "key": "arts_culture",
        "label": "Arts, culture & heritage organisations",
        "match": ["art", "arts", "museum", "gallery", "theatre", "theater", "orchestra", "heritage", "culture", "library", "opera", "dance", "exhibition"],
        "prioritise": ["brand_and_evidence", "demand_shaping", "compliance_edge", "cost_to_serve", "channel_partnership", "retention_programme"],
        "caution": ["price_reposition", "consolidate_sites"],
        "shape": "Earned income, subsidy and philanthropy move on different clocks, and the mission constrains which levers are allowed. Membership renewal and school/community programme volume are usually the controllable part.",
        "calendar": ["Season programmes, touring cycles, grant decision dates and the summer/winter visitor trough."],
        "peer_frame": "Arts councils publish attendance, earned-to-subsidy ratio and cost per visit by organisation type - a legitimate cohort when no competitor exists.",
    },
    {
        "key": "motorsport_sport",
        "label": "Motorsport, sport & competitive teams",
        "match": ["racing", "racing team", "motorsport", "formula", "nascar", "sport", "football club", "cricket", "team", "cycling", "athletics", "stadium"],
        "prioritise": ["supply_security", "capability_investment", "brand_and_evidence", "variable_contracting", "reserve_buffer", "channel_partnership"],
        "caution": ["deferred_capex", "consolidate_sites"],
        "shape": "Performance is the product, so development spend cannot simply be paused; income is contracted (media rights, sponsorship, gate) and therefore slow to move. Reliability and parts lead time are the operational risk.",
        "calendar": ["Season start, mid-season development windows, and the contract negotiation period just after the final event."],
        "peer_frame": "League financial rules publish wage-to-revenue, transfer/development spend and gate yields across the whole cohort.",
        "note": "A racing or sports organisation is dominated by a small number of incompressible costs. The honest question is which contracted income can be added, not which cost can be cut.",
    },
    {
        "key": "hospitality_tourism",
        "label": "Hospitality, tourism & venues",
        "match": ["hotel", "hospitality", "tourism", "travel", "restaurant", "resort", "catering", "venue", "airline", "cruise"],
        "prioritise": ["demand_shaping", "variable_contracting", "retention_programme", "productivity_step", "brand_and_evidence", "cost_to_serve"],
        "caution": ["capability_investment"],
        "shape": "Fixed premises, perishable inventory and an unsold unit that never comes back. Occupancy and yield per available unit beat price as the first lever.",
        "calendar": ["Peak season, school holidays, festival calendars and the shoulder months that decide whether the year works."],
        "peer_frame": "RevPAR, occupancy and average daily rate are published competitive-set statistics by design.",
    },
    {
        "key": "real_estate",
        "label": "Real estate, construction & property",
        "match": ["real estate", "property", "construction", "infrastructur", "developer", "rental", "leas", "building", "civil"],
        "prioritise": ["debt_reprofile", "deferred_capex", "reserve_buffer", "compliance_edge", "variable_contracting", "cost_to_serve"],
        "caution": ["new_segment", "capability_investment"],
        "shape": "Long project cycles against short financing windows; the failure mode is timing, not effort. Pre-sale cover and interest cover matter more than margin per unit.",
        "calendar": ["Planning, monsoon/winter working seasons, and fiscal-year land transaction windows."],
        "peer_frame": "Registered property transactions, rental yields and construction cost indices give a cohort without a named competitor.",
    },
    {
        "key": "agriculture",
        "label": "Agriculture, food production & inputs",
        "match": ["agri", "farm", "crop", "dairy", "poultry", "seed", "fertiliser", "fertilizer", "food production", "aquacult"],
        "prioritise": ["supply_security", "cost_to_serve", "reserve_buffer", "productivity_step", "mix_shift", "compliance_edge"],
        "caution": ["price_reposition", "digital_delivery"],
        "shape": "Biology and weather set the volume curve; input prices and yield set the margin. Perishability limits how long a problem can be waited out.",
        "calendar": ["Sowing and harvest windows, and the price basis between harvest and lean months."],
        "peer_frame": "Government and commodity-board statistics publish yield, cost of cultivation and mandi prices sector-wide.",
    },
    {
        "key": "public_nonprofit",
        "label": "Public sector, NGOs & social enterprises",
        "match": ["government", "public sector", "ngo", "non profit", "nonprofit", "charity", "foundation", "social enterprise", "development", "welfare", "municipal"],
        "prioritise": ["brand_and_evidence", "compliance_edge", "cost_to_serve", "reserve_buffer", "capability_investment", "channel_partnership"],
        "caution": ["price_reposition", "variable_contracting"],
        "shape": "Funding is granted on cycles and judged on outcomes, not on margin. The scarce resource is demonstrable impact and the administrative capacity to report it.",
        "calendar": ["Grant application and reporting deadlines, fiscal-year disbursement, and election-cycle shifts in priorities."],
        "peer_frame": "Regulator and donor disclosures give cost per outcome and reach per unit of spend for the whole cohort.",
    },
    {
        "key": "professional_services",
        "label": "Professional & business services",
        "match": ["consult", "legal", "law firm", "agency", "accounting", "advisory", "recruit", "staffing", "bpo", "kpo", "services", "corporate", "enterprise services"],
        "prioritise": ["productivity_step", "retention_programme", "capability_investment", "mix_shift", "brand_and_evidence", "new_segment"],
        "caution": ["consolidate_sites", "deferred_capex"],
        "shape": "The only inventory is billable time, so utilisation and realisation decide everything. People leave in cohorts, which makes retention the cheapest growth lever available.",
        "calendar": ["Fiscal-year-end budget releases and the January/September hiring waves."],
        "peer_frame": "Utilisation, realisation, revenue per professional and partner-leaver rates are sector-reported.",
    },
    {
        "key": "science_deep-tech",
        "label": "Research, deep technology & frontier labs",
        "match": ["research", "laboratory", "lab", "deepmind", "openai", "anthropic", "frontier", "model", "genomic", "biotech", "quantum", "space"],
        "prioritise": ["capability_investment", "deferred_capex", "brand_and_evidence", "compliance_edge", "channel_partnership", "reserve_buffer"],
        "caution": ["price_reposition", "consolidate_sites"],
        "shape": "Compute and talent consume cash while the product is still being proven, so runway and the cost-per-run of a result matter before revenue mechanics. A single capability step can change both.",
        "calendar": ["Model or product release cadence, conference cycles, and enterprise procurement quarters."],
        "peer_frame": "Cost per training run, inference unit cost and burn multiple are the cohort comparison even when competitors are private.",
    },
    {
        "key": "general",
        "label": "General commercial organisation",
        "match": [],
        "prioritise": ["reserve_buffer", "retention_programme", "cost_to_serve", "mix_shift", "productivity_step", "brand_and_evidence"],
        "caution": ["new_segment", "consolidate_sites"],
        "shape": "No sector pattern was recognised in the description provided, so the safest sequence is: fix the downside trigger, protect the revenue you already hold, then improve the ratio of output to input before spending on anything new.",
        "calendar": ["Record your own term, renewal or seasonal dates in the Seasonality umbrella - the model will then measure this organisation's calendar instead of an assumed one."],
        "peer_frame": "Without a sector cohort, the honest comparison is against this organisation's own history, which Crestfall already computes.",
    },
]


# --------------------------------------------------------------------------- #
# State detection - turns what the engine measured into why a move fits now.
# --------------------------------------------------------------------------- #

def detect_states(profile: Optional[dict], strengths: Optional[dict],
                  forecast: Optional[dict], timing: Optional[dict]) -> Dict[str, Any]:
    """Derive plain operating conditions from the numbers already on screen.

    Every key is optional: an imported file with three columns still resolves a
    playbook, it just resolves a shorter one.
    """
    states: Dict[str, Any] = {}
    series = (forecast or {}).get("forecast_series") or []
    in_range = [point for point in series if point.get("in_requested_range", True)]
    end = in_range[-1] if in_range else (series[-1] if series else None)
    history = (forecast or {}).get("recent_history") or []
    latest = history[-1] if history else None

    trajectory = None
    if end and latest:
        try:
            start_value = float(latest.get("value", latest.get("close")))
            end_value = float(end.get("forecast_value"))
            if start_value > 0:
                trajectory = (end_value / start_value - 1.0) * 100.0
        except (TypeError, ValueError):
            trajectory = None
    if trajectory is not None:
        states["projected_change_pct"] = round(trajectory, 2)
        states["declining"] = trajectory < 0
        states["growth_stalled"] = -5 <= trajectory <= 5
        states["growing"] = trajectory > 5

    metrics = {item.get("key") or item.get("metric"): item for item in ((strengths or {}).get("metrics") or [])}
    def number(key: str) -> Optional[float]:
        raw = (metrics.get(key) or {}).get("value")
        if isinstance(raw, (int, float)):
            return float(raw)
        if isinstance(raw, str):
            cleaned = raw.replace("%", "").replace(",", "").strip()
            try:
                return float(cleaned)
            except ValueError:
                return None
        return None

    if number("gross_margin_pct") is not None:
        states["gross_margin_pct"] = number("gross_margin_pct")
        states["thin_margin"] = states["gross_margin_pct"] < 35
    if number("net_income_usd_m") is not None and number("net_income_usd_m") < 0:
        states["losing_money"] = True
    debt = number("total_debt_usd_m")
    cash = number("cash_usd_m")
    if debt is not None and cash is not None:
        states["leveraged"] = debt > max(1.0, cash * 2)
        states["debt_free"] = debt <= 0
        states["tight_liquidity"] = cash < max(1.0, debt * 0.25)
        states["strong_balance_sheet"] = cash >= max(1.0, debt)

    crash_bars = ((timing or {}).get("crash_timing") or {}).get("bars") or []
    likely = next((bar for bar in crash_bars if bar.get("is_most_likely")), None)
    if likely:
        prob = float(likely.get("prob_pct") or 0.0)
        states["crash_prob_pct"] = round(prob, 1)
        states["high_crash_risk"] = prob >= 25
        states["crash_window"] = likely.get("label") or likely.get("year")
    peak = next((bar for bar in ((timing or {}).get("peak_timing") or {}).get("bars") or [] if bar.get("is_most_likely")), None)
    if peak:
        states["peak_window"] = peak.get("label") or peak.get("year")

    phase = str(((profile or {}).get("status") or {}).get("current_phase") or (profile or {}).get("current_phase") or "").lower()
    if phase:
        states["phase"] = phase
        states["capacity_constrained"] = "developing" in phase
        states["demand_collapsing"] = "crashing" in phase

    volatility = number("volatility") if number("volatility") is not None else number("daily_volatility")
    if volatility is not None:
        states["volatile_earnings"] = volatility > 3
    return states


def detect_sector(text: str) -> Dict[str, Any]:
    """Resolve the free-text niche the user typed to one sector overlay."""
    haystack = (text or "").lower()
    best, best_score = None, 0
    for sector in SECTORS:
        score = sum(1 for token in sector["match"] if token in haystack)
        if score > best_score:
            best, best_score = sector, score
    return best or SECTORS[-1]


def build_playbook(niche_text: str, states: Dict[str, Any]) -> Dict[str, Any]:
    """Rank the general moves for this organisation, and say why each one is
    where it is in the list. Nothing here is measured from a supplied file, so
    the provenance is carried on every single item."""
    sector = detect_sector(niche_text)
    ranked, excluded = [], set(sector["caution"])

    def suitability(move: Dict[str, Any]) -> Dict[str, Any]:
        suits, hurts = move.get("suits") or [], move.get("hurts") or []
        live_hurts = [key for key in hurts if states.get(key)]
        live_suits = [key for key in suits if states.get(key)]
        if "any" in suits:
            live_suits.append("always_worth_doing")
        if move["id"] in excluded:
            return {"verdict": "hold", "why": f"{sector['label']} usually pays for this one: {move['risk']}", "score": -2, "live_suits": live_suits, "live_hurts": live_hurts + ["sector_caution"]}
        if live_hurts:
            return {"verdict": "caution", "why": "This organisation currently shows " + ", ".join(live_hurts).replace("_", " ") + ", which is the condition this move tends to make worse.", "score": -1, "live_suits": live_suits, "live_hurts": live_hurts}
        if sector["key"] != "general" and move["id"] in sector["prioritise"]:
            return {"verdict": "prioritise", "why": "Named as a high-leverage move for " + sector["label"].lower() + "." + ((" Also fits: " + ", ".join(live_suits).replace("_", " ")) if live_suits else ""), "score": 3 + len(live_suits), "live_suits": live_suits, "live_hurts": []}
        if live_suits:
            return {"verdict": "consider", "why": "Fits the current condition: " + ", ".join(live_suits).replace("_", " ") + ".", "score": 1 + len(live_suits), "live_suits": live_suits, "live_hurts": []}
        return {"verdict": "backlog", "why": "No current condition in this organisation's numbers calls for it.", "score": 0, "live_suits": [], "live_hurts": []}

    for move in MOVES:
        fit = suitability(move)
        ranked.append({
            "id": move["id"], "name": move["name"], "family": move["family"],
            "family_label": FAMILIES[move["family"]], "what": move["what"],
            "reference_band_pct": move["reference_band_pct"], "band_meaning": move["band_meaning"],
            "check": move["check"], "risk": move["risk"],
            "provenance": "General sector playbook - a directional prior from publicly reported strategy patterns. Not measured from any supplied data.",
            "measured_from_your_data": False,
            **fit,
        })
    ranked.sort(key=lambda item: item["score"], reverse=True)
    return {
        "sector": {"key": sector["key"], "label": sector["label"], "shape": sector["shape"],
                   "calendar": sector["calendar"], "peer_frame": sector["peer_frame"]},
        "matched_from": niche_text or "no sector text supplied",
        "states": states,
        "moves": ranked,
        "naming_policy": "Peers are deliberately unnamed. The comparison is behavioural: what organisations in this sector publicly do, and what it tends to cost or earn.",
        "provenance": "No peer file was supplied for this organisation, so these candidates come from the general playbook rather than from measured history. They are hypotheses to test, not results.",
    }
