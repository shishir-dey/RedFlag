import { FinancialData, Metrics } from './types';

// Ported from Python calculate_metrics function
export function calculateMetrics(
  data: FinancialData,
  cogsPercentage: number = 85
): Metrics {
  const income = data.income_statement;
  const assets = data.assets;
  const liabilities = data.liabilities;

  // Calculate totals
  const totalFixedAssets = Object.values(assets.fixed_assets).reduce(
    (sum, val) => sum + val,
    0
  );
  const totalCurrentAssets = Object.values(assets.current_assets).reduce(
    (sum, val) => sum + val,
    0
  );
  const totalAssets = totalFixedAssets + totalCurrentAssets;

  const totalEquity = Object.values(liabilities.equity).reduce(
    (sum, val) => sum + val,
    0
  );
  const totalNonCurrentLiab = Object.values(
    liabilities.non_current_liabilities
  ).reduce((sum, val) => sum + val, 0);
  const totalCurrentLiab = Object.values(
    liabilities.current_liabilities
  ).reduce((sum, val) => sum + val, 0);
  const totalLiabilities = totalNonCurrentLiab + totalCurrentLiab;

  // Profitability ratios
  const netMargin = (income.pat / income.revenue) * 100;
  const roe = (income.pat / totalEquity) * 100;
  const roa = (income.pat / totalAssets) * 100;

  // Liquidity ratios
  const currentRatio = totalCurrentAssets / totalCurrentLiab;
  const quickRatio =
    (totalCurrentAssets - assets.current_assets.inventories) / totalCurrentLiab;
  const cashRatio = assets.current_assets.cash / totalCurrentLiab;

  // Leverage ratios
  const debtToEquity =
    liabilities.non_current_liabilities.long_term_borrowings / totalEquity;
  const debtToAssets =
    liabilities.non_current_liabilities.long_term_borrowings / totalAssets;

  // Efficiency ratios
  const assetTurnover = income.revenue / totalAssets;

  // Working capital
  const workingCapital = totalCurrentAssets - totalCurrentLiab;

  // Days ratios (assuming COGS is percentage of revenue for estimation)
  const estimatedCogs = income.revenue * (cogsPercentage / 100);
  const dio = (assets.current_assets.inventories / estimatedCogs) * 365;
  const dso = (assets.current_assets.trade_receivables / income.revenue) * 365;
  const dpo =
    (liabilities.current_liabilities.trade_payables / estimatedCogs) * 365;
  const cashConversionCycle = dio + dso - dpo;

  return {
    total_assets: totalAssets,
    total_equity: totalEquity,
    total_liabilities: totalLiabilities,
    total_current_assets: totalCurrentAssets,
    total_current_liab: totalCurrentLiab,
    working_capital: workingCapital,
    net_margin: netMargin,
    roe: roe,
    roa: roa,
    current_ratio: currentRatio,
    quick_ratio: quickRatio,
    cash_ratio: cashRatio,
    debt_to_equity: debtToEquity,
    debt_to_assets: debtToAssets,
    asset_turnover: assetTurnover,
    dio: dio,
    dso: dso,
    dpo: dpo,
    ccc: cashConversionCycle,
  };
}

// Ported from Python format_inr function
export function formatINR(amount: number): string {
  if (Math.abs(amount) >= 10000000) {
    // 1 Crore
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (Math.abs(amount) >= 100000) {
    // 1 Lakh
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}
