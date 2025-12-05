import { FinancialData } from './types';
import { calculateMetrics, formatINR } from './metrics';
import {
  createKeyMetricsChart,
  createHealthScorecardChart,
  createProfitLossChart,
  createAssetCompositionChart,
  createLiabilityCompositionChart,
  createLiquidityChart,
  createWorkingCapitalChart,
  generateKeyMetricsInsights,
  generateHealthScorecardInsights,
  generateProfitLossInsights,
  generateAssetCompositionInsights,
  generateLiabilityCompositionInsights,
  generateLiquidityInsights,
  generateWorkingCapitalInsights,
} from './charts';
import { sampleData } from './sampleData';
import { Metrics } from './types';

// Global state
let currentData: FinancialData | null = null;
let currentMetrics: Metrics | null = null;
let cogsPercentage = 85; // Default COGS percentage

// DOM elements
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const downloadSampleBtn = document.getElementById(
  'download-sample'
) as HTMLButtonElement;
const exportReportBtn = document.getElementById(
  'export-report'
) as HTMLButtonElement;
const errorMessage = document.getElementById('error-message') as HTMLDivElement;
const chartsContainer = document.getElementById(
  'charts-container'
) as HTMLDivElement;

// Risk dashboard elements
const riskScoreValue = document.getElementById('risk-score-value') as HTMLDivElement;
const riskScoreLabel = document.getElementById('risk-score-label') as HTMLDivElement;
const alertsList = document.getElementById('alerts-list') as HTMLDivElement;

// Key metrics elements
const metricRevenue = document.getElementById('metric-revenue') as HTMLDivElement;
const metricProfit = document.getElementById('metric-profit') as HTMLDivElement;
const metricMargin = document.getElementById('metric-margin') as HTMLDivElement;
const metricCurrentRatio = document.getElementById('metric-current-ratio') as HTMLDivElement;
const metricDebtEquity = document.getElementById('metric-debt-equity') as HTMLDivElement;
const metricCash = document.getElementById('metric-cash') as HTMLDivElement;

console.log('DOM elements found:', {
  fileInput: !!fileInput,
  downloadSampleBtn: !!downloadSampleBtn,
  errorMessage: !!errorMessage,
  chartsContainer: !!chartsContainer,
});

// Input elements for data editing
const revenueInput = document.getElementById(
  'revenue-input'
) as HTMLInputElement;
const otherIncomeInput = document.getElementById(
  'other-income-input'
) as HTMLInputElement;
const expensesInput = document.getElementById(
  'expenses-input'
) as HTMLInputElement;
const patInput = document.getElementById('pat-input') as HTMLInputElement;
const fixedAssetsInput = document.getElementById(
  'fixed-assets-input'
) as HTMLInputElement;
const inventoriesInput = document.getElementById(
  'inventories-input'
) as HTMLInputElement;
const receivablesInput = document.getElementById(
  'receivables-input'
) as HTMLInputElement;
const cashInput = document.getElementById('cash-input') as HTMLInputElement;
const equityInput = document.getElementById('equity-input') as HTMLInputElement;
const longTermDebtInput = document.getElementById(
  'long-term-debt-input'
) as HTMLInputElement;
const payablesInput = document.getElementById(
  'payables-input'
) as HTMLInputElement;
const otherLiabilitiesInput = document.getElementById(
  'other-liabilities-input'
) as HTMLInputElement;

// Sliders and value displays
const cogsSlider = document.getElementById('cogs-slider') as HTMLInputElement;
const cogsValue = document.getElementById('cogs-value') as HTMLSpanElement;
const scorecardSlider = document.getElementById(
  'scorecard-slider'
) as HTMLInputElement;
const scorecardValue = document.getElementById(
  'scorecard-value'
) as HTMLSpanElement;
const liquiditySlider = document.getElementById(
  'liquidity-slider'
) as HTMLInputElement;
const liquidityValue = document.getElementById(
  'liquidity-value'
) as HTMLSpanElement;
const workingCapitalSlider = document.getElementById(
  'working-capital-slider'
) as HTMLInputElement;
const workingCapitalValue = document.getElementById(
  'working-capital-value'
) as HTMLSpanElement;

