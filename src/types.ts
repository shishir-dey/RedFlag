// Types for MCA Financial Data

export interface IncomeStatement {
  // Core required fields
  revenue: number;
  other_income: number;
  total_expenses: number;
  pbt: number;
  pat: number;

  // Optional detailed fields for fundamental analysis (investing.com compatible)
  // Revenue breakdown
  gross_income?: number;
  cost_of_goods_sold?: number;
  gross_profit?: number;

  // Operating expenses breakdown
  operating_expenses?: number;
  selling_general_admin?: number;
  research_development?: number;
  depreciation_amortization?: number;
  operating_income?: number; // EBIT

  // Non-operating items
  interest_expense?: number;
  interest_income?: number;
  other_non_operating?: number;

  // Taxes
  income_tax?: number;
  tax_rate?: number;

  // Profitability metrics
  ebitda?: number;
  net_income_from_continuing_ops?: number;

  // Per share data
  basic_eps?: number;
  dividend_per_share?: number;
}

export interface FixedAssets {
  property_equipment: number;
  intangible_assets: number;
  other_non_current: number;
}

export interface CurrentAssets {
  inventories: number;
  trade_receivables: number;
  cash: number;
  other_current: number;
}

export interface Assets {
  fixed_assets: FixedAssets;
  current_assets: CurrentAssets;
}

export interface Equity {
  share_capital: number;
  reserves_surplus: number;
}

export interface NonCurrentLiabilities {
  long_term_borrowings: number;
  deferred_tax: number;
  long_term_provisions: number;
}

export interface CurrentLiabilities {
  trade_payables: number;
  other_current_liabilities: number;
  short_term_provisions: number;
  current_liability: number;
}

export interface Liabilities {
  equity: Equity;
  non_current_liabilities: NonCurrentLiabilities;
  current_liabilities: CurrentLiabilities;
}

// Dynamic shareholding - supports any promoter names
export type Shareholding = Record<string, number>;
export type PendingAllotment = Record<string, number>;

export interface FinancialData {
  company_name: string;
  income_statement: IncomeStatement;
  assets: Assets;
  liabilities: Liabilities;
  shareholding: Shareholding;
  pending_allotment: PendingAllotment;
  forex_exposure_usd: number;
  usd_to_inr_rate: number;
  // Optional valuation/market data for fundamental analysis
  market_cap?: number;
  share_price?: number;
  eps?: number;
  diluted_eps?: number;
  total_shares?: number;
}

export interface Metrics {
  total_assets: number;
  total_equity: number;
  total_liabilities: number;
  total_current_assets: number;
  total_current_liab: number;
  working_capital: number;
  net_margin: number;
  roe: number;
  roa: number;
  current_ratio: number;
  quick_ratio: number;
  cash_ratio: number;
  debt_to_equity: number;
  debt_to_assets: number;
  asset_turnover: number;
  dio: number;
  dso: number;
  dpo: number;
  ccc: number;
}
