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

  const summaryData = [
    ['Total Assets', formatINR(metrics.total_assets)],
    ['Total Equity', formatINR(metrics.total_equity)],
    ['Revenue', formatINR(data.income_statement.revenue)],
    ['Net Profit', formatINR(data.income_statement.pat)],
    ['Net Margin', `${metrics.net_margin.toFixed(1)}%`],
    ['ROE', `${metrics.roe.toFixed(1)}%`],
    ['Current Ratio', metrics.current_ratio.toFixed(2)],
    ['Debt/Equity', metrics.debt_to_equity.toFixed(2)],
    ['Cash', formatINR(data.assets.current_assets.cash)],
    ['Working Capital', formatINR(metrics.working_capital)],
  ];

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '13px';

  summaryData.forEach(([label, value]) => {
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

    // Color coding
    if (label === 'Net Profit') {
      cell2.style.color = data.income_statement.pat > 0 ? '#4caf50' : '#f44336';
    } else if (label === 'Cash') {
      cell2.style.color =
        data.assets.current_assets.cash >= 100000 ? '#4caf50' : '#f44336';
    } else if (label === 'Working Capital') {
      cell2.style.color = metrics.working_capital >= 0 ? '#4caf50' : '#f44336';
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

// 3. Profit & Loss Waterfall
export function createProfitLossChart(
  canvas: HTMLCanvasElement,
  data: FinancialData,
  scale: number = 1.0
): Chart {
  destroyChart((canvas as any).chart);

  const ctx = canvas.getContext('2d')!;
  const income = data.income_statement;
  const categories = ['Revenue', 'Other Income', 'Expenses', 'Tax', 'PAT'];
  const values = [
    income.revenue,
    income.other_income,
    -income.total_expenses,
    -(income.pbt - income.pat),
    income.pat,
  ];

  let cumulative = 0;
  const cumulativeValues = values.map((val) => {
    cumulative += val;
    return cumulative;
  });

  const scaledValues = cumulativeValues.map((val) => val * scale);

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [
        {
          data: scaledValues,
          backgroundColor: [
            '#4caf50',
            '#8bc34a',
            '#f44336',
            '#ff9800',
            '#4caf50',
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