// Chart canvases and containers
const canvases = {
  keyMetrics: document.getElementById('chart-key-metrics') as HTMLCanvasElement,
  healthScorecard: document.getElementById(
    'chart-health-scorecard'
  ) as HTMLCanvasElement,
  profitLoss: document.getElementById('chart-profit-loss') as HTMLCanvasElement,
  assets: document.getElementById('chart-assets') as HTMLCanvasElement,
  liabilities: document.getElementById(
    'chart-liabilities'
  ) as HTMLCanvasElement,
  liquidity: document.getElementById('chart-liquidity') as HTMLCanvasElement,
  workingCapital: document.getElementById(
    'chart-working-capital'
  ) as HTMLCanvasElement,
};

const containers = {
  keyMetrics: canvases.keyMetrics.parentElement!,
  healthScorecard: canvases.healthScorecard.parentElement!,
};

console.log(
  'Canvases found:',
  Object.keys(canvases).map(
    (key) => `${key}: ${!!canvases[key as keyof typeof canvases]}`
  )
);

// Calculate risk score based on financial metrics
function calculateRiskScore(metrics: Metrics): { score: number; level: 'low' | 'medium' | 'high' } {
  let score = 100; // Start with perfect score

  // Liquidity risks
  if (metrics.current_ratio < 1.0) score -= 20;
  else if (metrics.current_ratio < 1.5) score -= 10;

  if (metrics.quick_ratio < 0.5) score -= 15;
  else if (metrics.quick_ratio < 0.8) score -= 8;

  if (metrics.cash_ratio < 0.1) score -= 15;
  else if (metrics.cash_ratio < 0.2) score -= 8;

  // Profitability risks
  if (metrics.net_margin < 0) score -= 25;
  else if (metrics.net_margin < 3) score -= 12;

  if (metrics.roe < 0) score -= 15;
  else if (metrics.roe < 5) score -= 8;

  // Leverage risks
  if (metrics.debt_to_equity > 1.5) score -= 20;
  else if (metrics.debt_to_equity > 0.8) score -= 10;

  // Working capital risks
  if (metrics.working_capital < 0) score -= 20;
  if (metrics.ccc > 120) score -= 10;
  else if (metrics.ccc > 90) score -= 5;

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: 'low' | 'medium' | 'high';
  if (score >= 70) level = 'low';
  else if (score >= 40) level = 'medium';
  else level = 'high';

  return { score, level };
}

// Generate alerts based on financial data
function generateAlerts(data: FinancialData, metrics: Metrics): { type: 'critical' | 'warning' | 'info' | 'success'; icon: string; message: string }[] {
  const alerts: { type: 'critical' | 'warning' | 'info' | 'success'; icon: string; message: string }[] = [];

  // Critical alerts
  if (metrics.current_ratio < 1.0) {
    alerts.push({
      type: 'critical',
      icon: '🚨',
      message: `Current ratio (${metrics.current_ratio.toFixed(2)}) below 1.0 - Potential liquidity crisis`
    });
  }

  if (metrics.net_margin < 0) {
    alerts.push({
      type: 'critical',
      icon: '📉',
      message: `Operating at a loss with ${metrics.net_margin.toFixed(1)}% net margin`
    });
  }

  if (metrics.working_capital < 0) {
    alerts.push({
      type: 'critical',
      icon: '💰',
      message: `Negative working capital of ${formatINR(metrics.working_capital)}`
    });
  }

  // Warning alerts
  if (metrics.debt_to_equity > 1.0) {
    alerts.push({
      type: 'warning',
      icon: '⚠️',
      message: `High leverage: Debt/Equity ratio of ${metrics.debt_to_equity.toFixed(2)}`
    });
  }

  if (data.assets.current_assets.cash < 100000) {
    alerts.push({
      type: 'warning',
      icon: '💵',
      message: `Low cash reserves: Only ${formatINR(data.assets.current_assets.cash)}`
    });
  }

  if (metrics.ccc > 120) {
    alerts.push({
      type: 'warning',
      icon: '🔄',
      message: `Slow cash conversion cycle: ${Math.round(metrics.ccc)} days`
    });
  }

  if (metrics.quick_ratio < 0.8) {
    alerts.push({
      type: 'warning',
      icon: '⏱️',
      message: `Quick ratio (${metrics.quick_ratio.toFixed(2)}) below industry standard of 0.8`
    });
  }

  // Info alerts
  if (metrics.dio > 90) {
    alerts.push({
      type: 'info',
      icon: '📦',
      message: `High inventory days: ${Math.round(metrics.dio)} days of stock`
    });
  }

  if (metrics.dso > 45) {
    alerts.push({
      type: 'info',
      icon: '📋',
      message: `Collection period is ${Math.round(metrics.dso)} days`
    });
  }

  // Success alerts
  if (metrics.current_ratio >= 2.0) {
    alerts.push({
      type: 'success',
      icon: '✅',
      message: `Strong liquidity with current ratio of ${metrics.current_ratio.toFixed(2)}`
    });
  }

  if (metrics.net_margin >= 8) {
    alerts.push({
      type: 'success',
      icon: '📈',
      message: `Excellent profitability with ${metrics.net_margin.toFixed(1)}% net margin`
    });
  }

  if (metrics.roe >= 15) {
    alerts.push({
      type: 'success',
      icon: '🎯',
      message: `Strong ROE of ${metrics.roe.toFixed(1)}%`
    });
  }

  // Sort by priority: critical > warning > info > success
  const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
  alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

  return alerts.slice(0, 6); // Limit to 6 alerts
}

