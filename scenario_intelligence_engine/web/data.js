// data.js - Seed data for all 49 calibrated companies
const SEED_DATABASE = {
  companies: [
  {
    "company_id": "ADBE",
    "company_name": "Adobe Inc.",
    "ticker": "ADBE",
    "exchange": "NASDAQ",
    "main_country": "USA",
    "niche": "Digital Media & SaaS Software",
    "currency": "USD",
    "fiscal_year_end": "November",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 12955.46,
      "cost_of_revenue_usd_m": 5829.96,
      "operating_expense_usd_m": 3238.86,
      "operating_income_usd_m": 3886.64,
      "net_income_usd_m": 3109.31,
      "cash_usd_m": 17772.44,
      "total_debt_usd_m": 10663.46,
      "total_assets_usd_m": 71089.76,
      "equity_usd_m": 60426.3,
      "operating_cash_flow_usd_m": 3731.17,
      "capex_usd_m": 1305.91,
      "shares_outstanding_m": 450.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 376.71,
      "high": 378.4,
      "low": 376.57,
      "close": 376.7,
      "adjusted_close": 376.7,
      "volume": 23165056.0,
      "market_cap_usd_bn": 169.52
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5800.0,
      "sector_index_close": 20000.0,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 0.0,
      "cpi_index": 310.9,
      "unemployment_rate_pct": 3.4,
      "consumer_confidence_index": 73.68,
      "gdp_growth_pct": 3.58,
      "fx_rate_per_usd": 1.0005,
      "bond_yield_10y_pct": 5.0
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_ADBE_2021_01",
        "company_id": "ADBE",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_ADBE_2022_02",
        "company_id": "ADBE",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "GOOGL",
    "company_name": "Alphabet Inc.",
    "ticker": "GOOGL",
    "exchange": "NASDAQ",
    "main_country": "United States",
    "niche": "Internet Search & AI Infrastructure",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 541231.86,
      "cost_of_revenue_usd_m": 243554.34,
      "operating_expense_usd_m": 135307.96,
      "operating_income_usd_m": 162369.56,
      "net_income_usd_m": 129895.65,
      "cash_usd_m": 808730.5,
      "total_debt_usd_m": 278171.84,
      "total_assets_usd_m": 1126902.34,
      "equity_usd_m": 848730.5,
      "operating_cash_flow_usd_m": 155874.78,
      "capex_usd_m": 46762.43,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 240.97,
      "high": 241.53,
      "low": 239.94,
      "close": 240.65,
      "adjusted_close": 240.65,
      "volume": 4330264.0,
      "market_cap_usd_bn": 601.62
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 66274.53,
      "sector_index_close": 26589.48,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "United States",
      "date": "2026-10-23",
      "policy_rate_pct": 0.57,
      "cpi_index": 304.91,
      "unemployment_rate_pct": 7.92,
      "consumer_confidence_index": 109.8,
      "gdp_growth_pct": 1.3,
      "fx_rate_per_usd": 0.9852,
      "bond_yield_10y_pct": 2.48
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_GOOGL_2021_01",
        "company_id": "GOOGL",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_GOOGL_2022_02",
        "company_id": "GOOGL",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "AMD",
    "company_name": "Advanced Micro Devices, Inc.",
    "ticker": "AMD",
    "exchange": "NASDAQ",
    "main_country": "USA",
    "niche": "Semiconductors & Data Center CPUs/GPUs",
    "currency": "USD",
    "fiscal_year_end": "December",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 15546.56,
      "cost_of_revenue_usd_m": 6995.95,
      "operating_expense_usd_m": 3886.64,
      "operating_income_usd_m": 4663.97,
      "net_income_usd_m": 3731.18,
      "cash_usd_m": 19327.12,
      "total_debt_usd_m": 11596.27,
      "total_assets_usd_m": 77308.48,
      "equity_usd_m": 65712.21,
      "operating_cash_flow_usd_m": 4477.42,
      "capex_usd_m": 1567.1,
      "shares_outstanding_m": 1620.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 478.33,
      "high": 481.45,
      "low": 475.43,
      "close": 479.63,
      "adjusted_close": 479.63,
      "volume": 5992432.0,
      "market_cap_usd_bn": 777.0
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5800.0,
      "sector_index_close": 20000.0,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 0.0,
      "cpi_index": 310.9,
      "unemployment_rate_pct": 3.4,
      "consumer_confidence_index": 73.68,
      "gdp_growth_pct": 3.58,
      "fx_rate_per_usd": 1.0005,
      "bond_yield_10y_pct": 5.0
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_AMD_2021_01",
        "company_id": "AMD",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_AMD_2022_02",
        "company_id": "AMD",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "0",
    "company_name": "0",
    "ticker": "0",
    "exchange": "0",
    "main_country": "0",
    "niche": "0",
    "currency": "0",
    "fiscal_year_end": "0",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 1063.3,
      "cost_of_revenue_usd_m": 497.65,
      "operating_expense_usd_m": 1082.19,
      "operating_income_usd_m": -516.54,
      "net_income_usd_m": -413.23,
      "cash_usd_m": 3005.48,
      "total_debt_usd_m": 699.78,
      "total_assets_usd_m": 9506.03,
      "equity_usd_m": 8806.25,
      "operating_cash_flow_usd_m": -313.27,
      "capex_usd_m": 3146.15,
      "shares_outstanding_m": 500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 175.18,
      "high": 175.56,
      "low": 174.48,
      "close": 175.42,
      "adjusted_close": 175.42,
      "volume": 9610634.0,
      "market_cap_usd_bn": 39.98
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5331.87,
      "sector_index_close": 21884.25,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "0",
      "date": "2026-10-23",
      "policy_rate_pct": 4.5,
      "cpi_index": 312.99,
      "unemployment_rate_pct": 4.0,
      "consumer_confidence_index": 52.89,
      "gdp_growth_pct": 2.56,
      "fx_rate_per_usd": 1.0,
      "bond_yield_10y_pct": 4.51
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_0_2021_01",
        "company_id": "0",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_0_2022_02",
        "company_id": "0",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "AAPL",
    "company_name": "Apple Inc.",
    "ticker": "AAPL",
    "exchange": "NASDAQ",
    "main_country": "United States",
    "niche": "Consumer Electronics & Services Ecosystem",
    "currency": "USD",
    "fiscal_year_end": "09-30",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 585440.58,
      "cost_of_revenue_usd_m": 263448.26,
      "operating_expense_usd_m": 146360.15,
      "operating_income_usd_m": 175632.17,
      "net_income_usd_m": 140505.74,
      "cash_usd_m": 876774.7,
      "total_debt_usd_m": 300010.71,
      "total_assets_usd_m": 1216785.4,
      "equity_usd_m": 916774.7,
      "operating_cash_flow_usd_m": 168606.89,
      "capex_usd_m": 50582.07,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 144.86,
      "high": 144.87,
      "low": 144.31,
      "close": 144.74,
      "adjusted_close": 144.74,
      "volume": 9388030.0,
      "market_cap_usd_bn": 361.85
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 69516.57,
      "sector_index_close": 29166.55,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "United States",
      "date": "2026-10-23",
      "policy_rate_pct": 0.42,
      "cpi_index": 305.12,
      "unemployment_rate_pct": 7.98,
      "consumer_confidence_index": 109.42,
      "gdp_growth_pct": 1.37,
      "fx_rate_per_usd": 1.0073,
      "bond_yield_10y_pct": 2.49
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_AAPL_2021_01",
        "company_id": "AAPL",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_AAPL_2022_02",
        "company_id": "AAPL",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "ASML",
    "company_name": "ASML Holding N.V.",
    "ticker": "ASML",
    "exchange": "NASDAQ / EURONEXT",
    "main_country": "Netherlands",
    "niche": "Lithography Systems & Semiconductor Equipment",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 7260.13,
      "cost_of_revenue_usd_m": 3484.86,
      "operating_expense_usd_m": 1597.23,
      "operating_income_usd_m": 2178.04,
      "net_income_usd_m": 1785.99,
      "cash_usd_m": 31897.86,
      "total_debt_usd_m": 17932.86,
      "total_assets_usd_m": 133971.01,
      "equity_usd_m": 116038.15,
      "operating_cash_flow_usd_m": 2232.49,
      "capex_usd_m": 1815.03,
      "shares_outstanding_m": 2400.01,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 1614.45,
      "high": 1620.12,
      "low": 1609.95,
      "close": 1612.45,
      "adjusted_close": 1612.45,
      "volume": 9656196.0,
      "market_cap_usd_bn": 3869.9
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 23110.74,
      "sector_index_close": 5387.31,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "Netherlands",
      "date": "2026-10-23",
      "policy_rate_pct": 2.16,
      "cpi_index": 313.99,
      "unemployment_rate_pct": 4.58,
      "consumer_confidence_index": 86.94,
      "gdp_growth_pct": 1.59,
      "fx_rate_per_usd": 1.0,
      "bond_yield_10y_pct": 4.3
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_ASML_2021_01",
        "company_id": "ASML",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_ASML_2022_02",
        "company_id": "ASML",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "BAJFINANCE.NS",
    "company_name": "Bajaj Finance Limited",
    "ticker": "BAJFINANCE.NS",
    "exchange": "NSE",
    "main_country": "India",
    "niche": "Consumer Lending & Non-Banking Finance (NBFC)",
    "currency": "INR",
    "fiscal_year_end": "03-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 6270.9,
      "cost_of_revenue_usd_m": 3637.12,
      "operating_expense_usd_m": 1379.6,
      "operating_income_usd_m": 1254.18,
      "net_income_usd_m": 940.64,
      "cash_usd_m": 2902.43,
      "total_debt_usd_m": 2321.94,
      "total_assets_usd_m": 13060.94,
      "equity_usd_m": 10739.0,
      "operating_cash_flow_usd_m": 1175.8,
      "capex_usd_m": 411.53,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 37011047412.23,
      "high": 37273764922.68,
      "low": 36798181981.77,
      "close": 36939352772.79,
      "adjusted_close": 36939352772.79,
      "volume": 3847236.0,
      "market_cap_usd_bn": 271612888.04
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 133090315137.26,
      "sector_index_close": 139744830894.12,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "India",
      "date": "2026-10-23",
      "policy_rate_pct": 6.5,
      "cpi_index": 230.0,
      "unemployment_rate_pct": 7.1,
      "consumer_confidence_index": 94.5,
      "gdp_growth_pct": 6.8,
      "fx_rate_per_usd": 87.0,
      "bond_yield_10y_pct": 7.12
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_BAJFINANCE.NS_2021_01",
        "company_id": "BAJFINANCE.NS",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_BAJFINANCE.NS_2022_02",
        "company_id": "BAJFINANCE.NS",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "BAC",
    "company_name": "Bank of America Corporation",
    "ticker": "BAC",
    "exchange": "NYSE",
    "main_country": "United States",
    "niche": "Global Diversified Banking & Financial Services",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 585486.29,
      "cost_of_revenue_usd_m": 263468.83,
      "operating_expense_usd_m": 146371.57,
      "operating_income_usd_m": 175645.89,
      "net_income_usd_m": 140516.71,
      "cash_usd_m": 876857.08,
      "total_debt_usd_m": 300278.26,
      "total_assets_usd_m": 1217135.34,
      "equity_usd_m": 916857.08,
      "operating_cash_flow_usd_m": 168620.05,
      "capex_usd_m": 50586.02,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 50.08,
      "high": 50.43,
      "low": 49.94,
      "close": 49.97,
      "adjusted_close": 49.97,
      "volume": 1153854.0,
      "market_cap_usd_bn": 124.92
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 70541.26,
      "sector_index_close": 28437.01,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "United States",
      "date": "2026-10-23",
      "policy_rate_pct": 0.41,
      "cpi_index": 304.97,
      "unemployment_rate_pct": 7.95,
      "consumer_confidence_index": 110.91,
      "gdp_growth_pct": 1.33,
      "fx_rate_per_usd": 0.9959,
      "bond_yield_10y_pct": 2.44
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_BAC_2021_01",
        "company_id": "BAC",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_BAC_2022_02",
        "company_id": "BAC",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "BHARTIARTL.NS",
    "company_name": "Bharti Airtel Limited",
    "ticker": "BHARTIARTL.NS",
    "exchange": "NSE",
    "main_country": "India",
    "niche": "Telecommunications & Digital Services",
    "currency": "INR",
    "fiscal_year_end": "03-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 18403.71,
      "cost_of_revenue_usd_m": 10674.15,
      "operating_expense_usd_m": 4048.82,
      "operating_income_usd_m": 3680.74,
      "net_income_usd_m": 2760.56,
      "cash_usd_m": 8849.19,
      "total_debt_usd_m": 7079.35,
      "total_assets_usd_m": 39821.36,
      "equity_usd_m": 32742.01,
      "operating_cash_flow_usd_m": 3450.7,
      "capex_usd_m": 1207.74,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 16476662.88,
      "high": 16637031.44,
      "low": 16331391.73,
      "close": 16530411.32,
      "adjusted_close": 16530411.32,
      "volume": 1409746.0,
      "market_cap_usd_bn": 1163740.96
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 323996061.87,
      "sector_index_close": 340195864.96,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "India",
      "date": "2026-10-23",
      "policy_rate_pct": 6.5,
      "cpi_index": 230.0,
      "unemployment_rate_pct": 7.1,
      "consumer_confidence_index": 94.5,
      "gdp_growth_pct": 6.8,
      "fx_rate_per_usd": 87.0,
      "bond_yield_10y_pct": 7.12
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_BHARTIARTL.NS_2021_01",
        "company_id": "BHARTIARTL.NS",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_BHARTIARTL.NS_2022_02",
        "company_id": "BHARTIARTL.NS",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "BLK",
    "company_name": "BlackRock, Inc.",
    "ticker": "BLK",
    "exchange": "NYSE",
    "main_country": "United States",
    "niche": "Asset Management & Financial Risk Analytics",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 541350.32,
      "cost_of_revenue_usd_m": 243607.65,
      "operating_expense_usd_m": 135337.58,
      "operating_income_usd_m": 162405.1,
      "net_income_usd_m": 129924.08,
      "cash_usd_m": 809120.4,
      "total_debt_usd_m": 278841.15,
      "total_assets_usd_m": 1127961.55,
      "equity_usd_m": 849120.4,
      "operating_cash_flow_usd_m": 155908.89,
      "capex_usd_m": 46772.67,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 1709.62,
      "high": 1715.8,
      "low": 1706.26,
      "close": 1709.01,
      "adjusted_close": 1709.01,
      "volume": 3244366.0,
      "market_cap_usd_bn": 4272.52
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 62358.31,
      "sector_index_close": 27298.02,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "United States",
      "date": "2026-10-23",
      "policy_rate_pct": 0.38,
      "cpi_index": 304.91,
      "unemployment_rate_pct": 7.91,
      "consumer_confidence_index": 109.73,
      "gdp_growth_pct": 1.4,
      "fx_rate_per_usd": 0.9729,
      "bond_yield_10y_pct": 2.51
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_BLK_2021_01",
        "company_id": "BLK",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_BLK_2022_02",
        "company_id": "BLK",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "CVX",
    "company_name": "Chevron Corporation",
    "ticker": "CVX",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Energy & Integrated Oil & Gas",
    "currency": "USD",
    "fiscal_year_end": "December",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 320427.12,
      "cost_of_revenue_usd_m": 198664.81,
      "operating_expense_usd_m": 57676.88,
      "operating_income_usd_m": 64085.43,
      "net_income_usd_m": 49986.64,
      "cash_usd_m": 48152.77,
      "total_debt_usd_m": 112083.42,
      "total_assets_usd_m": 448698.05,
      "equity_usd_m": 336614.63,
      "operating_cash_flow_usd_m": 62483.3,
      "capex_usd_m": 25634.17,
      "shares_outstanding_m": 965.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 2319.65,
      "high": 2329.08,
      "low": 2312.31,
      "close": 2324.13,
      "adjusted_close": 2324.13,
      "volume": 8892339.0,
      "market_cap_usd_bn": 3486.2
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5787.6,
      "sector_index_close": 1100.22,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 5.06,
      "cpi_index": 315.99,
      "unemployment_rate_pct": 4.62,
      "consumer_confidence_index": 70.53,
      "gdp_growth_pct": 3.25,
      "fx_rate_per_usd": 1.015,
      "bond_yield_10y_pct": 2.42
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_CVX_2021_01",
        "company_id": "CVX",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_CVX_2022_02",
        "company_id": "CVX",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "CI",
    "company_name": "The Cigna Group",
    "ticker": "CI",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Healthcare & Managed Care",
    "currency": "USD",
    "fiscal_year_end": "December",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 287721.74,
      "cost_of_revenue_usd_m": 178387.48,
      "operating_expense_usd_m": 51789.91,
      "operating_income_usd_m": 57544.35,
      "net_income_usd_m": 44884.59,
      "cash_usd_m": 42745.81,
      "total_debt_usd_m": 100299.95,
      "total_assets_usd_m": 402718.8,
      "equity_usd_m": 302418.85,
      "operating_cash_flow_usd_m": 56105.74,
      "capex_usd_m": 23017.74,
      "shares_outstanding_m": 965.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 160.23,
      "high": 161.31,
      "low": 159.27,
      "close": 159.44,
      "adjusted_close": 159.44,
      "volume": 7896473.0,
      "market_cap_usd_bn": 239.16
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5807.66,
      "sector_index_close": 1096.65,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 4.94,
      "cpi_index": 315.99,
      "unemployment_rate_pct": 4.55,
      "consumer_confidence_index": 70.53,
      "gdp_growth_pct": 3.25,
      "fx_rate_per_usd": 1.015,
      "bond_yield_10y_pct": 2.42
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_CI_2021_01",
        "company_id": "CI",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_CI_2022_02",
        "company_id": "CI",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "KO",
    "company_name": "The Coca-Cola Company",
    "ticker": "KO",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Consumer Staples / Non-Alcoholic Beverages",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 47695.16,
      "cost_of_revenue_usd_m": 18867.42,
      "operating_expense_usd_m": 15158.62,
      "operating_income_usd_m": 13669.12,
      "net_income_usd_m": 10632.21,
      "cash_usd_m": 19173.33,
      "total_debt_usd_m": 44905.93,
      "total_assets_usd_m": 150939.28,
      "equity_usd_m": 86033.35,
      "operating_cash_flow_usd_m": 14517.27,
      "capex_usd_m": 1716.14,
      "shares_outstanding_m": 4300.03,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 65.47,
      "high": 65.73,
      "low": 64.71,
      "close": 65.27,
      "adjusted_close": 65.27,
      "volume": 26037152.0,
      "market_cap_usd_bn": 280.66
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5780.32,
      "sector_index_close": 3468.19,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 4.61,
      "cpi_index": 316.03,
      "unemployment_rate_pct": 3.81,
      "consumer_confidence_index": 95.77,
      "gdp_growth_pct": 2.86,
      "fx_rate_per_usd": 1.0,
      "bond_yield_10y_pct": 4.06
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_KO_2021_01",
        "company_id": "KO",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_KO_2022_02",
        "company_id": "KO",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "COST",
    "company_name": "Costco Wholesale Corporation",
    "ticker": "COST",
    "exchange": "NASDAQ",
    "main_country": "USA",
    "niche": "Wholesale Retail & Membership Warehouses",
    "currency": "USD",
    "fiscal_year_end": "August",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 160647.66,
      "cost_of_revenue_usd_m": 72291.45,
      "operating_expense_usd_m": 40161.92,
      "operating_income_usd_m": 48194.29,
      "net_income_usd_m": 38555.43,
      "cash_usd_m": 106387.74,
      "total_debt_usd_m": 63832.64,
      "total_assets_usd_m": 425550.96,
      "equity_usd_m": 361718.32,
      "operating_cash_flow_usd_m": 46266.52,
      "capex_usd_m": 16193.28,
      "shares_outstanding_m": 443.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 548.04,
      "high": 553.2,
      "low": 547.77,
      "close": 548.46,
      "adjusted_close": 548.46,
      "volume": 8247995.0,
      "market_cap_usd_bn": 242.97
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5800.0,
      "sector_index_close": 20000.0,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 0.0,
      "cpi_index": 310.9,
      "unemployment_rate_pct": 3.4,
      "consumer_confidence_index": 73.68,
      "gdp_growth_pct": 3.58,
      "fx_rate_per_usd": 1.0005,
      "bond_yield_10y_pct": 5.0
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_COST_2021_01",
        "company_id": "COST",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_COST_2022_02",
        "company_id": "COST",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "DEEPSEEK",
    "company_name": "DeepSeek",
    "ticker": "DEEPSEEK",
    "exchange": "PRIVATE_GLOBAL",
    "main_country": "CN",
    "niche": "Open Reasoning & High-Efficiency LLMs",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 5959.08,
      "cost_of_revenue_usd_m": 2684.96,
      "operating_expense_usd_m": 2384.68,
      "operating_income_usd_m": 889.44,
      "net_income_usd_m": 729.34,
      "cash_usd_m": 7881.53,
      "total_debt_usd_m": 1888.84,
      "total_assets_usd_m": 22681.53,
      "equity_usd_m": 20792.69,
      "operating_cash_flow_usd_m": 838.74,
      "capex_usd_m": 2082.67,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 121.09,
      "high": 121.51,
      "low": 120.33,
      "close": 120.98,
      "adjusted_close": 120.98,
      "volume": 11507565.0,
      "market_cap_usd_bn": 302.45
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5573.47,
      "sector_index_close": 6414.64,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "CN",
      "date": "2026-10-23",
      "policy_rate_pct": 3.25,
      "cpi_index": 288.0,
      "unemployment_rate_pct": 3.9,
      "consumer_confidence_index": 85.97,
      "gdp_growth_pct": 3.29,
      "fx_rate_per_usd": 7.2,
      "bond_yield_10y_pct": 4.45
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_DEEPSEEK_2021_01",
        "company_id": "DEEPSEEK",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_DEEPSEEK_2022_02",
        "company_id": "DEEPSEEK",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "DELL",
    "company_name": "Dell Technologies Inc.",
    "ticker": "DELL",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Technology & AI Infrastructure Servers",
    "currency": "USD",
    "fiscal_year_end": "January",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 152133.39,
      "cost_of_revenue_usd_m": 94322.7,
      "operating_expense_usd_m": 27384.01,
      "operating_income_usd_m": 30426.68,
      "net_income_usd_m": 23732.81,
      "cash_usd_m": 22813.71,
      "total_debt_usd_m": 53208.23,
      "total_assets_usd_m": 213258.59,
      "equity_usd_m": 160050.36,
      "operating_cash_flow_usd_m": 29666.01,
      "capex_usd_m": 12170.67,
      "shares_outstanding_m": 965.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 64.38,
      "high": 64.41,
      "low": 63.55,
      "close": 64.23,
      "adjusted_close": 64.23,
      "volume": 7646409.0,
      "market_cap_usd_bn": 96.34
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5794.59,
      "sector_index_close": 1106.52,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 5.01,
      "cpi_index": 315.99,
      "unemployment_rate_pct": 4.6,
      "consumer_confidence_index": 70.53,
      "gdp_growth_pct": 3.25,
      "fx_rate_per_usd": 1.015,
      "bond_yield_10y_pct": 2.42
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_DELL_2021_01",
        "company_id": "DELL",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_DELL_2022_02",
        "company_id": "DELL",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "ELV",
    "company_name": "Elevance Health, Inc.",
    "ticker": "ELV",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Healthcare & Health Benefits",
    "currency": "USD",
    "fiscal_year_end": "December",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 271361.49,
      "cost_of_revenue_usd_m": 168244.12,
      "operating_expense_usd_m": 48845.07,
      "operating_income_usd_m": 54272.3,
      "net_income_usd_m": 42332.39,
      "cash_usd_m": 40386.72,
      "total_debt_usd_m": 95145.67,
      "total_assets_usd_m": 379330.72,
      "equity_usd_m": 284185.05,
      "operating_cash_flow_usd_m": 52915.49,
      "capex_usd_m": 21708.92,
      "shares_outstanding_m": 965.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 937.71,
      "high": 941.05,
      "low": 934.8,
      "close": 940.96,
      "adjusted_close": 940.96,
      "volume": 8365108.0,
      "market_cap_usd_bn": 1411.44
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5799.35,
      "sector_index_close": 1099.74,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 5.0,
      "cpi_index": 315.99,
      "unemployment_rate_pct": 4.39,
      "consumer_confidence_index": 70.53,
      "gdp_growth_pct": 3.25,
      "fx_rate_per_usd": 1.015,
      "bond_yield_10y_pct": 2.42
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_ELV_2021_01",
        "company_id": "ELV",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_ELV_2022_02",
        "company_id": "ELV",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "XOM",
    "company_name": "Exxon Mobil Corporation",
    "ticker": "XOM",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Energy & Integrated Oil & Gas",
    "currency": "USD",
    "fiscal_year_end": "December",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 448852.17,
      "cost_of_revenue_usd_m": 278288.35,
      "operating_expense_usd_m": 80793.39,
      "operating_income_usd_m": 89770.43,
      "net_income_usd_m": 70020.94,
      "cash_usd_m": 67543.04,
      "total_debt_usd_m": 157449.02,
      "total_assets_usd_m": 629439.59,
      "equity_usd_m": 471990.57,
      "operating_cash_flow_usd_m": 87526.18,
      "capex_usd_m": 35908.17,
      "shares_outstanding_m": 965.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 88.75,
      "high": 89.89,
      "low": 88.45,
      "close": 89.37,
      "adjusted_close": 89.37,
      "volume": 14071525.0,
      "market_cap_usd_bn": 134.06
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5813.28,
      "sector_index_close": 1096.39,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 5.01,
      "cpi_index": 315.99,
      "unemployment_rate_pct": 4.62,
      "consumer_confidence_index": 70.53,
      "gdp_growth_pct": 3.25,
      "fx_rate_per_usd": 1.015,
      "bond_yield_10y_pct": 2.42
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_XOM_2021_01",
        "company_id": "XOM",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_XOM_2022_02",
        "company_id": "XOM",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "FDX",
    "company_name": "FedEx Corporation",
    "ticker": "FDX",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Logistics & Transportation",
    "currency": "USD",
    "fiscal_year_end": "May",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 141816.24,
      "cost_of_revenue_usd_m": 87926.07,
      "operating_expense_usd_m": 25526.92,
      "operating_income_usd_m": 28363.25,
      "net_income_usd_m": 22123.34,
      "cash_usd_m": 20957.51,
      "total_debt_usd_m": 50022.94,
      "total_assets_usd_m": 198684.58,
      "equity_usd_m": 148661.64,
      "operating_cash_flow_usd_m": 27654.18,
      "capex_usd_m": 11345.3,
      "shares_outstanding_m": 965.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 300.77,
      "high": 301.45,
      "low": 299.65,
      "close": 300.07,
      "adjusted_close": 300.07,
      "volume": 3494364.0,
      "market_cap_usd_bn": 450.1
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5799.23,
      "sector_index_close": 1103.3,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 4.97,
      "cpi_index": 315.99,
      "unemployment_rate_pct": 4.55,
      "consumer_confidence_index": 70.53,
      "gdp_growth_pct": 3.25,
      "fx_rate_per_usd": 1.015,
      "bond_yield_10y_pct": 2.42
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_FDX_2021_01",
        "company_id": "FDX",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_FDX_2022_02",
        "company_id": "FDX",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "FLIPKART",
    "company_name": "Flipkart Private Limited",
    "ticker": "FLIPKART",
    "exchange": "PRIVATE_WALMART",
    "main_country": "India",
    "niche": "E-Commerce & Digital Supply Chain Logistics",
    "currency": "INR",
    "fiscal_year_end": "03-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 586881.48,
      "cost_of_revenue_usd_m": 264096.67,
      "operating_expense_usd_m": 146720.37,
      "operating_income_usd_m": 176064.44,
      "net_income_usd_m": 140851.56,
      "cash_usd_m": 873586.41,
      "total_debt_usd_m": 300400.05,
      "total_assets_usd_m": 1213986.46,
      "equity_usd_m": 913586.41,
      "operating_cash_flow_usd_m": 169021.87,
      "capex_usd_m": 50706.56,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 455.0,
      "high": 456.49,
      "low": 453.28,
      "close": 455.37,
      "adjusted_close": 455.37,
      "volume": 4349373.0,
      "market_cap_usd_bn": 1138.42
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 69101.03,
      "sector_index_close": 28356.05,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "India",
      "date": "2026-10-23",
      "policy_rate_pct": 0.43,
      "cpi_index": 304.84,
      "unemployment_rate_pct": 7.94,
      "consumer_confidence_index": 110.34,
      "gdp_growth_pct": 1.26,
      "fx_rate_per_usd": 85.21,
      "bond_yield_10y_pct": 2.45
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_FLIPKART_2021_01",
        "company_id": "FLIPKART",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_FLIPKART_2022_02",
        "company_id": "FLIPKART",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "F",
    "company_name": "Ford Motor Company",
    "ticker": "F",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Automotive & Ford Pro",
    "currency": "USD",
    "fiscal_year_end": "December",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 256048.08,
      "cost_of_revenue_usd_m": 158749.81,
      "operating_expense_usd_m": 46088.65,
      "operating_income_usd_m": 51209.62,
      "net_income_usd_m": 39943.5,
      "cash_usd_m": 38257.01,
      "total_debt_usd_m": 89529.56,
      "total_assets_usd_m": 358131.37,
      "equity_usd_m": 268601.81,
      "operating_cash_flow_usd_m": 49929.38,
      "capex_usd_m": 20483.85,
      "shares_outstanding_m": 965.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 15.07,
      "high": 15.1,
      "low": 14.99,
      "close": 15.08,
      "adjusted_close": 15.08,
      "volume": 12705885.0,
      "market_cap_usd_bn": 22.62
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5821.24,
      "sector_index_close": 1093.95,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 5.02,
      "cpi_index": 315.99,
      "unemployment_rate_pct": 4.39,
      "consumer_confidence_index": 70.53,
      "gdp_growth_pct": 3.25,
      "fx_rate_per_usd": 1.015,
      "bond_yield_10y_pct": 2.42
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_F_2021_01",
        "company_id": "F",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_F_2022_02",
        "company_id": "F",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "GM",
    "company_name": "General Motors Company",
    "ticker": "GM",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Automotive & Electric Vehicles",
    "currency": "USD",
    "fiscal_year_end": "December",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 239282.9,
      "cost_of_revenue_usd_m": 148355.4,
      "operating_expense_usd_m": 43070.92,
      "operating_income_usd_m": 47856.58,
      "net_income_usd_m": 37328.13,
      "cash_usd_m": 36094.92,
      "total_debt_usd_m": 83656.32,
      "total_assets_usd_m": 334738.78,
      "equity_usd_m": 251082.46,
      "operating_cash_flow_usd_m": 46660.16,
      "capex_usd_m": 19142.63,
      "shares_outstanding_m": 965.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 64.66,
      "high": 64.94,
      "low": 63.91,
      "close": 64.34,
      "adjusted_close": 64.34,
      "volume": 12965164.0,
      "market_cap_usd_bn": 96.51
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5802.26,
      "sector_index_close": 1109.25,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 4.95,
      "cpi_index": 315.99,
      "unemployment_rate_pct": 4.62,
      "consumer_confidence_index": 70.53,
      "gdp_growth_pct": 3.25,
      "fx_rate_per_usd": 1.015,
      "bond_yield_10y_pct": 2.42
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_GM_2021_01",
        "company_id": "GM",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_GM_2022_02",
        "company_id": "GM",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "GS",
    "company_name": "The Goldman Sachs Group, Inc.",
    "ticker": "GS",
    "exchange": "NYSE",
    "main_country": "United States",
    "niche": "Investment Banking & Institutional Markets",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 541083.81,
      "cost_of_revenue_usd_m": 243487.71,
      "operating_expense_usd_m": 135270.95,
      "operating_income_usd_m": 162325.14,
      "net_income_usd_m": 129860.11,
      "cash_usd_m": 807270.98,
      "total_debt_usd_m": 278041.06,
      "total_assets_usd_m": 1125312.04,
      "equity_usd_m": 847270.98,
      "operating_cash_flow_usd_m": 155832.14,
      "capex_usd_m": 46749.64,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 490.81,
      "high": 492.47,
      "low": 489.96,
      "close": 491.16,
      "adjusted_close": 491.16,
      "volume": 8689801.0,
      "market_cap_usd_bn": 1227.9
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 64455.2,
      "sector_index_close": 26940.29,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "United States",
      "date": "2026-10-23",
      "policy_rate_pct": 0.4,
      "cpi_index": 304.95,
      "unemployment_rate_pct": 7.96,
      "consumer_confidence_index": 110.11,
      "gdp_growth_pct": 1.44,
      "fx_rate_per_usd": 0.948,
      "bond_yield_10y_pct": 2.45
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_GS_2021_01",
        "company_id": "GS",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_GS_2022_02",
        "company_id": "GS",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "0",
    "company_name": "0",
    "ticker": "0",
    "exchange": "0",
    "main_country": "0",
    "niche": "0",
    "currency": "0",
    "fiscal_year_end": "0",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 3813.3,
      "cost_of_revenue_usd_m": 1732.83,
      "operating_expense_usd_m": 3400.98,
      "operating_income_usd_m": -1320.51,
      "net_income_usd_m": -1056.41,
      "cash_usd_m": 12068.93,
      "total_debt_usd_m": 699.78,
      "total_assets_usd_m": 23101.2,
      "equity_usd_m": 22401.42,
      "operating_cash_flow_usd_m": -956.45,
      "capex_usd_m": 3148.19,
      "shares_outstanding_m": 500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 449.53,
      "high": 450.18,
      "low": 448.52,
      "close": 449.38,
      "adjusted_close": 449.38,
      "volume": 6320765.0,
      "market_cap_usd_bn": 219.91
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 4494.02,
      "sector_index_close": 21546.13,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "0",
      "date": "2026-10-23",
      "policy_rate_pct": 4.5,
      "cpi_index": 312.99,
      "unemployment_rate_pct": 3.83,
      "consumer_confidence_index": 54.64,
      "gdp_growth_pct": 2.19,
      "fx_rate_per_usd": 1.0,
      "bond_yield_10y_pct": 4.45
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_0_2021_01",
        "company_id": "0",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_0_2022_02",
        "company_id": "0",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "HDFCBANK.NS",
    "company_name": "HDFC Bank Limited",
    "ticker": "HDFCBANK.NS",
    "exchange": "NSE",
    "main_country": "India",
    "niche": "Private Sector Banking & Financial Services",
    "currency": "INR",
    "fiscal_year_end": "03-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 28155.39,
      "cost_of_revenue_usd_m": 16330.13,
      "operating_expense_usd_m": 6194.19,
      "operating_income_usd_m": 5631.07,
      "net_income_usd_m": 4223.3,
      "cash_usd_m": 13978.89,
      "total_debt_usd_m": 11183.11,
      "total_assets_usd_m": 62905.0,
      "equity_usd_m": 51721.89,
      "operating_cash_flow_usd_m": 5279.12,
      "capex_usd_m": 1847.69,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 82886853.0,
      "high": 84045073.15,
      "low": 82601530.24,
      "close": 83279519.01,
      "adjusted_close": 83279519.01,
      "volume": 1251033.0,
      "market_cap_usd_bn": 7823227.54
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 1236574676.21,
      "sector_index_close": 1298403410.02,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "India",
      "date": "2026-10-23",
      "policy_rate_pct": 6.5,
      "cpi_index": 230.0,
      "unemployment_rate_pct": 7.1,
      "consumer_confidence_index": 94.5,
      "gdp_growth_pct": 6.8,
      "fx_rate_per_usd": 87.0,
      "bond_yield_10y_pct": 7.12
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_HDFCBANK.NS_2021_01",
        "company_id": "HDFCBANK.NS",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_HDFCBANK.NS_2022_02",
        "company_id": "HDFCBANK.NS",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "HINDUNILVR.NS",
    "company_name": "Hindustan Unilever Limited",
    "ticker": "HINDUNILVR.NS",
    "exchange": "NSE",
    "main_country": "India",
    "niche": "Fast-Moving Consumer Goods (FMCG)",
    "currency": "INR",
    "fiscal_year_end": "03-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 7247.05,
      "cost_of_revenue_usd_m": 4203.29,
      "operating_expense_usd_m": 1594.35,
      "operating_income_usd_m": 1449.41,
      "net_income_usd_m": 1087.06,
      "cash_usd_m": 3488.87,
      "total_debt_usd_m": 2791.1,
      "total_assets_usd_m": 15699.92,
      "equity_usd_m": 12908.82,
      "operating_cash_flow_usd_m": 1358.82,
      "capex_usd_m": 475.59,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 443484449.7,
      "high": 447278060.18,
      "low": 440502048.31,
      "close": 445029134.97,
      "adjusted_close": 445029134.97,
      "volume": 4053425.0,
      "market_cap_usd_bn": 12715118.14
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 4450291349.7,
      "sector_index_close": 4672805917.19,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "India",
      "date": "2026-10-23",
      "policy_rate_pct": 6.5,
      "cpi_index": 230.0,
      "unemployment_rate_pct": 7.1,
      "consumer_confidence_index": 94.5,
      "gdp_growth_pct": 6.8,
      "fx_rate_per_usd": 87.0,
      "bond_yield_10y_pct": 7.12
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_HINDUNILVR.NS_2021_01",
        "company_id": "HINDUNILVR.NS",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_HINDUNILVR.NS_2022_02",
        "company_id": "HINDUNILVR.NS",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "HD",
    "company_name": "The Home Depot, Inc.",
    "ticker": "HD",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Retail & Home Improvement",
    "currency": "USD",
    "fiscal_year_end": "January",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 247881.54,
      "cost_of_revenue_usd_m": 153686.55,
      "operating_expense_usd_m": 44618.68,
      "operating_income_usd_m": 49576.31,
      "net_income_usd_m": 38669.52,
      "cash_usd_m": 37089.81,
      "total_debt_usd_m": 87283.3,
      "total_assets_usd_m": 346256.87,
      "equity_usd_m": 258973.57,
      "operating_cash_flow_usd_m": 48336.9,
      "capex_usd_m": 19830.52,
      "shares_outstanding_m": 965.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 965.47,
      "high": 973.39,
      "low": 956.13,
      "close": 972.41,
      "adjusted_close": 972.41,
      "volume": 13325542.0,
      "market_cap_usd_bn": 1458.62
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5786.16,
      "sector_index_close": 1102.98,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 5.1,
      "cpi_index": 315.99,
      "unemployment_rate_pct": 4.55,
      "consumer_confidence_index": 70.53,
      "gdp_growth_pct": 3.25,
      "fx_rate_per_usd": 1.015,
      "bond_yield_10y_pct": 2.42
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_HD_2021_01",
        "company_id": "HD",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_HD_2022_02",
        "company_id": "HD",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "ICICIBANK.NS",
    "company_name": "ICICI Bank Limited",
    "ticker": "ICICIBANK.NS",
    "exchange": "NSE",
    "main_country": "India",
    "niche": "Private Banking & Wealth Management",
    "currency": "INR",
    "fiscal_year_end": "03-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 21505.95,
      "cost_of_revenue_usd_m": 12473.45,
      "operating_expense_usd_m": 4731.31,
      "operating_income_usd_m": 4301.19,
      "net_income_usd_m": 3225.89,
      "cash_usd_m": 10166.39,
      "total_debt_usd_m": 8133.11,
      "total_assets_usd_m": 45748.76,
      "equity_usd_m": 37615.65,
      "operating_cash_flow_usd_m": 4032.36,
      "capex_usd_m": 1411.33,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 2228088.55,
      "high": 2242539.63,
      "low": 2222315.85,
      "close": 2226416.92,
      "adjusted_close": 2226416.92,
      "volume": 622865.0,
      "market_cap_usd_bn": 188847.86
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 48702870.12,
      "sector_index_close": 51138013.63,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "India",
      "date": "2026-10-23",
      "policy_rate_pct": 6.5,
      "cpi_index": 230.0,
      "unemployment_rate_pct": 7.1,
      "consumer_confidence_index": 94.5,
      "gdp_growth_pct": 6.8,
      "fx_rate_per_usd": 87.0,
      "bond_yield_10y_pct": 7.12
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_ICICIBANK.NS_2021_01",
        "company_id": "ICICIBANK.NS",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_ICICIBANK.NS_2022_02",
        "company_id": "ICICIBANK.NS",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "INTC",
    "company_name": "Intel Corporation",
    "ticker": "INTC",
    "exchange": "NASDAQ",
    "main_country": "USA",
    "niche": "Semiconductors & Foundry Services",
    "currency": "USD",
    "fiscal_year_end": "December",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 34979.74,
      "cost_of_revenue_usd_m": 15740.88,
      "operating_expense_usd_m": 8744.94,
      "operating_income_usd_m": 10493.92,
      "net_income_usd_m": 8395.14,
      "cash_usd_m": 30987.02,
      "total_debt_usd_m": 18592.21,
      "total_assets_usd_m": 123948.08,
      "equity_usd_m": 105355.87,
      "operating_cash_flow_usd_m": 10074.17,
      "capex_usd_m": 3525.96,
      "shares_outstanding_m": 4250.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 57.71,
      "high": 58.11,
      "low": 57.58,
      "close": 57.77,
      "adjusted_close": 57.77,
      "volume": 13519204.0,
      "market_cap_usd_bn": 245.52
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5800.0,
      "sector_index_close": 20000.0,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 0.0,
      "cpi_index": 310.9,
      "unemployment_rate_pct": 3.4,
      "consumer_confidence_index": 73.68,
      "gdp_growth_pct": 3.58,
      "fx_rate_per_usd": 1.0005,
      "bond_yield_10y_pct": 5.0
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_INTC_2021_01",
        "company_id": "INTC",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_INTC_2022_02",
        "company_id": "INTC",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "JPM",
    "company_name": "JPMorgan Chase & Co.",
    "ticker": "JPM",
    "exchange": "NYSE",
    "main_country": "United States",
    "niche": "Universal Banking & Investment Services",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 584345.77,
      "cost_of_revenue_usd_m": 262955.6,
      "operating_expense_usd_m": 146086.44,
      "operating_income_usd_m": 175303.73,
      "net_income_usd_m": 140242.98,
      "cash_usd_m": 876100.68,
      "total_debt_usd_m": 299614.41,
      "total_assets_usd_m": 1215715.09,
      "equity_usd_m": 916100.68,
      "operating_cash_flow_usd_m": 168291.58,
      "capex_usd_m": 50487.47,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 268.39,
      "high": 269.42,
      "low": 266.83,
      "close": 267.7,
      "adjusted_close": 267.7,
      "volume": 7488067.0,
      "market_cap_usd_bn": 669.25
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 70828.4,
      "sector_index_close": 28657.46,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "United States",
      "date": "2026-10-23",
      "policy_rate_pct": 0.37,
      "cpi_index": 305.22,
      "unemployment_rate_pct": 7.85,
      "consumer_confidence_index": 109.5,
      "gdp_growth_pct": 1.52,
      "fx_rate_per_usd": 1.0334,
      "bond_yield_10y_pct": 2.49
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_JPM_2021_01",
        "company_id": "JPM",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_JPM_2022_02",
        "company_id": "JPM",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "META_AI",
    "company_name": "Meta AI",
    "ticker": "META_AI",
    "exchange": "NASDAQ",
    "main_country": "US",
    "niche": "Open-Weight Llama Series & FAIR Research",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 5950.97,
      "cost_of_revenue_usd_m": 2670.82,
      "operating_expense_usd_m": 2377.36,
      "operating_income_usd_m": 902.79,
      "net_income_usd_m": 740.29,
      "cash_usd_m": 7912.51,
      "total_debt_usd_m": 1885.37,
      "total_assets_usd_m": 22712.51,
      "equity_usd_m": 20827.14,
      "operating_cash_flow_usd_m": 851.33,
      "capex_usd_m": 2061.6,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 167.52,
      "high": 168.62,
      "low": 166.87,
      "close": 168.21,
      "adjusted_close": 168.21,
      "volume": 10585512.0,
      "market_cap_usd_bn": 420.52
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5577.0,
      "sector_index_close": 6408.73,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "US",
      "date": "2026-10-23",
      "policy_rate_pct": 3.25,
      "cpi_index": 288.0,
      "unemployment_rate_pct": 3.9,
      "consumer_confidence_index": 82.68,
      "gdp_growth_pct": 3.82,
      "fx_rate_per_usd": 1.0,
      "bond_yield_10y_pct": 4.45
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_META_AI_2021_01",
        "company_id": "META_AI",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_META_AI_2022_02",
        "company_id": "META_AI",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "META",
    "company_name": "Meta Platforms, Inc.",
    "ticker": "META",
    "exchange": "NASDAQ",
    "main_country": "United States",
    "niche": "Social Media & Artificial Intelligence",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 108163.26,
      "cost_of_revenue_usd_m": 30285.71,
      "operating_expense_usd_m": 37857.14,
      "operating_income_usd_m": 40020.41,
      "net_income_usd_m": 32816.74,
      "cash_usd_m": 95617.6,
      "total_debt_usd_m": 84993.42,
      "total_assets_usd_m": 382470.4,
      "equity_usd_m": 297476.98,
      "operating_cash_flow_usd_m": 41020.92,
      "capex_usd_m": 19469.39,
      "shares_outstanding_m": 2200.03,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 432.4,
      "high": 432.65,
      "low": 429.37,
      "close": 432.13,
      "adjusted_close": 432.13,
      "volume": 7609862.0,
      "market_cap_usd_bn": 388.92
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5449.76,
      "sector_index_close": 6103.73,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "United States",
      "date": "2026-10-23",
      "policy_rate_pct": 5.22,
      "cpi_index": 312.99,
      "unemployment_rate_pct": 3.74,
      "consumer_confidence_index": 93.54,
      "gdp_growth_pct": 2.65,
      "fx_rate_per_usd": 1.0,
      "bond_yield_10y_pct": 3.93
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_META_2021_01",
        "company_id": "META",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_META_2022_02",
        "company_id": "META",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "MSFT",
    "company_name": "Microsoft Corporation",
    "ticker": "MSFT",
    "exchange": "NASDAQ",
    "main_country": "United States",
    "niche": "Enterprise Cloud & Software",
    "currency": "USD",
    "fiscal_year_end": "06-30",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 584264.44,
      "cost_of_revenue_usd_m": 262919.0,
      "operating_expense_usd_m": 146066.11,
      "operating_income_usd_m": 175279.33,
      "net_income_usd_m": 140223.46,
      "cash_usd_m": 874578.75,
      "total_debt_usd_m": 300288.86,
      "total_assets_usd_m": 1214867.61,
      "equity_usd_m": 914578.75,
      "operating_cash_flow_usd_m": 168268.16,
      "capex_usd_m": 50480.45,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 492.83,
      "high": 494.66,
      "low": 489.82,
      "close": 490.96,
      "adjusted_close": 490.96,
      "volume": 3328995.0,
      "market_cap_usd_bn": 1227.4
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 72111.5,
      "sector_index_close": 29819.03,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "United States",
      "date": "2026-10-23",
      "policy_rate_pct": 0.45,
      "cpi_index": 305.04,
      "unemployment_rate_pct": 7.88,
      "consumer_confidence_index": 109.83,
      "gdp_growth_pct": 1.3,
      "fx_rate_per_usd": 1.023,
      "bond_yield_10y_pct": 2.49
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_MSFT_2021_01",
        "company_id": "MSFT",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_MSFT_2022_02",
        "company_id": "MSFT",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "NFLX",
    "company_name": "Netflix, Inc.",
    "ticker": "NFLX",
    "exchange": "NASDAQ",
    "main_country": "USA",
    "niche": "Streaming Entertainment & Media",
    "currency": "USD",
    "fiscal_year_end": "December",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 24615.38,
      "cost_of_revenue_usd_m": 11076.92,
      "operating_expense_usd_m": 6153.84,
      "operating_income_usd_m": 7384.62,
      "net_income_usd_m": 5907.7,
      "cash_usd_m": 24768.42,
      "total_debt_usd_m": 14861.05,
      "total_assets_usd_m": 99073.68,
      "equity_usd_m": 84212.63,
      "operating_cash_flow_usd_m": 7089.24,
      "capex_usd_m": 2481.23,
      "shares_outstanding_m": 430.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 446.65,
      "high": 449.09,
      "low": 446.45,
      "close": 447.33,
      "adjusted_close": 447.33,
      "volume": 34622584.0,
      "market_cap_usd_bn": 192.35
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5800.0,
      "sector_index_close": 20000.0,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 0.0,
      "cpi_index": 310.9,
      "unemployment_rate_pct": 3.4,
      "consumer_confidence_index": 73.68,
      "gdp_growth_pct": 3.58,
      "fx_rate_per_usd": 1.0005,
      "bond_yield_10y_pct": 5.0
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_NFLX_2021_01",
        "company_id": "NFLX",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_NFLX_2022_02",
        "company_id": "NFLX",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "NKE",
    "company_name": "Nike, Inc.",
    "ticker": "NKE",
    "exchange": "NYSE",
    "main_country": "United States",
    "niche": "Athletic Footwear, Apparel & Equipment",
    "currency": "USD",
    "fiscal_year_end": "05-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 542087.35,
      "cost_of_revenue_usd_m": 243939.31,
      "operating_expense_usd_m": 135521.84,
      "operating_income_usd_m": 162626.21,
      "net_income_usd_m": 130100.96,
      "cash_usd_m": 810386.03,
      "total_debt_usd_m": 278174.44,
      "total_assets_usd_m": 1128560.47,
      "equity_usd_m": 850386.03,
      "operating_cash_flow_usd_m": 156121.16,
      "capex_usd_m": 46836.35,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 76.76,
      "high": 76.97,
      "low": 76.44,
      "close": 76.58,
      "adjusted_close": 76.58,
      "volume": 672922.0,
      "market_cap_usd_bn": 191.45
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 63152.87,
      "sector_index_close": 26021.42,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "United States",
      "date": "2026-10-23",
      "policy_rate_pct": 0.42,
      "cpi_index": 304.88,
      "unemployment_rate_pct": 7.88,
      "consumer_confidence_index": 110.78,
      "gdp_growth_pct": 1.48,
      "fx_rate_per_usd": 1.0347,
      "bond_yield_10y_pct": 2.51
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_NKE_2021_01",
        "company_id": "NKE",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_NKE_2022_02",
        "company_id": "NKE",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "NVDA",
    "company_name": "NVIDIA Corporation",
    "ticker": "NVDA",
    "exchange": "NASDAQ",
    "main_country": "USA",
    "niche": "Semiconductors & AI Hardware",
    "currency": "USD",
    "fiscal_year_end": "January",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 67368.38,
      "cost_of_revenue_usd_m": 30315.77,
      "operating_expense_usd_m": 16842.1,
      "operating_income_usd_m": 20210.51,
      "net_income_usd_m": 16168.41,
      "cash_usd_m": 50420.19,
      "total_debt_usd_m": 30252.11,
      "total_assets_usd_m": 201680.76,
      "equity_usd_m": 171428.65,
      "operating_cash_flow_usd_m": 19402.09,
      "capex_usd_m": 6790.73,
      "shares_outstanding_m": 24500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 305.49,
      "high": 305.5,
      "low": 304.42,
      "close": 304.47,
      "adjusted_close": 304.47,
      "volume": 37931606.0,
      "market_cap_usd_bn": 7459.52
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5800.0,
      "sector_index_close": 20000.0,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 0.0,
      "cpi_index": 310.9,
      "unemployment_rate_pct": 3.4,
      "consumer_confidence_index": 73.68,
      "gdp_growth_pct": 3.58,
      "fx_rate_per_usd": 1.0005,
      "bond_yield_10y_pct": 5.0
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_NVDA_2021_01",
        "company_id": "NVDA",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_NVDA_2022_02",
        "company_id": "NVDA",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "0",
    "company_name": "0",
    "ticker": "0",
    "exchange": "0",
    "main_country": "0",
    "niche": "0",
    "currency": "0",
    "fiscal_year_end": "0",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 4379.59,
      "cost_of_revenue_usd_m": 1983.41,
      "operating_expense_usd_m": 3905.25,
      "operating_income_usd_m": -1509.07,
      "net_income_usd_m": -1207.26,
      "cash_usd_m": 8786.21,
      "total_debt_usd_m": 699.78,
      "total_assets_usd_m": 18177.12,
      "equity_usd_m": 17477.34,
      "operating_cash_flow_usd_m": -1107.3,
      "capex_usd_m": 3137.67,
      "shares_outstanding_m": 500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 161.11,
      "high": 161.33,
      "low": 160.26,
      "close": 161.08,
      "adjusted_close": 161.08,
      "volume": 4877766.0,
      "market_cap_usd_bn": 156.93
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 4220.77,
      "sector_index_close": 20970.9,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "0",
      "date": "2026-10-23",
      "policy_rate_pct": 4.5,
      "cpi_index": 312.99,
      "unemployment_rate_pct": 4.06,
      "consumer_confidence_index": 54.2,
      "gdp_growth_pct": 2.56,
      "fx_rate_per_usd": 1.0,
      "bond_yield_10y_pct": 4.51
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_0_2021_01",
        "company_id": "0",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_0_2022_02",
        "company_id": "0",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "PEP",
    "company_name": "PepsiCo, Inc.",
    "ticker": "PEP",
    "exchange": "NASDAQ",
    "main_country": "USA",
    "niche": "Consumer Staples & Snacks & Beverages",
    "currency": "USD",
    "fiscal_year_end": "December",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 146355.76,
      "cost_of_revenue_usd_m": 90740.57,
      "operating_expense_usd_m": 26344.04,
      "operating_income_usd_m": 29271.15,
      "net_income_usd_m": 22831.5,
      "cash_usd_m": 21877.77,
      "total_debt_usd_m": 51593.08,
      "total_assets_usd_m": 204458.78,
      "equity_usd_m": 152865.7,
      "operating_cash_flow_usd_m": 28539.38,
      "capex_usd_m": 11708.46,
      "shares_outstanding_m": 965.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 185.03,
      "high": 187.27,
      "low": 184.45,
      "close": 186.31,
      "adjusted_close": 186.31,
      "volume": 2393205.0,
      "market_cap_usd_bn": 279.47
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5799.77,
      "sector_index_close": 1096.49,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 5.06,
      "cpi_index": 315.99,
      "unemployment_rate_pct": 4.46,
      "consumer_confidence_index": 70.53,
      "gdp_growth_pct": 3.25,
      "fx_rate_per_usd": 1.015,
      "bond_yield_10y_pct": 2.42
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_PEP_2021_01",
        "company_id": "PEP",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_PEP_2022_02",
        "company_id": "PEP",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "PSX",
    "company_name": "Phillips 66",
    "ticker": "PSX",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Energy & Refining & Marketing",
    "currency": "USD",
    "fiscal_year_end": "December",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 224181.14,
      "cost_of_revenue_usd_m": 138992.31,
      "operating_expense_usd_m": 40352.61,
      "operating_income_usd_m": 44836.22,
      "net_income_usd_m": 34972.25,
      "cash_usd_m": 33859.88,
      "total_debt_usd_m": 79014.62,
      "total_assets_usd_m": 313329.9,
      "equity_usd_m": 234315.28,
      "operating_cash_flow_usd_m": 43715.31,
      "capex_usd_m": 17934.49,
      "shares_outstanding_m": 965.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 25.05,
      "high": 25.14,
      "low": 24.96,
      "close": 25.02,
      "adjusted_close": 25.02,
      "volume": 5432947.0,
      "market_cap_usd_bn": 37.53
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5798.79,
      "sector_index_close": 1105.15,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 5.04,
      "cpi_index": 315.99,
      "unemployment_rate_pct": 4.43,
      "consumer_confidence_index": 70.53,
      "gdp_growth_pct": 3.25,
      "fx_rate_per_usd": 1.015,
      "bond_yield_10y_pct": 2.42
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_PSX_2021_01",
        "company_id": "PSX",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_PSX_2022_02",
        "company_id": "PSX",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "QCOM",
    "company_name": "Qualcomm Incorporated",
    "ticker": "QCOM",
    "exchange": "NASDAQ",
    "main_country": "USA",
    "niche": "Wireless & Mobile Semiconductors",
    "currency": "USD",
    "fiscal_year_end": "September",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 25392.7,
      "cost_of_revenue_usd_m": 11426.72,
      "operating_expense_usd_m": 6348.18,
      "operating_income_usd_m": 7617.8,
      "net_income_usd_m": 6094.24,
      "cash_usd_m": 25234.77,
      "total_debt_usd_m": 15140.86,
      "total_assets_usd_m": 100939.08,
      "equity_usd_m": 85798.22,
      "operating_cash_flow_usd_m": 7313.09,
      "capex_usd_m": 2559.58,
      "shares_outstanding_m": 1110.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 134.85,
      "high": 135.05,
      "low": 134.47,
      "close": 134.77,
      "adjusted_close": 134.77,
      "volume": 34955735.0,
      "market_cap_usd_bn": 149.59
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5800.0,
      "sector_index_close": 20000.0,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 0.0,
      "cpi_index": 310.9,
      "unemployment_rate_pct": 3.4,
      "consumer_confidence_index": 73.68,
      "gdp_growth_pct": 3.58,
      "fx_rate_per_usd": 1.0005,
      "bond_yield_10y_pct": 5.0
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_QCOM_2021_01",
        "company_id": "QCOM",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_QCOM_2022_02",
        "company_id": "QCOM",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "RELIANCE.NS",
    "company_name": "Reliance Industries Limited",
    "ticker": "RELIANCE.NS",
    "exchange": "NSE",
    "main_country": "India",
    "niche": "Oil-to-Chemicals, Telecom (Jio) & Retail",
    "currency": "INR",
    "fiscal_year_end": "03-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 108598.7,
      "cost_of_revenue_usd_m": 62987.25,
      "operating_expense_usd_m": 23891.71,
      "operating_income_usd_m": 21719.74,
      "net_income_usd_m": 16289.8,
      "cash_usd_m": 52015.11,
      "total_debt_usd_m": 41612.09,
      "total_assets_usd_m": 234068.0,
      "equity_usd_m": 192455.91,
      "operating_cash_flow_usd_m": 20362.25,
      "capex_usd_m": 7126.79,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 1215839903.25,
      "high": 1219562514.14,
      "low": 1205400678.64,
      "close": 1213342684.76,
      "adjusted_close": 1213342684.76,
      "volume": 5301084.0,
      "market_cap_usd_bn": 106167484.92
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 12386206573.59,
      "sector_index_close": 13005516902.27,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "India",
      "date": "2026-10-23",
      "policy_rate_pct": 6.5,
      "cpi_index": 230.0,
      "unemployment_rate_pct": 7.1,
      "consumer_confidence_index": 94.5,
      "gdp_growth_pct": 6.8,
      "fx_rate_per_usd": 87.0,
      "bond_yield_10y_pct": 7.12
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_RELIANCE.NS_2021_01",
        "company_id": "RELIANCE.NS",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_RELIANCE.NS_2022_02",
        "company_id": "RELIANCE.NS",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "005930.KS",
    "company_name": "Samsung Electronics Co., Ltd.",
    "ticker": "005930.KS",
    "exchange": "KRX",
    "main_country": "KR",
    "niche": "Consumer Electronics, Memory Semiconductors & Displays",
    "currency": "KRW",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-12-15",
      "source_frequency": "annual",
      "revenue_usd_m": 64423.63,
      "cost_of_revenue_usd_m": 39619.27,
      "operating_expense_usd_m": 11210.07,
      "operating_income_usd_m": 13594.29,
      "net_income_usd_m": 10603.55,
      "cash_usd_m": 80382.77,
      "total_debt_usd_m": 16715.33,
      "total_assets_usd_m": 306447.76,
      "equity_usd_m": 275069.86,
      "operating_cash_flow_usd_m": 13254.43,
      "capex_usd_m": 9663.54,
      "shares_outstanding_m": 6790.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 12626.1,
      "high": 12661.03,
      "low": 12608.06,
      "close": 12635.23,
      "adjusted_close": 12635.23,
      "volume": 13316878.0,
      "market_cap_usd_bn": 62.9
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 2727.9,
      "sector_index_close": 1071.86,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "KR",
      "date": "2026-10-23",
      "policy_rate_pct": 1.67,
      "cpi_index": 120.2,
      "unemployment_rate_pct": 3.55,
      "consumer_confidence_index": 100.36,
      "gdp_growth_pct": 3.17,
      "fx_rate_per_usd": 1364.02,
      "bond_yield_10y_pct": 2.44
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_005930.KS_2021_01",
        "company_id": "005930.KS",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_005930.KS_2022_02",
        "company_id": "005930.KS",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "SBIN.NS",
    "company_name": "State Bank of India",
    "ticker": "SBIN.NS",
    "exchange": "NSE",
    "main_country": "India",
    "niche": "Public Sector Banking & Financial Services",
    "currency": "INR",
    "fiscal_year_end": "03-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 52321.64,
      "cost_of_revenue_usd_m": 30346.55,
      "operating_expense_usd_m": 11510.76,
      "operating_income_usd_m": 10464.33,
      "net_income_usd_m": 7848.25,
      "cash_usd_m": 25049.18,
      "total_debt_usd_m": 20039.34,
      "total_assets_usd_m": 112721.31,
      "equity_usd_m": 92681.97,
      "operating_cash_flow_usd_m": 9810.31,
      "capex_usd_m": 3433.61,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 5974872.13,
      "high": 6018194.79,
      "low": 5922792.67,
      "close": 5991891.32,
      "adjusted_close": 5991891.32,
      "volume": 6354099.0,
      "market_cap_usd_bn": 629916.78
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 188206842.74,
      "sector_index_close": 197617184.88,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "India",
      "date": "2026-10-23",
      "policy_rate_pct": 6.5,
      "cpi_index": 230.0,
      "unemployment_rate_pct": 7.1,
      "consumer_confidence_index": 94.5,
      "gdp_growth_pct": 6.8,
      "fx_rate_per_usd": 87.0,
      "bond_yield_10y_pct": 7.12
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_SBIN.NS_2021_01",
        "company_id": "SBIN.NS",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_SBIN.NS_2022_02",
        "company_id": "SBIN.NS",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "TCS.NS",
    "company_name": "Tata Consultancy Services Limited",
    "ticker": "TCS.NS",
    "exchange": "NSE",
    "main_country": "India",
    "niche": "IT Services, Digital Transformation & Consulting",
    "currency": "INR",
    "fiscal_year_end": "03-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 28361.46,
      "cost_of_revenue_usd_m": 16449.65,
      "operating_expense_usd_m": 6239.52,
      "operating_income_usd_m": 5672.29,
      "net_income_usd_m": 4254.22,
      "cash_usd_m": 13600.43,
      "total_debt_usd_m": 10880.34,
      "total_assets_usd_m": 61201.94,
      "equity_usd_m": 50321.6,
      "operating_cash_flow_usd_m": 5317.78,
      "capex_usd_m": 1861.22,
      "shares_outstanding_m": 2500.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 2821437284.63,
      "high": 2843518590.27,
      "low": 2800427421.73,
      "close": 2822295642.62,
      "adjusted_close": 2822295642.62,
      "volume": 1649334.0,
      "market_cap_usd_bn": 124620846.56
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 17960063180.31,
      "sector_index_close": 18858066339.33,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "India",
      "date": "2026-10-23",
      "policy_rate_pct": 6.5,
      "cpi_index": 230.0,
      "unemployment_rate_pct": 7.1,
      "consumer_confidence_index": 94.5,
      "gdp_growth_pct": 6.8,
      "fx_rate_per_usd": 87.0,
      "bond_yield_10y_pct": 7.12
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_TCS.NS_2021_01",
        "company_id": "TCS.NS",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_TCS.NS_2022_02",
        "company_id": "TCS.NS",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "0700.HK",
    "company_name": "Tencent Holdings Limited",
    "ticker": "0700.HK",
    "exchange": "HKEX / OTC",
    "main_country": "China",
    "niche": "Interactive Media, Gaming & Fintech",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 21968.99,
      "cost_of_revenue_usd_m": 10545.12,
      "operating_expense_usd_m": 4833.18,
      "operating_income_usd_m": 6590.69,
      "net_income_usd_m": 5404.37,
      "cash_usd_m": 31934.68,
      "total_debt_usd_m": 18056.38,
      "total_assets_usd_m": 134125.66,
      "equity_usd_m": 116069.28,
      "operating_cash_flow_usd_m": 6755.46,
      "capex_usd_m": 5492.25,
      "shares_outstanding_m": 2400.01,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 254.0,
      "high": 255.82,
      "low": 253.96,
      "close": 254.22,
      "adjusted_close": 254.22,
      "volume": 26002882.0,
      "market_cap_usd_bn": 610.13
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 23050.35,
      "sector_index_close": 5396.78,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "China",
      "date": "2026-10-23",
      "policy_rate_pct": 2.16,
      "cpi_index": 313.99,
      "unemployment_rate_pct": 4.58,
      "consumer_confidence_index": 86.94,
      "gdp_growth_pct": 1.59,
      "fx_rate_per_usd": 1.0,
      "bond_yield_10y_pct": 4.3
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_0700.HK_2021_01",
        "company_id": "0700.HK",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_0700.HK_2022_02",
        "company_id": "0700.HK",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "TSLA",
    "company_name": "Tesla, Inc.",
    "ticker": "TSLA",
    "exchange": "NASDAQ",
    "main_country": "United States",
    "niche": "Electric Vehicles & Autonomous Clean Energy",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 71873.27,
      "cost_of_revenue_usd_m": 20124.52,
      "operating_expense_usd_m": 25155.64,
      "operating_income_usd_m": 26593.11,
      "net_income_usd_m": 21806.35,
      "cash_usd_m": 67994.74,
      "total_debt_usd_m": 67994.74,
      "total_assets_usd_m": 271978.95,
      "equity_usd_m": 203984.21,
      "operating_cash_flow_usd_m": 27257.94,
      "capex_usd_m": 12937.19,
      "shares_outstanding_m": 2200.03,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 345.75,
      "high": 348.23,
      "low": 341.3,
      "close": 344.05,
      "adjusted_close": 344.05,
      "volume": 17768174.0,
      "market_cap_usd_bn": 220.19
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5456.96,
      "sector_index_close": 6111.8,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "United States",
      "date": "2026-10-23",
      "policy_rate_pct": 5.26,
      "cpi_index": 312.99,
      "unemployment_rate_pct": 3.76,
      "consumer_confidence_index": 93.73,
      "gdp_growth_pct": 2.86,
      "fx_rate_per_usd": 1.0,
      "bond_yield_10y_pct": 4.06
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_TSLA_2021_01",
        "company_id": "TSLA",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_TSLA_2022_02",
        "company_id": "TSLA",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "TSM",
    "company_name": "Taiwan Semiconductor Manufacturing Company Limited",
    "ticker": "TSM",
    "exchange": "NYSE / TWSE",
    "main_country": "Taiwan",
    "niche": "Semiconductor Foundry & Advanced Packaging",
    "currency": "USD",
    "fiscal_year_end": "12-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 23606.54,
      "cost_of_revenue_usd_m": 11331.14,
      "operating_expense_usd_m": 5193.44,
      "operating_income_usd_m": 7081.96,
      "net_income_usd_m": 5807.21,
      "cash_usd_m": 32018.29,
      "total_debt_usd_m": 18004.37,
      "total_assets_usd_m": 134476.82,
      "equity_usd_m": 116472.45,
      "operating_cash_flow_usd_m": 7259.01,
      "capex_usd_m": 5901.64,
      "shares_outstanding_m": 2400.01,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 947.39,
      "high": 951.99,
      "low": 946.84,
      "close": 949.64,
      "adjusted_close": 949.64,
      "volume": 29487869.0,
      "market_cap_usd_bn": 2279.15
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 23030.91,
      "sector_index_close": 5407.12,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "Taiwan",
      "date": "2026-10-23",
      "policy_rate_pct": 2.16,
      "cpi_index": 313.99,
      "unemployment_rate_pct": 4.58,
      "consumer_confidence_index": 86.94,
      "gdp_growth_pct": 1.59,
      "fx_rate_per_usd": 1.0,
      "bond_yield_10y_pct": 4.3
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_TSM_2021_01",
        "company_id": "TSM",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_TSM_2022_02",
        "company_id": "TSM",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "WMT",
    "company_name": "Walmart Inc.",
    "ticker": "WMT",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Retail / Hypermarket & E-commerce",
    "currency": "USD",
    "fiscal_year_end": "01-31",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 680221.24,
      "cost_of_revenue_usd_m": 510142.72,
      "operating_expense_usd_m": 129140.91,
      "operating_income_usd_m": 40937.61,
      "net_income_usd_m": 31987.2,
      "cash_usd_m": 18000.71,
      "total_debt_usd_m": 55009.17,
      "total_assets_usd_m": 260923.41,
      "equity_usd_m": 185914.24,
      "operating_cash_flow_usd_m": 43228.56,
      "capex_usd_m": 16965.49,
      "shares_outstanding_m": 2700.07,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 65.54,
      "high": 66.09,
      "low": 64.85,
      "close": 65.55,
      "adjusted_close": 65.55,
      "volume": 20192354.0,
      "market_cap_usd_bn": 176.99
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5780.32,
      "sector_index_close": 4046.22,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 4.61,
      "cpi_index": 316.03,
      "unemployment_rate_pct": 3.81,
      "consumer_confidence_index": 102.4,
      "gdp_growth_pct": 1.81,
      "fx_rate_per_usd": 1.0,
      "bond_yield_10y_pct": 4.06
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_WMT_2021_01",
        "company_id": "WMT",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_WMT_2022_02",
        "company_id": "WMT",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  },
  {
    "company_id": "DIS",
    "company_name": "The Walt Disney Company",
    "ticker": "DIS",
    "exchange": "NYSE",
    "main_country": "USA",
    "niche": "Entertainment & Direct-to-Consumer Streaming",
    "currency": "USD",
    "fiscal_year_end": "September",
    "financials": {
      "date": "2026-10-23",
      "report_date": "2026-10-23",
      "source_frequency": "annual",
      "revenue_usd_m": 142343.24,
      "cost_of_revenue_usd_m": 88252.81,
      "operating_expense_usd_m": 25621.78,
      "operating_income_usd_m": 28468.65,
      "net_income_usd_m": 22205.55,
      "cash_usd_m": 21441.98,
      "total_debt_usd_m": 49352.88,
      "total_assets_usd_m": 199635.1,
      "equity_usd_m": 150282.22,
      "operating_cash_flow_usd_m": 27756.94,
      "capex_usd_m": 11387.46,
      "shares_outstanding_m": 965.0,
      "restated_flag": false
    },
    "market": {
      "date": "2026-10-23",
      "open": 5.54,
      "high": 5.56,
      "low": 5.49,
      "close": 5.52,
      "adjusted_close": 5.52,
      "volume": 9900528.0,
      "market_cap_usd_bn": 8.28
    },
    "benchmark": {
      "date": "2026-10-23",
      "home_index_close": 5814.55,
      "sector_index_close": 1109.07,
      "vix_or_volatility_index": 18.5
    },
    "macro": {
      "country": "USA",
      "date": "2026-10-23",
      "policy_rate_pct": 5.02,
      "cpi_index": 315.99,
      "unemployment_rate_pct": 4.63,
      "consumer_confidence_index": 70.53,
      "gdp_growth_pct": 3.25,
      "fx_rate_per_usd": 1.015,
      "bond_yield_10y_pct": 2.42
    },
    "calibrated_parameters": {
      "status": "calibrated",
      "event_calibrated": "enable_covid",
      "best_mape_pct": 26.83,
      "calibrated_demand_elasticity": 0.4,
      "calibrated_supply_sensitivity": 0.3,
      "sample_points_evaluated": 6,
      "convergence": "Global minimum reached across grid search hyper-parameter space"
    },
    "decisions": [
      {
        "decision_id": "DEC_DIS_2021_01",
        "company_id": "DIS",
        "decision_type": "product_launch",
        "announced_date": "2021-04-15",
        "effective_date": "2021-06-01",
        "magnitude": 15.0,
        "magnitude_unit": "percent",
        "short_description": "Global Flagship Product Expansion Launch",
        "reversed_flag": false
      },
      {
        "decision_id": "DEC_DIS_2022_02",
        "company_id": "DIS",
        "decision_type": "cost_cut",
        "announced_date": "2022-09-10",
        "effective_date": "2022-10-01",
        "magnitude": 8.5,
        "magnitude_unit": "percent",
        "short_description": "Operational Efficiency & Cloud Restructuring",
        "reversed_flag": false
      }
    ]
  }
],
  schemaTables: [
  {
    "table": "company",
    "columns": "company_id, company_name, ticker, exchange, main_country, niche, currency, fiscal_year_end"
  },
  {
    "table": "financials",
    "columns": "date, report_date, source_frequency, revenue_usd_m, cost_of_revenue_usd_m, operating_expense_usd_m, operating_income_usd_m, net_income_usd_m, cash_usd_m, total_debt_usd_m, total_assets_usd_m, equity_usd_m, operating_cash_flow_usd_m, capex_usd_m, shares_outstanding_m, restated_flag"
  },
  {
    "table": "market",
    "columns": "date, open, high, low, close, adjusted_close, volume, market_cap_usd_bn"
  },
  {
    "table": "benchmark",
    "columns": "date, home_index_close, sector_index_close, vix_or_volatility_index"
  },
  {
    "table": "macro",
    "columns": "country, date, policy_rate_pct, cpi_index, unemployment_rate_pct, consumer_confidence_index, gdp_growth_pct, fx_rate_per_usd, bond_yield_10y_pct"
  },
  {
    "table": "calendar",
    "columns": "country, month, festival_name, festival_days, festival_category, major_sale_flag"
  },
  {
    "table": "events",
    "columns": "event_id, event_name, start_date, end_date, event_category, primitive_demand, primitive_supply, primitive_credit, primitive_rates, primitive_sentiment, primitive_calendar, primitive_geopolitical, primitive_pandemic, half_life_months, source"
  },
  {
    "table": "decisions",
    "columns": "decision_id, company_id, decision_type, announced_date, effective_date, magnitude, magnitude_unit, currency, public_or_private, confidence, source_name, source_url, source_retrieved_date, short_description, reversed_flag"
  }
]
};
