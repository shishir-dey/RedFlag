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

// LocalStorage key
const STORAGE_KEY = 'redflag_data';

// Global state
let currentData: FinancialData | null = null;
let currentMetrics: Metrics | null = null;
let cogsPercentage = 85; // Default COGS percentage

// DOM elements
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const uploadBtn = document.getElementById('upload-btn') as HTMLButtonElement;
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

// Company display elements
const companyNameEl = document.getElementById('company-name') as HTMLHeadingElement;
const promoterHoldingEl = document.getElementById('promoter-holding') as HTMLSpanElement;
const marketCapEl = document.getElementById('market-cap') as HTMLSpanElement;
const epsDisplayEl = document.getElementById('eps-display') as HTMLSpanElement;
const dilutedEpsDisplayEl = document.getElementById('diluted-eps-display') as HTMLSpanElement;

// Modal elements
const modalOverlay = document.getElementById('modal-overlay') as HTMLDivElement;
const modalCloseBtn = document.getElementById('modal-close-btn') as HTMLButtonElement;
const modalCancelBtn = document.getElementById('modal-cancel-btn') as HTMLButtonElement;
const modalSaveBtn = document.getElementById('modal-save-btn') as HTMLButtonElement;
const modalFileInput = document.getElementById('modal-file-input') as HTMLInputElement;

// Modal form inputs
const modalRevenue = document.getElementById('modal-revenue') as HTMLInputElement;
const modalOtherIncome = document.getElementById('modal-other-income') as HTMLInputElement;
const modalExpenses = document.getElementById('modal-expenses') as HTMLInputElement;
const modalPat = document.getElementById('modal-pat') as HTMLInputElement;
const modalFixedAssets = document.getElementById('modal-fixed-assets') as HTMLInputElement;
const modalInventories = document.getElementById('modal-inventories') as HTMLInputElement;
const modalReceivables = document.getElementById('modal-receivables') as HTMLInputElement;
const modalCash = document.getElementById('modal-cash') as HTMLInputElement;
const modalEquity = document.getElementById('modal-equity') as HTMLInputElement;
const modalLongTermDebt = document.getElementById('modal-long-term-debt') as HTMLInputElement;
const modalPayables = document.getElementById('modal-payables') as HTMLInputElement;
const modalOtherLiabilities = document.getElementById('modal-other-liabilities') as HTMLInputElement;
const modalMarketCap = document.getElementById('modal-market-cap') as HTMLInputElement;
const modalSharePrice = document.getElementById('modal-share-price') as HTMLInputElement;
const modalEps = document.getElementById('modal-eps') as HTMLInputElement;
const modalDilutedEps = document.getElementById('modal-diluted-eps') as HTMLInputElement;

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

// Update company display section
function updateCompanyDisplay() {
  if (!currentData) return;

  // Company name
  companyNameEl.textContent = currentData.company_name;

  // Calculate promoter holding percentage
  const totalShares = currentData.total_shares || currentData.liabilities.equity.share_capital;
  const totalShareholding = Object.values(currentData.shareholding).reduce((a, b) => a + b, 0);
  const promoterHoldingPct = totalShares > 0 ? ((totalShareholding / totalShares) * 100).toFixed(1) : '--';
  promoterHoldingEl.textContent = `${promoterHoldingPct}%`;

  // Market cap
  if (currentData.market_cap) {
    marketCapEl.textContent = formatINR(currentData.market_cap);
  } else {
    marketCapEl.textContent = '--';
  }

  // EPS
  if (currentData.eps !== undefined) {
    epsDisplayEl.textContent = `₹${currentData.eps.toFixed(2)}`;
  } else {
    epsDisplayEl.textContent = '--';
  }

  // Diluted EPS
  if (currentData.diluted_eps !== undefined) {
    dilutedEpsDisplayEl.textContent = `₹${currentData.diluted_eps.toFixed(2)}`;
  } else {
    dilutedEpsDisplayEl.textContent = '--';
  }
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

// Save data to localStorage
function saveToLocalStorage(data: FinancialData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Load data from localStorage
function loadFromLocalStorage(): FinancialData | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (validateData(data)) {
        return data;
      }
    } catch (e) {
      console.error('Error parsing stored data:', e);
    }
  }
  return null;
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
        saveToLocalStorage(data);
        renderCharts();
        updateRiskDashboard();
        updateKeyMetrics();
        updateCompanyDisplay();
        hideError();
        closeModal();
      } else {
        showError('Invalid JSON structure. Please check the required fields.');
      }
    } catch (error) {
      showError('Invalid JSON format.');
    }
  };
  reader.readAsText(file);
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

// Load initial data (from localStorage or sample)
function loadInitialData() {
  const storedData = loadFromLocalStorage();
  if (storedData) {
    currentData = storedData;
  } else {
    currentData = sampleData;
    saveToLocalStorage(sampleData);
  }
  currentMetrics = calculateMetrics(currentData, cogsPercentage);
  renderCharts();
  updateRiskDashboard();
  updateKeyMetrics();
  updateCompanyDisplay();
  hideError();
}

// Add insights to chart containers
function addInsights(chartId: string, insight: string) {
  const canvas = document.querySelector(`#chart-${chartId}`) as HTMLElement;
  if (!canvas) return;

  const container = canvas.closest('.chart-container') as HTMLElement;
  if (!container) return;

  let insightsDiv = container.querySelector('.chart-insights') as HTMLElement;
  if (!insightsDiv) {
    insightsDiv = document.createElement('div');
    insightsDiv.className = 'chart-insights';
    // Insert after chart-content
    const chartContent = container.querySelector('.chart-content');
    if (chartContent) {
      chartContent.after(insightsDiv);
    }
  }
  insightsDiv.textContent = insight;
}