// Update risk dashboard with animated SVG circle
function updateRiskDashboard() {
  if (!currentData || !currentMetrics) return;

  const { score, level } = calculateRiskScore(currentMetrics);

  // Update score display
  riskScoreValue.textContent = score.toString();
  riskScoreLabel.textContent = level === 'low' ? 'Low Risk' : level === 'medium' ? 'Medium Risk' : 'High Risk';
  riskScoreLabel.className = `risk-score-label ${level}`;

  // Animate SVG circle
  const circle = document.getElementById('progress-circle') as unknown as SVGCircleElement;
  if (circle) {
    const circumference = 2 * Math.PI * 60; // r=60
    const offset = circumference - (score / 100) * circumference;

    // Remove all level classes first
    circle.classList.remove('low', 'medium', 'high');
    circle.classList.add(level);

    // Animate the circle
    circle.style.strokeDasharray = `${circumference}`;
    // Reset offset first for animation
    circle.style.transition = 'none';
    circle.style.strokeDashoffset = `${circumference}`;
    // Force reflow then animate
    circle.getBoundingClientRect();
    circle.style.transition = 'stroke-dashoffset 1s ease-out';
    circle.style.strokeDashoffset = `${offset}`;
  }

  // Update alerts (limit to 5 for compact view)
  const alerts = generateAlerts(currentData, currentMetrics);
  alertsList.innerHTML = alerts.slice(0, 5).map(alert => `
    <div class="alert-item ${alert.type}">
      <span class="alert-icon">${alert.icon}</span>
      <span>${alert.message}</span>
    </div>
  `).join('');
}

// Update key metrics in the executive summary
function updateKeyMetrics() {
  if (!currentData || !currentMetrics) return;

  metricRevenue.textContent = formatINR(currentData.income_statement.revenue);

  const profit = currentData.income_statement.pat;
  metricProfit.textContent = formatINR(profit);
  metricProfit.className = `metric-value ${profit >= 0 ? 'positive' : 'negative'}`;

  metricMargin.textContent = `${currentMetrics.net_margin.toFixed(1)}%`;
  metricMargin.className = `metric-value ${currentMetrics.net_margin >= 0 ? 'positive' : 'negative'}`;

  metricCurrentRatio.textContent = currentMetrics.current_ratio.toFixed(2);
  metricCurrentRatio.className = `metric-value ${currentMetrics.current_ratio >= 1.5 ? 'positive' : currentMetrics.current_ratio >= 1 ? '' : 'warning'}`;

  metricDebtEquity.textContent = currentMetrics.debt_to_equity.toFixed(2);
  metricDebtEquity.className = `metric-value ${currentMetrics.debt_to_equity <= 0.5 ? 'positive' : currentMetrics.debt_to_equity <= 1 ? '' : 'negative'}`;

  metricCash.textContent = formatINR(currentData.assets.current_assets.cash);
  metricCash.className = `metric-value ${currentData.assets.current_assets.cash >= 100000 ? 'positive' : 'negative'}`;
}

