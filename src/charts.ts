import { Chart, ChartConfiguration } from 'chart.js/auto';
import { FinancialData, Metrics } from './types';
import { formatINR } from './metrics';

// Utility function to destroy existing chart
function destroyChart(chart: Chart | null): void {
  if (chart) {
    chart.destroy();
  }
}

// 1. Key Metrics Summary
export function createKeyMetricsChart(
  container: HTMLElement,
  data: FinancialData,
  metrics: Metrics,
  cogsPercentage: number = 85
): void {
  // Clear existing content
  container.innerHTML = '';

  // Build summary data dynamically based on available fields
  const summaryData: [string, string, string?][] = [
    ['Total Assets', formatINR(metrics.total_assets)],
    ['Total Equity', formatINR(metrics.total_equity)],
    ['Revenue', formatINR(data.income_statement.revenue)],
  ];

  // Conditionally add income statement details
  if (data.income_statement.cost_of_goods_sold !== undefined) {
    summaryData.push(['COGS', formatINR(data.income_statement.cost_of_goods_sold)]);
  }
  if (data.income_statement.gross_profit !== undefined) {
    summaryData.push(['Gross Profit', formatINR(data.income_statement.gross_profit), 'positive']);
  }
  if (data.income_statement.operating_income !== undefined) {
    summaryData.push(['EBIT', formatINR(data.income_statement.operating_income), data.income_statement.operating_income > 0 ? 'positive' : 'negative']);
  }
  if (data.income_statement.ebitda !== undefined) {
    summaryData.push(['EBITDA', formatINR(data.income_statement.ebitda), data.income_statement.ebitda > 0 ? 'positive' : 'negative']);
  }

  // Always show core metrics
  summaryData.push(['Net Profit', formatINR(data.income_statement.pat), data.income_statement.pat > 0 ? 'positive' : 'negative']);
  summaryData.push(['Net Margin', `${metrics.net_margin.toFixed(1)}%`, metrics.net_margin > 0 ? 'positive' : 'negative']);
  summaryData.push(['ROE', `${metrics.roe.toFixed(1)}%`]);
  summaryData.push(['Current Ratio', metrics.current_ratio.toFixed(2)]);
  summaryData.push(['Debt/Equity', metrics.debt_to_equity.toFixed(2)]);
  summaryData.push(['Cash', formatINR(data.assets.current_assets.cash), data.assets.current_assets.cash >= 100000 ? 'positive' : 'negative']);
  summaryData.push(['Working Capital', formatINR(metrics.working_capital), metrics.working_capital >= 0 ? 'positive' : 'negative']);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '13px';

  summaryData.forEach(([label, value, colorClass]) => {
    const row = table.insertRow();
    const cell1 = row.insertCell();
    const cell2 = row.insertCell();

    cell1.textContent = label;
    cell1.style.padding = '4px 8px';
    cell1.style.borderBottom = '1px solid #ddd';
    cell1.style.fontWeight = '500';

    cell2.textContent = value;
    cell2.style.padding = '4px 8px';
    cell2.style.borderBottom = '1px solid #ddd';
    cell2.style.textAlign = 'right';
    cell2.style.fontWeight = '600';

    // Apply color coding
    if (colorClass === 'positive') {
      cell2.style.color = '#4caf50';
    } else if (colorClass === 'negative') {
      cell2.style.color = '#f44336';
    }
  });

  container.appendChild(table);
}

// 2. Financial Health Scorecard
export function createHealthScorecardChart(
  container: HTMLElement,
  metrics: Metrics,
  thresholdMultiplier: number = 1.0
): void {
  // Clear existing content
  container.innerHTML = '';

  const scorecard = [
    [
      'Current Ratio',
      metrics.current_ratio,
      1.5 * thresholdMultiplier,
      2.5 * thresholdMultiplier,
    ],
    [
      'Quick Ratio',
      metrics.quick_ratio,
      0.8 * thresholdMultiplier,
      1.2 * thresholdMultiplier,
    ],
    [
      'Cash Ratio',
      metrics.cash_ratio,
      0.2 * thresholdMultiplier,
      0.5 * thresholdMultiplier,
    ],
    [
      'Net Margin %',
      metrics.net_margin,
      3 * thresholdMultiplier,
      8 * thresholdMultiplier,
    ],
    ['ROE %', metrics.roe, 10 * thresholdMultiplier, 20 * thresholdMultiplier],
    ['ROA %', metrics.roa, 5 * thresholdMultiplier, 10 * thresholdMultiplier],
    [
      'Debt/Equity',
      metrics.debt_to_equity,
      0.3 * thresholdMultiplier,
      0.7 * thresholdMultiplier,
    ],
    [
      'Asset Turnover',
      metrics.asset_turnover,
      1.0 * thresholdMultiplier,
      2.0 * thresholdMultiplier,
    ],
  ];

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '13px';

  scorecard.forEach(([label, value, lowThresh, highThresh]) => {
    const row = table.insertRow();
    const cell1 = row.insertCell();
    const cell2 = row.insertCell();

    cell1.textContent = label as string;
    cell1.style.padding = '4px 8px';
    cell1.style.borderBottom = '1px solid #ddd';
    cell1.style.fontWeight = '500';

    cell2.textContent = Number(value).toFixed(2);
    cell2.style.padding = '4px 8px';
    cell2.style.borderBottom = '1px solid #ddd';
    cell2.style.textAlign = 'right';
    cell2.style.fontWeight = '600';

    // Color coding
    if (value < lowThresh) {
      cell2.style.color = '#f44336';
    } else if (value < highThresh) {
      cell2.style.color = '#ff9800';
    } else {
      cell2.style.color = '#4caf50';
    }
  });

  container.appendChild(table);
}