// Render all charts
function renderCharts() {
  if (!currentData || !currentMetrics) {
    console.log('No data or metrics available');
    return;
  }

  chartsContainer.style.display = 'grid';

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

// Modal functions
function openModal() {
  modalOverlay.classList.add('active');
  populateModalForm();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function populateModalForm() {
  if (!currentData) return;

  modalRevenue.value = currentData.income_statement.revenue.toString();
  modalOtherIncome.value = currentData.income_statement.other_income.toString();
  modalExpenses.value = currentData.income_statement.total_expenses.toString();
  modalPat.value = currentData.income_statement.pat.toString();

  const totalFixedAssets = Object.values(currentData.assets.fixed_assets).reduce((a, b) => a + b, 0);
  modalFixedAssets.value = totalFixedAssets.toString();
  modalInventories.value = currentData.assets.current_assets.inventories.toString();
  modalReceivables.value = currentData.assets.current_assets.trade_receivables.toString();
  modalCash.value = currentData.assets.current_assets.cash.toString();

  const totalEquity = Object.values(currentData.liabilities.equity).reduce((a, b) => a + b, 0);
  modalEquity.value = totalEquity.toString();
  modalLongTermDebt.value = currentData.liabilities.non_current_liabilities.long_term_borrowings.toString();
  modalPayables.value = currentData.liabilities.current_liabilities.trade_payables.toString();
  const totalOtherLiabilities =
    Object.values(currentData.liabilities.current_liabilities).reduce((a, b) => a + b, 0) -
    currentData.liabilities.current_liabilities.trade_payables;
  modalOtherLiabilities.value = totalOtherLiabilities.toString();

  // Optional fields
  modalMarketCap.value = currentData.market_cap?.toString() || '';
  modalSharePrice.value = currentData.share_price?.toString() || '';
  modalEps.value = currentData.eps?.toString() || '';
  modalDilutedEps.value = currentData.diluted_eps?.toString() || '';
}

function saveModalForm() {
  if (!currentData) return;

  // Update income statement
  currentData.income_statement.revenue = parseFloat(modalRevenue.value) || 0;
  currentData.income_statement.other_income = parseFloat(modalOtherIncome.value) || 0;
  currentData.income_statement.total_expenses = parseFloat(modalExpenses.value) || 0;
  currentData.income_statement.pat = parseFloat(modalPat.value) || 0;
  currentData.income_statement.pbt = currentData.income_statement.pat; // Simplified

  // Update assets
  const fixedAssets = parseFloat(modalFixedAssets.value) || 0;
  currentData.assets.fixed_assets.property_equipment = Math.round(fixedAssets * 0.25);
  currentData.assets.fixed_assets.intangible_assets = Math.round(fixedAssets * 0.33);
  currentData.assets.fixed_assets.other_non_current = Math.round(fixedAssets * 0.42);

  currentData.assets.current_assets.inventories = parseFloat(modalInventories.value) || 0;
  currentData.assets.current_assets.trade_receivables = parseFloat(modalReceivables.value) || 0;
  currentData.assets.current_assets.cash = parseFloat(modalCash.value) || 0;
  currentData.assets.current_assets.other_current = parseFloat(modalCash.value) * 75; // Simplified

  // Update liabilities
  const equity = parseFloat(modalEquity.value) || 0;
  currentData.liabilities.equity.share_capital = Math.round(equity * 0.19);
  currentData.liabilities.equity.reserves_surplus = Math.round(equity * 0.81);

  currentData.liabilities.non_current_liabilities.long_term_borrowings = parseFloat(modalLongTermDebt.value) || 0;
  currentData.liabilities.current_liabilities.trade_payables = parseFloat(modalPayables.value) || 0;
  currentData.liabilities.current_liabilities.other_current_liabilities =
    Math.round((parseFloat(modalOtherLiabilities.value) || 0) * 0.78);
  currentData.liabilities.current_liabilities.current_liability = Math.round(
    (parseFloat(modalOtherLiabilities.value) || 0) * 0.22
  );

  // Optional fields
  if (modalMarketCap.value) currentData.market_cap = parseFloat(modalMarketCap.value);
  if (modalSharePrice.value) currentData.share_price = parseFloat(modalSharePrice.value);
  if (modalEps.value) currentData.eps = parseFloat(modalEps.value);
  if (modalDilutedEps.value) currentData.diluted_eps = parseFloat(modalDilutedEps.value);

  // Recalculate metrics and update UI
  currentMetrics = calculateMetrics(currentData, cogsPercentage);
  saveToLocalStorage(currentData);
  renderCharts();
  updateRiskDashboard();
  updateKeyMetrics();
  updateCompanyDisplay();
  closeModal();
}

// Event listeners
uploadBtn.addEventListener('click', openModal);

modalCloseBtn.addEventListener('click', closeModal);
modalCancelBtn.addEventListener('click', closeModal);
modalSaveBtn.addEventListener('click', saveModalForm);

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
    closeModal();
  }
});

// Close modal on backdrop click
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// File input in modal
modalFileInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    loadFromFile(file);
  }
});

// Hidden file input (for external file trigger)
fileInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    loadFromFile(file);
  }
});

if (exportReportBtn) {
  exportReportBtn.addEventListener('click', exportReport);
}

// Initialize with data
loadInitialData();