// Validate JSON data
function validateData(data: any): data is FinancialData {
  return (
    data &&
    typeof data.company_name === 'string' &&
    data.income_statement &&
    typeof data.income_statement.revenue === 'number' &&
    data.assets &&
    data.assets.fixed_assets &&
    data.assets.current_assets &&
    data.liabilities &&
    data.liabilities.equity &&
    data.liabilities.non_current_liabilities &&
    data.liabilities.current_liabilities
  );
}

// Show error message
function showError(message: string) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

// Hide error message
function hideError() {
  errorMessage.style.display = 'none';
}

// Load data from file
function loadFromFile(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (validateData(data)) {
        currentData = data;
        currentMetrics = calculateMetrics(data, cogsPercentage);
        renderCharts();
        populateInputFields();
        updateRiskDashboard();
        updateKeyMetrics();
        hideError();
      } else {
        showError('Invalid JSON structure. Please check the required fields.');
      }
    } catch (error) {
      showError('Invalid JSON format.');
    }
  };
  reader.readAsText(file);
}

// Download sample data
function downloadSampleData() {
  const dataStr = JSON.stringify(sampleData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sample_financial_data.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export report as text
function exportReport() {
  if (!currentData || !currentMetrics) {
    alert('Please load financial data first');
    return;
  }

  const { score, level } = calculateRiskScore(currentMetrics);
  const alerts = generateAlerts(currentData, currentMetrics);

  const report = `
REDFLAG FINANCIAL ANALYSIS REPORT
==================================
Company: ${currentData.company_name}
Generated: ${new Date().toLocaleString()}

RISK ASSESSMENT
---------------
Overall Risk Score: ${score}/100 (${level.toUpperCase()} RISK)

KEY METRICS
-----------
Revenue: ${formatINR(currentData.income_statement.revenue)}
Net Profit: ${formatINR(currentData.income_statement.pat)}
Net Margin: ${currentMetrics.net_margin.toFixed(2)}%
ROE: ${currentMetrics.roe.toFixed(2)}%
ROA: ${currentMetrics.roa.toFixed(2)}%

LIQUIDITY RATIOS
----------------
Current Ratio: ${currentMetrics.current_ratio.toFixed(2)}
Quick Ratio: ${currentMetrics.quick_ratio.toFixed(2)}
Cash Ratio: ${currentMetrics.cash_ratio.toFixed(2)}

LEVERAGE RATIOS
---------------
Debt/Equity: ${currentMetrics.debt_to_equity.toFixed(2)}
Debt/Assets: ${currentMetrics.debt_to_assets.toFixed(2)}

WORKING CAPITAL
---------------
Working Capital: ${formatINR(currentMetrics.working_capital)}
Inventory Days: ${Math.round(currentMetrics.dio)}
Collection Days: ${Math.round(currentMetrics.dso)}
Payment Days: ${Math.round(currentMetrics.dpo)}
Cash Conversion Cycle: ${Math.round(currentMetrics.ccc)} days

ALERTS & RECOMMENDATIONS
------------------------
${alerts.map(a => `[${a.type.toUpperCase()}] ${a.message}`).join('\n')}

---
Report generated by RedFlag - MCA Financial Analysis
`.trim();

  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentData.company_name.replace(/\s+/g, '_')}_financial_report.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Load sample data
function loadSampleData() {
  currentData = sampleData;
  currentMetrics = calculateMetrics(sampleData, cogsPercentage);
  renderCharts();
  updateRiskDashboard();
  updateKeyMetrics();
  hideError();
}

// Add insights to chart containers
function addInsights(chartId: string, insight: string) {
  const canvas = document.querySelector(`#chart-${chartId}`) as HTMLElement;
  if (!canvas) return;

  const container = canvas.closest('.chart-container') as HTMLElement;
  if (!container) return;

  const controls = container.querySelector('.chart-controls') as HTMLElement;
  if (!controls) return;

  let insightsDiv = container.querySelector('.chart-insights') as HTMLElement;
  if (!insightsDiv) {
    insightsDiv = document.createElement('div');
    insightsDiv.className = 'chart-insights';
    container.insertBefore(insightsDiv, controls);
  }
  insightsDiv.textContent = insight;
}

// Render all charts
function renderCharts() {
  if (!currentData || !currentMetrics) {
    console.log('No data or metrics available');
    return;
  }

  console.log(
    'Rendering charts with data:',
    currentData,
    'metrics:',
    currentMetrics
  );
  chartsContainer.style.display = 'grid';

  // For now, use default parameters since we're focusing on data inputs
  try {
    createKeyMetricsChart(
      containers.keyMetrics,
      currentData,
      currentMetrics,
      cogsPercentage
    );
    createHealthScorecardChart(containers.healthScorecard, currentMetrics, 1.0);
    createProfitLossChart(canvases.profitLoss, currentData, 1.0);
    createAssetCompositionChart(
      canvases.assets,
      currentData,
      currentMetrics,
      0.5
    );
    createLiabilityCompositionChart(
      canvases.liabilities,
      currentData,
      currentMetrics,
      0.5
    );
    createLiquidityChart(canvases.liquidity, currentMetrics, 1.5);
    createWorkingCapitalChart(canvases.workingCapital, currentMetrics, 90);
    console.log('Charts rendered successfully');

    // Add insights
    addInsights('key-metrics', generateKeyMetricsInsights(currentData, currentMetrics));
    addInsights('health-scorecard', generateHealthScorecardInsights(currentMetrics, 1.0));
    addInsights('profit-loss', generateProfitLossInsights(currentData));
    addInsights('assets', generateAssetCompositionInsights(currentData, currentMetrics));
    addInsights('liabilities', generateLiabilityCompositionInsights(currentData, currentMetrics));
    addInsights('liquidity', generateLiquidityInsights(currentMetrics, 1.5));
    addInsights('working-capital', generateWorkingCapitalInsights(currentMetrics, 90));
  } catch (error) {
    console.error('Error rendering charts:', error);
  }
}

// Event listeners
fileInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    loadFromFile(file);
  }
});