// 3. Profit & Loss Waterfall - Fixed to show actual values
export function createProfitLossChart(
  canvas: HTMLCanvasElement,
  data: FinancialData,
  scale: number = 1.0
): Chart {
  destroyChart((canvas as any).chart);

  const ctx = canvas.getContext('2d')!;
  const income = data.income_statement;

  // Show actual individual values for P&L waterfall
  const categories = ['Revenue', 'Other Income', 'Expenses', 'Tax', 'Net Profit'];
  const tax = income.pbt - income.pat;

  // Individual values (expenses and tax shown as positive but colored red)
  const values = [
    income.revenue * scale,
    income.other_income * scale,
    income.total_expenses * scale,
    tax * scale,
    income.pat * scale,
  ];

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [
        {
          data: values,
          backgroundColor: [
            '#4caf50', // Revenue - green
            '#8bc34a', // Other Income - light green
            '#f44336', // Expenses - red
            '#ff9800', // Tax - orange
            income.pat >= 0 ? '#4caf50' : '#f44336', // PAT - green if positive, red if negative
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.raw as number;
              const formatted = formatINR(value / scale);
              if (label === 'Expenses' || label === 'Tax') {
                return `${label}: -${formatted}`;
              }
              return `${label}: ${formatted}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatINR(Number(value) / scale);
            }
          }
        },
      },
    },
  };

  const chart = new Chart(ctx, config);
  (canvas as any).chart = chart;
  return chart;
}

// Insight generation functions
export function generateKeyMetricsInsights(data: FinancialData, metrics: Metrics): string {
  const insights: string[] = [];

  if (metrics.net_margin > 5) insights.push("Strong profitability with healthy net margin");
  else if (metrics.net_margin < 0) insights.push("Operating at a loss");
  else insights.push("Moderate profitability");

  if (metrics.roe > 15) insights.push("Excellent return on equity");
  else if (metrics.roe < 5) insights.push("Low return on equity");
  else insights.push("Decent return on equity");

  if (metrics.current_ratio > 1.5) insights.push("Strong liquidity position");
  else if (metrics.current_ratio < 1) insights.push("Potential liquidity issues");
  else insights.push("Adequate liquidity");

  if (metrics.debt_to_equity < 0.5) insights.push("Conservative leverage");
  else if (metrics.debt_to_equity > 1) insights.push("High leverage risk");
  else insights.push("Moderate leverage");

  if (data.assets.current_assets.cash >= 100000) insights.push("Good cash reserves");
  else insights.push("Limited cash reserves");

  if (metrics.working_capital >= 0) insights.push("Positive working capital");
  else insights.push("Negative working capital - potential cash flow issues");

  return insights.join('. ') + '.';
}

export function generateHealthScorecardInsights(metrics: Metrics, thresholdMultiplier: number = 1.0): string {
  const scorecard = [
    ['Current Ratio', metrics.current_ratio, 1.5 * thresholdMultiplier, 2.5 * thresholdMultiplier],
    ['Quick Ratio', metrics.quick_ratio, 0.8 * thresholdMultiplier, 1.2 * thresholdMultiplier],
    ['Cash Ratio', metrics.cash_ratio, 0.2 * thresholdMultiplier, 0.5 * thresholdMultiplier],
    ['Net Margin %', metrics.net_margin, 3 * thresholdMultiplier, 8 * thresholdMultiplier],
    ['ROE %', metrics.roe, 10 * thresholdMultiplier, 20 * thresholdMultiplier],
    ['ROA %', metrics.roa, 5 * thresholdMultiplier, 10 * thresholdMultiplier],
    ['Debt/Equity', metrics.debt_to_equity, 0.3 * thresholdMultiplier, 0.7 * thresholdMultiplier],
    ['Asset Turnover', metrics.asset_turnover, 1.0 * thresholdMultiplier, 2.0 * thresholdMultiplier],
  ];

  let excellent = 0, moderate = 0, concerning = 0;

  scorecard.forEach(([label, value, lowThresh, highThresh]) => {
    if (value >= highThresh) excellent++;
    else if (value >= lowThresh) moderate++;
    else concerning++;
  });

  const total = scorecard.length;
  return `Financial Health: ${excellent}/${total} excellent, ${moderate}/${total} moderate, ${concerning}/${total} concerning parameters.`;
}

export function generateProfitLossInsights(data: FinancialData): string {
  const { revenue, other_income, total_expenses, pat } = data.income_statement;
  const grossProfit = revenue - (total_expenses - other_income); // Simplified

  if (pat > 0) {
    return `Profitable operation with PAT of ${formatINR(pat)}. Revenue: ${formatINR(revenue)}, Expenses: ${formatINR(total_expenses)}.`;
  } else {
    return `Loss-making operation with loss of ${formatINR(Math.abs(pat))}. Revenue: ${formatINR(revenue)}, Expenses: ${formatINR(total_expenses)}.`;
  }
}

export function generateAssetCompositionInsights(data: FinancialData, metrics: Metrics): string {
  const { current_assets, fixed_assets } = data.assets;
  const totalAssets = metrics.total_assets;
  const fixedPct = (Object.values(fixed_assets).reduce((a, b) => a + b, 0) / totalAssets) * 100;
  const currentPct = (Object.values(current_assets).reduce((a, b) => a + b, 0) / totalAssets) * 100;

  const insights: string[] = [];

  if (current_assets.cash < 100000) insights.push("Low cash reserves");
  if (current_assets.inventories > totalAssets * 0.3) insights.push("High inventory levels");
  if (current_assets.trade_receivables > totalAssets * 0.2) insights.push("Significant receivables");
  if (fixedPct > 70) insights.push("Asset-heavy with high fixed assets");
  else if (fixedPct < 30) insights.push("Light asset base");

  return insights.length > 0 ? insights.join('. ') + '.' : 'Balanced asset composition.';
}

export function generateLiabilityCompositionInsights(data: FinancialData, metrics: Metrics): string {
  const totalLiab = metrics.total_liabilities;
  const equityPct = (metrics.total_equity / (metrics.total_equity + totalLiab)) * 100;
  const debtPct = (metrics.debt_to_assets) * 100;

  const insights: string[] = [];

  if (equityPct > 60) insights.push("Strong equity base");
  else if (equityPct < 30) insights.push("Low equity, high leverage");

  if (debtPct > 50) insights.push("High debt levels");
  else if (debtPct < 20) insights.push("Conservative debt usage");

  if (metrics.debt_to_equity > 1) insights.push("Debt exceeds equity");
  else insights.push("Equity exceeds debt");

  return insights.join('. ') + '.';
}

export function generateLiquidityInsights(metrics: Metrics, target: number = 1.5): string {
  const ratios = [
    { name: 'Current Ratio', value: metrics.current_ratio, target: target },
    { name: 'Quick Ratio', value: metrics.quick_ratio, target: target * 0.67 },
    { name: 'Cash Ratio', value: metrics.cash_ratio, target: target * 0.2 },
  ];

  const meeting = ratios.filter(r => r.value >= r.target).length;
  const total = ratios.length;

  if (meeting === total) return `Strong liquidity: All ${total} ratios meet or exceed targets.`;
  else if (meeting >= total / 2) return `Moderate liquidity: ${meeting}/${total} ratios meet targets.`;
  else return `Weak liquidity: Only ${meeting}/${total} ratios meet targets.`;
}

export function generateWorkingCapitalInsights(metrics: Metrics, benchmark: number = 90): string {
  const { dio, dso, dpo, ccc } = metrics;

  const insights: string[] = [];

  if (dio > benchmark * 1.5) insights.push("High inventory holding period");
  else if (dio < benchmark * 0.5) insights.push("Efficient inventory management");

  if (dso > benchmark * 1.5) insights.push("Slow receivables collection");
  else if (dso < benchmark * 0.5) insights.push("Fast receivables collection");

  if (dpo < benchmark * 0.5) insights.push("Quick payables settlement");
  else if (dpo > benchmark * 1.5) insights.push("Extended payables period");

  if (ccc < benchmark) insights.push("Efficient cash conversion cycle");
  else insights.push("Slow cash conversion cycle");

  return insights.join('. ') + '.';
}

// 4. Asset Composition
export function createAssetCompositionChart(
  canvas: HTMLCanvasElement,
  data: FinancialData,
  metrics: Metrics,
  focus: number = 0.5
): Chart {
  destroyChart((canvas as any).chart);

  const ctx = canvas.getContext('2d')!;
  const assets = data.assets;
  const labels = [
    'Fixed Assets',
    'Inventories',
    'Receivables',
    'Cash',
    'Other Current',
  ];
  const values = [
    Object.values(assets.fixed_assets).reduce((a, b) => a + b, 0),
    assets.current_assets.inventories,
    assets.current_assets.trade_receivables,
    assets.current_assets.cash,
    assets.current_assets.other_current,
  ];

  // Adjust opacity based on focus (0 = all equal, 1 = emphasize largest)
  const opacities = values.map((val, index) => {
    const maxVal = Math.max(...values);
    const baseOpacity = 0.7;
    const emphasis = focus * (val / maxVal);
    return Math.max(baseOpacity, baseOpacity + emphasis * 0.3);
  });

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            `rgba(25, 118, 210, ${opacities[0]})`,
            `rgba(56, 142, 60, ${opacities[1]})`,
            `rgba(245, 124, 0, ${opacities[2]})`,
            `rgba(211, 47, 47, ${opacities[3]})`,
            `rgba(123, 31, 162, ${opacities[4]})`,
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };

  const chart = new Chart(ctx, config);
  (canvas as any).chart = chart;
  return chart;
}

// 5. Liability & Equity Composition
export function createLiabilityCompositionChart(
  canvas: HTMLCanvasElement,
  data: FinancialData,
  metrics: Metrics,
  focus: number = 0.5
): Chart {
  destroyChart((canvas as any).chart);

  const ctx = canvas.getContext('2d')!;
  const liabilities = data.liabilities;
  const labels = ['Equity', 'Long-term Debt', 'Payables', 'Other Current Liab'];
  const values = [
    Object.values(liabilities.equity).reduce((a, b) => a + b, 0),
    Object.values(liabilities.non_current_liabilities).reduce(
      (a, b) => a + b,
      0
    ),
    liabilities.current_liabilities.trade_payables,
    Object.values(liabilities.current_liabilities).reduce((a, b) => a + b, 0) -
    liabilities.current_liabilities.trade_payables,
  ];

  // Adjust opacity based on focus (0 = all equal, 1 = emphasize largest)
  const opacities = values.map((val, index) => {
    const maxVal = Math.max(...values);
    const baseOpacity = 0.7;
    const emphasis = focus * (val / maxVal);
    return Math.max(baseOpacity, baseOpacity + emphasis * 0.3);
  });

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            `rgba(76, 175, 80, ${opacities[0]})`,
            `rgba(255, 152, 0, ${opacities[1]})`,
            `rgba(244, 67, 54, ${opacities[2]})`,
            `rgba(156, 39, 176, ${opacities[3]})`,
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };

  const chart = new Chart(ctx, config);
  (canvas as any).chart = chart;
  return chart;
}

// 6. Liquidity Indicators
export function createLiquidityChart(
  canvas: HTMLCanvasElement,
  metrics: Metrics,
  target: number = 1.5
): Chart {
  destroyChart((canvas as any).chart);

  const ctx = canvas.getContext('2d')!;
  const ratios = [
    { label: 'Current Ratio', value: metrics.current_ratio, target: target },
    { label: 'Quick Ratio', value: metrics.quick_ratio, target: target * 0.67 },
    { label: 'Cash Ratio', value: metrics.cash_ratio, target: target * 0.2 },
  ];

  const config: ChartConfiguration = {
    type: 'doughnut',
    data: {
      labels: ratios.map((r) => r.label),
      datasets: [
        {
          data: ratios.map((r) => r.value),
          backgroundColor: ratios.map((r) =>
            r.value >= r.target ? '#4caf50' : '#f44336'
          ),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
    },
  };

  const chart = new Chart(ctx, config);
  (canvas as any).chart = chart;
  return chart;
}

// 7. Working Capital Cycle
export function createWorkingCapitalChart(
  canvas: HTMLCanvasElement,
  metrics: Metrics,
  benchmark: number = 90
): Chart {
  destroyChart((canvas as any).chart);

  const ctx = canvas.getContext('2d')!;
  const data = [
    { label: 'Inventory Days', value: metrics.dio },
    { label: 'Collection Days', value: metrics.dso },
    { label: 'Payment Days', value: -metrics.dpo },
    { label: 'Cash Cycle', value: metrics.ccc },
  ];

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: data.map((d) => d.label),
      datasets: [
        {
          data: data.map((d) => d.value),
          backgroundColor: ['#e91e63', '#2196f3', '#4caf50', '#ff9800'],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };

  const chart = new Chart(ctx, config);
  (canvas as any).chart = chart;
  return chart;
}