downloadSampleBtn.addEventListener('click', downloadSampleData);

if (exportReportBtn) {
  exportReportBtn.addEventListener('click', exportReport);
}

// Update value displays
function updateValueDisplays() {
  cogsValue.textContent = `${cogsSlider.value}%`;
  scorecardValue.textContent = `${scorecardSlider.value}x`;
  liquidityValue.textContent = liquiditySlider.value;
  workingCapitalValue.textContent = workingCapitalSlider.value;
}

// Update data from input fields
function updateDataFromInputs() {
  if (!currentData) return;

  // Update income statement
  currentData.income_statement.revenue = parseFloat(revenueInput.value) || 0;
  currentData.income_statement.other_income =
    parseFloat(otherIncomeInput.value) || 0;
  currentData.income_statement.total_expenses =
    parseFloat(expensesInput.value) || 0;
  currentData.income_statement.pat = parseFloat(patInput.value) || 0;
  currentData.income_statement.pbt = currentData.income_statement.pat; // Simplified

  // Update assets
  const fixedAssets = parseFloat(fixedAssetsInput.value) || 0;
  currentData.assets.fixed_assets.property_equipment = Math.round(
    fixedAssets * 0.25
  );
  currentData.assets.fixed_assets.intangible_assets = Math.round(
    fixedAssets * 0.33
  );
  currentData.assets.fixed_assets.other_non_current = Math.round(
    fixedAssets * 0.42
  );

  currentData.assets.current_assets.inventories =
    parseFloat(inventoriesInput.value) || 0;
  currentData.assets.current_assets.trade_receivables =
    parseFloat(receivablesInput.value) || 0;
  currentData.assets.current_assets.cash = parseFloat(cashInput.value) || 0;
  currentData.assets.current_assets.other_current =
    parseFloat(cashInput.value) * 75; // Simplified

  // Update liabilities
  const equity = parseFloat(equityInput.value) || 0;
  currentData.liabilities.equity.share_capital = Math.round(equity * 0.19);
  currentData.liabilities.equity.reserves_surplus = Math.round(equity * 0.81);

  currentData.liabilities.non_current_liabilities.long_term_borrowings =
    parseFloat(longTermDebtInput.value) || 0;
  currentData.liabilities.current_liabilities.trade_payables =
    parseFloat(payablesInput.value) || 0;
  currentData.liabilities.current_liabilities.other_current_liabilities =
    Math.round((parseFloat(otherLiabilitiesInput.value) || 0) * 0.78);
  currentData.liabilities.current_liabilities.current_liability = Math.round(
    (parseFloat(otherLiabilitiesInput.value) || 0) * 0.22
  );

  // Recalculate metrics
  currentMetrics = calculateMetrics(currentData, cogsPercentage);
  renderCharts();
  updateRiskDashboard();
  updateKeyMetrics();
}

// Populate input fields with current data
function populateInputFields() {
  if (!currentData) return;

  revenueInput.value = currentData.income_statement.revenue.toString();
  otherIncomeInput.value = currentData.income_statement.other_income.toString();
  expensesInput.value = currentData.income_statement.total_expenses.toString();
  patInput.value = currentData.income_statement.pat.toString();

  const totalFixedAssets = Object.values(
    currentData.assets.fixed_assets
  ).reduce((a, b) => a + b, 0);
  fixedAssetsInput.value = totalFixedAssets.toString();
  inventoriesInput.value =
    currentData.assets.current_assets.inventories.toString();
  receivablesInput.value =
    currentData.assets.current_assets.trade_receivables.toString();
  cashInput.value = currentData.assets.current_assets.cash.toString();

  const totalEquity = Object.values(currentData.liabilities.equity).reduce(
    (a, b) => a + b,
    0
  );
  equityInput.value = totalEquity.toString();
  longTermDebtInput.value =
    currentData.liabilities.non_current_liabilities.long_term_borrowings.toString();
  payablesInput.value =
    currentData.liabilities.current_liabilities.trade_payables.toString();
  const totalOtherLiabilities =
    Object.values(currentData.liabilities.current_liabilities).reduce(
      (a, b) => a + b,
      0
    ) - currentData.liabilities.current_liabilities.trade_payables;
  otherLiabilitiesInput.value = totalOtherLiabilities.toString();
}

// Slider event listeners - only render on mouseup/touchend
cogsSlider.addEventListener('input', () => {
  cogsValue.textContent = `${cogsSlider.value}%`;
});

cogsSlider.addEventListener('change', () => {
  cogsPercentage = parseInt(cogsSlider.value);
  if (currentData) {
    currentMetrics = calculateMetrics(currentData, cogsPercentage);
    renderCharts();
    updateRiskDashboard();
    updateKeyMetrics();
  }
});

scorecardSlider.addEventListener('input', () => {
  scorecardValue.textContent = `${scorecardSlider.value}x`;
});

scorecardSlider.addEventListener('change', () => {
  renderCharts();
});

liquiditySlider.addEventListener('input', () => {
  liquidityValue.textContent = liquiditySlider.value;
});

liquiditySlider.addEventListener('change', () => {
  renderCharts();
});

workingCapitalSlider.addEventListener('input', () => {
  workingCapitalValue.textContent = workingCapitalSlider.value;
});

workingCapitalSlider.addEventListener('change', () => {
  renderCharts();
});

// Input field event listeners
const inputFields = [
  revenueInput,
  otherIncomeInput,
  expensesInput,
  patInput,
  fixedAssetsInput,
  inventoriesInput,
  receivablesInput,
  cashInput,
  equityInput,
  longTermDebtInput,
  payablesInput,
  otherLiabilitiesInput,
];

inputFields.forEach((input) => {
  input.addEventListener('input', updateDataFromInputs);
});

// Initialize with sample data
loadSampleData();
updateValueDisplays();
populateInputFields();

// Add expand/collapse toggle event listeners
const expandToggleButtons = document.querySelectorAll('.expand-toggle');
expandToggleButtons.forEach(button => {
  button.addEventListener('click', () => {
    const container = button.closest('.chart-container') as HTMLElement;
    const isExpanded = container.classList.contains('expanded');

    // Toggle expanded class
    container.classList.toggle('expanded');

    // Update aria-expanded and button text
    button.setAttribute('aria-expanded', (!isExpanded).toString());
    const textSpan = button.querySelector('.expand-text');
    if (textSpan) {
      if (!isExpanded) {
        textSpan.textContent = 'Hide Controls';
      } else {
        // Restore original text based on card type
        const title = container.querySelector('.chart-title')?.textContent || '';
        if (title.includes('Profit') || title.includes('Asset') || title.includes('Liability')) {
          textSpan.textContent = 'Edit Values';
        } else {
          textSpan.textContent = 'Adjust Parameters';
        }
      }
    }
  });
});
